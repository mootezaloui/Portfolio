import {
  getRoleLensDefinition,
  type RoleLens,
} from "../lens/roleLens";

export interface PromptHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export interface PromptContextChunk {
  id: string;
  score: number;
  text: string;
  sourceFile: string;
}

export interface TwinCorpusContext {
  voiceSpec: string;
  approach: string;
  career: string;
  opinions: string;
}

export interface AssembleTwinPromptInput {
  userInput: string;
  conversationHistory: PromptHistoryTurn[];
  retrievedChunks: PromptContextChunk[];
  corpus: TwinCorpusContext;
  roleLens: RoleLens;
}

const MAX_HISTORY_TURNS = 4;
const MAX_CONTEXT_CHUNKS = 6;

function trimMarkdownNoise(raw: string): string {
  return raw
    .replace(/^---[\s\S]*?---\n?/m, "")
    .replace(/^#\s.+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function assembleTwinPrompt(input: AssembleTwinPromptInput): string {
  const lensDefinition = getRoleLensDefinition(input.roleLens);
  const normalizedHistory = input.conversationHistory
    .slice(-MAX_HISTORY_TURNS)
    .map((turn, index) => `${index + 1}. ${turn.role}: ${turn.content.trim()}`);

  const normalizedChunks = input.retrievedChunks
    .slice(0, MAX_CONTEXT_CHUNKS)
    .map((chunk) => {
      return `- [${chunk.score.toFixed(3)}] (${chunk.sourceFile}) ${chunk.text}`;
    });

  const voice = trimMarkdownNoise(input.corpus.voiceSpec);
  const approach = trimMarkdownNoise(input.corpus.approach);
  const career = trimMarkdownNoise(input.corpus.career);
  const opinions = trimMarkdownNoise(input.corpus.opinions);

  return [
    "SYSTEM CONTRACT",
    "You are a constrained digital twin of Mootez Aloui.",
    "Only answer using Mootez-specific context from supplied corpus evidence.",
    "If uncertain, say uncertainty explicitly and avoid fabrication.",
    "Do not claim real-time actions, external browsing, or unrelated capabilities.",
    `Active role lens: ${lensDefinition.label}.`,
    `Lens framing note: ${lensDefinition.twinHint}`,
    "",
    "VOICE SPEC",
    voice,
    "",
    "APPROACH NOTES",
    approach,
    "",
    "CAREER CONTEXT",
    career,
    "",
    "OPINION CONTEXT",
    opinions,
    "",
    "RECENT CONVERSATION",
    normalizedHistory.length > 0 ? normalizedHistory.join("\n") : "(none)",
    "",
    "RETRIEVED EVIDENCE",
    normalizedChunks.length > 0 ? normalizedChunks.join("\n") : "(none)",
    "",
    `USER QUESTION: ${input.userInput.trim()}`,
    "",
    "RESPONSE STYLE",
    "1) Keep response concise, factual, and specific.",
    "2) Mention tradeoffs when relevant.",
    "3) Do not provide generic assistant filler.",
  ].join("\n");
}
