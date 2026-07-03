'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, X, Volume2, VolumeX, Languages,
    ChevronDown, Send, Loader2, Sparkles, MessageSquare
} from 'lucide-react';
import axios from 'axios';

const AI_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';

const SUPPORTED_LANGUAGES = [
    { code: 'auto', name: 'Auto Detect', speechCode: '' },
    { code: 'en', name: 'English', speechCode: 'en-US' },
    { code: 'hi', name: 'हिन्दी (Hindi)', speechCode: 'hi-IN' },
    { code: 'mr', name: 'मराठी (Marathi)', speechCode: 'mr-IN' },
    { code: 'ta', name: 'தமிழ் (Tamil)', speechCode: 'ta-IN' },
    { code: 'te', name: 'తెలుగు (Telugu)', speechCode: 'te-IN' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)', speechCode: 'gu-IN' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', speechCode: 'kn-IN' },
    { code: 'ml', name: 'മലയാളം (Malayalam)', speechCode: 'ml-IN' },
    { code: 'bn', name: 'বাংলা (Bengali)', speechCode: 'bn-IN' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)', speechCode: 'pa-IN' },
];

interface TranscriptEntry {
    id: string;
    speaker: 'patient' | 'ai';
    originalText: string;
    translatedText: string;
    originalLanguage: string;
    timestamp: Date;
}

export default function VoiceAssistantFloatingButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('auto');
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
    const [interimText, setInterimText] = useState('');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [autoTTS, setAutoTTS] = useState(true);
    const [textInput, setTextInput] = useState('');

    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);

    // Initialize speech synthesis
    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcripts, interimText]);

    const startSession = useCallback(() => {
        // Generate a local session ID — no backend DB needed for the AI assistant
        setSessionId('session-' + Date.now());
    }, []);

    const handleOpen = () => {
        setIsOpen(true);
        startSession();
    };

    const handleClose = () => {
        stopListening();
        stopSpeaking();
        setIsOpen(false);
        setTranscripts([]);
        setSessionId(null);
        setInterimText('');
    };

    // Waveform visualizer
    const drawWaveform = useCallback(() => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        if (!canvas || !analyser) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animFrameRef.current = requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(dataArray);

            ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.lineWidth = 2;
            ctx.strokeStyle = '#818cf8';
            ctx.beginPath();

            const sliceWidth = canvas.width / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * canvas.height) / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceWidth;
            }
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        };

        draw();
    }, []);

    // Start listening with Web Speech API
    const startListening = useCallback(async () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech Recognition is not supported in this browser. Please use Chrome.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        const lang = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage);
        if (lang && lang.speechCode) {
            recognition.lang = lang.speechCode;
        }

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            setInterimText(interimTranscript);

            if (finalTranscript.trim()) {
                setInterimText('');
                processVoiceInput(finalTranscript.trim());
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error !== 'no-speech') {
                setIsListening(false);
            }
        };

        recognition.onend = () => {
            if (isListening && recognitionRef.current) {
                try { recognitionRef.current.start(); } catch(e) {}
            }
        };

        recognitionRef.current = recognition;

        // Setup audio analyser for waveform
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioCtx = new AudioContext();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;
            drawWaveform();
        } catch(e) {
            console.warn('Could not get audio stream for visualizer');
        }

        recognition.start();
        setIsListening(true);
    }, [selectedLanguage, drawWaveform, isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
        }
        analyserRef.current = null;
        setIsListening(false);
        setInterimText('');
    }, []);

    // Process voice input — calls the AI service directly (no backend relay needed)
    const processVoiceInput = async (text: string) => {
        const entryId = 'p-' + Date.now();

        setTranscripts(prev => [...prev, {
            id: entryId,
            speaker: 'patient',
            originalText: text,
            translatedText: '',
            originalLanguage: selectedLanguage === 'auto' ? '...' : selectedLanguage,
            timestamp: new Date()
        }]);

        setIsProcessing(true);

        try {
            // Step 1: Detect language via AI service
            let detectedLang = selectedLanguage !== 'auto' ? selectedLanguage : 'en';
            let detectedLangName = selectedLanguage !== 'auto' ? selectedLanguage : 'English';
            try {
                const detectRes = await axios.post(`${AI_URL}/voice/detect-language`, { text });
                detectedLang = detectRes.data.language || detectedLang;
                detectedLangName = detectRes.data.language_name || detectedLangName;
            } catch (e) { /* use defaults */ }

            // Step 2: Translate to English if needed (for clinical reasoning)
            let englishText = text;
            if (detectedLang !== 'en') {
                try {
                    const transRes = await axios.post(`${AI_URL}/voice/translate`, {
                        text,
                        source_language: detectedLang,
                        target_language: 'en'
                    });
                    englishText = transRes.data.translated_text || text;
                } catch (e) { /* use original */ }
            }

            // Update patient entry with detected language
            setTranscripts(prev => prev.map(t =>
                t.id === entryId ? { ...t, originalLanguage: detectedLangName, translatedText: detectedLang !== 'en' ? englishText : '' } : t
            ));

            // Step 3: Get clinical AI response
            const reasonRes = await axios.post(`${AI_URL}/voice/clinical-reason`, {
                text: englishText,
                patient_context: {}
            });
            const reasoning = reasonRes.data;

            // Step 4: Translate AI response back to patient's language if needed
            let responseInPatientLang = reasoning.response;
            if (detectedLang !== 'en') {
                try {
                    const backRes = await axios.post(`${AI_URL}/voice/translate`, {
                        text: reasoning.response,
                        source_language: 'en',
                        target_language: detectedLang
                    });
                    responseInPatientLang = backRes.data.translated_text || reasoning.response;
                } catch (e) { /* use English */ }
            }

            const aiEntry: TranscriptEntry = {
                id: 'ai-' + Date.now(),
                speaker: 'ai',
                originalText: reasoning.response,
                translatedText: responseInPatientLang !== reasoning.response ? responseInPatientLang : '',
                originalLanguage: 'en',
                timestamp: new Date()
            };
            setTranscripts(prev => [...prev, aiEntry]);

            if (autoTTS) {
                speakText(responseInPatientLang, detectedLang);
            }
        } catch (err) {
            console.error('Voice processing error:', err);
            const fallbackEntry: TranscriptEntry = {
                id: 'ai-err-' + Date.now(),
                speaker: 'ai',
                originalText: 'I apologize, the AI service is unreachable. Please check that all services are running.',
                translatedText: '',
                originalLanguage: 'en',
                timestamp: new Date()
            };
            setTranscripts(prev => [...prev, fallbackEntry]);
        } finally {
            setIsProcessing(false);
        }
    };

    // Text-to-Speech
    const speakText = (text: string, lang: string) => {
        if (!synthRef.current) return;
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const langEntry = SUPPORTED_LANGUAGES.find(l => l.code === lang);
        utterance.lang = langEntry?.speechCode || 'en-US';
        utterance.rate = 0.9;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        synthRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        synthRef.current?.cancel();
        setIsSpeaking(false);
    };

    // Handle text input submission
    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!textInput.trim()) return;
        processVoiceInput(textInput.trim());
        setTextInput('');
    };

    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleOpen}
                        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:shadow-indigo-500/50 transition-shadow"
                        id="voice-assistant-fab"
                    >
                        <Mic className="w-6 h-6" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Voice Assistant Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] rounded-2xl overflow-hidden shadow-2xl shadow-indigo-900/30 border border-slate-700/50 flex flex-col"
                        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Voice Assistant</h3>
                                    <p className="text-[10px] text-indigo-300">Multilingual AI Health Helper</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setAutoTTS(!autoTTS)}
                                    className={`p-1.5 rounded-lg transition-colors ${autoTTS ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}
                                    title={autoTTS ? 'Auto-speak ON' : 'Auto-speak OFF'}
                                >
                                    {autoTTS ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                </button>
                                <button onClick={handleClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Language Selector */}
                        <div className="px-4 py-2 border-b border-slate-700/30 bg-slate-900/30">
                            <div className="relative">
                                <button
                                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 text-slate-200 text-xs w-full justify-between hover:bg-slate-700/60 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Languages className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>{SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || 'Auto Detect'}</span>
                                    </div>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {showLanguageDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto"
                                        >
                                            {SUPPORTED_LANGUAGES.map(lang => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => { setSelectedLanguage(lang.code); setShowLanguageDropdown(false); }}
                                                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                                                        selectedLanguage === lang.code
                                                            ? 'bg-indigo-500/20 text-indigo-300'
                                                            : 'text-slate-300 hover:bg-slate-700/50'
                                                    }`}
                                                >
                                                    {lang.name}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Chat / Transcript Area */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" id="voice-chat-area">
                            {transcripts.length === 0 && !interimText && (
                                <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                                    <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                        <MessageSquare className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <p className="text-slate-400 text-sm max-w-[240px]">
                                        Tap the microphone and speak in your language. I&apos;ll translate and help you.
                                    </p>
                                </div>
                            )}

                            {transcripts.map(entry => (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${entry.speaker === 'patient' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                                        entry.speaker === 'patient'
                                            ? 'bg-indigo-600/80 text-white rounded-br-md'
                                            : 'bg-slate-700/60 text-slate-100 rounded-bl-md'
                                    }`}>
                                        <p className="text-sm leading-relaxed">{entry.originalText}</p>
                                        {entry.translatedText && entry.translatedText !== entry.originalText && (
                                            <p className="text-xs mt-1.5 pt-1.5 border-t border-white/10 text-slate-300 italic">
                                                {entry.translatedText}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] text-slate-400">
                                                {entry.originalLanguage}
                                            </span>
                                            {entry.speaker === 'ai' && (
                                                <button
                                                    onClick={() => speakText(entry.translatedText || entry.originalText, entry.originalLanguage)}
                                                    className="text-[9px] text-indigo-300 hover:text-indigo-200 flex items-center gap-0.5"
                                                >
                                                    <Volume2 className="w-2.5 h-2.5" /> Replay
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Interim text (live transcription) */}
                            {interimText && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
                                    <div className="max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5 bg-indigo-600/40 text-indigo-200 text-sm italic">
                                        {interimText}...
                                    </div>
                                </motion.div>
                            )}

                            {/* Processing indicator */}
                            {isProcessing && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                    <div className="bg-slate-700/60 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                                        <span className="text-xs text-slate-300">Translating & reasoning...</span>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Waveform Visualizer */}
                        {isListening && (
                            <div className="px-4 pb-1">
                                <canvas ref={canvasRef} width={360} height={32} className="w-full h-8 rounded-lg opacity-60" />
                            </div>
                        )}

                        {/* Controls Area */}
                        <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-900/60 space-y-2">
                            {/* Text Input */}
                            <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Type or use mic..."
                                    className="flex-1 bg-slate-800/60 text-white text-sm rounded-xl px-3 py-2 border border-slate-700/50 focus:outline-none focus:border-indigo-500/50 placeholder-slate-500"
                                />
                                <button type="submit" disabled={!textInput.trim() || isProcessing}
                                    className="p-2 rounded-xl bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-500 transition-colors">
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>

                            {/* Mic Button */}
                            <div className="flex justify-center">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={isListening ? stopListening : startListening}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                        isListening
                                            ? 'bg-red-500 shadow-lg shadow-red-500/30 animate-pulse'
                                            : 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50'
                                    }`}
                                    id="voice-mic-button"
                                >
                                    {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                                </motion.button>
                            </div>

                            {isSpeaking && (
                                <div className="flex justify-center">
                                    <button onClick={stopSpeaking} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                                        <VolumeX className="w-3 h-3" /> Stop speaking
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
