import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Database,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Info,
  Clock,
  Shirt,
  Users
} from 'lucide-react';
import { ChatMessage, AgentActionProposal } from '../types/index.js';
import { api } from '../lib/api.js';

interface AiAgentViewProps {
  onRefreshData?: () => void;
}

export const AiAgentView: React.FC<AiAgentViewProps> = ({ onRefreshData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your **StyleCart AI Sales Assistant**.\n\nI am connected to your live store database (Customers, Clothing Inventory, and Sales Enquiries) and can also sync with Gmail.\n\nTry clicking one of the sample requests below, or type your own question!`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickPrompts = [
    'Show all pending enquiries.',
    'Which customers asked about jeans?',
    'Find products priced below ₹1,000.',
    'Which products are out of stock?',
    'Find customers who have not received a response.',
    'Draft a polite reply to enquiry #ENQ-101.',
    'Mark enquiry ENQ-101 as resolved.'
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build history
      const history = messages.slice(-6).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      const res = await api.chatWithAgent(text, history);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
        toolInvocations: res.toolInvocations,
        proposal: res.proposal
      };

      setMessages(prev => [...prev, aiMsg]);
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (err: any) {
      console.error('Agent chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'system',
        content: `Error: ${err.message || 'Failed to communicate with AI Assistant.'}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async (msgId: string, proposal: AgentActionProposal) => {
    setExecutingActionId(proposal.actionId);
    try {
      const result = await api.confirmAgentAction(proposal.actionType, proposal.payload);
      
      // Update the message state so the proposal is marked as executed
      setMessages(prev =>
        prev.map(m => {
          if (m.id === msgId) {
            return {
              ...m,
              isActionExecuted: true
            };
          }
          return m;
        })
      );

      // Append confirmation note
      const confirmNote: ChatMessage = {
        id: `conf-${Date.now()}`,
        role: 'assistant',
        content: `✅ **Action Confirmed & Executed**: ${result.message}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, confirmNote]);

      if (onRefreshData) {
        onRefreshData();
      }
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleCancelAction = (msgId: string) => {
    setMessages(prev =>
      prev.map(m => {
        if (m.id === msgId) {
          return {
            ...m,
            proposal: undefined
          };
        }
        return m;
      })
    );
  };

  // Render markdown-like simple formatting (bold, bullet points)
  const formatText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Bold text handling
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-stone-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-stone-700 my-0.5">
            {renderedLine.slice(1)}
          </li>
        );
      }

      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      return <p key={idx} className="my-1 text-stone-700 leading-relaxed">{renderedLine}</p>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] bg-white rounded-xl border border-[#EFE9DF] shadow-xs overflow-hidden">
      {/* Agent Top Header */}
      <div className="p-4 border-b border-[#EFE9DF] bg-[#FAF8F5] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-100 flex items-center justify-center font-bold shadow-xs">
            <Bot className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-base text-stone-900">StyleCart AI Assistant</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Tool Calling
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Direct access to Clothing Inventory, Customer CRM, and Sales Enquiries database.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: 'welcome',
                role: 'assistant',
                content: `Chat session reset. How may I assist your clothing store?`,
                timestamp: new Date().toISOString()
              }
            ]);
          }}
          title="Reset conversation"
          className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2.5 bg-white border-b border-[#EFE9DF] overflow-x-auto flex items-center gap-2">
        <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-600" /> Suggested:
        </span>
        {quickPrompts.map(prompt => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="text-xs bg-[#FAF8F5] hover:bg-[#F4EFE6] text-stone-700 px-3 py-1 rounded-full border border-[#EFE9DF] hover:border-[#D5C7B0] whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-2xl rounded-2xl px-4 py-3 text-sm shadow-xs ${
                msg.role === 'user'
                  ? 'bg-stone-900 text-amber-50 rounded-br-xs'
                  : msg.role === 'system'
                  ? 'bg-rose-50 border border-rose-200 text-rose-800'
                  : 'bg-[#FAF8F5] text-stone-800 border border-[#EFE9DF] rounded-bl-xs'
              }`}
            >
              {/* Tool Execution Badges (shows transparency of backend database queries) */}
              {msg.toolInvocations && msg.toolInvocations.length > 0 && (
                <div className="mb-2.5 pb-2 border-b border-[#EAE3D5] space-y-1">
                  <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                    <Database className="w-3 h-3 text-amber-700" />
                    <span>Real Backend Tool Invocations ({msg.toolInvocations.length})</span>
                  </div>
                  {msg.toolInvocations.map((t, i) => (
                    <div
                      key={i}
                      className="text-xs bg-white p-2 rounded border border-[#EAE3D5] flex items-center justify-between"
                    >
                      <span className="font-mono text-[11px] font-bold text-amber-900">
                        ⚡ {t.toolName}()
                      </span>
                      <span className="text-[11px] text-stone-500 font-medium">{t.resultSummary}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Content */}
              <div className="text-xs leading-relaxed space-y-1">
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div>{formatText(msg.content)}</div>
                )}
              </div>

              {/* Consequential Action Confirmation Card (Safety Requirement) */}
              {msg.proposal && !msg.isActionExecuted && (
                <div className="mt-3 p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-serif font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    <span>Confirmation Required: {msg.proposal.title}</span>
                  </div>
                  <p className="text-xs text-stone-700">{msg.proposal.description}</p>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleCancelAction(msg.id)}
                      className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirmAction(msg.id, msg.proposal!)}
                      disabled={executingActionId === msg.proposal.actionId}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-amber-100 rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      {executingActionId === msg.proposal.actionId ? 'Executing...' : 'Confirm Action'}
                    </button>
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div
                className={`text-[10px] mt-1.5 ${
                  msg.role === 'user' ? 'text-stone-400 text-right' : 'text-stone-400 text-left'
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-100 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl rounded-bl-xs border border-[#EFE9DF] text-xs text-stone-500 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-stone-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-stone-500 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-stone-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-stone-600 font-medium ml-1">Querying database & tools...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 bg-[#FAF8F5] border-t border-[#EFE9DF]">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about pending enquiries, jeans stock, prices below ₹1,000, unresponded customers..."
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-xs bg-white border border-[#EAE3D5] rounded-xl focus:outline-none focus:border-stone-900 shadow-xs"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 bg-stone-900 hover:bg-stone-800 text-amber-100 rounded-xl transition-colors cursor-pointer disabled:opacity-40 shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
