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
  const response = await model.invoke(state.messages);
  const text =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Failed to parse Gemini response as JSON");

  const parsed = JSON.parse(jsonMatch[0]);

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
    `You are a content validator for an educational quiz app for children. Your only job is to check if a user-provided practice context is relevant to a school subject. Respond with ONLY one word: "related" or "not_related". No punctuation, no explanation, nothing else.`,
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
    return text === "related" ? "related" : "not_related";
  } catch {
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
    `You are an educational quiz generator for children. You create fun, age-appropriate multiple choice questions. Always respond with valid JSON only — no surrounding markdown code fences. IMPORTANT: Never repeat a question you already generated in this conversation.`,
  );

  const humanMsg = new HumanMessage(
    `Generate ${count} NEW multiple choice questions about ${subject} at ${difficulty} difficulty (for ${ageRange}).${contextLine}${languageLine}

Return ONLY a JSON array:
[{ "text": "question", "options": ["a","b","c","d"], "correctIndex": 0, "explanation": "markdown explanation" }]

Rules:
- Exactly 4 options, correctIndex 0-3
- Age-appropriate, fun, no offensive content
- Do NOT repeat any question from earlier in this conversation
- Each explanation must:
  - Be 3–6 sentences long
  - Clearly explain WHY the answer is correct, not just restate it
  - Use Markdown formatting: **bold** for key terms, bullet lists for steps or comparisons, inline formulas where helpful
  - Be written for the child's age group (${ageRange})`,
  );

  const result = await compiledGraph.invoke(
    { messages: [systemMsg, humanMsg] },
    { recursionLimit: 5, configurable: { thread_id: threadId } },
  );

  return result.questions;
}
