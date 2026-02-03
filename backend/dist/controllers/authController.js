"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const bcrypt_1 = __importDefault(require("bcrypt"));
// import jwt from 'jsonwebtoken'; // Assuming you'd add JWT later, simplified for now
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { abha_id, name, phone, password, role, profile } = req.body;
        // Check if user exists
        const existing = yield User_1.default.findOne({ abha_id });
        if (existing)
            return res.status(400).json({ message: 'User with this ABHA ID already exists' });
        const password_hash = yield bcrypt_1.default.hash(password, 10);
        const newUser = yield User_1.default.create({
            abha_id,
            name,
            phone,
            password_hash,
            role: role || 'patient',
            profile
        });
        res.status(201).json({ message: 'User registered successfully', userId: newUser._id });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { abha_id, password } = req.body;
        const user = yield User_1.default.findOne({ abha_id });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const match = yield bcrypt_1.default.compare(password, user.password_hash);
        if (!match)
            return res.status(401).json({ message: 'Invalid credentials' });
        // Mock Token Generation
        const token = "mock.jwt.token." + user._id;
        res.json({ message: 'Login successful', token, user });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.login = login;
