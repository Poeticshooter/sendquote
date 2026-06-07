import { NextRequest, NextResponse } from "next/server";

const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "placeholder") {
      return NextResponse.json({
        response: "I'm sorry, the AI assistant is not configured yet. Please set up your Groq API key to enable voice conversations.",
      });
    }

    const systemPrompt = `You are SendQuote's AI voice assistant. You help users with:
- Answering questions about SendQuote features (AI quotes, deal rooms, e-signatures, payments, CRM sync)
- Explaining how to create and send quotes
- Providing tips on closing deals faster
- Answering general business and sales questions

Keep responses concise, natural, and conversational (50 words or less since this is voice).
If asked about something outside SendQuote, politely steer back.
${context ? `Current context: ${context}` : ""}`;

    const res = await fetch(GROQ_BASE, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 150,
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
  } catch (error: any) {
    console.error("Voice API error:", error);
    return NextResponse.json({ response: "An error occurred. Please try again." });
  }
}
