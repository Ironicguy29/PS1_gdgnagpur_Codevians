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
exports.updateStatus = exports.getDoctors = void 0;
const Doctor_1 = __importDefault(require("../models/Doctor"));
const getDoctors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const doctors = yield Doctor_1.default.find().populate('user_id', 'name');
        res.json(doctors);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getDoctors = getDoctors;
const updateStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId, isAvailable } = req.body;
        const doctor = yield Doctor_1.default.findOneAndUpdate({ user_id: doctorId }, { is_available: isAvailable }, { new: true });
        res.json(doctor);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.updateStatus = updateStatus;
