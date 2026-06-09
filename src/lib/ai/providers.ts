interface AIProvider {
  name: string;
  generate(prompt: string, system: string): Promise<string>;
  isAvailable(): boolean;
}

export class GroqProvider implements AIProvider {
  name = "groq";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || "";
  }

  isAvailable() {
    return !!this.apiKey;
  }

  async generate(prompt: string, system: string): Promise<string> {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

export class OpenRouterProvider implements AIProvider {
  name = "openrouter";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || "";
  }

  isAvailable() {
    return !!this.apiKey;
  }

  async generate(prompt: string, system: string): Promise<string> {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://sendquote.in",
        "X-Title": "SendQuote",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`OpenRouter API error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
  }

  isAvailable() {
    return !!this.apiKey;
  }

  async generate(prompt: string, system: string): Promise<string> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${system}\n\n${prompt}` }] }],
        }),
        signal: AbortSignal.timeout(30000),
      },
    );
    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
}

const providers: AIProvider[] = [];

export function initProviders() {
  // Clear to prevent duplicate entries on re-initialization
  providers.length = 0;
  const groq = new GroqProvider();
  const openRouter = new OpenRouterProvider();
  const gemini = new GeminiProvider();
  if (groq.isAvailable()) providers.push(groq);
  if (openRouter.isAvailable()) providers.push(openRouter);
  if (gemini.isAvailable()) providers.push(gemini);
  return providers;
}

export async function generateWithFallback(
  prompt: string,
  system: string,
  availableProviders: AIProvider[],
): Promise<{ content: string; provider: string }> {
  const errors: string[] = [];
  for (const provider of availableProviders) {
    try {
      const content = await provider.generate(prompt, system);
      return { content, provider: provider.name };
    } catch (e) {
      errors.push(`${provider.name}: ${e}`);
      continue;
    }
  }
  throw new Error(`All AI providers failed: ${errors.join("; ")}`);
}
