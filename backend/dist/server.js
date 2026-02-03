"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*", // Allow all for hackathon
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
const queue_routes_1 = __importDefault(require("./routes/queue.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const appointments_routes_1 = __importDefault(require("./routes/appointments.routes"));
const doctors_routes_1 = __importDefault(require("./routes/doctors.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
app.use('/api/v1/queue', queue_routes_1.default);
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/appointments', appointments_routes_1.default);
app.use('/api/v1/doctors', doctors_routes_1.default);
app.use('/api/v1/admin', admin_routes_1.default);
// Basic Route
app.get('/', (req, res) => {
    res.send('ArogyaMitra API is running');
});
const errorHandler_1 = require("./utils/errorHandler");
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/arogyamitra';
mongoose_1.default.connect(MONGO_URI)
    .then(() => {
    console.log('Connected to MongoDB');
    httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
    .catch((err) => {
    console.error('MongoDB connection error:', err);
});
