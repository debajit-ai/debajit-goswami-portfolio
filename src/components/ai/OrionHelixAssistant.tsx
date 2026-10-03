'use client';

import { ReactElement, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AICoreVisual from './AICoreVisual';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const SUGGESTED_QUESTIONS = [
    "What is Singularity Horizon Technologies?",
    "What is OrionHelix AI?",
    "Who is Debajit Goswami?",
    "Are you the primary OrionHelix AI?",
];

const renderMessageContent = (content: string) => {
    const paragraphs = content.split(/\n{2,}/);
    
    return paragraphs.map((paragraph, pIdx) => {
        const lines = paragraph.split('\n');
        
        return (
            <div key={pIdx} className="mb-4 last:mb-0">
                {lines.map((line, lIdx) => {
                    const trimmedLine = line.trim();
                    const isBullet = trimmedLine.startsWith('- ');
                    const isNumbered = /^\d+\.\s/.test(trimmedLine);
                    const isListItem = isBullet || isNumbered;
                    const isHeading = /^#+\s/.test(trimmedLine);
                    
                    let text = trimmedLine;
                    let prefix = '';
                    
                    if (isBullet) {
                        text = text.substring(2);
                        prefix = '•';
                    } else if (isNumbered) {
                        const match = text.match(/^(\d+\.\s)/);
                        if (match) {
                            prefix = match[1].trim();
                            text = text.substring(match[1].length);
                        }
                    } else if (isHeading) {
                        text = text.replace(/^#+\s*/, '');
                    }
                    
                    const tokens = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
                    
                    const formattedLine = tokens.map((token, i) => {
                        if (token.startsWith('**') && token.endsWith('**')) {
                            return <strong key={i} className="font-semibold text-white/90">{token.slice(2, -2)}</strong>;
                        }
                        const linkMatch = token.match(/^\[(.*?)\]\((.*?)\)$/);
                        if (linkMatch) {
                            let url = linkMatch[2];
                            if (!url.startsWith('http')) url = `https://${url}`;
                            return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors">{linkMatch[1]}</a>;
                        }
                        return token;
                    });

                    if (isListItem) {
                        return (
                            <div key={lIdx} className="flex gap-2 mt-1.5 ml-1">
                                <span className="text-cyan-500/70 select-none min-w-[12px]">{prefix}</span>
                                <span>{formattedLine}</span>
                            </div>
                        );
                    }
                    
                    if (isHeading) {
                        return (
                            <span key={lIdx} className="block mt-2 mb-1 font-semibold text-white/95 text-[15px]">
                                {formattedLine}
                            </span>
                        );
                    }

                    return (
                        <span key={lIdx} className={lIdx > 0 ? "block mt-1" : "block"}>
                            {formattedLine}
                        </span>
                    );
                })}
            </div>
        );
    });
};

export default function OrionHelixAssistant(): ReactElement {
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Welcome to the OrionHelix AI Portfolio Intelligence Interface.\n\nI can help you explore Singularity Horizon Technologies Pvt. Ltd., OrionHelix AI, our technology direction, projects, and the work of Debajit Goswami, Founder & CEO.\n\nHow may I assist you?"
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Interaction States
    const [isHovered, setIsHovered] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [justFinished, setJustFinished] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Handle completion pulse
    useEffect(() => {
        if (!isLoading && messages.length > 1 && messages[messages.length - 1].role === 'assistant') {
            setJustFinished(true);
            const t = setTimeout(() => setJustFinished(false), 2000);
            return () => clearTimeout(t);
        }
    }, [isLoading, messages]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        setMousePos({ x, y });
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setMousePos({ x: 0, y: 0 });
    };

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        const userMsg = { role: 'user' as const, content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const res = await fetch('/api/orionhelix/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMsg] }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!res.ok) throw new Error('Failed to fetch');
            
            const data = await res.json();
            
            setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: error.name === 'AbortError'
                    ? "The connection timed out. Please try again."
                    : "I'm currently unable to access the core systems. Please try again later." 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.9, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 30, scale: 0.95, filter: "blur(8px)" }}
                        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        style={{ transformOrigin: "bottom right" }}
                        className="mb-6 flex h-[550px] max-h-[80vh] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/95 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
                    >
                        {/* Header */}
                        <div className="flex flex-col border-b border-white/[0.05] bg-black/60 px-5 py-4">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-3">
                                    <h3 className="font-mono text-sm font-semibold tracking-widest text-white">ORIONHELIX AI</h3>
                                    <div className="flex items-center space-x-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5">
                                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                                        <span className="text-[9px] font-bold tracking-wider text-cyan-300">ONLINE</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsExpanded(false)}
                                    className="text-slate-500 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Portfolio Intelligence Interface</p>
                        </div>

                        {/* Disclosure Banner */}
                        <div className="border-b border-white/[0.02] bg-cyan-900/[0.02] px-4 py-2.5">
                            <p className="text-center text-[10px] italic text-slate-500 tracking-wide">
                                Portfolio demonstrator — not the primary OrionHelix AI system.
                            </p>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`mb-5 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[88%] rounded-xl px-4 py-3 text-sm font-light leading-relaxed whitespace-pre-wrap ${
                                        msg.role === 'user' 
                                            ? 'bg-gradient-to-br from-cyan-900/40 to-cyan-950/40 border border-cyan-800/30 text-white rounded-br-sm shadow-inner' 
                                            : 'bg-white/[0.03] border border-white/[0.05] text-slate-300 rounded-bl-sm'
                                    }`}>
                                        {msg.role === 'assistant' ? renderMessageContent(msg.content) : msg.content}
                                    </div>
                                </div>
                            ))}
                            
                            {/* Cinematic Processing State */}
                            {isLoading && (
                                <div className="mb-5 flex justify-start">
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        className="px-4 py-2"
                                    >
                                        <span className="font-mono text-[10px] tracking-[0.25em] text-cyan-400/70 uppercase">
                                            OrionHelix is processing...
                                        </span>
                                    </motion.div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggested Questions */}
                        {messages.length === 1 && (
                            <div className="flex flex-wrap gap-2 px-5 pb-4">
                                {SUGGESTED_QUESTIONS.map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => handleSend(q)}
                                        className="rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-left text-[11px] text-slate-400 transition-all duration-300 hover:border-cyan-500/30 hover:bg-cyan-900/10 hover:text-cyan-100"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="border-t border-white/[0.05] bg-black/40 p-4">
                            <form 
                                onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                                className="flex items-center gap-3 relative"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Query OrionHelix..."
                                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] pl-4 pr-12 py-3 text-sm text-white placeholder-slate-600 focus:border-cyan-500/50 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-1.5 top-1.5 bottom-1.5 flex w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 transition-all hover:bg-cyan-500/20 disabled:opacity-30 disabled:hover:bg-cyan-500/10"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="19" x2="12" y2="5"></line>
                                        <polyline points="5 12 12 5 19 12"></polyline>
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cinematic AI Core Launcher */}
            <div className="relative mt-2 flex items-center justify-center">
                
                {/* Activation Signal Waves (CORE -> SIGNAL) */}
                <AnimatePresence>
                    {isExpanded && [0, 1, 2].map(i => (
                        <motion.div
                            key={`wave-${i}`}
                            initial={{ opacity: 0.5, scale: 1, borderWidth: "2px" }}
                            animate={{ opacity: 0, scale: 2.5 + i * 1.5, borderWidth: "0px" }}
                            exit={{ opacity: 0, transition: { duration: 0.2 } }}
                            transition={{ duration: 1.2 + i * 0.2, delay: i * 0.15, ease: "easeOut" }}
                            className="pointer-events-none absolute h-16 w-16 rounded-full border-cyan-400/50"
                        />
                    ))}
                </AnimatePresence>

                <motion.button
                    ref={buttonRef}
                    onClick={() => setIsExpanded(!isExpanded)}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={handleMouseLeave}
                    whileTap={{ scale: 0.85 }}
                    animate={{
                        x: isHovered ? mousePos.x * 0.2 : 0,
                        y: isHovered ? mousePos.y * 0.2 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 20, mass: 0.5 }}
                    className="relative flex h-16 w-16 items-center justify-center rounded-full focus:outline-none z-50 group"
                    aria-label="Toggle OrionHelix AI Interface"
                >
                    {/* Ring 1 - Base Illumination */}
                    <motion.div 
                        className="absolute inset-0 rounded-full bg-cyan-500/10 blur-xl"
                        animate={{
                            scale: isLoading ? [1, 1.4, 1] : isHovered ? 1.2 : [1, 1.05, 1],
                            opacity: isLoading ? 0.9 : isHovered ? 0.7 : 0.4
                        }}
                        transition={{ duration: isLoading ? 1.5 : 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    
                    {/* Ring 2 - Scanning Arc (Hover & Active state) */}
                    <motion.div 
                        className="absolute -inset-1 rounded-full border border-transparent border-t-cyan-500/40 border-l-cyan-500/10"
                        animate={{
                            rotate: isLoading ? 360 : isHovered ? 180 : 360,
                            opacity: isLoading ? 1 : isHovered || isExpanded ? 0.8 : 0.2,
                            scale: isLoading ? [1, 1.05, 1] : 1
                        }}
                        transition={{ 
                            rotate: { duration: isLoading ? 1.2 : 8, repeat: Infinity, ease: "linear" },
                            scale: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                        }}
                    />

                    {/* Ring 3 - Counter/Inner Arc (Computational Motion) */}
                    <motion.div 
                        className="absolute -inset-2 rounded-full border border-transparent border-b-cyan-300/20 border-r-cyan-400/5"
                        animate={{
                            rotate: isLoading ? -360 : isHovered ? -180 : -360,
                            opacity: isLoading ? 0.9 : isHovered || isExpanded ? 0.6 : 0.1
                        }}
                        transition={{ duration: isLoading ? 1.8 : 12, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Tiny signal pulses during processing (Thinking State) */}
                    <AnimatePresence>
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0.6, scale: 0.8 }}
                                animate={{ opacity: 0, scale: 1.6 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
                                className="absolute inset-0 rounded-full border border-cyan-300/40"
                            />
                        )}
                    </AnimatePresence>

                    {/* Completion Confirmation Pulse */}
                    <AnimatePresence>
                        {justFinished && (
                            <motion.div
                                initial={{ opacity: 0.9, scale: 0.8, borderWidth: "2px" }}
                                animate={{ opacity: 0, scale: 2.0, borderWidth: "0px" }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="absolute inset-0 rounded-full border-cyan-300"
                            />
                        )}
                    </AnimatePresence>
                    
                    {/* The internal AI Core visual structure */}
                    <div className="relative z-10 flex h-full w-full items-center justify-center transition-transform duration-700 ease-out group-hover:scale-105">
                        <AICoreVisual isExpanded={isExpanded} isThinking={isLoading} />
                    </div>
                </motion.button>
            </div>
        </div>
    );
}
