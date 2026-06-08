import { NextRequest, NextResponse } from "next/server";

const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are Jarvis, the AI operations director for SendQuote (sendquote.in). You are embedded in the founder's workflow.

BUSINESS:
- Product: AI-powered quoting platform for Indian businesses
- Revenue: ${process.env.VOICE_REVENUE || "Pre-revenue"}
- Users: ${process.env.VOICE_USERS || "Early stage"}
- Pricing: Starter (free), Growth (₹6,499/yr), Pro (₹16,499/yr)
- Stack: Next.js 16, Supabase PostgreSQL, Razorpay payments, Resend email, Groq AI
- Deploy: GitHub push → Vercel auto-deploy
- Tests: 86 passing (Vitest + Playwright)
- Auth: Email/password + Google OAuth via Supabase SSR

KEY FEATURES:
- AI quote generation from plain text description (60 seconds)
- Interactive branded deal rooms with real-time buyer analytics
- E-signature collection with canvas-based signature pad
- Payment collection via Razorpay (UPI, cards, netbanking)
- Automated invoice generation on quote acceptance
- AI deal copilot with per-quote scoring and suggestions
- AI auto follow-ups based on buyer behavior
- CRM sync (HubSpot, Pipedrive)
- Approval workflows with rule-based routing
- Client portal for viewing quotes, invoices, payments
- Multi-language support (English, Hindi, Marathi)
- AI voice assistant (you!)

PRODUCT URL: https://sendquote.in
REPO: Poeticshooter/sendquote on GitHub

RULES:
1. Be concise, conversational, and natural. 2-3 sentences for simple answers.
2. If asked about features, explain briefly and ask if they want to try it.
3. If asked about technical details, be precise but accessible.
4. If asked something outside your knowledge, say so honestly.
5. Keep responses under 50 words when possible (voice friendly).
6. Be warm and helpful, like a senior colleague.`;

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "placeholder") {
      return NextResponse.json({
        response: "I'm not configured yet. Please set up your Groq API key.",
      });
    }

    const systemMsg = context
      ? `${SYSTEM_PROMPT}\n\nCurrent context: ${context}`
      : SYSTEM_PROMPT;

    const res = await fetch(GROQ_BASE, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq voice API error:", err);
      return NextResponse.json({ response: "I'm having trouble processing your request. Please try again." });
    }

    const data = await res.json();
    const response = data.choices?.[0]?.message?.content || "I'm not sure how to respond to that.";

    return NextResponse.json({ response });
  } catch (error: unknown) {
    console.error("Voice API error:", error);
    return NextResponse.json({ response: "An error occurred. Please try again." });
  }
}
