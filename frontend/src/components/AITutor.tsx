import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Send, HeartHandshake, HelpCircle, Lightbulb, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface AITutorProps {
  userCode: string;
  isCodeFailing?: boolean;
  dominantEmotion?: 'FOCUSED' | 'HAPPY' | 'EXCITED' | 'ANXIOUS' | 'SAD';
  problemTitle?: string;
}

export default function AITutor({
  userCode,
  isCodeFailing = false,
  dominantEmotion = 'FOCUSED',
  problemTitle = 'Two Sum'
}: AITutorProps) {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string; hint?: boolean }[]>([
    {
      role: 'ai',
      text: "Hello! I'm your Socratic AI companion. I observe your code and focus rhythm. How can I assist your thinking today?"
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  // Emotional Intervention Trigger: When student is ANXIOUS or code is failing
  useEffect(() => {
    if (dominantEmotion === 'ANXIOUS' || dominantEmotion === 'SAD') {
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.text.includes('Take a calm breath')) return prev;
        return [
          ...prev,
          {
            role: 'ai',
            text: "Take a calm breath. You're working through a challenging constraint. Consider: what if you used a hash map to look up complements in O(1) instead of nested loops?",
            hint: true
          }
        ];
      });
    }
  }, [dominantEmotion]);

  useEffect(() => {
    if (isCodeFailing) {
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          text: "Notice the edge cases: what happens when duplicate numbers appear, or when the target sum requires the exact same element twice?",
          hint: true
        }
      ]);
    }
  }, [isCodeFailing]);

  const handleSend = () => {
    if (!inputVal.trim()) return;
    const userMsg = inputVal.trim();
    setInputVal('');

    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);

    // Socratic response simulation
    setTimeout(() => {
      let reply = "Good observation. What data structure would give you instant access to previously seen values without re-scanning the array?";
      if (userMsg.toLowerCase().includes('hash') || userMsg.toLowerCase().includes('dict') || userMsg.toLowerCase().includes('map')) {
        reply = "Spot on! By mapping `target - num` to its index, you achieve single-pass O(N) time. How will you check if the complement already exists?";
      } else if (userMsg.toLowerCase().includes('help') || userMsg.toLowerCase().includes('hint')) {
        reply = "Think of it backwards: as you iterate through each number `x`, ask: 'Have I already encountered `target - x`?'";
      }

      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    }, 700);
  };

  return (
    <div className="w-full bg-[#0d0d10] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-xl">
      {/* Header */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="px-4 py-3 bg-neutral-950/90 border-b border-white/10 flex items-center justify-between cursor-pointer hover:bg-neutral-900/60 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-white/90">AI Socratic Mentor</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
            {dominantEmotion === 'ANXIOUS' ? 'Empathetic Active' : 'Online'}
          </span>
        </div>
        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-white/40" /> : <ChevronUp className="w-3.5 h-3.5 text-white/40" />}
      </div>

      {/* Chat Messages */}
      {isExpanded && (
        <>
          <div className="p-3 space-y-2.5 max-h-56 overflow-y-auto text-xs font-sans">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl ${
                  m.role === 'ai'
                    ? m.hint
                      ? 'bg-amber-950/20 border border-amber-500/30 text-amber-200/90'
                      : 'bg-white/5 border border-white/10 text-white/80'
                    : 'bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 ml-6 text-right'
                }`}
              >
                {m.hint && (
                  <div className="flex items-center space-x-1 text-[10px] text-amber-400 font-mono mb-1 font-semibold">
                    <Lightbulb className="w-3 h-3" />
                    <span>Gentle Micro-Hint</span>
                  </div>
                )}
                <p className="leading-relaxed">{m.text}</p>
              </div>
            ))}
          </div>

          {/* Prompt Input */}
          <div className="p-2.5 bg-neutral-950 border-t border-white/10 flex items-center space-x-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for a gentle nudge..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/40"
            />
            <button
              onClick={handleSend}
              className="p-1.5 rounded-xl bg-white text-black hover:bg-neutral-200 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
