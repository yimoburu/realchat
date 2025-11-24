export type AgentId = 'gemini' | 'gpt' | 'claude' | 'mistral';

export interface AgentConfig {
  id: AgentId;
  name: string;
  color: string;
  avatar: string;
  description: string;
  systemInstruction: string;
  model: string; // The underlying real Gemini model to use for simulation
}

export interface AgentResponse {
  agentId: AgentId;
  content: string;
  isThinking: boolean;
}

export interface Round {
  roundNumber: number;
  responses: AgentResponse[];
  consensusCheck?: ConsensusResult;
}

export interface ConsensusResult {
  hasConsensus: boolean;
  summary: string;
  disagreements?: string[];
  finalAnswer?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'system';
  content?: string;
  // If role is system, we might have a complex multi-round debate structure
  debateData?: {
    rounds: Round[];
    status: 'idle' | 'debating' | 'consensus_reached' | 'failed' | 'summarizing';
    finalResult?: ConsensusResult;
  };
  timestamp: number;
}
