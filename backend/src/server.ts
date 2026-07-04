import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { setIo } from './utils/socket';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all for hackathon
        methods: ["GET", "POST"]
    }
});

setIo(io);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io Events
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Make io available in routes
app.set('io', io);

// Routes
import queueRoutes from './routes/queue.routes';
import authRoutes from './routes/auth.routes';
import appointmentRoutes from './routes/appointments.routes';
import doctorRoutes from './routes/doctors.routes';
import adminRoutes from './routes/admin.routes';
import emrRoutes from './routes/emr.routes';
import consultationRoutes from './routes/consultation.routes';
import labRoutes from './routes/lab.routes';
import pharmacyRoutes from './routes/pharmacy.routes';
import billingRoutes from './routes/billing.routes';
import telemedicineRoutes from './routes/telemedicine.routes';
import ambulanceRoutes from './routes/ambulance.routes';
import digitalTwinRoutes from './routes/digitalTwin.routes';
import aiClinicalRoutes from './routes/aiClinical.routes';
import voiceAssistantRoutes from './routes/voiceAssistant.routes';
import stateAdminRoutes from './routes/stateAdmin.routes';

app.use('/api/v1/queue', queueRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/emr', emrRoutes);
app.use('/api/v1/consultations', consultationRoutes);
app.use('/api/v1/lab', labRoutes);
app.use('/api/v1/pharmacy', pharmacyRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/telemedicine', telemedicineRoutes);
app.use('/api/v1/ambulance', ambulanceRoutes);
app.use('/api/v1/digital-twin', digitalTwinRoutes);
app.use('/api/v1/ai-clinical', aiClinicalRoutes);
app.use('/api/v1/voice-assistant', voiceAssistantRoutes);
app.use('/api/v1/state-admin', stateAdminRoutes);



// Basic Route
app.get('/', (req: Request, res: Response) => {
    res.send('ArogyaMitra API is running');
});

import { errorHandler } from './utils/errorHandler';

// Error handling middleware
app.use(errorHandler);

// Database Connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('MONGO_URI is not set. Please configure backend/.env before starting the backend.');
    process.exit(1);
}

mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
})
    .then(() => {
        console.log('Connected to MongoDB Atlas');
        httpServer.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
