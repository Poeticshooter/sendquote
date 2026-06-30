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
    return !!this.apiKey && this.apiKey !== "placeholder";
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
    return !!this.apiKey && this.apiKey !== "placeholder";
  }

  async generate(prompt: string, system: string): Promise<string> {
    const models = [
      "deepseek/deepseek-chat-v3-0324",
      "qwen/qwen-2.5-72b-instruct",
      "google/gemini-2.0-flash-001",
    ];
    let lastError: string = "";
    for (const model of models) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
            "HTTP-Referer": "https://sendquote.in",
            "X-Title": "SendQuote",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: system },
              { role: "user", content: prompt },
            ],
            temperature: 0.2,
            max_tokens: 2048,
          }),
          signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) {
          lastError = `OpenRouter ${model} error: ${res.status}`;
          continue;
        }
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "";
      } catch {
        continue;
      }
    }
    throw new Error(lastError || "OpenRouter: all models failed");
  }
}

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
  }

  isAvailable() {
    return !!this.apiKey && this.apiKey !== "placeholder";
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

export class MistralProvider implements AIProvider {
  name = "mistral";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY || "";
  }

  isAvailable() {
    return !!this.apiKey && this.apiKey !== "placeholder";
  }

  async generate(prompt: string, system: string): Promise<string> {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`Mistral API error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

export class CerebrasProvider implements AIProvider {
  name = "cerebras";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.CEREBRAS_API_KEY || "";
  }

  isAvailable() {
    return !!this.apiKey && this.apiKey !== "placeholder";
  }

  async generate(prompt: string, system: string): Promise<string> {
    const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-oss-120b",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`Cerebras API error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

let providers: AIProvider[] = [];

export function clearProviderCache() {
  providers = [];
}

export function initProviders() {
  clearProviderCache();
  const groq = new GroqProvider();
  const mistral = new MistralProvider();
  const openRouter = new OpenRouterProvider();
  const gemini = new GeminiProvider();
  if (groq.isAvailable()) providers.push(groq);
  if (mistral.isAvailable()) providers.push(mistral);
  if (openRouter.isAvailable()) providers.push(openRouter);
  if (gemini.isAvailable()) providers.push(gemini);
  const cerebras = new CerebrasProvider();
  if (cerebras.isAvailable()) providers.push(cerebras);
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
