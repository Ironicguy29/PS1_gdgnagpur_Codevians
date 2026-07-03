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
const ctrl = __importStar(require("../controllers/telemedicineController"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Token & session lifecycle
router.post('/token', auth_middleware_1.authenticate, ctrl.getToken);
router.post('/start', auth_middleware_1.authenticate, ctrl.startSession);
router.post('/end', auth_middleware_1.authenticate, ctrl.endSession);
// Messaging
router.post('/message', auth_middleware_1.authenticate, ctrl.sendMessage);
// Admin analytics
router.get('/admin/analytics', auth_middleware_1.authenticate, ctrl.getAdminAnalytics);
// Per-role history
router.get('/patient/:patientUserId', auth_middleware_1.authenticate, ctrl.getPatientSessions);
router.get('/doctor/:doctorUserId', auth_middleware_1.authenticate, ctrl.getDoctorSessions);
// Session lookup by appointment (must be last to avoid route conflicts)
router.get('/:appointmentId', auth_middleware_1.authenticate, ctrl.getSession);
exports.default = router;
