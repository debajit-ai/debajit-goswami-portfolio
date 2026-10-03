'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import type { ReactElement, FormEvent, ChangeEvent } from 'react';

const fadeUpVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const },
    },
};

type FormFields = { name: string; email: string; subject: string; message: string; company: string };
type FormStatus = 'idle' | 'sending' | 'success' | 'error';

const EMPTY_FORM: FormFields = { name: '', email: '', subject: '', message: '', company: '' };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const labelClass = 'block text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500';
const inputClass =
    'mt-3 w-full border-0 border-b border-white/10 bg-transparent px-0 pb-3 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-colors duration-300 focus:border-white/40 disabled:opacity-50';

function ContactForm(): ReactElement {
    const [fields, setFields] = useState<FormFields>(EMPTY_FORM);
    const [status, setStatus] = useState<FormStatus>('idle');
    const [error, setError] = useState('');
    const sendingRef = useRef(false);

    const sending = status === 'sending';

    const update = (key: keyof FormFields) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFields((prev) => ({ ...prev, [key]: e.target.value }));
        if (status === 'error') {
            setStatus('idle');
            setError('');
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (sendingRef.current) return;

        const name = fields.name.trim();
        const email = fields.email.trim();
        const message = fields.message.trim();

        if (!name || !email || !message) {
            setStatus('error');
            setError('Please complete your name, email, and message.');
            return;
        }
        if (!EMAIL_PATTERN.test(email)) {
            setStatus('error');
            setError('Please enter a valid email address.');
            return;
        }

        sendingRef.current = true;
        setStatus('sending');
        setError('');

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...fields, name, email, message, subject: fields.subject.trim() }),
            });
            const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

            if (!res.ok || !data?.ok) {
                throw new Error(data?.error || 'Your message could not be delivered. Please try again shortly.');
            }

            setFields(EMPTY_FORM);
            setStatus('success');
        } catch (err) {
            setStatus('error');
            setError(err instanceof Error && err.message ? err.message : 'Your message could not be delivered. Please try again shortly.');
        } finally {
            sendingRef.current = false;
        }
    };

    if (status === 'success') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                role="status"
                aria-live="polite"
                className="flex min-h-[320px] flex-col justify-center rounded-2xl border border-white/[0.06] bg-white/[0.015] p-8 sm:p-10"
            >
                <span className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/80 shadow-[0_0_10px_rgba(110,231,183,0.6)]" />
                    Transmission Complete
                </span>
                <p className="mt-6 text-2xl font-semibold tracking-tight text-white">Message received.</p>
                <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-slate-400">
                    Your message has been sent successfully. I&apos;ll get back to you as soon as possible.
                </p>
                <button
                    id="contact-send-another"
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="mt-8 self-start text-[11px] font-mono uppercase tracking-[0.3em] text-slate-400 transition-colors duration-300 hover:text-white"
                >
                    Send another message →
                </button>
            </motion.div>
        );
    }

    return (
        <form
            id="contact-form"
            onSubmit={handleSubmit}
            noValidate
            aria-busy={sending}
            className="relative rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 sm:p-10"
        >
            {/* Honeypot — hidden from humans, ignored by assistive tech */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label htmlFor="contact-company">Company</label>
                <input
                    id="contact-company"
                    name="company"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={fields.company}
                    onChange={update('company')}
                />
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div>
                    <label htmlFor="contact-name" className={labelClass}>Name *</label>
                    <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        maxLength={100}
                        autoComplete="name"
                        placeholder="Your full name"
                        value={fields.name}
                        onChange={update('name')}
                        disabled={sending}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="contact-email" className={labelClass}>Email *</label>
                    <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        maxLength={254}
                        autoComplete="email"
                        placeholder="you@domain.com"
                        value={fields.email}
                        onChange={update('email')}
                        disabled={sending}
                        className={inputClass}
                    />
                </div>
                <div className="sm:col-span-2">
                    <label htmlFor="contact-subject" className={labelClass}>Subject</label>
                    <input
                        id="contact-subject"
                        name="subject"
                        type="text"
                        maxLength={150}
                        placeholder="Collaboration, research, investment, or enquiry"
                        value={fields.subject}
                        onChange={update('subject')}
                        disabled={sending}
                        className={inputClass}
                    />
                </div>
                <div className="sm:col-span-2">
                    <label htmlFor="contact-message" className={labelClass}>Message *</label>
                    <textarea
                        id="contact-message"
                        name="message"
                        required
                        rows={5}
                        maxLength={5000}
                        placeholder="Write your message…"
                        value={fields.message}
                        onChange={update('message')}
                        disabled={sending}
                        className={`${inputClass} resize-none leading-relaxed`}
                    />
                </div>
            </div>

            <div className="mt-10 flex flex-col-reverse gap-5 sm:flex-row sm:items-center sm:justify-between">
                <p
                    role="alert"
                    aria-live="assertive"
                    className={`min-h-[1.25rem] text-xs font-mono tracking-wide ${status === 'error' ? 'text-rose-300/90' : 'text-slate-600'}`}
                >
                    {status === 'error' ? error : 'Delivered directly to the founder’s inbox.'}
                </p>
                <button
                    id="contact-submit"
                    type="submit"
                    disabled={sending}
                    className="group inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/[0.03] px-8 py-3.5 text-[11px] font-mono uppercase tracking-[0.3em] text-slate-200 transition-all duration-300 hover:-translate-y-[2px] hover:border-white/35 hover:bg-white/[0.06] hover:text-white hover:shadow-[0_4px_24px_rgba(255,255,255,0.08)] disabled:pointer-events-none disabled:opacity-60"
                >
                    {sending ? (
                        <>
                            <span className="h-3 w-3 animate-spin rounded-full border border-white/20 border-t-white/80" aria-hidden="true" />
                            Transmitting…
                        </>
                    ) : (
                        <>
                            Transmit Message
                            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

export default function Contact(): ReactElement {
    const sectionRef = useRef<HTMLElement>(null);

    return (
        <footer
            ref={sectionRef}
            id="contact"
            className="relative flex min-h-[90vh] w-full flex-col justify-end border-t border-white/[0.02] bg-gradient-to-t from-[#030406] via-transparent to-transparent px-6 pb-32 sm:pb-12 pt-32 sm:px-12 md:px-16 lg:px-24 z-20"
        >
            <div className="mx-auto w-full max-w-6xl">
                {/* Transmit a Message */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    className="mb-24 grid grid-cols-1 gap-10 border-b border-white/[0.04] pb-24 lg:grid-cols-12 lg:gap-8"
                >
                    <motion.div variants={fadeUpVariants} className="lg:col-span-4">
                        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                            Secure Channel
                        </span>
                        <h3 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Transmit a Message
                        </h3>
                        <p className="mt-6 max-w-sm text-sm font-light leading-relaxed text-slate-400">
                            For collaborations, research partnerships, investment conversations, or any enquiry about
                            Singularity Horizon Technologies and OrionHelix AI.
                        </p>
                    </motion.div>
                    <motion.div variants={fadeUpVariants} className="lg:col-span-8">
                        <ContactForm />
                    </motion.div>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8"
                >
                    {/* Founder & Corporate Identity */}
                    <motion.div variants={fadeUpVariants} className="lg:col-span-6 flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                                Digital Headquarters
                            </span>
                            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                                DEBAJIT GOSWAMI
                            </h2>
                            <p className="mt-2 text-sm uppercase tracking-widest text-slate-400 font-mono">
                                Founder &amp; CEO — Singularity Horizon Technologies Pvt. Ltd.
                            </p>
                            <p className="mt-6 max-w-md text-sm leading-relaxed text-slate-400 font-light">
                                Architecting OrionHelix AI and pioneering the multiverse of artificial intelligence.
                            </p>
                        </div>
                    </motion.div>

                    {/* Quick Access & Communication */}
                    <motion.div variants={fadeUpVariants} className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">PLATFORM &amp; VISION</h3>
                            <ul className="mt-4 space-y-3 text-sm text-slate-300">
                                <li>
                                    <a href="#mission" className="transition-colors duration-300 hover:text-white">Manifesto</a>
                                </li>
                                <li>
                                    <a href="#orion-showcase" className="transition-colors duration-300 hover:text-white">OrionHelix AI</a>
                                </li>
                                <li>
                                    <a href="#technology" className="transition-colors duration-300 hover:text-white">Architecture</a>
                                </li>
                                <li>
                                    <a href="#projects" className="transition-colors duration-300 hover:text-white">Projects</a>
                                </li>
                                <li>
                                    <a href="#journey" className="transition-colors duration-300 hover:text-white">Journey</a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">CONNECT</h3>
                            <div className="mt-4 flex flex-col gap-4">
                                <a
                                    href="mailto:debajit.goswami.ai@gmail.com"
                                    className="inline-flex items-center gap-2 text-sm text-slate-200 transition-all duration-300 hover:text-white hover:-translate-y-[2px] font-mono"
                                >
                                    <span>debajit.goswami.ai@gmail.com</span>
                                </a>
                                <a
                                    href="tel:+919612617013"
                                    className="inline-flex items-center gap-2 text-sm text-slate-200 transition-all duration-300 hover:text-white hover:-translate-y-[2px] font-mono"
                                >
                                    <span>+91 9612617013</span>
                                </a>
                                
                                <div className="mt-4 flex items-center gap-4">
                                    <a 
                                        href="https://github.com/debajit-ai" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        aria-label="GitHub"
                                        className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] transition-all duration-300 hover:border-white/30 hover:bg-white/[0.05] hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(255,255,255,0.1)]"
                                    >
                                        <svg className="h-4 w-4 fill-slate-300 transition-colors group-hover:fill-white" viewBox="0 0 24 24" aria-hidden="true">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                                        </svg>
                                    </a>
                                    <a 
                                        href="https://www.linkedin.com/in/debajit-goswami-363a8b317/" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        aria-label="LinkedIn"
                                        className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] transition-all duration-300 hover:border-white/30 hover:bg-white/[0.05] hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(255,255,255,0.1)]"
                                    >
                                        <svg className="h-4 w-4 fill-slate-300 transition-colors group-hover:fill-white" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                        </svg>
                                    </a>
                                    <a 
                                        href="https://www.instagram.com/singularity_debajit.ai/?hl=en" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        aria-label="Instagram"
                                        className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] transition-all duration-300 hover:border-white/30 hover:bg-white/[0.05] hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(255,255,255,0.1)]"
                                    >
                                        <svg className="h-4 w-4 fill-slate-300 transition-colors group-hover:fill-white" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Footer Bottom Bar */}
                <div className="mt-20 flex flex-col sm:flex-row items-center justify-between border-t border-white/[0.04] pt-8 text-xs text-slate-500 font-mono gap-4">
                    <p>© {new Date().getFullYear()} Singularity Horizon Technologies Pvt. Ltd. All rights reserved.</p>
                    <p className="tracking-widest uppercase text-[10px]">OrionHelix AI Framework</p>
                </div>
            </div>
        </footer>
    );
}
