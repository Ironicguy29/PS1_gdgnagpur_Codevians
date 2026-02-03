import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const predictWaitTime = async (queueLength: number, avgTime: number, doctorId: string) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/predict-wait`, {
            queue_length: queueLength,
            avg_consultation_time: avgTime,
            doctor_id: doctorId
        });
        return response.data;
    } catch (error) {
        console.error('AI Service Error:', error);
        // Fallback logic
        return { predicted_wait_minutes: queueLength * avgTime, confidence_score: 0.5 };
    }
};

export const getTriageScore = async (data: any) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/triage-score`, data);
        return response.data;
    } catch (error) {
        console.error('AI Service Error:', error);
        return { triage_score: 0, category: 'Unknown' };
    }
}
