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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIVEKIT_API_KEY = exports.LIVEKIT_HTTP_URL = exports.LIVEKIT_URL = void 0;
exports.generateToken = generateToken;
exports.createRoom = createRoom;
exports.roomExists = roomExists;
exports.getParticipants = getParticipants;
exports.deleteRoom = deleteRoom;
exports.removeParticipant = removeParticipant;
const livekit_server_sdk_1 = require("livekit-server-sdk");
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://healthcare-bewsqlmf.livekit.cloud';
exports.LIVEKIT_URL = LIVEKIT_URL;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'APIUiGQxhQSCoQf';
exports.LIVEKIT_API_KEY = LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'J1KaSb4kkfKzwYWiZ4kTp8yV9r6P3msoM09Si8Km0bT';
// HTTP URL for RoomService (strip wss:// → https://)
const LIVEKIT_HTTP_URL = LIVEKIT_URL.replace(/^wss?:\/\//, 'https://');
exports.LIVEKIT_HTTP_URL = LIVEKIT_HTTP_URL;
const roomService = new livekit_server_sdk_1.RoomServiceClient(LIVEKIT_HTTP_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
function generateToken(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const ttl = (_a = opts.ttlSeconds) !== null && _a !== void 0 ? _a : 7200;
        const at = new livekit_server_sdk_1.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: opts.identity,
            name: opts.name,
            ttl: `${ttl}s`,
        });
        at.addGrant({
            room: opts.roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            // Doctors get room admin rights
            roomAdmin: opts.role === 'doctor',
            roomCreate: opts.role === 'doctor',
        });
        return at.toJwt();
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// Room management
// ─────────────────────────────────────────────────────────────────────────────
function createRoom(roomName) {
    return __awaiter(this, void 0, void 0, function* () {
        return roomService.createRoom({
            name: roomName,
            maxParticipants: 2, // doctor + patient only
            emptyTimeout: 300, // auto-cleanup after 5 min empty
        });
    });
}
function roomExists(roomName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const rooms = yield roomService.listRooms([roomName]);
            return rooms.length > 0;
        }
        catch (_a) {
            return false;
        }
    });
}
function getParticipants(roomName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield roomService.listParticipants(roomName);
        }
        catch (_a) {
            return [];
        }
    });
}
function deleteRoom(roomName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield roomService.deleteRoom(roomName);
        }
        catch (err) {
            // Room may not exist — swallow gracefully
            console.warn(`[LiveKit] Could not delete room ${roomName}:`, err);
        }
    });
}
function removeParticipant(roomName, identity) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield roomService.removeParticipant(roomName, identity);
        }
        catch (err) {
            console.warn(`[LiveKit] Could not remove participant ${identity}:`, err);
        }
    });
}
