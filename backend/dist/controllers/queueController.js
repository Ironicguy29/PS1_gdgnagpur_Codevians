"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictWait = exports.nextPatient = exports.getQueue = void 0;
const queueService = __importStar(require("../services/queueService"));
const getQueue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const doctorId = req.params.doctorId;
        const date = new Date().toISOString().split('T')[0]; // Today
        const queue = yield queueService.getQueueStatus(doctorId, date);
        res.json(queue);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getQueue = getQueue;
const nextPatient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId } = req.body;
        const date = new Date().toISOString().split('T')[0];
        const queue = yield queueService.updateQueueProgress(doctorId, date);
        // Emit Socket Event
        const io = req.app.get('io');
        io.emit('queue.token.update', { doctorId, currentToken: queue.current_token });
        io.emit('queue.status.update', { doctorId, status: queue.status });
        res.json(queue);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.nextPatient = nextPatient;
const predictWait = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const queueId = req.params.queueId;
        const tokenNumber = req.params.tokenNumber;
        const waitTime = yield queueService.predictWaitTime(queueId, parseInt(tokenNumber));
        res.json({ waitTime });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.predictWait = predictWait;
