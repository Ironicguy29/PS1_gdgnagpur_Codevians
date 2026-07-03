import mongoose from 'mongoose';
import Consultation from '../models/Consultation';
import ClinicalNote from '../models/ClinicalNote';
import Medicine from '../models/Medicine';
import FollowUp from '../models/FollowUp';
import Referral from '../models/Referral';
import DoctorInstruction from '../models/DoctorInstruction';
import ConsultationAnalytics from '../models/ConsultationAnalytics';
import Visit from '../models/Visit';
import Patient from '../models/Patient';
import Doctor from '../models/Doctor';
import Vitals from '../models/Vitals';
import Diagnosis from '../models/Diagnosis';
import Prescription from '../models/Prescription';
import LabOrder from '../models/LabOrder';
import MedicalProfile from '../models/MedicalProfile';
import AuditLog from '../models/AuditLog';
import axios from 'axios';
import * as labService from './labService';

// Helper for audit logging
export const logConsultationAudit = async (
    userId: string,
    action: string,
    patientId: string,
    details: string
) => {
    try {
        await AuditLog.create({
            user_id: new mongoose.Types.ObjectId(userId),
            user_type: 'Doctor',
            action,
            patient_id: new mongoose.Types.ObjectId(patientId),
            details,
            ip_address: '127.0.0.1'
        });
    } catch (e) {
        console.error("Consultation audit logging failed", e);
    }
};

export const startConsultation = async (patientId: string, doctorId: string, tokenId?: string) => {
    // Check if there is an active/InProgress consultation for this patient and doctor
    let consultation = await Consultation.findOne({
        patient_id: new mongoose.Types.ObjectId(patientId),
        doctor_id: new mongoose.Types.ObjectId(doctorId),
        status: 'InProgress'
    });

    if (!consultation) {
        consultation = new Consultation({
            patient_id: new mongoose.Types.ObjectId(patientId),
            doctor_id: new mongoose.Types.ObjectId(doctorId),
            token_id: tokenId ? new mongoose.Types.ObjectId(tokenId) : undefined,
            chief_complaint: 'Routine consultation checkup',
            symptoms: [],
            status: 'InProgress',
            duration_seconds: 0
        });
        await consultation.save();

        await logConsultationAudit(
            doctorId,
            'START_CONSULTATION',
            patientId,
            `Started consultation session (ID: ${consultation._id}).`
        );
    }

    return consultation;
};

export const getConsultationById = async (consultationId: string) => {
    return await Consultation.findById(consultationId).populate('patient_id');
};

export const getConsultationContext = async (patientId: string, doctorId: string) => {
    const patientObjId = new mongoose.Types.ObjectId(patientId);
    
    // 1. Fetch Patient, Doctor details
    const patient = await Patient.findById(patientId).populate('user_id', 'name email phone gender date_of_birth');
    const medicalProfile = await MedicalProfile.findOne({ patient_id: patientObjId });
    
    // 2. Fetch History
    const visits = await Visit.find({ patient_id: patientObjId })
        .populate('vitals')
        .populate('diagnosis')
        .populate('prescription')
        .populate('lab_orders')
        .sort({ date: -1 });

    const vitalsHistory = await Vitals.find({ patient_id: patientObjId }).sort({ recorded_at: -1 }).limit(10);
    const labOrders = await LabOrder.find({ patient_id: patientObjId }).sort({ createdAt: -1 });

    // 3. AI assistant call
    let aiSuggestions = null;
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    try {
        const payload = {
            patient_name: patient?.name || 'Patient',
            age: patient?.age || 30,
            gender: patient?.gender || 'Male',
            blood_group: patient?.blood_group || 'O+',
            allergies: medicalProfile?.allergies || [],
            chronic_diseases: medicalProfile?.existing_diseases || [],
            current_medications: medicalProfile?.current_medications || [],
            symptoms: visits.length > 0 ? (visits[0].symptoms || []) : [],
            vitals: vitalsHistory.length > 0 ? {
                temperature: vitalsHistory[0].temperature,
                blood_pressure: vitalsHistory[0].blood_pressure,
                heart_rate: vitalsHistory[0].heart_rate,
                oxygen_saturation: vitalsHistory[0].oxygen_saturation,
                blood_sugar: vitalsHistory[0].blood_sugar
            } : {},
            previous_visits: visits.slice(0, 3).map(v => ({
                date: v.date,
                symptoms: v.symptoms,
                treatment_plan: v.treatment_plan
            }))
        };

        const res = await axios.post(`${aiServiceUrl}/consultation-assistant`, payload, { timeout: 3000 });
        aiSuggestions = res.data;
    } catch (e: any) {
        console.error("AI Assistant Service connection error:", e.message);
        // Rule-based fallback suggestions
        aiSuggestions = {
            summary: "Patient presents for consultation. Check recent vitals and history.",
            differential_diagnoses: ["Viral Infection", "Influenza", "Acute Bronchitis"],
            warnings: medicalProfile?.allergies?.length 
                ? [`Allergic warning: Patient is allergic to: ${medicalProfile.allergies.join(', ')}`]
                : ["No allergy profile loaded. Verify drug interactions manually."],
            suggested_investigations: ["Complete Blood Count (CBC)"],
            suggested_follow_up: "Follow up in 5 days if symptoms persist."
        };
    }

    return {
        patient,
        medicalProfile,
        visits,
        vitalsHistory,
        labOrders,
        aiSuggestions
    };
};

