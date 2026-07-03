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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const queueController = __importStar(require("../controllers/queueController"));
const router = (0, express_1.Router)();
router.get('/live/:doctorId', queueController.getQueue);
router.post('/next', queueController.nextPatient);
router.post('/emergency', queueController.emergency);
router.get('/predict/:queueId/:tokenNumber', queueController.predictWait);
router.post('/check-in', queueController.checkIn);
router.post('/start', queueController.startConsultation);
router.post('/complete', queueController.completeConsultation);
router.post('/skip', queueController.skipPatient);
router.post('/transfer', queueController.transfer);
router.post('/duration', queueController.changeDuration);
router.post('/pause', queueController.pauseQueue);
router.get('/analytics', queueController.getAnalytics);
router.get('/patient-live/:patientId', queueController.getPatientLiveToken);
router.post('/generate-walkin', queueController.generateWalkInToken);
exports.default = router;
