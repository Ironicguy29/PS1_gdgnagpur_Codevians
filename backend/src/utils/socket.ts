import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export const setIo = (io: Server) => {
    ioInstance = io;
};

export const getIo = (): Server | null => {
    return ioInstance;
};

export const emitQueueUpdate = (event: string, data: any) => {
    if (ioInstance) {
        console.log(`Socket emit [${event}]:`, data);
        ioInstance.emit(event, data);
    } else {
        console.warn(`Socket instance not ready. Event [${event}] not sent.`);
    }
};
