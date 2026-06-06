const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";

export interface FollowUpInput {
  clientName: string;
  quoteNumber: string;
  total: number;
  status: string;
  daysSinceSent: number;
  viewedCount: number;
  sectionsViewed: string[];
  businessName: string;
}

export interface FollowUpResult {
  subject: string;
  body: string;
  tone: "gentle" | "direct" | "urgency";
}

function buildPrompt(input: FollowUpInput): string {
  let context = `Quote ${input.quoteNumber} for ${input.clientName} — $${input.total}`;
  context += `\nStatus: ${input.status}`;
  context += `\nDays since sent: ${input.daysSinceSent}`;
  context += `\nTimes viewed: ${input.viewedCount}`;
  if (input.sectionsViewed.length > 0) {
    context += `\nSections viewed: ${input.sectionsViewed.join(", ")}`;
  }

  let tone: string;
  let instruction: string;

  if (input.daysSinceSent <= 2 && input.viewedCount > 0) {
    tone = "gentle";
    instruction = "Write a short, friendly follow-up. The client has viewed the quote recently. Don't be pushy. Ask if they have questions.";
  } else if (input.daysSinceSent <= 5 && input.viewedCount > 0) {
    tone = "direct";
    instruction = "Write a professional follow-up. The client has viewed the quote multiple times. Offer to help with any questions. Mention you're available for a quick call.";
  } else {
    tone = "urgency";
    instruction = "Write a follow-up that creates gentle urgency. The quote may expire soon. Mention you'd love to help move things forward. Keep it professional but warm.";
  }

  return `You are a sales follow-up assistant for ${input.businessName}. Write a short email to ${input.clientName} about their quote.

Context:
${context}

${instruction}

Write in plain text format. Start with subject line on first line (prefix "Subject: "), then a blank line, then body. Keep the email under 150 words. Do not use placeholders like [Name]. Be specific.`;
}

export async function generateFollowUp(input: FollowUpInput): Promise<FollowUpResult> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "mixtral-8x7b-32768";

  if (!apiKey || apiKey === "placeholder") {
    const templates: Record<string, { subject: string; body: string; tone: "gentle" | "direct" | "urgency" }> = {
      gentle: {
        subject: `Quick question about your quote (${input.quoteNumber})`,
        body: `Hi ${input.clientName},

I noticed you've had a chance to review the quote we sent. I wanted to check in and see if you have any questions about the pricing or scope.

Happy to hop on a quick call if that would help.

Best,
${input.businessName}`,
        tone: "gentle",
      },
      direct: {
        subject: `Following up on your quote — ${input.quoteNumber}`,
        body: `Hi ${input.clientName},

I'm following up on the quote we sent you recently. I see you've taken a look at the details.

I'd love to answer any questions you might have. Let me know if a quick call this week works for you.

Best,
${input.businessName}`,
        tone: "direct",
      },
      urgency: {
        subject: `Your quote ${input.quoteNumber} — let's discuss`,
        body: `Hi ${input.clientName},

I wanted to check in regarding the quote we sent. We'd love to help move things forward.

If there's anything you'd like to discuss or adjust, just reply to this email. I'm here to help.

Best,
${input.businessName}`,
        tone: "urgency",
      },
    };

    const t = input.daysSinceSent <= 2 && input.viewedCount > 0 ? templates.gentle
      : input.daysSinceSent <= 5 ? templates.direct
      : templates.urgency;

    return t;
  }

  try {
    const prompt = buildPrompt(input);
    const res = await fetch(GROQ_BASE, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";

    const subjectMatch = text.match(/Subject:\s*(.+)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : `Follow-up on ${input.quoteNumber}`;
    const body = text.replace(/Subject:\s*.+\n/i, "").trim();

    const tone: "gentle" | "direct" | "urgency" =
      input.daysSinceSent <= 2 ? "gentle" : input.daysSinceSent <= 5 ? "direct" : "urgency";

    return { subject, body, tone };
  } catch {
    return {
      subject: `Following up on ${input.quoteNumber}`,
      body: `Hi ${input.clientName},\n\nJust checking in on the quote we sent. Happy to answer any questions.\n\nBest,\n${input.businessName}`,
      tone: "gentle",
    };
  }
}
