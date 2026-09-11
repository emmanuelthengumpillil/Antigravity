import React, { useState } from 'react';
import { Activity, Flame, Trophy, Award, Sparkles, ChevronRight, ChevronLeft, ShieldCheck, Users } from 'lucide-react';

interface GeminiRailProps {
  streakDays?: number;
  points?: number;
  streakMultiplier?: number;
}

export default function GeminiRail({
  streakDays = 5,
  points = 450,
  streakMultiplier = 1.0
}: GeminiRailProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Activity Ring calculations (Apple Health style)
  // Ring 1: Session Flow (88%) - Cyan
  // Ring 2: Emotion Balance (94%) - Emerald
  // Ring 3: Early-Return Consistency (100%) - Fuchsia
  const rings = [
    { label: 'Session Flow', val: 88, color: '#06b6d4', r: 42, circ: 263.89 },
    { label: 'Emotion Balance', val: 94, color: '#10b981', r: 32, circ: 201.06 },
    { label: 'Early-Return Cons.', val: 100, color: '#d946ef', r: 22, circ: 138.23 },
  ];

  return (
    <aside 
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`h-full bg-[#0a0a0c]/90 border-r border-white/10 backdrop-blur-2xl transition-all duration-300 ease-spring z-40 flex flex-col justify-between py-5 select-none ${
        isExpanded ? 'w-72 px-4 shadow-2xl shadow-black/80' : 'w-16 px-2'
      }`}
    >
      {/* Top Brand / Toggle Area */}
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center justify-between w-full">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-cyan-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center text-cyan-400 mx-auto">
            <Activity className="w-5 h-5" />
          </div>
          {isExpanded && (
            <button 
              onClick={() => setIsExpanded(false)}
              className="text-white/40 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Apple Health-Style Concentric Activity Rings */}
        <div className="flex flex-col items-center justify-center pt-2">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-28 h-28 transform -rotate-90">
              {rings.map((ring, i) => {
                const offset = ring.circ - (ring.val / 100) * ring.circ;
                return (
                  <React.Fragment key={i}>
                    {/* Track */}
                    <circle
                      cx="50%"
                      cy="50%"
                      r={ring.r}
                      stroke={ring.color}
                      strokeWidth="5"
                      strokeOpacity="0.15"
                      fill="transparent"
                    />
                    {/* Active ring */}
                    <circle
                      cx="50%"
                      cy="50%"
                      r={ring.r}
                      stroke={ring.color}
                      strokeWidth="5"
                      strokeDasharray={ring.circ}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </React.Fragment>
                );
              })}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-mono text-white/50">FLOW</span>
              <span className="text-xs font-bold font-mono text-cyan-400">94%</span>
            </div>
          </div>

          {/* Activity Ring Legend when expanded */}
          {isExpanded && (
            <div className="w-full mt-3 space-y-1.5 animate-fadeIn">
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider pb-1 border-b border-white/5">
                Final Analysis Rings
              </div>
              {rings.map((ring, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ring.color }}></span>
                    <span className="text-white/70">{ring.label}</span>
                  </div>
                  <span className="font-bold text-white/90">{ring.val}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Streak Score Board */}
      <div className="w-full space-y-3">
        {isExpanded ? (
          <div className="p-3 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-2.5 animate-fadeIn">
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider flex items-center justify-between">
              <span>Score Board</span>
              <span className="text-emerald-400">● Live Sync</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-400">
                <Flame className="w-4 h-4 fill-amber-400/20" />
                <span className="font-bold text-sm font-mono">{streakDays} Days</span>
              </div>
              <span className="text-xs font-mono text-white/40">Daily Streak</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Trophy className="w-4 h-4" />
                <span className="font-bold text-sm font-mono">{points} Pts</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                {streakMultiplier.toFixed(1)}x
              </span>
            </div>

            <div className="pt-2 border-t border-white/5 space-y-1 text-[10px] font-mono text-white/50">
              <div>+100 pts: Full Session Completed</div>
              <div>+50 pts: Early Break Return Bonus</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3 text-white/40">
            <div className="flex flex-col items-center text-amber-400">
              <Flame className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold mt-0.5">{streakDays}d</span>
            </div>
            <div className="flex flex-col items-center text-indigo-400">
              <Trophy className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold mt-0.5">{points}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom: Teacher / Classroom Sync Badge */}
      <div className="w-full flex flex-col items-center">
        {isExpanded ? (
          <div className="w-full p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs font-mono text-white/70">
            <div className="flex items-center space-x-2">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Teacher Room</span>
            </div>
            <span className="text-[10px] text-emerald-400">Connected</span>
          </div>
        ) : (
          <Users className="w-4 h-4 text-white/30" />
        )}
      </div>
    </aside>
  );
}
