import { GoogleGenAI, Type } from "@google/genai";
import { AgentConfig, AgentResponse, ConsensusResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates a response for a specific "Persona" agent.
 */
export const generateAgentResponse = async (
  agent: AgentConfig,
  userPrompt: string,
  previousContext?: string
): Promise<string> => {
  try {
    let fullPrompt = userPrompt;

    // If there is context (previous rounds), we append it to the prompt
    // to let the agent refine its answer.
    if (previousContext) {
      fullPrompt = `
ORIGINAL USER PROMPT: "${userPrompt}"

CONTEXT FROM PREVIOUS ROUND (Other agents' responses):
${previousContext}

INSTRUCTIONS:
Based on the original prompt and the perspectives of other agents above, provide your REFINED answer.
- If you agree with others, synthesize the best parts.
- If you disagree, explain why you are correct and they might be wrong.
- Maintain your persona (${agent.name}).
`;
    }

    const response = await ai.models.generateContent({
      model: agent.model,
      contents: fullPrompt,
      config: {
        systemInstruction: agent.systemInstruction,
        temperature: 0.7, // Some creativity for distinct personas
      },
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error(`Error generating response for ${agent.name}:`, error);
    return `[Error simulating ${agent.name}: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
};

/**
 * The "Judge" model evaluates consensus.
 * Uses Gemini 3 Pro for high-quality reasoning.
 */
export const evaluateConsensus = async (
  userPrompt: string,
  responses: AgentResponse[]
): Promise<ConsensusResult> => {
  try {
    const inputs = responses.map(r => `Model ${r.agentId} says:\n${r.content}\n---\n`).join('\n');

    const prompt = `
You are the Consensus Judge.
User Prompt: "${userPrompt}"

The following are responses from different AI models:
${inputs}

Your Task:
1. Determine if the models broadly agree on the core answer (Consensus: true/false). Minor phrasing differences do not count as disagreement.
2. If they agree, provide a synthesized "finalAnswer" that combines the best clarity of all.
3. If they DISAGREE on facts or logic, list the "disagreements".
4. Provide a short "summary" of the situation (e.g., "All models agree that X" or "Models dispute the value of Y").

Respond in JSON format.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // High intelligence for judging
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasConsensus: { type: Type.BOOLEAN },
            summary: { type: Type.STRING },
            finalAnswer: { type: Type.STRING },
            disagreements: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['hasConsensus', 'summary']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Judge");
    
    return JSON.parse(text) as ConsensusResult;

  } catch (error) {
    console.error("Error evaluating consensus:", error);
    return {
      hasConsensus: false,
      summary: "Error evaluating consensus due to API failure.",
      disagreements: ["System error occurred."]
    };
  }
};
