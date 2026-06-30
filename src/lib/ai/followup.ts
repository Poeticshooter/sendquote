import { initProviders, generateWithFallback } from "./providers";
import { getCachedResponse, setCachedResponse } from "./cache";

let aiProviders: ReturnType<typeof initProviders> | null = null;

function getProviders() {
  if (!aiProviders) {
    aiProviders = initProviders();
  }
  return aiProviders;
}

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

function buildSystemPrompt(input: FollowUpInput): string {
  return `You are a sales follow-up assistant for ${input.businessName}. Write professional and effective follow-up emails for quotes.`;
}

function buildPrompt(input: FollowUpInput): string {
  const totalFormatted = `₹${input.total.toLocaleString("en-IN")}`;
  let context = `Quote ${input.quoteNumber} for ${input.clientName} — ${totalFormatted}`;
  context += `\nStatus: ${input.status}`;
  context += `\nDays since sent: ${input.daysSinceSent}`;
  context += `\nTimes viewed: ${input.viewedCount}`;
  if (input.sectionsViewed.length > 0) {
    context += `\nSections viewed: ${input.sectionsViewed.join(", ")}`;
  }

  let instruction: string;

  if (input.daysSinceSent <= 2 && input.viewedCount > 0) {
    instruction = "Write a short, friendly follow-up. The client has viewed the quote recently. Don't be pushy. Ask if they have questions.";
  } else if (input.daysSinceSent <= 5 && input.viewedCount > 0) {
    instruction = "Write a professional follow-up. The client has viewed the quote multiple times. Offer to help with any questions. Mention you're available for a quick call.";
  } else {
    instruction = "Write a follow-up that creates gentle urgency. The quote may expire soon. Mention you'd love to help move things forward. Keep it professional but warm.";
  }

  return `Write a short email to ${input.clientName} about their quote.

Context:
${context}

${instruction}

Write in plain text format. Start with subject line on first line (prefix "Subject: "), then a blank line, then body. Keep the email under 150 words. Do not use placeholders like [Name]. Be specific.`;
}

function getTone(input: FollowUpInput): "gentle" | "direct" | "urgency" {
  return input.daysSinceSent <= 2 ? "gentle" : input.daysSinceSent <= 5 ? "direct" : "urgency";
}

function buildTemplateResponse(input: FollowUpInput): FollowUpResult {
  if (input.daysSinceSent <= 2 && input.viewedCount > 0) {
    return {
      subject: `Quick question about your quote (${input.quoteNumber})`,
      body: `Hi ${input.clientName},

I noticed you've had a chance to review the quote we sent. I wanted to check in and see if you have any questions about the pricing or scope.

Happy to hop on a quick call if that would help.

Best,
${input.businessName}`,
      tone: "gentle",
    };
  }
  if (input.daysSinceSent <= 5) {
    return {
      subject: `Following up on your quote — ${input.quoteNumber}`,
      body: `Hi ${input.clientName},

I'm following up on the quote we sent you recently. I see you've taken a look at the details.

I'd love to answer any questions you might have. Let me know if a quick call this week works for you.

Best,
${input.businessName}`,
      tone: "direct",
    };
  }
  return {
    subject: `Your quote ${input.quoteNumber} — let's discuss`,
    body: `Hi ${input.clientName},

I wanted to check in regarding the quote we sent. We'd love to help move things forward.

If there's anything you'd like to discuss or adjust, just reply to this email. I'm here to help.

Best,
${input.businessName}`,
    tone: "urgency",
  };
}

function parseFollowUpResponse(text: string, input: FollowUpInput): FollowUpResult {
  const subjectMatch = text.match(/Subject:\s*(.+)/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : `Follow-up on ${input.quoteNumber}`;
  const body = text.replace(/Subject:\s*.+\n/i, "").trim();
  return { subject, body, tone: getTone(input) };
}

export async function generateFollowUp(input: FollowUpInput): Promise<FollowUpResult> {
  // Fall back to templates when no AI providers are configured
  if (getProviders().length === 0) {
    return buildTemplateResponse(input);
  }

  const systemPrompt = buildSystemPrompt(input);
  const prompt = buildPrompt(input);

  try {
    const cached = await getCachedResponse(prompt, systemPrompt);
    if (cached) {
      return parseFollowUpResponse(cached, input);
    }

    const { content, provider } = await generateWithFallback(prompt, systemPrompt, getProviders());

    setCachedResponse(prompt, systemPrompt, content, provider).catch((e) => console.error("[Cache] write failed:", e));

    return parseFollowUpResponse(content, input);
  } catch {
    return buildTemplateResponse(input);
  }
}
