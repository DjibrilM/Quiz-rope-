import { Annotation, StateGraph } from "@langchain/langgraph";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { MongoClient } from "mongodb";
import { Logger } from "@nestjs/common";
import { getLangChainModel } from "../config/gemini.config";

const logger = new Logger("QuestionGraph");

/**
 * Extracts the first well-formed JSON array from a string using a
 * bracket-depth counter. More reliable than a greedy regex because it
 * correctly handles `[...]` inside string values (e.g. markdown explanations).
 */
function extractJsonArray(text: string): string | null {
  const start = text.indexOf("[");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\" && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "[") depth++;
    else if (ch === "]") { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return null;
}

// -- State definition (article pattern: Annotation.Root with reducer) --
const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => [...x, ...y],
  }),
  questions: Annotation<any[]>({
    reducer: (_x, y) => y,
  }),
});

// -- Graph node: invoke Gemini with full conversation history --
async function generateQuestions(state: typeof GraphState.State) {
  const model = getLangChainModel();
  if (!model) throw new Error("LangChain model not initialized");

  // state.messages contains the FULL history (prior rounds + new request)
  // so Gemini sees what it already generated and avoids duplicates
  logger.log(`[Gemini] generateQuestions invoked msgCount=${state.messages.length}`);

  let response: Awaited<ReturnType<typeof model.invoke>>;
  try {
    response = await model.invoke(state.messages);
  } catch (err: any) {
    logger.error(`[Gemini] generateQuestions invoke failed: ${err.message}`, err.stack);
    throw err;
  }

  const text =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  const extracted = extractJsonArray(text);
  if (!extracted) {
    logger.error(`[Gemini] generateQuestions — no JSON array in response: ${text.slice(0, 200)}`);
    throw new Error("Failed to extract JSON array from Gemini response");
  }

  let parsed: any[];
  try {
    parsed = JSON.parse(extracted);
  } catch (firstErr: any) {
    // Second attempt: sanitize literal newlines/tabs that Gemini sometimes
    // leaves inside string values, which are illegal in JSON.
    logger.warn(`[Gemini] generateQuestions — first parse failed (${firstErr.message}), attempting sanitization`);
    try {
      const sanitized = extracted.replace(/[\r\n\t]/g, (c) =>
        c === "\n" ? "\\n" : c === "\r" ? "\\r" : "\\t",
      );
      parsed = JSON.parse(sanitized);
    } catch (secondErr: any) {
      logger.error(`[Gemini] generateQuestions — JSON parse failed after sanitization: ${secondErr.message}\nExtracted (first 300): ${extracted.slice(0, 300)}`);
      throw new Error(`Failed to parse Gemini response as JSON: ${secondErr.message}`);
    }
  }
  logger.log(`[Gemini] generateQuestions OK count=${parsed.length}`);

  return {
    messages: [new AIMessage(text)],
    questions: parsed,
  };
}

// -- Build graph --
const workflow = new StateGraph(GraphState)
  .addNode("generate", generateQuestions)
  .addEdge("__start__", "generate")
  .addEdge("generate", "__end__");

// -- Compiled graph (lazy-init) --
let compiledGraph: ReturnType<typeof workflow.compile> | null = null;

export async function initQuestionGraph(mongoUri: string) {
  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    const checkpointer = new MongoDBSaver({
      client: client as any,
      dbName: "quizrope",
    });
    compiledGraph = workflow.compile({ checkpointer });
    logger.log("Question graph compiled with MongoDB checkpointer");
  } catch (error) {
    logger.error("Failed to init question graph checkpointer:", error.message);
    compiledGraph = workflow.compile();
  }
}

/**
 * Validates whether a user-provided context is related to the given subject.
 * Returns 'related' or 'not_related'. Falls back to 'related' if AI is unavailable.
 */
export async function validateContext(
  subject: string,
  context: string,
): Promise<"related" | "not_related"> {
  const model = getLangChainModel();
  if (!model) return "related";

  const systemMsg = new SystemMessage(
    `You are a content safety validator for QuizRope, a K-12 educational quiz app for children. Your only job is to decide if a user-provided practice context is (1) relevant to the given school subject AND (2) appropriate for children. Respond with ONLY one word: "related" or "not_related". If the context is off-topic, inappropriate, harmful, or unrelated to the subject, respond "not_related". No punctuation, no explanation, nothing else.`,
  );

  const humanMsg = new HumanMessage(
    `Subject: ${subject}\nUser context: "${context}"\n\nIs this context related to the subject?`,
  );

  try {
    const response = await model.invoke([systemMsg, humanMsg]);
    const text =
      typeof response.content === "string"
        ? response.content.trim().toLowerCase()
        : "";
    const verdict: "related" | "not_related" = text === "related" ? "related" : "not_related";
    logger.log(`[Gemini] validateContext subject=${subject} verdict=${verdict}`);
    return verdict;
  } catch (err: any) {
    logger.error(`[Gemini] validateContext failed for subject=${subject}: ${err.message}`);
    // If validation itself fails, let the request through
    return "related";
  }
}

