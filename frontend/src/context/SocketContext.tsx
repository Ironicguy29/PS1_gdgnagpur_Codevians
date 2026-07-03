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
        // Connect to Backend URL
        let backendUrl = 'http://localhost:5000';
        if (process.env.NEXT_PUBLIC_API_URL) {
            try {
                backendUrl = new URL(process.env.NEXT_PUBLIC_API_URL).origin;
            } catch (err) {
                console.error('Failed to parse NEXT_PUBLIC_API_URL:', err);
            }
        }

        const socketInstance = io(backendUrl, {
            transports: ['websocket'], // Force WebSocket for better performance
            autoConnect: true
        });

        socketInstance.on('connect', () => {
            console.log('Socket Connected:', socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket Disconnected');
            setIsConnected(false);
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
