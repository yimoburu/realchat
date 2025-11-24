import React, { useState, useRef, useEffect } from 'react';
import { Message, Round, AgentResponse, ConsensusResult, AgentConfig } from './types';
import { AGENTS, MAX_ROUNDS } from './constants';
import { generateAgentResponse, evaluateConsensus } from './services/gemini';
import ConsensusView from './components/ConsensusView';
import { Send, Settings, Sparkles, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: Date.now()
    };

    // Initialize the System "Debate" Message
    const debateMsgId = (Date.now() + 1).toString();
    const debateMsg: Message = {
      id: debateMsgId,
      role: 'system',
      timestamp: Date.now(),
      debateData: {
        rounds: [],
        status: 'debating'
      }
    };

    setMessages(prev => [...prev, userMsg, debateMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      await runConsensusLoop(inputText, debateMsgId);
    } catch (e) {
      console.error(e);
      updateDebateStatus(debateMsgId, 'failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to update specific message state safely
  const updateDebateStatus = (msgId: string, status: Message['debateData']['status'], finalResult?: ConsensusResult) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.debateData) {
        return { ...m, debateData: { ...m.debateData, status, finalResult } };
      }
      return m;
    }));
  };

  const addRound = (msgId: string, round: Round) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.debateData) {
        return { 
          ...m, 
          debateData: { 
            ...m.debateData, 
            rounds: [...m.debateData.rounds, round] 
          } 
        };
      }
      return m;
    }));
  };

  const updateRoundResponses = (msgId: string, roundIdx: number, responses: AgentResponse[]) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.debateData) {
        const newRounds = [...m.debateData.rounds];
        newRounds[roundIdx] = { ...newRounds[roundIdx], responses };
        return { ...m, debateData: { ...m.debateData, rounds: newRounds } };
      }
      return m;
    }));
  };

  // The Core Consensus Logic
  const runConsensusLoop = async (prompt: string, msgId: string) => {
    let currentRound = 1;
    let consensusReached = false;
    let previousContext = "";

    while (currentRound <= MAX_ROUNDS && !consensusReached) {
        
      // 1. Initialize Round Placeholder
      const initialResponses: AgentResponse[] = AGENTS.map(a => ({
        agentId: a.id,
        content: '',
        isThinking: true
      }));
      
      const newRound: Round = {
        roundNumber: currentRound,
        responses: initialResponses
      };
      addRound(msgId, newRound);

      // 2. Fetch Agent Responses in Parallel
      const agentPromises = AGENTS.map(agent => 
        generateAgentResponse(agent, prompt, previousContext)
          .then(content => ({
            agentId: agent.id,
            content,
            isThinking: false
          }))
      );

      const completedResponses = await Promise.all(agentPromises);
      
      // Update UI with real responses
      updateRoundResponses(msgId, currentRound - 1, completedResponses);

      // 3. Evaluate Consensus
      const consensusCheck = await evaluateConsensus(prompt, completedResponses);

      if (consensusCheck.hasConsensus) {
        updateDebateStatus(msgId, 'consensus_reached', consensusCheck);
        consensusReached = true;
      } else {
        // Prepare context for next round (Cross-Check)
        previousContext = completedResponses.map(r => 
          `[Agent ${r.agentId}]: ${r.content}`
        ).join('\n\n');
        
        if (currentRound === MAX_ROUNDS) {
           // Max rounds reached, no consensus
           updateDebateStatus(msgId, 'failed', consensusCheck);
        }
      }

      currentRound++;
    }
  };

  const clearChat = () => {
      setMessages([]);
  }

  return (
    <div className="flex h-full flex-col bg-background text-slate-100 font-sans">
      
      {/* Header */}
      <header className="flex-none h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between px-6 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg shadow-lg shadow-blue-900/20">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Consensus AI</h1>
            <p className="text-xs text-slate-400">Multi-LLM Debate System (Simulated)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={clearChat} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors" title="Clear Chat">
                <Trash2 size={18} />
            </button>
            <button className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                <Settings size={18} />
            </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 scroll-smooth pb-32">
        {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 select-none pointer-events-none">
                <Sparkles size={64} className="mb-6 text-slate-600" />
                <h2 className="text-2xl font-bold text-slate-500 mb-2">Start a Debate</h2>
                <p className="max-w-md mx-auto text-slate-600">
                    Ask a complex question. Gemini, ChatGPT (Sim), and Claude (Sim) will debate, cross-check each other, and try to reach the truth.
                </p>
            </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {msg.role === 'user' ? (
              <div className="flex justify-end mb-6">
                <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl rounded-tr-none max-w-2xl shadow-lg shadow-blue-900/20">
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ) : (
              <ConsensusView message={msg} />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="flex-none p-4 md:p-6 bg-gradient-to-t from-background via-background to-transparent z-20 sticky bottom-0">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
          <div className="relative bg-slate-900 rounded-xl flex items-center shadow-2xl border border-slate-700/50">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask a question requiring multiple perspectives..."
              className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-200 placeholder-slate-500 p-4 resize-none h-14 md:h-16 outline-none"
              disabled={isProcessing}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isProcessing}
              className={`
                mr-2 p-3 rounded-lg transition-all duration-200
                ${!inputText.trim() || isProcessing 
                  ? 'text-slate-600 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'}
              `}
            >
              {isProcessing ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                 <Send size={20} />
              )}
            </button>
          </div>
          <div className="text-center mt-2 text-xs text-slate-500">
             Simulated agents powered by Google Gemini API.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
