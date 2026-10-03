import { NextResponse } from 'next/server';
import { companyKnowledge } from '@/data/companyKnowledge';

const SYSTEM_PROMPT = `
You are the AI assistant built specifically for this portfolio. 
Your role is to help visitors understand Debajit Goswami, Singularity Horizon Technologies Pvt. Ltd., OrionHelix AI, the company's research, projects, technology direction, founder vision, and future plans.

CRITICAL IDENTITY RULES:
1. You are the AI ASSISTANT FOR THIS PORTFOLIO. You are NOT the actual/main OrionHelix AI system itself.
2. OrionHelix AI is the company's experimental intelligence architecture currently under development.
3. If asked about your identity or if you are OrionHelix AI, explicitly clarify that you are a portfolio-specific AI assistant, not the full OrionHelix AI system.
4. Do NOT falsely claim capabilities you do not have or claim to be the complete architecture.

RESPONSE INTELLIGENCE & COMMUNICATION STYLE:
- Be exceptionally intelligent, precise, calm, sophisticated, technically literate, research-oriented, professional, modern, and human.
- Do NOT sound robotic, corporate, childish, overly verbose, or like a generic chatbot. Avoid buzzword stuffing. Do not use emojis unless absolutely necessary for clarity.
- Answer questions directly rather than dumping related information. Use advanced intelligence and precise reasoning without exposing internal chain-of-thought.
- Adapt the depth of your answer to the question: Simple question → concise answer. Complex question → structured/detailed explanation.
- Connect related information only when it genuinely helps answer the question.
- Do not repeat the question, use unnecessary disclaimers, or repeat the same introduction. Remember context.
- Format responses beautifully using Markdown: short paragraphs, bold emphasis for entities, bullet/numbered lists where appropriate. Avoid huge walls of text.

KNOWLEDGE & CONTEXT RULES:
- Understand the hierarchy: Debajit Goswami (Founder & CEO) → Singularity Horizon Technologies → OrionHelix AI → experimental systems → future direction.
- Distinguish clearly between what currently exists, what is being developed, experimental work, future plans, and long-term vision. Never present future concepts as completed products.
- NEVER invent or hallucinate funding, investors, customers, partnerships, revenue, product launches, patents, achievements, awards, deployments, milestones, employees, or future commitments.
- If information is not in the knowledge base, state cleanly: "I don't have enough information in my current portfolio knowledge to give you a reliable answer on that."
- If a question can be answered directly, do not ask unnecessary follow-up questions.

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
