import mongoose from 'mongoose';
import MedicalProfile from '../models/MedicalProfile';
import Patient from '../models/Patient';
import Visit from '../models/Visit';
import Vitals from '../models/Vitals';
import Diagnosis from '../models/Diagnosis';
import Prescription from '../models/Prescription';
import LabOrder from '../models/LabOrder';
import DoctorNote from '../models/DoctorNote';
import AuditLog from '../models/AuditLog';

// Helper to log actions
export const logAudit = async (
    userId: string,
    userType: 'Doctor' | 'Patient' | 'Admin' | 'Lab',
    action: string,
    patientId: string,
    details: string,
    ipAddress?: string
) => {
    try {
        await AuditLog.create({
            user_id: new mongoose.Types.ObjectId(userId),
            user_type: userType,
            action,
            patient_id: new mongoose.Types.ObjectId(patientId),
            details,
            ip_address: ipAddress || '127.0.0.1'
        });
    } catch (e) {
        console.error("Audit log creation failed", e);
    }
};

export const getMedicalProfile = async (patientId: string) => {
    return await MedicalProfile.findOne({ patient_id: new mongoose.Types.ObjectId(patientId) });
};

export const updateMedicalProfile = async (
    patientId: string,
    profileData: any,
    operatorId: string,
    operatorRole: 'Doctor' | 'Patient' | 'Admin' | 'Lab'
) => {
    let profile = await MedicalProfile.findOne({ patient_id: new mongoose.Types.ObjectId(patientId) });
    
    if (profile) {
        // Enforce that we do not delete fields, only merge/update
        Object.assign(profile, profileData);
        await profile.save();
    } else {
        profile = new MedicalProfile({
            patient_id: new mongoose.Types.ObjectId(patientId),
            ...profileData
        });
        await profile.save();

        // Connect back to patient model
        await Patient.findByIdAndUpdate(patientId, { medical_profile: profile._id });
    }

    await logAudit(
        operatorId,
        operatorRole,
        'UPDATE_MEDICAL_PROFILE',
        patientId,
        `Updated patient medical profile. Allergies count: ${profile.allergies?.length || 0}.`
    );

    return profile;
};

export const getVisitHistory = async (patientId: string) => {
    return await Visit.find({ patient_id: new mongoose.Types.ObjectId(patientId) })
        .populate('doctor_id', 'user_id specialization')
        .populate({
            path: 'doctor_id',
            populate: { path: 'user_id', select: 'name' }
        })
        .populate('vitals')
        .populate('diagnosis')
        .populate('prescription')
        .populate('lab_orders')
        .sort({ date: -1 }); // Newest first
};

export const createVisitRecord = async (
    visitData: {
        patient_id: string;
        doctor_id: string;
        department: string;
        symptoms: string[];
        treatment_plan?: string;
        vitals?: {
            temperature: number;
            blood_pressure: string;
            heart_rate: number;
            respiratory_rate: number;
            oxygen_saturation: number;
            height: number;
            weight: number;
            blood_sugar?: number;
            pain_scale?: number;
        };
        diagnosis?: {
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
        };
        lab_orders?: {
            tests: string[];
        };
        private_notes?: string;
    },
    operatorId: string,
    operatorRole: 'Doctor' | 'Patient' | 'Admin' | 'Lab'
) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const patientIdObj = new mongoose.Types.ObjectId(visitData.patient_id);
        const doctorIdObj = new mongoose.Types.ObjectId(visitData.doctor_id);

        // Prevent duplicate visit record: Check if there's already a visit for this patient with this doctor in the last 15 minutes
        const minutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const duplicate = await Visit.findOne({
            patient_id: patientIdObj,
            doctor_id: doctorIdObj,
            createdAt: { $gte: minutesAgo }
        }).session(session);

        if (duplicate) {
            throw new Error("A recent visit record with this doctor already exists (potential double submit).");
        }

        // Create Visit
        const visit = new Visit({
            patient_id: patientIdObj,
            doctor_id: doctorIdObj,
            department: visitData.department,
            symptoms: visitData.symptoms,
            treatment_plan: visitData.treatment_plan,
            status: 'Completed'
        });
        await visit.save({ session });

        // Save Vitals if provided
        if (visitData.vitals) {
            // Calculate BMI
            const heightInM = visitData.vitals.height / 100;
            const bmi = parseFloat((visitData.vitals.weight / (heightInM * heightInM)).toFixed(2));

            const vitalsRecord = new Vitals({
                patient_id: patientIdObj,
                visit_id: visit._id,
                ...visitData.vitals,
                bmi
            });
            await vitalsRecord.save({ session });
            visit.vitals = vitalsRecord._id;

            // Also update the patient's master MedicalProfile with recent height/weight
            await MedicalProfile.findOneAndUpdate(
                { patient_id: patientIdObj },
                { 
                    height: visitData.vitals.height, 
                    weight: visitData.vitals.weight,
                    bmi
                },
                { upsert: true, session }
            );
        }

        // Save Diagnosis if provided
        if (visitData.diagnosis) {
            const diagRecord = new Diagnosis({
                patient_id: patientIdObj,
                visit_id: visit._id,
                ...visitData.diagnosis
            });
            await diagRecord.save({ session });
            visit.diagnosis = diagRecord._id;
        }

        // Save Prescription if provided
        if (visitData.prescription) {
            const presRecord = new Prescription({
                patient_id: patientIdObj,
                visit_id: visit._id,
                ...visitData.prescription
            });
            await presRecord.save({ session });
            visit.prescription = presRecord._id;
        }

        // Save Lab Orders if provided
        if (visitData.lab_orders && visitData.lab_orders.tests && visitData.lab_orders.tests.length > 0) {
            const results = visitData.lab_orders.tests.map(testName => ({
                test_name: testName,
                status: 'Pending' as const
            }));

            const labOrderRecord = new LabOrder({
                patient_id: patientIdObj,
                visit_id: visit._id,
                tests: visitData.lab_orders.tests,
                results,
                status: 'Ordered'
            });
            await labOrderRecord.save({ session });
            visit.lab_orders.push(labOrderRecord._id);
        }

        // Save Doctor Private Notes if provided
        if (visitData.private_notes) {
            const notesRecord = new DoctorNote({
                patient_id: patientIdObj,
                visit_id: visit._id,
                doctor_id: doctorIdObj,
                private_notes: visitData.private_notes
            });
            await notesRecord.save({ session });
            visit.notes = notesRecord._id;
        }

        await visit.save({ session });
        
        await logAudit(
            operatorId,
            operatorRole,
            'CREATE_VISIT_RECORD',
            visitData.patient_id,
            `Created clinical encounter visit ${visit.visit_id}.`
        );

        await session.commitTransaction();
        session.endSession();
        return visit;
    } catch (e: any) {
        await session.abortTransaction();
        session.endSession();
        throw e;
    }
};

