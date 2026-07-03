'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Volume2, VolumeX, Languages, Send,
    Loader2, Sparkles, Globe, ArrowRightLeft, MessageCircle
} from 'lucide-react';
import api from '@/lib/api';

const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', speechCode: 'en-US' },
    { code: 'hi', name: 'Hindi', speechCode: 'hi-IN' },
    { code: 'mr', name: 'Marathi', speechCode: 'mr-IN' },
    { code: 'ta', name: 'Tamil', speechCode: 'ta-IN' },
    { code: 'te', name: 'Telugu', speechCode: 'te-IN' },
    { code: 'gu', name: 'Gujarati', speechCode: 'gu-IN' },
    { code: 'kn', name: 'Kannada', speechCode: 'kn-IN' },
    { code: 'ml', name: 'Malayalam', speechCode: 'ml-IN' },
    { code: 'bn', name: 'Bengali', speechCode: 'bn-IN' },
    { code: 'pa', name: 'Punjabi', speechCode: 'pa-IN' },
];

interface Transcript {
    id: string;
    speaker: 'patient' | 'doctor' | 'ai';
    original: string;
    translated: string;
    language: string;
    languageName: string;
    time: Date;
}

export default function DoctorVoiceAssistantWidget() {
    const [isActive, setIsActive] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [patientLang, setPatientLang] = useState('hi');
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [textInput, setTextInput] = useState('');
    const [interimText, setInterimText] = useState('');

    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') synthRef.current = window.speechSynthesis;
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcripts]);

    const startSession = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = localStorage.getItem('token');
            if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            const res = await api.post('/voice-assistant/sessions', {
                patient_id: user._id,
                doctor_id: user._id,
                doctor_preferred_language: 'en',
                patient_preferred_language: patientLang
            });
            setSessionId(res.data._id);
        } catch {
            setSessionId('local-doc-' + Date.now());
        }
    };

    const handleActivate = () => {
        setIsActive(true);
        startSession();
    };

    const handleDeactivate = () => {
        stopListening();
        synthRef.current?.cancel();
        setIsActive(false);
        setTranscripts([]);
        setSessionId(null);
    };

    // Doctor speaks English, translate to patient language
    const processInput = async (text: string, role: 'doctor' | 'patient' = 'doctor') => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const entryId = `${role}-${Date.now()}`;

        setTranscripts(prev => [...prev, {
            id: entryId,
            speaker: role,
            original: text,
            translated: '',
            language: role === 'doctor' ? 'en' : patientLang,
            languageName: role === 'doctor' ? 'English' : SUPPORTED_LANGUAGES.find(l => l.code === patientLang)?.name || patientLang,
            time: new Date()
        }]);

        setIsProcessing(true);
        try {
            const token = localStorage.getItem('token');
            if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            const targetLang = role === 'doctor' ? patientLang : 'en';
            const res = await api.post(`/voice-assistant/sessions/${sessionId}/transcripts`, {
                speaker_id: user._id,
                speaker_role: role,
                original_text: text,
                target_language: targetLang,
                run_clinical_reasoning: false
            });

            const data = res.data;
            setTranscripts(prev => prev.map(t =>
                t.id === entryId
                    ? { ...t, translated: data.translated_text || '', language: data.detected_language || t.language, languageName: data.detected_language_name || t.languageName }
                    : t
            ));
        } catch (err) {
            console.error('Translation error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const startListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            let final = '';
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) final += event.results[i][0].transcript;
                else interim += event.results[i][0].transcript;
            }
            setInterimText(interim);
            if (final.trim()) {
                setInterimText('');
                processInput(final.trim(), 'doctor');
            }
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => {
            if (isListening && recognitionRef.current) {
                try { recognitionRef.current.start(); } catch(e) {}
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    };

    const stopListening = () => {
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        setIsListening(false);
        setInterimText('');
    };

    const speakText = (text: string, lang: string) => {
        if (!synthRef.current) return;
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const entry = SUPPORTED_LANGUAGES.find(l => l.code === lang);
        utterance.lang = entry?.speechCode || 'en-US';
        utterance.rate = 0.9;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        synthRef.current.speak(utterance);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!textInput.trim()) return;
        processInput(textInput.trim(), 'doctor');
        setTextInput('');
    };

    if (!isActive) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 p-5 shadow-xl"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">Voice Translator</h3>
                            <p className="text-xs text-slate-400">Real-time multilingual communication</p>
                        </div>
                    </div>
                    <button
                        onClick={handleActivate}
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        Activate
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/60">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Live Translator</h3>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                        <span className="text-indigo-300">EN</span>
                        <ArrowRightLeft className="w-3 h-3" />
                        <select
                            value={patientLang}
                            onChange={(e) => setPatientLang(e.target.value)}
                            className="bg-slate-700/50 border border-slate-600/50 rounded-md text-xs text-indigo-300 px-1.5 py-0.5 focus:outline-none"
                        >
                            {SUPPORTED_LANGUAGES.filter(l => l.code !== 'en').map(l => (
                                <option key={l.code} value={l.code}>{l.name}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={handleDeactivate} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-slate-700/50">
                        End
                    </button>
                </div>
            </div>

            {/* Conversation Area */}
            <div className="h-[260px] overflow-y-auto px-3 py-2 space-y-2">
                {transcripts.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                        <MessageCircle className="w-8 h-8 text-slate-600" />
                        <p className="text-xs text-slate-500 max-w-[200px]">Speak in English. Your words will be translated for the patient.</p>
                    </div>
                )}

                {transcripts.map(t => (
                    <motion.div key={t.id} initial={{ opacity: 0, x: t.speaker === 'doctor' ? 10 : -10 }} animate={{ opacity: 1, x: 0 }}
                        className={`flex ${t.speaker === 'doctor' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                            t.speaker === 'doctor'
                                ? 'bg-indigo-600/70 text-white rounded-br-sm'
                                : 'bg-slate-700/50 text-slate-200 rounded-bl-sm'
                        }`}>
                            <p className="text-xs leading-relaxed">{t.original}</p>
                            {t.translated && t.translated !== t.original && (
                                <div className="mt-1.5 pt-1 border-t border-white/10">
                                    <p className="text-[11px] text-slate-300 italic">{t.translated}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] text-slate-500">{t.languageName}</span>
                                        <button onClick={() => speakText(t.translated, t.speaker === 'doctor' ? patientLang : 'en')}
                                            className="text-[9px] text-indigo-300 hover:text-indigo-200 flex items-center gap-0.5">
                                            <Volume2 className="w-2.5 h-2.5" /> Play
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}

                {interimText && (
                    <div className="flex justify-end">
                        <div className="max-w-[80%] rounded-xl rounded-br-sm px-3 py-2 bg-indigo-600/30 text-indigo-200 text-xs italic">
                            {interimText}...
                        </div>
                    </div>
                )}

                {isProcessing && (
                    <div className="flex justify-center">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Loader2 className="w-3 h-3 animate-spin" /> Translating...
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-3 py-2 border-t border-slate-700/50 bg-slate-900/40 space-y-2">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Type in English..."
                        className="flex-1 bg-slate-800/60 text-white text-xs rounded-lg px-3 py-2 border border-slate-700/50 focus:outline-none focus:border-indigo-500/50 placeholder-slate-500"
                    />
                    <button type="submit" disabled={!textInput.trim() || isProcessing}
                        className="p-2 rounded-lg bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-500 transition-colors">
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </form>
                <div className="flex justify-center">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={isListening ? stopListening : startListening}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isListening
                                ? 'bg-red-500 shadow-lg shadow-red-500/30 animate-pulse'
                                : 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40'
                        }`}
                    >
                        {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                    </motion.button>
                </div>
                {isSpeaking && (
                    <div className="flex justify-center">
                        <button onClick={() => { synthRef.current?.cancel(); setIsSpeaking(false); }}
                            className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1">
                            <VolumeX className="w-3 h-3" /> Stop
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
