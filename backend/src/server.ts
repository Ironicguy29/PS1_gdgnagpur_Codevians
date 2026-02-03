import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all for hackathon
        methods: ["GET", "POST"]
    }
});

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

app.use('/api/v1/queue', queueRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/admin', adminRoutes);

// Basic Route
app.get('/', (req: Request, res: Response) => {
    res.send('ArogyaMitra API is running');
});

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/arogyamitra';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        httpServer.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
