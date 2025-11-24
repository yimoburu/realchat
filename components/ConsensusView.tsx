import React, { useState } from 'react';
import { Message, Round } from '../types';
import AgentCard from './AgentCard';
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ConsensusViewProps {
  message: Message;
}

const ConsensusView: React.FC<ConsensusViewProps> = ({ message }) => {
  const { debateData } = message;
  const [expandedRound, setExpandedRound] = useState<number | null>(
    debateData?.rounds.length ? debateData.rounds.length : null
  );

  if (!debateData) return null;

  const toggleRound = (idx: number) => {
    setExpandedRound(expandedRound === idx ? null : idx);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Rounds History */}
      <div className="space-y-4">
        {debateData.rounds.map((round: Round, idx) => (
          <div key={idx} className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900/50">
            {/* Round Header */}
            <button 
                onClick={() => toggleRound(round.roundNumber)}
                className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-750 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 text-xs font-bold bg-slate-700 rounded text-slate-300">
                        Round {round.roundNumber}
                    </span>
                    <span className="text-sm text-slate-400">
                        {round.responses.some(r => r.isThinking) ? 'Agents are deliberating...' : `${round.responses.length} Perspectives`}
                    </span>
                </div>
                {expandedRound === round.roundNumber ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Round Content */}
            {expandedRound === round.roundNumber && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-900/30">
                {round.responses.map((resp, rIdx) => (
                    <AgentCard 
                        key={`${round.roundNumber}-${resp.agentId}-${rIdx}`} 
                        response={resp} 
                        isLatest={idx === debateData.rounds.length - 1}
                    />
                ))}
                </div>
            )}
          </div>
        ))}
      </div>

      {/* Final Consensus or Status Box */}
      {debateData.status === 'consensus_reached' && debateData.finalResult && (
        <div className="border border-emerald-500/30 bg-emerald-900/10 rounded-xl p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-4 text-emerald-400">
            <CheckCircle2 size={24} />
            <h3 className="text-lg font-bold">Consensus Reached</h3>
          </div>
          <div className="prose prose-invert prose-emerald max-w-none mb-4">
            <ReactMarkdown>{debateData.finalResult.finalAnswer || ''}</ReactMarkdown>
          </div>
          <div className="text-xs text-emerald-500/70 border-t border-emerald-500/20 pt-2">
            Summary: {debateData.finalResult.summary}
          </div>
        </div>
      )}

      {debateData.status === 'debating' && (
        <div className="flex items-center justify-center p-8 text-slate-400 animate-pulse">
          <span className="mr-2">Agents are cross-checking answers...</span>
        </div>
      )}

      {debateData.status === 'failed' && debateData.finalResult && (
        <div className="border border-orange-500/30 bg-orange-900/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4 text-orange-400">
            <AlertTriangle size={24} />
            <h3 className="text-lg font-bold">Agree to Disagree</h3>
          </div>
          <p className="mb-4 text-slate-300">{debateData.finalResult.summary}</p>
          
          {debateData.finalResult.disagreements && (
             <div className="bg-orange-950/30 rounded p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-2">Key Disagreements</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                    {debateData.finalResult.disagreements.map((d, i) => (
                        <li key={i}>{d}</li>
                    ))}
                </ul>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConsensusView;
