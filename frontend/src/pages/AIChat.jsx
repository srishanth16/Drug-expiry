import { useState, useRef, useEffect } from "react";
import api from "../services/api";
import { Send, Sparkles, AlertCircle, HelpCircle, Bot, User, Trash2 } from "lucide-react";

const AIChat = () => {
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: "Hello! I am your CareWise Pharmacy Intelligence Assistant. Ask me anything about medicine expiries, low stock reorders, sales demand, or generic drug substitutions."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const chatEndRef = useRef(null);

  // Suggested Prompts
  const SUGGESTED_PROMPTS = [
    "Which medicines are most likely to expire?",
    "What should I reorder this month?",
    "Give me a summary of my current stock."
  ];

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;

    setError("");
    const userMsg = { role: "user", text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Prepare history format for API (exclude the last added user query since it's passed as current message)
    const apiHistory = messages.map(m => ({
      role: m.role,
      text: m.text
    }));

    try {
      const res = await api.post("/chat", {
        message: textToSend,
        history: apiHistory
      });

      const assistantMsg = { role: "model", text: res.data.response };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setError("AI Assistant connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const clearChat = () => {
    if (!window.confirm("Clear chat history?")) return;
    setMessages([
      {
        role: "model",
        text: "Chat cleared. How can I help you manage your inventory today?"
      }
    ]);
    setError("");
  };

  return (
    <div className="space-y-6 p-8 max-w-5xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      
      {/* Title Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black font-display text-on-surface tracking-wide">CareWise AI Assistant</h1>
          <p className="text-on-surface-variant text-xs mt-1 font-semibold">
            Ask natural language questions about your pharmacy inventory, alert summaries, and purchase recommendations.
          </p>
        </div>
        <button
          onClick={clearChat}
          className="p-2 bg-surface-container hover:bg-surface-container-high hover:text-error text-on-surface-variant border border-outline-variant rounded-xl transition-all"
          title="Clear chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Quick Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="text-left p-3.5 bg-surface-container border border-outline-variant hover:border-primary rounded-xl text-xs font-semibold text-on-surface hover:text-primary transition-all duration-150 disabled:opacity-50 active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary inline mr-2" />
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Log Panel */}
      <div className="flex-1 min-h-0 card-level-1 border-outline-variant p-6 overflow-y-auto space-y-4 flex flex-col scrollbar-thin">
        
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <div 
              key={index} 
              className={`flex gap-3 max-w-[80%] ${isUser ? "self-end flex-row-reverse" : "self-start"}`}
            >
              {/* Avatar Icon */}
              <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center border font-bold ${
                isUser 
                  ? "bg-surface-container border-outline-variant text-on-surface-variant" 
                  : "bg-primary/10 border-primary/20 text-primary shadow-glow-primary"
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble content */}
              <div className={`p-4 rounded-2xl text-xs leading-relaxed font-semibold ${
                isUser 
                  ? "bg-primary text-on-primary rounded-tr-none" 
                  : "bg-surface-container-lowest border border-outline-variant text-on-surface rounded-tl-none whitespace-pre-wrap"
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}

        {/* Loading placeholder spinner */}
        {loading && (
          <div className="flex gap-3 max-w-[80%] self-start">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-4 bg-surface-container-lowest border border-outline-variant text-on-surface-variant rounded-2xl rounded-tl-none text-xs font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-outline rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="h-1.5 w-1.5 bg-outline rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="h-1.5 w-1.5 bg-outline rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              <span className="ml-1.5 font-bold uppercase tracking-wider text-[10px]">Analyzing Database...</span>
            </div>
          </div>
        )}

        {/* Error Notification inside chat box */}
        {error && (
          <div className="p-3 bg-error-container border border-error/20 text-error text-xs rounded-xl flex items-center gap-2 self-center font-bold">
            <AlertCircle className="w-4 h-4 text-error" />
            <span>{error}</span>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Input Message Footer bar */}
      <form onSubmit={handleSubmit} className="flex gap-3 shrink-0">
        <input
          type="text"
          placeholder="Ask me anything about your stock inventory..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-3 bg-white border border-outline-variant rounded-xl text-on-surface placeholder-outline focus:outline-none focus:border-primary text-xs font-semibold transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-bold flex items-center justify-center shadow-level-1 transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};

export default AIChat;
