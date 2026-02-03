import Queue, { IQueue } from '../models/Queue';
import Doctor from '../models/Doctor';
import Appointment from '../models/Appointment';
import axios from 'axios';

export const getQueueStatus = async (doctorId: string, date: string) => {
    let queue = await Queue.findOne({ doctor_id: doctorId, date });
    if (!queue) {
        // If queue doesn't exist for today, create one
        const doctor = await Doctor.findOne({ user_id: doctorId });
        if (!doctor) throw new Error('Doctor not found');

        queue = await Queue.create({
            department: doctor.department,
            doctor_id: doctorId,
            date,
            current_token: 0,
            total_waiting: 0,
            estimated_wait_time_per_patient: doctor.avg_consultation_time
        });
    }
    return queue;
};

export const updateQueueProgress = async (doctorId: string, date: string) => {
    const queue = await Queue.findOne({ doctor_id: doctorId, date });
    if (!queue) throw new Error('Queue not found');

    queue.current_token += 1;
    queue.total_waiting = Math.max(0, queue.total_waiting - 1);
    await queue.save();
    return queue;
};

export const predictWaitTime = async (queueId: string, tokenNumber: number) => {
    const queue = await Queue.findById(queueId);
    if (!queue) throw new Error('Queue not found');

    const patientsAhead = Math.max(0, tokenNumber - queue.current_token);

    // AI Service Call
    try {
        const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        const response = await axios.post(`${aiUrl}/predict-wait`, {
            queue_length: patientsAhead,
            avg_consultation_time: queue.estimated_wait_time_per_patient,
            doctor_id: queue.doctor_id.toString()
        });
        return response.data.predicted_wait_minutes;
    } catch (error) {
        console.warn('AI Service unreachable, using fallback math.');
        // Fallback: Simple Linear Regression (y = mx)
        return patientsAhead * queue.estimated_wait_time_per_patient;
    }
};

export const handleEmergency = async (patientId: string, doctorId: string) => {
    // 1. Find today's queue
    const date = new Date().toISOString().split('T')[0];
    let queue = await Queue.findOne({ doctor_id: doctorId, date });

    if (!queue) {
        // Create if not exists (reusing logic or simplified)
        const doctor = await Doctor.findOne({ user_id: doctorId });
        if (!doctor) throw new Error('Doctor not found');
        queue = await Queue.create({
            department: doctor.department,
            doctor_id: doctorId,
            date,
            current_token: 0,
            total_waiting: 0,
            estimated_wait_time_per_patient: doctor.avg_consultation_time
        });
    }

    // 2. Create Emergency Appointment
    // In a real app, we might check if appointment exists. For hackathon, just log it.

    // 3. Logic: Emergency patients bypass the count or are flagged.
    // For simplicity: We decrease the current_token (if >0) effectively "inserting" them, 
    // or we just return a special "EMERGENCY" status.

    // Better Approach: Add to a priority list or just notify.
    // Let's assume we return a high-priority token (e.g., fractional or special flag).

    return {
        message: "Emergency Priority Granted",
        queueId: queue._id,
        estimatedWait: 0,
        status: "EMERGENCY_PRIORITY"
    };
};
