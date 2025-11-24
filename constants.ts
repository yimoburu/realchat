import { AgentConfig } from './types';

// We use the Gemini API to simulate other models via prompting for this demo.
// In a real production scenario with access to other APIs, you would swap the implementation.
export const AGENTS: AgentConfig[] = [
  {
    id: 'gemini',
    name: 'Gemini 3.0',
    color: 'bg-blue-500',
    avatar: 'G',
    description: 'Multimodal, reasoning-focused native model.',
    model: 'gemini-3-pro-preview', // Using the powerful one for the "native" feel
    systemInstruction: 'You are Gemini 3.0. You are helpful, precise, and capable of complex reasoning. Answer the user prompt directly.',
  },
  {
    id: 'gpt',
    name: 'ChatGPT 5.1 (Sim)',
    color: 'bg-emerald-500',
    avatar: 'O',
    description: 'Simulated persona of a high-reasoning O-series model.',
    model: 'gemini-2.5-flash', // Using flash for speed/cost in simulation
    systemInstruction: 'Roleplay as "ChatGPT 5.1". You are direct, concise, and extremely logical. Your goal is to provide the most accurate answer possible. If you disagree with others, state why clearly.',
  },
  {
    id: 'claude',
    name: 'Claude 4.5 (Sim)',
    color: 'bg-orange-500',
    avatar: 'C',
    description: 'Simulated persona of a nuanced, safe, and literary model.',
    model: 'gemini-2.5-flash',
    systemInstruction: 'Roleplay as "Claude 4.5". You are thoughtful, nuanced, and prioritize safety and ethical considerations. You often consider edge cases others miss.',
  },
];

export const MAX_ROUNDS = 3;
