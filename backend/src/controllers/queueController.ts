import { Request, Response } from 'express';
import * as queueService from '../services/queueService';

export const getQueue = async (req: Request, res: Response) => {
    try {
        const { doctorId } = req.params;
        const date = new Date().toISOString().split('T')[0]; // Today
        const queue = await queueService.getQueueStatus(doctorId, date);
        res.json(queue);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const nextPatient = async (req: Request, res: Response) => {
    try {
        const { doctorId } = req.body;
        const date = new Date().toISOString().split('T')[0];
        const queue = await queueService.updateQueueProgress(doctorId, date);

        // Emit Socket Event
        const io = req.app.get('io');
        io.emit('queue.token.update', { doctorId, currentToken: queue.current_token });
        io.emit('queue.status.update', { doctorId, status: queue.status });

        res.json(queue);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const predictWait = async (req: Request, res: Response) => {
    try {
        const { queueId, tokenNumber } = req.params;
        const waitTime = await queueService.predictWaitTime(queueId, parseInt(tokenNumber));
        res.json({ waitTime });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
