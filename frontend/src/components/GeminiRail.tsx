import React, { useState } from 'react';
import { Activity, Flame, Trophy, Award, Sparkles, ChevronRight, ChevronLeft, ShieldCheck, Users, AlertTriangle, Send, BellRing, Video } from 'lucide-react';

interface GeminiRailProps {
  streakDays?: number;
  points?: number;
  streakMultiplier?: number;
  isSleepingAlertActive?: boolean;
  onOpenZoomModal?: () => void;
}

export default function GeminiRail({
  streakDays = 5,
  points = 450,
  streakMultiplier = 1.0,
  isSleepingAlertActive = false,
  onOpenZoomModal
}: GeminiRailProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [nudgeNotification, setNudgeNotification] = useState<string | null>(null);

  // Activity Ring calculations (Apple Health style)
  const rings = [
    { label: 'Session Flow', val: 88, color: '#06b6d4', r: 42, circ: 263.89 },
    { label: 'Emotion Balance', val: 94, color: '#10b981', r: 32, circ: 201.06 },
    { label: 'Early-Return Cons.', val: 100, color: '#d946ef', r: 22, circ: 138.23 },
  ];

  const handleTeacherNudge = (studentName: string) => {
    setNudgeNotification(`Teacher sent wake-up nudge to ${studentName}`);
    setTimeout(() => setNudgeNotification(null), 3000);
  };

  return (
    <aside 
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`h-full bg-[#0a0a0c]/90 border-r border-white/10 backdrop-blur-2xl transition-all duration-300 ease-spring z-40 flex flex-col justify-between py-5 select-none ${
        isExpanded ? 'w-80 px-4 shadow-2xl shadow-black/80' : 'w-16 px-2'
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
                    <circle
                      cx="50%"
                      cy="50%"
                      r={ring.r}
                      stroke={ring.color}
                      strokeWidth="5"
                      strokeOpacity="0.15"
                      fill="transparent"
                    />
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
              <span className="text-emerald-400">● Live Streak Sync</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-400">
                <Flame className="w-4 h-4 fill-amber-400/20" />
                <span className="font-bold text-sm font-mono">{streakDays} Days</span>
              </div>
              <span className="text-xs font-mono text-white/40">Streak Master</span>
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
              <div>+100 pts: Full Session (No Sleeping)</div>
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

      {/* Bottom: Teacher Realtime Status Monitor */}
      <div className="w-full flex flex-col items-center space-y-2">
        {nudgeNotification && isExpanded && (
          <div className="w-full p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono">
            {nudgeNotification}
          </div>
        )}

        {isExpanded ? (
          <div className="w-full p-3 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-[11px] font-mono text-white/40 border-b border-white/5 pb-1">
              <div className="flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Teacher Live Monitor</span>
              </div>
              <span className="text-emerald-400">Active</span>
            </div>

            {/* Current student status in Teacher view */}
            <div className={`p-2 rounded-xl border text-xs font-mono transition-all ${
              isSleepingAlertActive
                ? 'bg-red-950/40 border-red-500/50 text-red-300 animate-pulse'
                : 'bg-white/5 border-white/5 text-white/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold">Student: You</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isSleepingAlertActive
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {isSleepingAlertActive ? 'SLEEPING [Notification Sent]' : 'Focusing [EAR 0.28]'}
                </span>
              </div>

              {isSleepingAlertActive && (
                <div className="mt-2 pt-1.5 border-t border-red-500/20 flex items-center space-x-2">
                  <button
                    onClick={() => handleTeacherNudge('You')}
                    className="w-full py-1 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-[10px] text-red-200 font-bold"
                  >
                    Teacher: Send Remote Wake-Up Nudge
                  </button>
                </div>
              )}
            </div>

            {/* Peer Student B */}
            <div className="flex items-center justify-between text-[11px] font-mono text-white/60 pt-1">
              <span>Student B (Alex): Focusing</span>
              <span className="text-emerald-400">[EAR 0.29]</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-white/60">
              <span>Student C (Elena): Focusing</span>
              <span className="text-emerald-400">[EAR 0.27]</span>
            </div>

            {/* Zoom Classroom Co-Host & Security Button */}
            {onOpenZoomModal && (
              <button
                onClick={onOpenZoomModal}
                className="w-full mt-2 py-1.5 px-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm"
              >
                <Video className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zoom Co-Host & Controls</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <Users className="w-4 h-4 text-white/30" />
              {isSleepingAlertActive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              )}
            </div>
            {onOpenZoomModal && (
              <button
                onClick={onOpenZoomModal}
                title="Zoom Classroom & Security"
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 text-white/40 hover:text-cyan-400 flex items-center justify-center transition-all"
              >
                <Video className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
