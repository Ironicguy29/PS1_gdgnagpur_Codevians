"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn exists, if not I'll use template literals or check utils

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const toast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 5000); // Auto dismiss after 5s
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                            layout
                            className={cn(
                                "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md min-w-[300px] max-w-md",
                                t.type === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-900/20",
                                t.type === 'error' && "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 dark:bg-red-900/20",
                                t.type === 'warning' && "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 dark:bg-amber-900/20",
                                t.type === 'info' && "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 dark:bg-blue-900/20",
                                "bg-white/80 dark:bg-black/80" // Fallback/Base
                            )}
                        >
                            <div className="shrink-0">
                                {t.type === 'success' && <CheckCircle className="w-5 h-5" />}
                                {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
                                {t.type === 'warning' && <AlertCircle className="w-5 h-5" />}
                                {t.type === 'info' && <Info className="w-5 h-5" />}
                            </div>
                            <p className="text-sm font-medium flex-1">{t.message}</p>
                            <button
                                onClick={() => removeToast(t.id)}
                                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