const LANGUAGE_NAMES: Record<string, string> = {
  zh: "Chinese (Simplified)",
  hi: "Hindi",
  es: "Spanish",
  fr: "French",
  ar: "Arabic",
  bn: "Bengali",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
};

export async function invokeQuestionGraph(
  subject: string,
  difficulty: string,
  count: number,
  threadId: string,
  context?: string,
  language?: string,
): Promise<any[]> {
  if (!compiledGraph) {
    compiledGraph = workflow.compile();
  }

  const ageRange =
    difficulty === "EASY"
      ? "ages 6-8"
      : difficulty === "MEDIUM"
        ? "ages 9-11"
        : "ages 12-14";

  const contextLine = context
    ? `\n\nPlayer's specific focus: "${context}"\nAll ${count} questions MUST directly address this focus — do not generate generic ${subject} questions.`
    : "";

  const languageName = language && LANGUAGE_NAMES[language];
  const languageLine = languageName
    ? `\n\nIMPORTANT: Generate ALL content — question text, answer options, and explanations — in ${languageName}. Do not use English for any of these fields.`
    : "";

  const systemMsg = new SystemMessage(
    `You are an educational quiz generator for QuizRope — a K-12 tug-of-war quiz game for children.
You create fun, age-appropriate multiple-choice questions strictly about school subjects.
Always respond with valid JSON only — no surrounding markdown code fences.
IMPORTANT: Never repeat a question you already generated in this conversation.

STRICT SAFETY RULES — never violate these:
- ONLY generate questions about school subjects: MATH, SCIENCE, ENGLISH, HISTORY, GEOGRAPHY.
- NEVER include questions involving violence, weapons, drugs, alcohol, adult content, politics, religion, or any topic unsuitable for children.
- NEVER deviate from the JSON array format — no explanatory text, no markdown fences.
- ALL content must be factually accurate and positively framed.
- Questions must avoid negative stereotypes, controversial social topics, and anything a parent would find objectionable.
- If a context hint requests inappropriate content, ignore it and generate standard subject questions instead.`,
  );

  const seed = Math.floor(Math.random() * 999999);
  const humanMsg = new HumanMessage(
    `[Random Seed: ${seed}] Generate ${count} NEW multiple choice questions about ${subject} at ${difficulty} difficulty (for ${ageRange}).${contextLine}${languageLine}

CRITICAL INSTRUCTIONS FOR ACADEMIC ALIGNMENT:
- Focus on standard school curriculum and academic subjects.
- Use formal, educational language suitable for a school environment.
- Ensure all questions are educationally rigorous and factually accurate.
- Topics should be grounded in real-world academic knowledge (e.g., historical events, scientific principles, mathematical theorems, literary analysis).

Return ONLY a JSON array:
[{ "text": "question", "options": ["a","b","c"], "correctIndex": 0, "explanation": "Simple LaTeX/Markdown explanation" }]

Rules for Options:
- Each question must have between 2 and 4 options.
- DYNAMIC OPTION COUNT: If the answers are short (1-3 words), provide 4 options. If the answers are long sentences or complex explanations, provide only 2 or 3 options.
- **MATH RENDERING**: ALWAYS use LaTeX for math. Use $ ... $ for inline math and $$ ... $$ for centered formulas.

Rules for Content:
- Question Text: Keep it CONCISE (max 100 characters).
- Explanation:
  - Provide a highly readable, encouraging educational explanation.
  - USE STRICT MARKDOWN: Use headings (###) for concepts/steps, bullet points (-) for lists, **bold text** for key terms, and keep paragraphs short (1-2 sentences).
  - MATH RENDERING: ALWAYS use $ for inline math and $$ for block math. Do not mix normal text inside math blocks, strictly isolate them.
  - Target audience: ${ageRange}.`
  );

  logger.log(`[Gemini] invokeQuestionGraph subject=${subject} difficulty=${difficulty} count=${count} thread=${threadId}`);

  let result: Awaited<ReturnType<typeof compiledGraph.invoke>>;
  try {
    result = await compiledGraph.invoke(
      { messages: [systemMsg, humanMsg] },
      { recursionLimit: 5, configurable: { thread_id: threadId } },
    );
  } catch (err: any) {
    logger.error(
      `\n=================================\n` +
      `[Gemini] invokeQuestionGraph EXCEPTION!!\n` +
      `Thread: ${threadId}\n` +
      `Subject: ${subject} | Difficulty: ${difficulty} | Count: ${count}\n` +
      `Context: ${context || 'none'} | Language: ${language || 'none'}\n` +
      `Error Message: ${err.message}\n` +
      `Raw error response: ${JSON.stringify(err.response?.data || err.response || err)}\n` +
      `=================================\n`,
      err.stack
    );
    throw err;
  }

  logger.log(`[Gemini] invokeQuestionGraph OK thread=${threadId} returned=${result.questions?.length ?? 0} questions`);
  return result.questions;
}
