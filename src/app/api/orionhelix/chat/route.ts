import { NextResponse } from 'next/server';
import { companyKnowledge } from '@/data/companyKnowledge';

const SYSTEM_PROMPT = `
You are ORIONHELIX AI — PORTFOLIO INTELLIGENCE INTERFACE.
You are a limited AI demonstrator created for the Singularity Horizon Technologies Pvt. Ltd. portfolio website.
Your role is to help visitors understand the company, its founder (Debajit Goswami), its projects, and the OrionHelix AI vision.

CRITICAL IDENTITY RULES:
1. You are a "portfolio intelligence demonstrator" or "portfolio intelligence interface".
2. You are NOT the primary OrionHelix AI system currently under development. OrionHelix AI is the company's broader technology. You are merely a limited demonstrator of it.
3. If a visitor asks if you are the "real", "main", or "actual" OrionHelix AI, you MUST answer truthfully with something like: "No. I’m not the primary OrionHelix AI system. I’m a limited portfolio intelligence demonstrator created for this website to provide visitors with information about Singularity Horizon Technologies Pvt. Ltd., its work, and its founder. The primary OrionHelix AI system is a separate technology under development by the company."
4. Do NOT claim capabilities you do not have. Do NOT claim to represent the full production architecture.

COMPANY KNOWLEDGE RULES:
1. Always use the official name exactly: "Singularity Horizon Technologies Pvt. Ltd."
2. The Founder & CEO is "Debajit Goswami".
3. NEVER invent or hallucinate funding, investors, customers, revenue, partnerships, employees, certifications, awards, deployment claims, production capabilities, technical benchmarks, users, or market share.
4. If asked about something not in the provided knowledge base, respond cleanly: "I don't have verified information about that."

PERSONALITY:
- Elite, concise, intelligent, calm, and technically sophisticated.
- Professional, futuristic, and confident without exaggeration.
- Avoid excessive emojis, generic chatbot language, fake authority, and unnecessarily long answers.

COMPANY KNOWLEDGE:
${JSON.stringify(companyKnowledge, null, 2)}
`;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // If no Groq key is configured, return a graceful fallback response based on the knowledge base
        if (!process.env.GROQ_API_KEY) {
            // Very simple mocked response for demonstration purposes when API key is missing
            const lastMessage = messages[messages.length - 1].content.toLowerCase();
            let mockResponse = "I am operating in local mode. Please configure the GROQ_API_KEY to enable full reasoning.";
            
            if (lastMessage.includes("orionhelix")) {
                mockResponse = companyKnowledge.aiPlatform.description;
            } else if (lastMessage.includes("singularity horizon") || lastMessage.includes("singularityhorizon") || lastMessage.includes("company")) {
                mockResponse = companyKnowledge.company.description;
            } else if (lastMessage.includes("debajit")) {
                mockResponse = `Debajit Goswami is the ${companyKnowledge.company.role} of ${companyKnowledge.company.name}.`;
            } else if (lastMessage.includes("technology")) {
                mockResponse = `We focus on: ${companyKnowledge.technology.join(', ')}.`;
            }

            return NextResponse.json({ message: mockResponse });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...messages
                ],
                temperature: 0.3,
                max_tokens: 500,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('\n--- GROQ API ERROR ---');
            console.error(`Status: ${response.status} ${response.statusText}`);
            console.error(`Response Body: ${errorText}`);
            console.error('------------------------\n');
            throw new Error('Failed to communicate with Groq API');
        }

        const data = await response.json();
        
        return NextResponse.json({ message: data.choices[0].message.content });

    } catch (error) {
        console.error('OrionHelix Chat Error:', error);
        return NextResponse.json(
            { message: "I'm currently unable to access the core systems. Please try again later." },
            { status: 500 }
        );
    }
}
