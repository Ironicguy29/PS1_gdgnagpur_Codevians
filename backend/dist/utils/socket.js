"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitQueueUpdate = exports.getIo = exports.setIo = void 0;
let ioInstance = null;
const setIo = (io) => {
    ioInstance = io;
};
exports.setIo = setIo;
const getIo = () => {
    return ioInstance;
};
exports.getIo = getIo;
const emitQueueUpdate = (event, data) => {
    if (ioInstance) {
        console.log(`Socket emit [${event}]:`, data);
        ioInstance.emit(event, data);
    }
    else {
        console.warn(`Socket instance not ready. Event [${event}] not sent.`);
    }
};
exports.emitQueueUpdate = emitQueueUpdate;
