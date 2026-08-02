import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useMember } from '../../context/MemberContext';
import { EditorialContent } from '../EditorialContent';

type Message = {
  id: string;
  role: 'user' | 'analyst';
  content: string;
  sources?: string[];
  isError?: boolean;
};

export const BetaChatWidget = () => {
  const { isMember } = useMember();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'analyst',
      content: "Hello! I'm here to help. Ask me anything about African markets, investments, or our recent coverage.",
    }
  ]);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Only render for logged-in members
  if (!isMember) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.askAnalyst(userMessage.content);
      
      const analystMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'analyst',
        content: response.response,
        sources: response.sources,
      };
      
      setMessages(prev => [...prev, analystMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'analyst',
        content: 'Sorry, I encountered an error while trying to process your request. Please try again.',
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        aria-label="Open the analyst chat"
        className="fixed bottom-[calc(4.65rem+env(safe-area-inset-bottom))] right-3 z-50 p-3 sm:right-6 sm:p-4 lg:bottom-6 bg-background text-foreground rounded-full shadow-lg border border-primary/20 hover:bg-background/90 hover:scale-105 transition-all flex items-center justify-center"
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-[calc(4.65rem+env(safe-area-inset-bottom))] right-3 z-50 w-[calc(100vw-1.5rem)] sm:right-6 sm:w-[560px] h-[min(760px,72dvh)] sm:h-[min(760px,82dvh)] lg:bottom-6 bg-background rounded-2xl shadow-2xl border border-primary/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-background text-foreground p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-accent" />
                <div>
                  <h3 className="font-serif text-lg leading-tight">Ask the Analyst</h3>
                  <p className="text-[10px] text-foreground/60 uppercase tracking-wider font-bold">Source-grounded briefing</p>
                </div>
              </div>
              <button 
                aria-label="Close the analyst chat"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-foreground/10 rounded-full transition-colors text-foreground/60 hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/30 scrollbar-thin scrollbar-thumb-primary/10">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[92%] rounded-2xl p-4 ${
                    msg.role === 'user' 
                      ? 'bg-background text-foreground rounded-br-sm' 
                      : msg.isError 
                        ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-sm'
                        : 'bg-background border border-primary/10 text-primary rounded-bl-sm shadow-sm'
                  }`}>
                    {msg.isError && <AlertCircle size={14} className="inline mr-1.5 mb-0.5" />}
                    {msg.role === 'user' || msg.isError
                      ? <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      : <EditorialContent content={msg.content} className="editorial-content-compact text-sm" />}
                    
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-primary/10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-1.5">Sources</p>
                        <ul className="space-y-1">
                          {msg.sources.map((source, idx) => (
                            <li key={idx} className="text-xs text-primary/70 truncate flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-accent/60 shrink-0" />
                              {source}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm p-4 bg-background border border-primary/10 text-primary/50 shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-background border-t border-primary/10 shrink-0">
              <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-secondary/50 border border-primary/10 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent text-primary placeholder:text-primary/40"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  aria-label="Send question"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1 p-2 bg-background text-foreground rounded-full hover:bg-background/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
