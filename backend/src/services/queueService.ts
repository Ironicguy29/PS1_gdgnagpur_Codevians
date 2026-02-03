import Queue, { IQueue } from '../models/Queue';
import Doctor from '../models/Doctor';
import Appointment from '../models/Appointment';

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
    return patientsAhead * queue.estimated_wait_time_per_patient;
};
