import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
// Resend's shared sender works without a verified domain. Override with
// CONTACT_FROM_EMAIL once a custom domain is verified in Resend.
const DEFAULT_FROM = 'Portfolio Contact <onboarding@resend.dev>';

const LIMITS = {
    name: 100,
    email: 254,
    subject: 150,
    message: 5000,
} as const;

const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

type ContactPayload = {
    name?: unknown;
    email?: unknown;
    subject?: unknown;
    message?: unknown;
    company?: unknown; // honeypot
};

function clean(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function stripLineBreaks(value: string): string {
    return value.replace(/[\r\n]+/g, ' ');
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function fail(message: string, status = 400) {
    return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request) {
    let body: ContactPayload;
    try {
        body = (await request.json()) as ContactPayload;
    } catch {
        return fail('Invalid request.');
    }

    // Honeypot: real visitors never see or fill this field.
    // Respond with success so bots receive no signal.
    if (clean(body.company)) {
        return NextResponse.json({ ok: true });
    }

    const name = stripLineBreaks(clean(body.name));
    const email = clean(body.email);
    const subject = stripLineBreaks(clean(body.subject));
    const message = clean(body.message);

    if (!name) return fail('Please enter your name.');
    if (!email) return fail('Please enter your email address.');
    if (!message) return fail('Please enter a message.');
    if (name.length > LIMITS.name) return fail(`Name must be under ${LIMITS.name} characters.`);
    if (email.length > LIMITS.email || !EMAIL_PATTERN.test(email)) {
        return fail('Please enter a valid email address.');
    }
    if (subject.length > LIMITS.subject) return fail(`Subject must be under ${LIMITS.subject} characters.`);
    if (message.length > LIMITS.message) return fail(`Message must be under ${LIMITS.message} characters.`);

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_TO_EMAIL;
    const from = process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM;

    if (!apiKey || !to) {
        console.error('[contact] Email service is not configured.');
        return fail('Message service is temporarily unavailable. Please try again later.', 503);
    }

    const emailSubject = `Portfolio Message — ${subject || 'New enquiry'} (from ${name})`;

    const safe = {
        name: escapeHtml(name),
        email: escapeHtml(email),
        subject: escapeHtml(subject || '—'),
        message: escapeHtml(message).replace(/\n/g, '<br />'),
    };

    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
  <p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#64748b;margin:0 0 16px;">New message via portfolio contact form</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:6px 0;color:#64748b;width:90px;">Name</td><td style="padding:6px 0;"><strong>${safe.name}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Email</td><td style="padding:6px 0;"><a href="mailto:${safe.email}">${safe.email}</a></td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Subject</td><td style="padding:6px 0;">${safe.subject}</td></tr>
  </table>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
  <div style="font-size:14px;line-height:1.7;">${safe.message}</div>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
  <p style="font-size:12px;color:#94a3b8;margin:0;">Reply directly to this email to respond to ${safe.name}.</p>
</div>`.trim();

    const text = [
        'New message via portfolio contact form',
        '',
        `Name: ${name}`,
        `Email: ${email}`,
        `Subject: ${subject || '—'}`,
        '',
        message,
    ].join('\n');

    try {
        const response = await fetch(RESEND_ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from,
                to: [to],
                reply_to: email,
                subject: emailSubject,
                html,
                text,
            }),
        });

        if (!response.ok) {
            // Log only status — never payload contents or credentials.
            console.error(`[contact] Resend rejected the request (status ${response.status}).`);
            return fail('Your message could not be delivered. Please try again shortly.', 502);
        }

        // Send acknowledgement email to the visitor (do not fail the request if this fails)
        try {
            const ackHtml = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
  <p style="font-size:14px;line-height:1.7;">Your message has been successfully received by Singularity Horizon Technologies.</p>
  <p style="font-size:14px;line-height:1.7;">Thank you for reaching out. Your transmission has been received and will be reviewed.</p>
  <p style="font-size:14px;line-height:1.7;margin-top:24px;color:#475569;">— Debajit Goswami<br/>Founder &amp; CEO<br/>Singularity Horizon Technologies Pvt. Ltd.</p>
</div>`.trim();

            const ackText = [
                'Your message has been successfully received by Singularity Horizon Technologies.',
                '',
                'Thank you for reaching out. Your transmission has been received and will be reviewed.',
                '',
                '— Debajit Goswami',
                'Founder & CEO',
                'Singularity Horizon Technologies Pvt. Ltd.',
            ].join('\n');

            const ackResponse = await fetch(RESEND_ENDPOINT, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from,
                    to: [email],
                    subject: 'Message received — Singularity Horizon Technologies',
                    html: ackHtml,
                    text: ackText,
                }),
            });

            if (!ackResponse.ok) {
                console.error(`[contact] Resend rejected the acknowledgement request (status ${ackResponse.status}).`);
            }
        } catch {
            // Silently ignore acknowledgement network failures to preserve primary success
            console.error('[contact] Network error while sending acknowledgement email.');
        }

        return NextResponse.json({ ok: true });
    } catch {
        console.error('[contact] Network error while contacting email service.');
        return fail('Your message could not be delivered. Please try again shortly.', 502);
    }
}
