import VoiceSession from '../models/VoiceSession';
import VoiceTranscript from '../models/VoiceTranscript';
import VoiceTranslation from '../models/VoiceTranslation';
import VoiceSettings from '../models/VoiceSettings';

export const createSession = async (data: any) => {
    return VoiceSession.create(data);
};

export const findSessionById = async (id: string) => {
    return VoiceSession.findById(id);
};

export const updateSession = async (id: string, data: any) => {
    return VoiceSession.findByIdAndUpdate(id, data, { new: true });
};

export const findSessionsByPatient = async (patientId: string) => {
    return VoiceSession.find({ patient_id: patientId }).sort({ createdAt: -1 }).limit(50);
};

export const createTranscript = async (data: any) => {
    return VoiceTranscript.create(data);
};

export const findTranscriptsBySession = async (sessionId: string) => {
    return VoiceTranscript.find({ session_id: sessionId }).sort({ createdAt: 1 });
};

export const createTranslationLog = async (data: any) => {
    return VoiceTranslation.create(data);
};

export const findSettings = async (userId: string) => {
    return VoiceSettings.findOne({ user_id: userId });
};

export const upsertSettings = async (userId: string, data: any) => {
    return VoiceSettings.findOneAndUpdate(
        { user_id: userId },
        { ...data, user_id: userId },
        { new: true, upsert: true }
    );
};

export const getVoiceAnalytics = async () => {
    const totalSessions = await VoiceSession.countDocuments();
    const activeSessions = await VoiceSession.countDocuments({ status: 'active' });
    const totalTranscripts = await VoiceTranscript.countDocuments();
    const totalTranslations = await VoiceTranslation.countDocuments();

    const languageDistribution = await VoiceTranscript.aggregate([
        { $group: { _id: '$original_language', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    const translationTypeDistribution = await VoiceTranslation.aggregate([
        { $group: { _id: '$translation_type', count: { $sum: 1 } } }
    ]);

    const avgConfidence = await VoiceTranscript.aggregate([
        { $group: { _id: null, avg: { $avg: '$confidence_score' } } }
    ]);

    const recentSessions = await VoiceSession.find()
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
        avgConfidence: avgConfidence[0]?.avg || 0,
        recentSessions
    };
};

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
