import mongoose, { Schema, Document } from 'mongoose';

// ─── Chat Message ─────────────────────────────────────────────────────────────
export interface IChatMessage {
    sender_id: mongoose.Types.ObjectId;
    sender_role: 'patient' | 'doctor';
    sender_name: string;
    message: string;
    message_type: 'text' | 'file' | 'voice_note' | 'instruction';
    file_url?: string;
    file_name?: string;
    file_size?: number;
    file_type?: string;
    sentAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
    sender_id:   { type: Schema.Types.ObjectId, required: true },
    sender_role: { type: String, enum: ['patient', 'doctor'], required: true },
    sender_name: { type: String, required: true },
    message:     { type: String, default: '' },
    message_type:{ type: String, enum: ['text', 'file', 'voice_note', 'instruction'], default: 'text' },
    file_url:    { type: String },
    file_name:   { type: String },
    file_size:   { type: Number },
    file_type:   { type: String },
    sentAt:      { type: Date, default: Date.now },
});

// ─── Shared File ──────────────────────────────────────────────────────────────
export interface ISharedFile {
    uploader_id: mongoose.Types.ObjectId;
    uploader_role: 'patient' | 'doctor';
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    category: 'lab_report' | 'prescription' | 'image' | 'document' | 'other';
    uploaded_at: Date;
}

const SharedFileSchema = new Schema<ISharedFile>({
    uploader_id:   { type: Schema.Types.ObjectId, required: true },
    uploader_role: { type: String, enum: ['patient', 'doctor'], required: true },
    file_name:     { type: String, required: true },
    file_url:      { type: String, required: true },
    file_type:     { type: String, required: true },
    file_size:     { type: Number, required: true },
    category:      { type: String, enum: ['lab_report', 'prescription', 'image', 'document', 'other'], default: 'other' },
    uploaded_at:   { type: Date, default: Date.now },
});

// ─── Connection Log Entry ─────────────────────────────────────────────────────
export interface IConnectionLog {
    user_id: mongoose.Types.ObjectId;
    role: string;
    event: 'joined' | 'left' | 'reconnected' | 'network_poor' | 'network_good';
    timestamp: Date;
    metadata?: Record<string, any>;
}

const ConnectionLogSchema = new Schema<IConnectionLog>({
    user_id:   { type: Schema.Types.ObjectId },
    role:      { type: String },
    event:     { type: String, enum: ['joined', 'left', 'reconnected', 'network_poor', 'network_good'] },
    timestamp: { type: Date, default: Date.now },
    metadata:  { type: Schema.Types.Mixed },
});

// ─── Main TelemedicineSession ─────────────────────────────────────────────────
export interface ITelemedicineSession extends Document {
    appointment_id:   mongoose.Types.ObjectId;
    consultation_id?: mongoose.Types.ObjectId;
    patient_id:       mongoose.Types.ObjectId;
    doctor_id:        mongoose.Types.ObjectId;
    room_name:        string;          // Format: appointment-{appointmentId}
    livekit_url:      string;
    consultation_type: 'video' | 'audio' | 'physical';
    status: 'waiting' | 'active' | 'completed' | 'cancelled' | 'missed';
    doctor_joined_at?: Date;
    patient_joined_at?: Date;
    started_at?: Date;
    ended_at?: Date;
    duration_seconds: number;
    chat_messages: IChatMessage[];
    shared_files: ISharedFile[];
    connection_logs: IConnectionLog[];
    // Post-consultation summary
    summary?: {
        chief_complaint?: string;
        diagnosis?: string;
        notes?: string;
        prescription_id?: mongoose.Types.ObjectId;
        lab_order_ids?: mongoose.Types.ObjectId[];
        follow_up_date?: Date;
        follow_up_notes?: string;
    };
    // Analytics
    analytics?: {
        avg_network_quality?: number;
        reconnection_count?: number;
        bandwidth_mode?: 'hd' | 'sd' | 'audio_only';
        patient_rating?: number;
        patient_feedback?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const TelemedicineSessionSchema: Schema = new Schema<ITelemedicineSession>({
    appointment_id:    { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    consultation_id:   { type: Schema.Types.ObjectId, ref: 'Consultation' },
    patient_id:        { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor_id:         { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    room_name:         { type: String, required: true, unique: true },
    livekit_url:       { type: String, required: true },
    consultation_type: { type: String, enum: ['video', 'audio', 'physical'], default: 'video' },
    status:            { type: String, enum: ['waiting', 'active', 'completed', 'cancelled', 'missed'], default: 'waiting' },
    doctor_joined_at:  { type: Date },
    patient_joined_at: { type: Date },
    started_at:        { type: Date },
    ended_at:          { type: Date },
    duration_seconds:  { type: Number, default: 0 },
    chat_messages:     [ChatMessageSchema],
    shared_files:      [SharedFileSchema],
    connection_logs:   [ConnectionLogSchema],
    summary: {
        chief_complaint: { type: String },
        diagnosis:       { type: String },
        notes:           { type: String },
        prescription_id: { type: Schema.Types.ObjectId, ref: 'Prescription' },
        lab_order_ids:   [{ type: Schema.Types.ObjectId, ref: 'LabOrder' }],
        follow_up_date:  { type: Date },
        follow_up_notes: { type: String },
    },
    analytics: {
        avg_network_quality: { type: Number },
        reconnection_count:  { type: Number, default: 0 },
        bandwidth_mode:      { type: String, enum: ['hd', 'sd', 'audio_only'], default: 'hd' },
        patient_rating:      { type: Number, min: 1, max: 5 },
        patient_feedback:    { type: String },
    },
}, { timestamps: true });

// Index for quick lookups
TelemedicineSessionSchema.index({ patient_id: 1, status: 1 });
TelemedicineSessionSchema.index({ doctor_id: 1, status: 1 });

export default mongoose.model<ITelemedicineSession>('TelemedicineSession', TelemedicineSessionSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
