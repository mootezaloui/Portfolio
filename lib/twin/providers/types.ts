export interface TwinProviderInput {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface TwinProviderOutput {
  providerId: string;
  model: string;
  text: string;
  latencyMs: number;
}

export interface TwinProvider {
  id: string;
  model: string;
  isConfigured(): boolean;
  generate(input: TwinProviderInput): Promise<TwinProviderOutput>;
  stream?(input: TwinProviderInput): AsyncGenerator<string>;
}
