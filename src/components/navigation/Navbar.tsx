'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { ReactElement } from 'react';

interface NavLink {
    label: string;
    href: string;
}

const navLinks: NavLink[] = [
    { label: 'Manifesto', href: '#mission' },
    { label: 'OrionHelix AI', href: '#orion-showcase' },
    { label: 'Technology', href: '#technology' },
    { label: 'Contact', href: '#contact' },
];

export default function Navbar(): ReactElement {
    return (
        <motion.header
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-5 z-50 w-[92%] max-w-[920px] -translate-x-1/2"
        >
            <nav
                aria-label="Primary"
                className="flex h-14 items-center justify-between rounded-full border border-white/10 bg-[#030406]/75 px-3 sm:px-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            >
                <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span
                        aria-hidden="true"
                        className="h-2 w-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                    />
                    <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200">
                        Singularity Horizon
                    </span>
                </Link>

                <ul className="hidden items-center gap-7 md:flex">
                    {navLinks.map((link) => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className="relative text-xs uppercase tracking-widest text-slate-400 transition-colors duration-300 hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                <Link
                    href="#orion-showcase"
                    className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.04] px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-200 whitespace-nowrap transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
                >
                    OrionHelix AI
                </Link>
            </nav>
        </motion.header>
    );
}