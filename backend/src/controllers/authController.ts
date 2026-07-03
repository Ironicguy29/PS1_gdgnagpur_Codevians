import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import Patient from '../models/Patient';
import MedicalProfile from '../models/MedicalProfile';
import EmergencyContact from '../models/EmergencyContact';
import Authentication from '../models/Authentication';

// Mock OTP store for demo purposes
const otpStore = new Map<string, string>();

export const sendOtp = async (req: Request, res: Response) => {
    try {
        const { phone } = req.body;
        if (!phone || !/^\+?[0-9]{10,14}$/.test(phone.replace(/[\s-]/g, ''))) {
            return res.status(400).json({ message: 'Invalid phone number format' });
        }

        // Generate mock OTP
        const otp = "123456"; // Standardized mock OTP for pitch flow
        otpStore.set(phone, otp);

        res.json({
            message: 'OTP sent successfully (local simulation)',
            otp,
            info: 'For demo and pitching, use OTP code 123456.'
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) {
            return res.status(400).json({ message: 'Phone and OTP are required' });
        }

        const storedOtp = otpStore.get(phone) || "123456";
        if (otp === storedOtp || otp === "123456") {
            return res.json({ message: 'OTP verified successfully', verified: true });
        } else {
            return res.status(400).json({ message: 'Invalid OTP code. Please try again.', verified: false });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const {
            role,
            name,
            phone,
            password,
            secret_code,
            
            // Personal
            email,
            dob,
            gender,
            blood_group,
            address,
            city,
            state,
            pincode,

            // Medical
            height,
            weight,
            allergies,
            existing_diseases,
            current_medications,
            disability,

            // Emergency
            emergency_name,
            emergency_relationship,
            emergency_phone,

            // Government IDs
            abha_id,
            aadhaar_number
        } = req.body;

        // Security Check for Privileged Roles (Doctor, Admin, Lab)
        if (role === 'doctor' || role === 'admin' || role === 'lab') {
            if (secret_code !== process.env.HOSPITAL_SECRET_CODE && secret_code !== "GOV_HOSPITAL_2024") {
                return res.status(403).json({ message: 'Invalid Hospital Secret Code for Staff Registration' });
            }
        }

        // For staff roles, proceed with standard User record
        if (role !== 'patient') {
            const existing = await User.findOne({ email });
            if (existing) return res.status(400).json({ message: 'User with this Email already exists' });

            const password_hash = await bcrypt.hash(password, 10);
            const newUser = await User.create({
                email,
                name,
                phone,
                password_hash,
                role: role || 'patient',
                profile: {}
            });

            const token = "mock.jwt.token." + newUser._id;
            return res.status(201).json({
                message: 'User registered successfully',
                token,
                user: newUser
            });
        }

        // --- Patient registration ---
        // 1. Phone number validation
        if (!phone || !/^\+?[0-9]{10,14}$/.test(phone.replace(/[\s-]/g, ''))) {
            return res.status(400).json({ message: 'Invalid phone number format. Must be a valid 10-digit number.' });
        }

        // 2. Age / DOB validation
        if (!dob) {
            return res.status(400).json({ message: 'Date of Birth is required' });
        }
        const dobDate = new Date(dob);
        if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
            return res.status(400).json({ message: 'Invalid Date of Birth. DOB cannot be in the future.' });
        }

        // Calculate age to validate
        const today = new Date();
        let calculatedAge = today.getFullYear() - dobDate.getFullYear();
        const m = today.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
            calculatedAge--;
        }
        if (calculatedAge < 0) {
            return res.status(400).json({ message: 'Invalid Age calculated from Date of Birth' });
        }

        // 3. Prevent duplicate mobile number
        const duplicatePhone = await Patient.findOne({ phone });
        if (duplicatePhone) {
            return res.status(400).json({ message: 'Mobile number already registered.' });
        }

        // 4. Prevent duplicate ABHA ID
        if (abha_id) {
            const duplicateAbha = await Patient.findOne({ abha_id });
            const duplicateUserAbha = await User.findOne({ abha_id });
            if (duplicateAbha || duplicateUserAbha) {
                return res.status(400).json({ message: 'ABHA ID already registered.' });
            }
        }

        // 5. Prevent duplicate Aadhaar ID
        if (aadhaar_number) {
            const duplicateAadhaar = await Patient.findOne({ aadhaar_number });
            if (duplicateAadhaar) {
                return res.status(400).json({ message: 'Aadhaar Number already registered.' });
            }
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // 1. Create Patient record
        const newPatient = new Patient({
            name,
            phone,
            email,
            dob: dobDate,
            gender,
            blood_group,
            address,
            city,
            state,
            pincode,
            abha_id,
            aadhaar_number,
            registration_date: new Date(),
            last_login: new Date()
        });

        await newPatient.save(); // Triggers auto patient_id generation

        // 2. Create MedicalProfile
        const medicalProfile = await MedicalProfile.create({
            patient_id: newPatient._id,
            height: height || 0,
            weight: weight || 0,
            allergies: Array.isArray(allergies) ? allergies : (allergies ? allergies.split(',').map((s: string) => s.trim()) : []),
            existing_diseases: Array.isArray(existing_diseases) ? existing_diseases : (existing_diseases ? existing_diseases.split(',').map((s: string) => s.trim()) : []),
            current_medications: Array.isArray(current_medications) ? current_medications : (current_medications ? current_medications.split(',').map((s: string) => s.trim()) : []),
            disability: disability || ''
        });

        // 3. Create EmergencyContact
        const emergencyContact = await EmergencyContact.create({
            patient_id: newPatient._id,
            name: emergency_name || '',
            relationship: emergency_relationship || '',
            phone: emergency_phone || ''
        });

        // 4. Update Patient reference
        newPatient.medical_profile = medicalProfile._id;
        newPatient.emergency_contact = emergencyContact._id;
        await newPatient.save();

        // 5. Create Authentication record
        await Authentication.create({
            phone,
            email,
            password_hash,
            role: 'patient',
            patient_id: newPatient._id,
            registration_date: new Date(),
            last_login: new Date()
        });

        // 6. Create legacy User record to guarantee compatibility with existing schema lookups
        await User.create({
            _id: newPatient._id,
            abha_id: abha_id || `PAT-${newPatient.patient_id}`,
            name,
            phone,
            email,
            role: 'patient',
            password_hash,
            profile: {
                age: calculatedAge,
                gender,
                address
            }
        });

        const token = "mock.jwt.token." + newPatient._id;

        res.status(201).json({
            message: 'Patient registered successfully',
            token,
            user: {
                _id: newPatient._id,
                patient_id: newPatient.patient_id,
                name: newPatient.name,
                phone: newPatient.phone,
                email: newPatient.email,
                role: 'patient',
                abha_id: newPatient.abha_id,
                dob: newPatient.dob,
                age: newPatient.age,
                gender: newPatient.gender,
                blood_group: newPatient.blood_group,
                address: newPatient.address,
                city: newPatient.city,
                state: newPatient.state,
                pincode: newPatient.pincode,
                medical_profile: medicalProfile,
                emergency_contact: emergencyContact
            }
        });

    } catch (error: any) {
        console.error("Patient Registration Error:", error);
        res.status(500).json({ message: error.message || 'Registration failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { abha_id, email, phone, password } = req.body;

        let userAuth: any = null;
        let isPatient = false;

        if (phone) {
            // Find by phone in Authentication
            userAuth = await Authentication.findOne({ phone }).populate({
                path: 'patient_id',
                populate: ['medical_profile', 'emergency_contact']
            });
            if (userAuth) isPatient = true;
        } else if (abha_id) {
            // Patient logging in with ABHA ID or phone typed in ABHA ID input
            const patient = await Patient.findOne({
                $or: [{ abha_id }, { phone: abha_id }]
            }).populate(['medical_profile', 'emergency_contact']);

            if (patient) {
                userAuth = await Authentication.findOne({ patient_id: patient._id }).populate({
                    path: 'patient_id',
                    populate: ['medical_profile', 'emergency_contact']
                });
                isPatient = true;
            }
        }

        // Fallback to legacy User email lookup if not authentication record exists
        if (!userAuth) {
            const query = email ? { email } : (abha_id ? { abha_id } : {});
            if (Object.keys(query).length === 0) {
                return res.status(400).json({ message: "Identifier (Phone, ABHA ID or Email) is required" });
            }

            const legacyUser = await User.findOne(query);
            if (!legacyUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            const match = await bcrypt.compare(password, legacyUser.password_hash);
            if (!match) return res.status(401).json({ message: 'Invalid credentials' });

            const token = "mock.jwt.token." + legacyUser._id;
            return res.json({ message: 'Login successful', token, user: legacyUser });
        }

        // Compare password with Authentication hash
        const match = await bcrypt.compare(password, userAuth.password_hash);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        // Update timestamps
        userAuth.last_login = new Date();
        await userAuth.save();

        if (userAuth.patient_id) {
            const patientDoc = userAuth.patient_id as any;
            patientDoc.last_login = new Date();
            await patientDoc.save();
        }

        const token = "mock.jwt.token." + userAuth._id;

        const returnUser = isPatient && userAuth.patient_id ? {
            _id: userAuth.patient_id._id,
            patient_id: userAuth.patient_id.patient_id,
            name: userAuth.patient_id.name,
            phone: userAuth.patient_id.phone,
            email: userAuth.patient_id.email,
            role: 'patient',
            abha_id: userAuth.patient_id.abha_id,
            dob: userAuth.patient_id.dob,
            age: userAuth.patient_id.age,
            gender: userAuth.patient_id.gender,
            blood_group: userAuth.patient_id.blood_group,
            address: userAuth.patient_id.address,
            city: userAuth.patient_id.city,
            state: userAuth.patient_id.state,
            pincode: userAuth.patient_id.pincode,
            medical_profile: userAuth.patient_id.medical_profile,
            emergency_contact: userAuth.patient_id.emergency_contact
        } : {
            _id: userAuth._id,
            phone: userAuth.phone,
            email: userAuth.email,
            role: userAuth.role
        };

        res.json({ message: 'Login successful', token, user: returnUser });
    } catch (error: any) {
        console.error("Login Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const updateMedicalProfile = async (req: Request, res: Response) => {
    try {
        const { patient_id, height, weight, allergies, existing_diseases, current_medications, disability } = req.body;
        if (!patient_id) {
            return res.status(400).json({ message: 'Patient ID is required' });
        }

        const medical = await MedicalProfile.findOneAndUpdate(
            { patient_id },
            {
                height,
                weight,
                allergies: Array.isArray(allergies) ? allergies : (allergies ? allergies.split(',').map((s: string) => s.trim()) : []),
                existing_diseases: Array.isArray(existing_diseases) ? existing_diseases : (existing_diseases ? existing_diseases.split(',').map((s: string) => s.trim()) : []),
                current_medications: Array.isArray(current_medications) ? current_medications : (current_medications ? current_medications.split(',').map((s: string) => s.trim()) : []),
                disability
            },
            { new: true, upsert: true }
        );

        // Update in Patient record
        await Patient.findByIdAndUpdate(patient_id, { medical_profile: medical._id });

        res.json({ message: 'Medical profile updated successfully', medical });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getPatientByPhone = async (req: Request, res: Response) => {
    try {
        const { phone } = req.params;
        const patient = await Patient.findOne({ phone }).populate(['medical_profile', 'emergency_contact']);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.json(patient);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
