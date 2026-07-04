/**
 * SocketContext.tsx
 * -----------------------------------------------------------------
 * Provides a single Socket.IO connection shared across the entire app.
 *
 * URL resolution priority (production-safe):
 *  1. NEXT_PUBLIC_BACKEND_URL  (explicit socket root, e.g. https://api.example.com)
 *  2. Origin of NEXT_PUBLIC_API_URL (strips /api/v1 suffix)
 *  3. http://localhost:5000  — ONLY when running on localhost (local dev)
 *  4. No socket connection created if none of the above resolve
 *     → real-time features degrade gracefully, REST API still works
 *
 * Socket events used across the app:
 *  - queue.token.update  → UpcomingPatientsPanel (doctor)
 *  - queue.update        → UpcomingPatientsPanel (doctor)
 *  - prescription.created        → PharmacyQueuePanel
 *  - prescription.status.ready   → PharmacyQueuePanel
 *
 * Transports: WebSocket first, polling fallback (for Render.com free tier)
 * -----------------------------------------------------------------
 */
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Derive backend socket URL from NEXT_PUBLIC_BACKEND_URL (preferred)
        // or fall back to the origin of NEXT_PUBLIC_API_URL
        let backendUrl: string | null = null;

        if (process.env.NEXT_PUBLIC_BACKEND_URL) {
            backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        } else if (process.env.NEXT_PUBLIC_API_URL) {
            try {
                backendUrl = new URL(process.env.NEXT_PUBLIC_API_URL).origin;
            } catch {
                // malformed URL — skip socket
            }
        } else if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            // Local dev only
            backendUrl = 'http://localhost:5000';
        }

        if (!backendUrl) {
            console.warn('[Socket] No backend URL configured — real-time updates disabled.');
            return;
        }

        const socketInstance = io(backendUrl, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socketInstance.on('connect', () => {
            console.log('[Socket] Connected:', socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (err) => {
            console.warn('[Socket] Connection error:', err.message);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
