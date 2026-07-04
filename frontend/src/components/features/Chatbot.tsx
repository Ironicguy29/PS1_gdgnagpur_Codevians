'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X } from 'lucide-react';
import axios from 'axios';
import { usePathname } from 'next/navigation';

export default function Chatbot() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
    const [input, setInput] = useState('');

    // Hide on dashboard, live-map and nura pages to avoid floating button conflicts
    if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/live-map') || pathname?.startsWith('/nura')) {
        return null;
    }

    const sendMessage = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');

        try {
            // Direct call to AI Service (in prod, proxy via backend)
            const aiUrl = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';
            const res = await axios.post(`${aiUrl}/chatbot`, {
                message: userMsg,
                language: 'en'
            });
            setMessages(prev => [...prev, { role: 'bot', text: res.data.response }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I'm offline right now." }]);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen && (
                <Button onClick={() => setIsOpen(true)} className="rounded-full h-14 w-14 shadow-lg bg-blue-600 hover:bg-blue-700">
                    <MessageCircle className="h-6 w-6 text-white" />
                </Button>
            )}

            {isOpen && (
                <Card className="w-[350px] shadow-2xl">
                    <CardHeader className="flex flex-row items-center justify-between p-4 bg-blue-600 text-white rounded-t-xl">
                        <CardTitle className="text-sm font-bold">ArogyaMitra Assistant</CardTitle>
                        <button onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></button>
                    </CardHeader>
                    <CardContent className="p-4 h-[300px] flex flex-col justify-between">
                        <div className="overflow-y-auto space-y-3 mb-4 h-full pr-2">
                            {messages.length === 0 && <p className="text-xs text-slate-400 text-center mt-4">Ask me about appointments, symptoms, or queues.</p>}
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg p-3 text-xs ${m.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-900'}`}>{m.text}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Type a message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <Button size="sm" onClick={sendMessage}>Send</Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
