import type {
  TwinProvider,
  TwinProviderInput,
  TwinProviderOutput,
} from "./types";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export const openRouterProvider: TwinProvider = {
  id: "openrouter",
  model: process.env.OPENROUTER_MODEL ?? "openai/gpt-oss-120b",
  isConfigured() {
    return Boolean(process.env.OPENROUTER_API_KEY);
  },
  async generate(input: TwinProviderInput): Promise<TwinProviderOutput> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured.");
    }

    const startedAt = Date.now();
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        temperature: input.temperature ?? 0.2,
        max_tokens: input.maxTokens ?? 600,
        messages: [
          {
            role: "system",
            content:
              "You are Mootez's constrained digital twin. Stay factual and scoped.",
          },
          {
            role: "user",
            content: input.prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter request failed (${response.status}): ${errorText}`
      );
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = payload.choices?.[0]?.message?.content?.trim() ?? "";

    if (!text) {
      throw new Error("OpenRouter returned an empty response.");
    }

    return {
      providerId: this.id,
      model: this.model,
      text,
      latencyMs: Date.now() - startedAt,
    };
  },
  async *stream(input: TwinProviderInput): AsyncGenerator<string> {
    const output = await this.generate(input);
    const chunks = output.text.split(/\s+/);
    for (const chunk of chunks) {
      yield `${chunk} `;
    }
  },
};
