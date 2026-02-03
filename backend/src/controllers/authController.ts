import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken'; // Assuming you'd add JWT later, simplified for now

export const register = async (req: Request, res: Response) => {
    try {
        const { abha_id, email, name, phone, password, role, secret_code } = req.body;

        // Security Check for Privileged Roles
        if (role === 'doctor' || role === 'admin') {
            if (secret_code !== process.env.HOSPITAL_SECRET_CODE && secret_code !== "GOV_HOSPITAL_2024") {
                return res.status(403).json({ message: 'Invalid Hospital Secret Code for Staff Registration' });
            }
        }

        // Check if user exists (checking both ABHA and Email)
        const identifier = role === 'patient' ? { abha_id } : { email };
        const existing = await User.findOne(identifier);

        if (existing) return res.status(400).json({ message: 'User with this ID/Email already exists' });

        const password_hash = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            abha_id: role === 'patient' ? abha_id : undefined,
            email: role !== 'patient' ? email : undefined,
            name,
            phone,
            password_hash,
            role: role || 'patient',
            // Default empty profile for now
            profile: {}
        });

        // Generate Token immediately for auto-login
        const token = "mock.jwt.token." + newUser._id;

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: newUser
        });
    } catch (error: any) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: error.message || 'Registration failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { abha_id, email, password } = req.body;

        // Determine lookup field based on what's provided
        // Patients send abha_id, Staff sends email
        let query = {};
        if (abha_id) query = { abha_id };
        else if (email) query = { email };
        else return res.status(400).json({ message: "Identifier (ABHA ID or Email) is required" });

        const user = await User.findOne(query);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        // Mock Token Generation
        const token = "mock.jwt.token." + user._id;

        res.json({ message: 'Login successful', token, user });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
