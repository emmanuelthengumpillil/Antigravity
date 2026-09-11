import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Send, Lightbulb, ChevronDown, ChevronUp, GraduationCap, BrainCircuit } from 'lucide-react';

interface AITutorProps {
  userCode: string;
  isCodeFailing?: boolean;
  dominantEmotion?: 'FOCUSED' | 'HAPPY' | 'EXCITED' | 'ANXIOUS' | 'SAD';
  problemTitle?: string;
  roomCode?: string;
}

export default function AITutor({
  userCode,
  isCodeFailing = false,
  dominantEmotion = 'FOCUSED',
  problemTitle = 'Two Sum',
  roomCode = 'FM-1001'
}: AITutorProps) {
  const [activeMode, setActiveMode] = useState<'TEACHER' | 'STUDENT'>('TEACHER');
  const [messages, setMessages] = useState<{ role: 'ai' | 'user' | 'system'; author?: string; text: string; hint?: boolean }[]>([
    {
      role: 'ai',
      author: 'FocusMind Master Educator',
      text: "Hello! I'm your Teacher Bot. I observe your code and focus rhythm. How can I help you master Two Sum today?"
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  // Mode Toggle Handler with Context Preservation
  const handleToggleMode = async (newMode: 'TEACHER' | 'STUDENT') => {
    if (newMode === activeMode) return;
    setActiveMode(newMode);

    const noticeText = newMode === 'STUDENT'
      ? "🧠 Switched to Student Bot Mode (Feynman Technique). You are now the Teacher! Sam is ready to learn from you."
      : "🎓 Switched to Teacher Bot Mode. Master Educator is guiding you with Socratic scaffolding and analogies.";

    setMessages(prev => [
      ...prev,
      { role: 'system', text: noticeText }
    ]);

    // Sync mode with backend room if available
    try {
      await fetch(`http://127.0.0.1:8000/api/rooms/${roomCode}/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_mode: newMode })
      });
    } catch (e) {
      // Local fallback
    }
  };

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
            author: activeMode === 'TEACHER' ? 'FocusMind Master Educator' : 'Sam (Inquisitive Learner)',
            text: activeMode === 'TEACHER'
              ? "Take a calm breath. You're working through a challenging constraint. Consider: what if you used a hash map to look up complements in O(1) instead of nested loops?"
              : "Don't worry, this looks tricky! Can we step back and explain the simplest possible example together?",
            hint: true
          }
        ];
      });
    }
  }, [dominantEmotion, activeMode]);

  const handleSend = async () => {
    if (!inputVal.trim()) return;
    const userMsg = inputVal.trim();
    setInputVal('');

    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);

    // Attempt backend sync
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/rooms/${roomCode}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: 'You',
          text: userMsg,
          user_code: userCode
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [
          ...prev,
          {
            role: 'ai',
            author: data.ai_message.author_name,
            text: data.ai_message.text,
            hint: data.ai_message.hint
          }
        ]);
        return;
      }
    } catch (e) {
      console.log('Using local dual-mode simulation:', e);
    }

    // Local Fallback Simulation
    setTimeout(() => {
      let reply = "";
      let author = activeMode === 'TEACHER' ? 'FocusMind Master Educator' : 'Sam (Inquisitive Learner)';

      if (activeMode === 'STUDENT') {
        if (userMsg.toLowerCase().includes('hash') || userMsg.toLowerCase().includes('map')) {
          reply = "Ooh! So a hash map is like a numbered cubby where each number sits right in its own slot? How does it make lookups instantaneous without searching?";
        } else {
          reply = "I'm listening! Could you explain that part simply, like I'm 10 years old? Why is this better than checking every pair?";
        }
      } else {
        if (userMsg.toLowerCase().includes('hash') || userMsg.toLowerCase().includes('map')) {
          reply = "Spot on! By mapping `target - num` to its index, you achieve single-pass O(N) time. Comprehension Check: Why must we check before storing?";
        } else {
          reply = "Let's analyze this step-by-step. What is the sub-problem we repeat on every iteration?";
        }
      }

      setMessages(prev => [
        ...prev,
        { role: 'ai', author, text: reply, hint: activeMode === 'TEACHER' }
      ]);
    }, 600);
  };

  return (
    <div className="w-full bg-[#0d0d10] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-xl select-none">
      {/* Header & Mode Toggle */}
      <div className="px-3.5 py-2.5 bg-neutral-950/90 border-b border-white/10 flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
              activeMode === 'TEACHER'
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              {activeMode === 'TEACHER' ? <GraduationCap className="w-3.5 h-3.5" /> : <BrainCircuit className="w-3.5 h-3.5" />}
            </div>
            <span className="text-xs font-semibold text-white/90">
              {activeMode === 'TEACHER' ? 'Teacher Bot (Expert)' : 'Student Bot (Feynman)'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
              Room: {roomCode}
            </span>
          </div>
          <button 
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-1 text-white/40 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Persistent Dual-Mode Toggle Switch */}
        <div className="flex items-center p-0.5 rounded-xl bg-neutral-900 border border-white/10 text-xs font-mono">
          <button
            onClick={() => handleToggleMode('TEACHER')}
            className={`flex-1 py-1 px-2 rounded-lg font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              activeMode === 'TEACHER'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3 h-3" />
            <span>Teacher Mode</span>
          </button>

          <button
            onClick={() => handleToggleMode('STUDENT')}
            className={`flex-1 py-1 px-2 rounded-lg font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              activeMode === 'STUDENT'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <BrainCircuit className="w-3 h-3" />
            <span>Student Mode (Feynman)</span>
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      {isExpanded && (
        <>
          <div className="p-3 space-y-2.5 max-h-56 overflow-y-auto text-xs font-sans">
            {messages.map((m, idx) => {
              if (m.role === 'system') {
                return (
                  <div key={idx} className="p-2 rounded-xl bg-white/5 border border-white/10 text-center text-[11px] font-mono text-white/60">
                    {m.text}
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl ${
                    m.role === 'ai'
                      ? activeMode === 'TEACHER'
                        ? 'bg-cyan-950/20 border border-cyan-500/30 text-cyan-100'
                        : 'bg-amber-950/20 border border-amber-500/30 text-amber-100'
                      : 'bg-white/10 border border-white/10 text-white ml-6 text-right'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mb-1">
                    <span>{m.role === 'ai' ? m.author : 'You (Instructor)'}</span>
                    {m.hint && <span className="text-amber-400 font-bold">● Socratic Step</span>}
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                </div>
              );
            })}
          </div>

          {/* Prompt Input */}
          <div className="p-2.5 bg-neutral-950 border-t border-white/10 flex items-center space-x-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={activeMode === 'TEACHER' ? "Ask a doubt or concept question..." : "Explain the concept to Sam..."}
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