export const completeConsultation = async (
    consultationId: string,
    doctorId: string,
    payload: {
        chief_complaint: string;
        symptoms: string[];
        examination?: string;
        vitals?: {
            temperature: number;
            blood_pressure: string;
            heart_rate: number;
            respiratory_rate: number;
            oxygen_saturation: number;
            height: number;
            weight: number;
            blood_sugar?: number;
        };
        diagnosis: {
            primary_diagnosis: string;
            secondary_diagnoses?: string[];
            icd_code: string;
            severity: 'Mild' | 'Moderate' | 'Severe';
            clinical_impression?: string;
        };
        prescription?: {
            medicines: Array<{
                name: string;
                dosage: string;
                frequency: string;
                duration: string;
                instructions?: string;
                before_food: boolean;
                substitution_allowed: boolean;
            }>;
            instructions?: string;
            confirmation_acknowledged: boolean;
        };
        clinical_note: {
            subjective: string;
            objective: string;
            assessment: string;
            plan: string;
            private_notes?: string;
        };
        follow_up?: {
            follow_up_date: string;
            follow_up_time?: string;
            purpose: string;
        };
        referral?: {
            referred_to_specialist?: string;
            referred_to_department?: string;
            referred_to_hospital?: string;
            referral_letter: string;
        };
        doctor_instruction?: {
            diet_advice?: string;
            exercise_plan?: string;
            recovery_instructions?: string;
            preventive_care?: string;
            educational_pdfs?: string[];
        };
        lab_orders?: string[]; // Test names
        duration_seconds: number;
    }
) => {
    // 1. Validation
    if (!payload.diagnosis || !payload.diagnosis.primary_diagnosis) {
        throw new Error("Validation Error: Primary diagnosis is required to complete consultation.");
    }
    if (payload.prescription && !payload.prescription.confirmation_acknowledged) {
        throw new Error("Validation Error: Prescription safety verification must be acknowledged.");
    }

    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
        throw new Error("Consultation not found.");
    }
    if (consultation.status !== 'InProgress') {
        throw new Error("Consultation is already completed or cancelled.");
    }

    const patientId = consultation.patient_id;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Create Clinical Note
        const note = new ClinicalNote({
            patient_id: patientId,
            doctor_id: doctorId,
            subjective: payload.clinical_note.subjective,
            objective: payload.clinical_note.objective,
            assessment: payload.clinical_note.assessment,
            plan: payload.clinical_note.plan,
            private_notes: payload.clinical_note.private_notes
        });
        await note.save({ session });
        consultation.clinical_note = note._id;

        // Create Diagnosis
        const diag = new Diagnosis({
            patient_id: patientId,
            primary_diagnosis: payload.diagnosis.primary_diagnosis,
            secondary_diagnoses: payload.diagnosis.secondary_diagnoses || [],
            icd_code: payload.diagnosis.icd_code,
            severity: payload.diagnosis.severity,
            clinical_impression: payload.diagnosis.clinical_impression
        });
        await diag.save({ session });
        consultation.diagnosis = diag._id;

        // Save Vitals
        let vitalsRef = null;
        if (payload.vitals) {
            const heightInM = payload.vitals.height / 100;
            const bmi = parseFloat((payload.vitals.weight / (heightInM * heightInM)).toFixed(2));
            
            const vitals = new Vitals({
                patient_id: patientId,
                ...payload.vitals,
                bmi
            });
            await vitals.save({ session });
            vitalsRef = vitals._id;

            // Update patient Master Profile
            await MedicalProfile.findOneAndUpdate(
                { patient_id: patientId },
                { height: payload.vitals.height, weight: payload.vitals.weight, bmi },
                { upsert: true, session }
            );
        }

        // Create Prescription
        if (payload.prescription && payload.prescription.medicines.length > 0) {
            const pres = new Prescription({
                patient_id: patientId,
                doctor_id: new mongoose.Types.ObjectId(doctorId),
                medicines: payload.prescription.medicines.map((m: any) => ({
                    ...m,
                    quantity: m.quantity || 10
                })),
                instructions: payload.prescription.instructions,
                status: 'Generated'
            });
            await pres.save({ session });
            consultation.prescription = pres._id;

            // Keep track of medicine database insertion asynchronously or dynamically
            for (const med of (payload.prescription.medicines as any[])) {
                await Medicine.findOneAndUpdate(
                    { name: med.name },
                    { name: med.name, dosage_form: 'Tablet', strength: med.dosage || '500mg', is_active: true },
                    { upsert: true, session }
                );
            }
        }

        // Save Follow Up
        if (payload.follow_up && payload.follow_up.follow_up_date) {
            const followUp = new FollowUp({
                patient_id: patientId,
                doctor_id: doctorId,
                follow_up_date: new Date(payload.follow_up.follow_up_date),
                follow_up_time: payload.follow_up.follow_up_time,
                purpose: payload.follow_up.purpose
            });
            await followUp.save({ session });
            consultation.follow_up = followUp._id;
        }

        // Save Referral
        if (payload.referral && payload.referral.referral_letter) {
            const referral = new Referral({
                patient_id: patientId,
                doctor_id: doctorId,
                referred_to_specialist: payload.referral.referred_to_specialist,
                referred_to_department: payload.referral.referred_to_department,
                referred_to_hospital: payload.referral.referred_to_hospital,
                referral_letter: payload.referral.referral_letter
            });
            await referral.save({ session });
            consultation.referral = referral._id;
        }

        // Save Doctor Instructions
        if (payload.doctor_instruction) {
            const instruction = new DoctorInstruction({
                patient_id: patientId,
                doctor_id: doctorId,
                diet_advice: payload.doctor_instruction.diet_advice,
                exercise_plan: payload.doctor_instruction.exercise_plan,
                recovery_instructions: payload.doctor_instruction.recovery_instructions,
                preventive_care: payload.doctor_instruction.preventive_care,
                educational_pdfs: payload.doctor_instruction.educational_pdfs || []
            });
            await instruction.save({ session });
            consultation.doctor_instruction = instruction._id;
        }

        // Save Lab Orders
        const labOrderIds: mongoose.Types.ObjectId[] = [];
        if (payload.lab_orders && payload.lab_orders.length > 0) {
            const results = payload.lab_orders.map(testName => ({
                test_name: testName,
                status: 'Pending' as const
            }));

            const labOrder = new LabOrder({
                patient_id: patientId,
                tests: payload.lab_orders,
                results,
                status: 'Ordered'
            });
            await labOrder.save({ session });
            await labService.initializeSamplesForOrder(labOrder);
            labOrderIds.push(labOrder._id);
            consultation.lab_orders = labOrderIds;
        }

        // Create the legacy EMR "Visit" record for full backwards compatibility
        const doctor = await Doctor.findOne({ _id: doctorId }).populate('user_id');
        const department = doctor?.specialization || 'General';

        const visit = new Visit({
            patient_id: patientId,
            doctor_id: doctorId,
            department: department,
            symptoms: payload.symptoms,
            treatment_plan: payload.clinical_note.plan,
            vitals: vitalsRef || undefined,
            diagnosis: consultation.diagnosis,
            prescription: consultation.prescription,
            notes: note._id,
            lab_orders: labOrderIds,
            status: 'Completed',
            date: new Date()
        });
        await visit.save({ session });
        consultation.visit_id = visit._id;

        // Link prescription to visit if it was created
        if (consultation.prescription) {
            await Prescription.findByIdAndUpdate(
                consultation.prescription,
                { visit_id: visit._id },
                { session }
            );
        }

        // Update consultation duration, status
        consultation.chief_complaint = payload.chief_complaint;
        consultation.symptoms = payload.symptoms;
        consultation.examination = payload.examination;
        consultation.duration_seconds = payload.duration_seconds || 0;
        consultation.status = 'Completed';
        await consultation.save({ session });

        // Update Token queue status to Completed if token exists
        if (consultation.token_id) {
            try {
                // Check if QueueToken model exists
                const QueueToken = mongoose.model('QueueToken');
                if (QueueToken) {
                    await QueueToken.findByIdAndUpdate(
                        consultation.token_id,
                        { status: 'Completed', completed_at: new Date() },
                        { session }
                    );
                }
            } catch (err) {
                // Ignore if model does not exist
            }
        }

        // Update Analytics
        const todayStr = new Date().toISOString().split('T')[0];
        const todayStart = new Date(todayStr);

        let analytics = await ConsultationAnalytics.findOne({ date: todayStart }).session(session);
        if (!analytics) {
            analytics = new ConsultationAnalytics({
                date: todayStart,
                consultations_count: 0,
                average_consultation_time_seconds: 0,
                doctor_productivity: [],
                department_stats: [],
                medicine_usage: [],
                lab_requests_count: 0
            });
        }

        const prevCount = analytics.consultations_count;
        const prevAvg = analytics.average_consultation_time_seconds;
        const newCount = prevCount + 1;
        const newAvg = parseFloat(((prevAvg * prevCount + consultation.duration_seconds) / newCount).toFixed(2));

        analytics.consultations_count = newCount;
        analytics.average_consultation_time_seconds = newAvg;
        analytics.lab_requests_count += (payload.lab_orders?.length || 0);

        // Update doctor productivity
        const docIndex = analytics.doctor_productivity.findIndex(d => d.doctor_id.toString() === doctorId.toString());
        const doctorName = doctor?.user_id && 'name' in doctor.user_id ? (doctor.user_id as any).name : 'Doctor';
        if (docIndex >= 0) {
            const dCount = analytics.doctor_productivity[docIndex].consultations_count;
            const dAvg = analytics.doctor_productivity[docIndex].average_time_seconds;
            analytics.doctor_productivity[docIndex].consultations_count += 1;
            analytics.doctor_productivity[docIndex].average_time_seconds = parseFloat(
                ((dAvg * dCount + consultation.duration_seconds) / (dCount + 1)).toFixed(2)
            );
        } else {
            analytics.doctor_productivity.push({
                doctor_id: new mongoose.Types.ObjectId(doctorId),
                name: doctorName,
                consultations_count: 1,
                average_time_seconds: consultation.duration_seconds
            });
        }

        // Update department stats
        const deptIndex = analytics.department_stats.findIndex(d => d.department === department);
        if (deptIndex >= 0) {
            analytics.department_stats[deptIndex].consultations_count += 1;
        } else {
            analytics.department_stats.push({
                department: department,
                consultations_count: 1
            });
        }

        // Update medicine usage
        if (payload.prescription && payload.prescription.medicines) {
            for (const med of payload.prescription.medicines) {
                const medIndex = analytics.medicine_usage.findIndex(m => m.medicine_name.toLowerCase() === med.name.toLowerCase());
                if (medIndex >= 0) {
                    analytics.medicine_usage[medIndex].prescription_count += 1;
                } else {
                    analytics.medicine_usage.push({
                        medicine_name: med.name,
                        prescription_count: 1
                    });
                }
            }
        }

        await analytics.save({ session });

        await logConsultationAudit(
            doctorId,
            'COMPLETE_CONSULTATION',
            patientId.toString(),
            `Completed consultation ${consultation._id}. Duration: ${consultation.duration_seconds}s. Visit: ${visit.visit_id}.`
        );

        await session.commitTransaction();
        session.endSession();

        return consultation;
    } catch (e) {
        await session.abortTransaction();
        session.endSession();
        throw e;
    }
};

export const getAnalytics = async (doctorId?: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayStart = new Date(todayStr);

    let analytics = await ConsultationAnalytics.findOne({ date: todayStart });
    if (!analytics) {
        // Return latest analytics or dummy
        analytics = await ConsultationAnalytics.findOne().sort({ date: -1 });
    }

    return analytics;
};
