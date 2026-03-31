import { Logger } from "@nestjs/common";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const logger = new Logger("GeminiConfig");

export let isGeminiConfigured = false;
let langchainModel: ChatGoogleGenerativeAI | null = null;

export function initializeGemini() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    logger.warn(
      "Missing Gemini API key — using mock questions. Set GEMINI_API_KEY for AI-generated questions.",
    );
    isGeminiConfigured = false;
    return null;
  }

  try {
    langchainModel = new ChatGoogleGenerativeAI({
      model: "gemini-3.1-flash-lite-preview",
      apiKey,
      temperature: 0.7,
      maxOutputTokens: 8192,
    });
    isGeminiConfigured = true;
    logger.log("Gemini AI initialized via LangChain");
    return langchainModel;
  } catch (error) {
    logger.error("Gemini initialization failed:", error.message);
    isGeminiConfigured = false;
    return null;
  }
}

export function getLangChainModel(): ChatGoogleGenerativeAI | null {
  return langchainModel;
}