export const getVitalsHistory = async (patientId: string) => {
    return await Vitals.find({ patient_id: new mongoose.Types.ObjectId(patientId) })
        .sort({ recorded_at: 1 }); // chronological order for trend charts
};

export const updateLabOrderStatus = async (
    orderId: string,
    updateData: {
        status: 'Ordered' | 'Collected' | 'Processing' | 'Completed';
        results?: Array<{
            test_name: string;
            result_value: string;
            reference_range?: string;
        }>;
    },
    operatorId: string,
    operatorRole: 'Doctor' | 'Patient' | 'Admin' | 'Lab'
) => {
    const labOrder = await LabOrder.findById(orderId);
    if (!labOrder) {
        throw new Error("Lab order not found.");
    }

    labOrder.status = updateData.status;
    if (updateData.results) {
        // Map results back
        labOrder.results = labOrder.results.map(r => {
            const match = updateData.results?.find(ur => ur.test_name === r.test_name);
            if (match) {
                return {
                    ...r,
                    result_value: match.result_value,
                    reference_range: match.reference_range || r.reference_range,
                    status: 'Completed' as const,
                    completed_at: new Date()
                };
            }
            return r;
        });
    }

    await labOrder.save();

    await logAudit(
        operatorId,
        operatorRole,
        'UPDATE_LAB_ORDER',
        labOrder.patient_id.toString(),
        `Updated Lab Order ${labOrder.lab_order_id} status to ${updateData.status}.`
    );

    return labOrder;
};

export const addAttachmentToVisit = async (
    visitId: string,
    attachment: {
        name: string;
        file_type: string;
        url: string;
    },
    operatorId: string,
    operatorRole: 'Doctor' | 'Patient' | 'Admin' | 'Lab'
) => {
    const visit = await Visit.findById(visitId);
    if (!visit) {
        throw new Error("Visit not found.");
    }

    // Check version
    const existingCount = visit.attachments.filter(a => a.name === attachment.name).length;
    const version = existingCount + 1;

    visit.attachments.push({
        ...attachment,
        uploaded_at: new Date(),
        version
    });

    await visit.save();

    await logAudit(
        operatorId,
        operatorRole,
        'ADD_ATTACHMENT',
        visit.patient_id.toString(),
        `Attached file ${attachment.name} (version ${version}) to visit ${visit.visit_id}.`
    );

    return visit;
};

export const getDoctorNotes = async (patientId: string, doctorId: string) => {
    return await DoctorNote.find({
        patient_id: new mongoose.Types.ObjectId(patientId),
        doctor_id: new mongoose.Types.ObjectId(doctorId)
    }).sort({ createdAt: -1 });
};

export const getAuditHistory = async (patientId: string) => {
    return await AuditLog.find({ patient_id: new mongoose.Types.ObjectId(patientId) })
        .sort({ timestamp: -1 });
};

export const getLabOrders = async (status?: string) => {
    const query = status ? { status } : {};
    return await LabOrder.find(query)
        .populate({
            path: 'patient_id',
            select: 'name patient_id gender age phone'
        })
        .populate({
            path: 'visit_id',
            populate: {
                path: 'doctor_id',
                populate: {
                    path: 'user_id',
                    select: 'name'
                }
            }
        })
        .sort({ createdAt: -1 });
};
