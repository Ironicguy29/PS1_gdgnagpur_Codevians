import { AccessToken, RoomServiceClient, Room, ParticipantInfo } from 'livekit-server-sdk';

const LIVEKIT_URL    = process.env.LIVEKIT_URL    || 'wss://healthcare-bewsqlmf.livekit.cloud';
const LIVEKIT_API_KEY    = process.env.LIVEKIT_API_KEY    || 'APIUiGQxhQSCoQf';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'J1KaSb4kkfKzwYWiZ4kTp8yV9r6P3msoM09Si8Km0bT';

// HTTP URL for RoomService (strip wss:// → https://)
const LIVEKIT_HTTP_URL = LIVEKIT_URL.replace(/^wss?:\/\//, 'https://');

const roomService = new RoomServiceClient(LIVEKIT_HTTP_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

// ─────────────────────────────────────────────────────────────────────────────
// Token generation — short-lived JWT for a single participant
// ─────────────────────────────────────────────────────────────────────────────
export interface TokenGrantOptions {
    roomName:    string;
    identity:    string;   // unique user identifier
    name:        string;   // display name in the room
    role:        'doctor' | 'patient';
    ttlSeconds?: number;   // default 2 hours
}

export async function generateToken(opts: TokenGrantOptions): Promise<string> {
    const ttl = opts.ttlSeconds ?? 7200;

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity: opts.identity,
        name: opts.name,
        ttl: `${ttl}s`,
    });

    at.addGrant({
        room:              opts.roomName,
        roomJoin:          true,
        canPublish:        true,
        canSubscribe:      true,
        canPublishData:    true,
        // Doctors get room admin rights
        roomAdmin:         opts.role === 'doctor',
        roomCreate:        opts.role === 'doctor',
    });

    return at.toJwt();
}

// ─────────────────────────────────────────────────────────────────────────────
// Room management
// ─────────────────────────────────────────────────────────────────────────────
export async function createRoom(roomName: string): Promise<Room> {
    return roomService.createRoom({
        name:            roomName,
        maxParticipants: 2,           // doctor + patient only
        emptyTimeout:    300,         // auto-cleanup after 5 min empty
    });
}

export async function roomExists(roomName: string): Promise<boolean> {
    try {
        const rooms = await roomService.listRooms([roomName]);
        return rooms.length > 0;
    } catch {
        return false;
    }
}

export async function getParticipants(roomName: string): Promise<ParticipantInfo[]> {
    try {
        return await roomService.listParticipants(roomName);
    } catch {
        return [];
    }
}

export async function deleteRoom(roomName: string): Promise<void> {
    try {
        await roomService.deleteRoom(roomName);
    } catch (err) {
        // Room may not exist — swallow gracefully
        console.warn(`[LiveKit] Could not delete room ${roomName}:`, err);
    }
}

export async function removeParticipant(roomName: string, identity: string): Promise<void> {
    try {
        await roomService.removeParticipant(roomName, identity);
    } catch (err) {
        console.warn(`[LiveKit] Could not remove participant ${identity}:`, err);
    }
}

export { LIVEKIT_URL, LIVEKIT_HTTP_URL, LIVEKIT_API_KEY };

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
