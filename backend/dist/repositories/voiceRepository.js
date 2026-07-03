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
exports.getVoiceAnalytics = exports.upsertSettings = exports.findSettings = exports.createTranslationLog = exports.findTranscriptsBySession = exports.createTranscript = exports.findSessionsByPatient = exports.updateSession = exports.findSessionById = exports.createSession = void 0;
const VoiceSession_1 = __importDefault(require("../models/VoiceSession"));
const VoiceTranscript_1 = __importDefault(require("../models/VoiceTranscript"));
const VoiceTranslation_1 = __importDefault(require("../models/VoiceTranslation"));
const VoiceSettings_1 = __importDefault(require("../models/VoiceSettings"));
const createSession = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return VoiceSession_1.default.create(data);
});
exports.createSession = createSession;
const findSessionById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return VoiceSession_1.default.findById(id);
});
exports.findSessionById = findSessionById;
const updateSession = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    return VoiceSession_1.default.findByIdAndUpdate(id, data, { new: true });
});
exports.updateSession = updateSession;
const findSessionsByPatient = (patientId) => __awaiter(void 0, void 0, void 0, function* () {
    return VoiceSession_1.default.find({ patient_id: patientId }).sort({ createdAt: -1 }).limit(50);
});
exports.findSessionsByPatient = findSessionsByPatient;
const createTranscript = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return VoiceTranscript_1.default.create(data);
});
exports.createTranscript = createTranscript;
const findTranscriptsBySession = (sessionId) => __awaiter(void 0, void 0, void 0, function* () {
    return VoiceTranscript_1.default.find({ session_id: sessionId }).sort({ createdAt: 1 });
});
exports.findTranscriptsBySession = findTranscriptsBySession;
const createTranslationLog = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return VoiceTranslation_1.default.create(data);
});
exports.createTranslationLog = createTranslationLog;
const findSettings = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return VoiceSettings_1.default.findOne({ user_id: userId });
});
exports.findSettings = findSettings;
const upsertSettings = (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
    return VoiceSettings_1.default.findOneAndUpdate({ user_id: userId }, Object.assign(Object.assign({}, data), { user_id: userId }), { new: true, upsert: true });
});
exports.upsertSettings = upsertSettings;
const getVoiceAnalytics = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const totalSessions = yield VoiceSession_1.default.countDocuments();
    const activeSessions = yield VoiceSession_1.default.countDocuments({ status: 'active' });
    const totalTranscripts = yield VoiceTranscript_1.default.countDocuments();
    const totalTranslations = yield VoiceTranslation_1.default.countDocuments();
    const languageDistribution = yield VoiceTranscript_1.default.aggregate([
        { $group: { _id: '$original_language', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    const translationTypeDistribution = yield VoiceTranslation_1.default.aggregate([
        { $group: { _id: '$translation_type', count: { $sum: 1 } } }
    ]);
    const avgConfidence = yield VoiceTranscript_1.default.aggregate([
        { $group: { _id: null, avg: { $avg: '$confidence_score' } } }
    ]);
    const recentSessions = yield VoiceSession_1.default.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('patient_id', 'name')
        .populate('doctor_id', 'name');
    return {
        totalSessions,
        activeSessions,
        totalTranscripts,
        totalTranslations,
        languageDistribution,
        translationTypeDistribution,
        avgConfidence: ((_a = avgConfidence[0]) === null || _a === void 0 ? void 0 : _a.avg) || 0,
        recentSessions
    };
});
exports.getVoiceAnalytics = getVoiceAnalytics;
