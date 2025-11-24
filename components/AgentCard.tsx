import React from 'react';
import { AgentResponse, AgentConfig } from '../types';
import { AGENTS } from '../constants';
import { Bot, Cpu, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AgentCardProps {
  response: AgentResponse;
  isLatest: boolean;
}

const AgentIcon: React.FC<{ id: string }> = ({ id }) => {
    switch (id) {
        case 'gemini': return <Sparkles size={16} />;
        case 'gpt': return <Bot size={16} />;
        case 'claude': return <Cpu size={16} />;
        default: return <Bot size={16} />;
    }
};

const AgentCard: React.FC<AgentCardProps> = ({ response, isLatest }) => {
  const agentConfig = AGENTS.find(a => a.id === response.agentId) || AGENTS[0];
  
  return (
    <div className={`
      flex flex-col border rounded-lg p-4 mb-3 transition-all duration-300
      ${isLatest ? 'bg-surface border-slate-700 shadow-md' : 'bg-slate-800/50 border-slate-800 opacity-80'}
    `}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-md ${agentConfig.color} text-white`}>
            <AgentIcon id={agentConfig.id} />
        </div>
        <span className="font-semibold text-sm text-slate-200">{agentConfig.name}</span>
        {response.isThinking && (
           <span className="ml-auto text-xs text-blue-400 animate-pulse">Processing...</span>
        )}
      </div>
      
      <div className="text-sm text-slate-300 leading-relaxed prose prose-invert max-w-none">
        {response.isThinking ? (
             <div className="space-y-2 animate-pulse">
                <div className="h-2 bg-slate-700 rounded w-3/4"></div>
                <div className="h-2 bg-slate-700 rounded w-1/2"></div>
             </div>
        ) : (
            <ReactMarkdown>{response.content}</ReactMarkdown>
        )}
      </div>
    </div>
  );
};

export default AgentCard;