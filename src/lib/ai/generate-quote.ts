const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";

export interface GeneratedLineItem {
  description: string;
  quantity: number;
  rate: number;
}

export interface GeneratedQuote {
  items: GeneratedLineItem[];
  notes: string;
  terms: string;
  subtotal: number;
}

const industryTemplates: Record<string, { items: GeneratedLineItem[]; notes: string; terms: string }> = {
  "website": {
    items: [
      { description: "Website Design — Homepage", quantity: 1, rate: 15000 },
      { description: "Website Design — Inner Pages (up to 5)", quantity: 5, rate: 5000 },
      { description: "Responsive Mobile Optimization", quantity: 1, rate: 8000 },
      { description: "Content Management System Setup", quantity: 1, rate: 5000 },
      { description: "SEO Basic Optimization", quantity: 1, rate: 3000 },
    ],
    notes: "Includes 2 rounds of revisions. Hosting and domain not included.",
    terms: "50% advance, 50% on completion. Estimated timeline: 3-4 weeks.",
  },
  "consulting": {
    items: [
      { description: "Initial Assessment & Discovery", quantity: 1, rate: 25000 },
      { description: "Strategy Development", quantity: 1, rate: 35000 },
      { description: "Implementation Support (per month)", quantity: 3, rate: 20000 },
      { description: "Monthly Review & Reporting", quantity: 3, rate: 10000 },
    ],
    notes: "All rates in INR. Travel and accommodation billed separately.",
    terms: "Monthly invoicing. Net 15 payment terms.",
  },
  "software": {
    items: [
      { description: "Requirement Analysis & Architecture", quantity: 1, rate: 40000 },
      { description: "Frontend Development", quantity: 1, rate: 80000 },
      { description: "Backend Development", quantity: 1, rate: 80000 },
      { description: "Database Design & Setup", quantity: 1, rate: 25000 },
      { description: "Testing & QA", quantity: 1, rate: 30000 },
      { description: "Deployment & DevOps", quantity: 1, rate: 20000 },
    ],
    notes: "Tech stack: React/Next.js + Node.js + PostgreSQL. Includes 3 months of post-launch support.",
    terms: "30% upon signing, 40% at mid-point, 30% on delivery.",
  },
  "marketing": {
    items: [
      { description: "Marketing Strategy Development", quantity: 1, rate: 20000 },
      { description: "Social Media Content (per month)", quantity: 3, rate: 12000 },
      { description: "Email Campaign Setup & Design", quantity: 1, rate: 15000 },
      { description: "Performance Analytics Dashboard", quantity: 1, rate: 10000 },
    ],
    notes: "Monthly retainer model. Ad spend billed separately.",
    terms: "Monthly retainer, invoiced at the start of each month.",
  },
  "design": {
    items: [
      { description: "Brand Identity Design", quantity: 1, rate: 25000 },
      { description: "Logo Design (3 concepts)", quantity: 1, rate: 15000 },
      { description: "Business Card & Stationery", quantity: 1, rate: 8000 },
      { description: "Brand Guidelines Document", quantity: 1, rate: 12000 },
    ],
    notes: "Includes 2 rounds of revisions per deliverable.",
    terms: "50% advance. Balance due on delivery.",
  },
};

function detectIndustry(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes("website") || lower.includes("web") || lower.includes("landing page") || lower.includes("ecommerce") || lower.includes("shopify")) return "website";
  if (lower.includes("consult") || lower.includes("advisory") || lower.includes("strategy") || lower.includes("coach")) return "consulting";
  if (lower.includes("software") || lower.includes("app") || lower.includes("saas") || lower.includes("mobile app") || lower.includes("platform") || lower.includes("api")) return "software";
  if (lower.includes("market") || lower.includes("social media") || lower.includes("seo") || lower.includes("content") || lower.includes("email")) return "marketing";
  if (lower.includes("design") || lower.includes("brand") || lower.includes("logo") || lower.includes("ui") || lower.includes("ux")) return "design";
  return "consulting";
}

function generateItems(description: string, industry: string): GeneratedLineItem[] {
  const template = industryTemplates[industry];
  if (!template) return industryTemplates["consulting"].items;

  const items = template.items.map((item) => ({
    ...item,
    description: item.description,
  }));

  const lower = description.toLowerCase();
  const multiplier = lower.includes("enterprise") || lower.includes("large") || lower.includes("complex") ? 1.5
    : lower.includes("small") || lower.includes("basic") || lower.includes("simple") ? 0.6
    : 1;

  if (multiplier !== 1) {
    items.forEach((item) => {
      item.rate = Math.round(item.rate * multiplier / 100) * 100;
    });
  }

  return items;
}

export async function generateQuoteAI(description: string): Promise<GeneratedQuote> {
  const apiKey = process.env.GROQ_API_KEY;
  const useAI = apiKey && apiKey !== "placeholder";

  if (!useAI) {
    const industry = detectIndustry(description);
    const items = generateItems(description, industry);
    const template = industryTemplates[industry];
    const subtotal = items.reduce((s, i) => s + i.quantity * i.rate, 0);

    return {
      items,
      notes: template?.notes || "Custom quote generated for your requirements.",
      terms: template?.terms || "Payment terms to be agreed upon.",
      subtotal,
    };
  }

  try {
    const prompt = `You are an expert sales engineer. Generate a professional quote from this description:

"${description}"

Respond with ONLY valid JSON (no markdown, no explanations):
{
  "items": [
    { "description": "string", "quantity": number, "rate": number }
  ],
  "notes": "string",
  "terms": "string"
}

Guidelines:
- 3-6 line items with realistic B2B pricing
- Items should cover the full scope implied by the description
- Notes should explain what's included/excluded, and suggest a "good/better/best" tier if applicable
- Terms should specify payment schedule
- Use professional, detailed descriptions
- Include a "recommended" flag (boolean) on one item to suggest best value
- If team/enterprise scale is implied, suggest a package discount`;

    const res = await fetch(GROQ_BASE, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        items: parsed.items || [],
        notes: parsed.notes || "",
        terms: parsed.terms || "",
        subtotal: (parsed.items || []).reduce((s: number, i: any) => s + i.quantity * i.rate, 0),
      };
    }

    throw new Error("Could not parse AI response");
  } catch {
    const industry = detectIndustry(description);
    const items = generateItems(description, industry);
    const template = industryTemplates[industry];
    return {
      items,
      notes: template?.notes || "",
      terms: template?.terms || "",
      subtotal: items.reduce((s, i) => s + i.quantity * i.rate, 0),
    };
  }
}
