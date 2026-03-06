import { Annotation, StateGraph } from '@langchain/langgraph';
import { MongoDBSaver } from '@langchain/langgraph-checkpoint-mongodb';
import { BaseMessage, HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { MongoClient } from 'mongodb';
import { Logger } from '@nestjs/common';
import { getLangChainModel } from '../config/gemini.config';

const logger = new Logger('QuestionGraph');

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
  if (!model) throw new Error('LangChain model not initialized');

  // state.messages contains the FULL history (prior rounds + new request)
  // so Gemini sees what it already generated and avoids duplicates
  const response = await model.invoke(state.messages);
  const text =
    typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Failed to parse Gemini response as JSON');

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    messages: [new AIMessage(text)],
    questions: parsed,
  };
}

// -- Build graph --
const workflow = new StateGraph(GraphState)
  .addNode('generate', generateQuestions)
  .addEdge('__start__', 'generate')
  .addEdge('generate', '__end__');

// -- Compiled graph (lazy-init) --
let compiledGraph: ReturnType<typeof workflow.compile> | null = null;

export async function initQuestionGraph(mongoUri: string) {
  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    const checkpointer = new MongoDBSaver({ client, dbName: 'quizrope' });
    compiledGraph = workflow.compile({ checkpointer });
    logger.log('Question graph compiled with MongoDB checkpointer');
  } catch (error) {
    logger.error('Failed to init question graph checkpointer:', error.message);
    compiledGraph = workflow.compile();
  }
}

export async function invokeQuestionGraph(
  subject: string,
  difficulty: string,
  count: number,
  threadId: string,
): Promise<any[]> {
  if (!compiledGraph) {
    compiledGraph = workflow.compile();
  }

  const ageRange =
    difficulty === 'EASY'
      ? 'ages 6-8'
      : difficulty === 'MEDIUM'
        ? 'ages 9-11'
        : 'ages 12-14';

  const systemMsg = new SystemMessage(
    `You are an educational quiz generator for children. You create fun, age-appropriate multiple choice questions. Always respond with valid JSON only, no markdown. IMPORTANT: Never repeat a question you already generated in this conversation.`,
  );

  const humanMsg = new HumanMessage(
    `Generate ${count} NEW multiple choice questions about ${subject} at ${difficulty} difficulty (for ${ageRange}).

Return ONLY a JSON array:
[{ "text": "question", "options": ["a","b","c","d"], "correctIndex": 0, "explanation": "brief" }]

Rules:
- Exactly 4 options, correctIndex 0-3
- Age-appropriate, fun, no offensive content
- Do NOT repeat any question from earlier in this conversation`,
  );

  const result = await compiledGraph.invoke(
    { messages: [systemMsg, humanMsg] },
    { recursionLimit: 5, configurable: { thread_id: threadId } },
  );

  return result.questions;
}
