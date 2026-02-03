import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken'; // Assuming you'd add JWT later, simplified for now

export const register = async (req: Request, res: Response) => {
    try {
        const { abha_id, name, phone, password, role, profile } = req.body;

        // Check if user exists
        const existing = await User.findOne({ abha_id });
        if (existing) return res.status(400).json({ message: 'User with this ABHA ID already exists' });

        const password_hash = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            abha_id,
            name,
            phone,
            password_hash,
            role: role || 'patient',
            profile
        });

        res.status(201).json({ message: 'User registered successfully', userId: newUser._id });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { abha_id, password } = req.body;

        const user = await User.findOne({ abha_id });
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
