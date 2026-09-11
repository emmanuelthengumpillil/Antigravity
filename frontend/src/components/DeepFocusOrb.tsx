import React from 'react';

interface DeepFocusOrbProps {
  emotion?: 'FOCUSED' | 'HAPPY' | 'EXCITED' | 'ANXIOUS' | 'SAD';
  progressPercent?: number; // 0 to 100 hairline ambient fill
}

export default function DeepFocusOrb({ emotion = 'FOCUSED', progressPercent = 35 }: DeepFocusOrbProps) {
  // Emotion-reactive aura gradients
  const auraStyles = emotion === 'HAPPY' || emotion === 'EXCITED'
    ? {
        primary: 'from-emerald-500/20 via-teal-500/15 to-transparent',
        glow: 'rgba(16, 185, 129, 0.25)',
        ringColor: 'stroke-emerald-400/40',
        textColor: 'text-emerald-300/60'
      }
    : emotion === 'ANXIOUS'
      ? {
          primary: 'from-amber-500/20 via-orange-500/15 to-transparent',
          glow: 'rgba(245, 158, 11, 0.25)',
          ringColor: 'stroke-amber-400/40',
          textColor: 'text-amber-300/60'
        }
      : emotion === 'SAD'
        ? {
            primary: 'from-blue-500/20 via-indigo-500/15 to-transparent',
            glow: 'rgba(59, 130, 246, 0.25)',
            ringColor: 'stroke-blue-400/40',
            textColor: 'text-blue-300/60'
          }
        : {
            // Calm FOCUSED flow (Cyan / Soft Indigo)
            primary: 'from-cyan-500/20 via-indigo-600/15 to-transparent',
            glow: 'rgba(6, 182, 212, 0.22)',
            ringColor: 'stroke-cyan-400/40',
            textColor: 'text-cyan-300/60'
          };

  // Hairline perimeter calculation (radius = 160)
  const radius = 160;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full min-h-[420px] select-none">
      {/* Background Soft Aura Shift */}
      <div 
        className="absolute w-72 h-72 rounded-full blur-[90px] transition-all duration-1000 pointer-events-none"
        style={{ backgroundColor: auraStyles.glow }}
      />

      {/* Breathing Siri/Apple Health Concentric Orb */}
      <div className="relative flex items-center justify-center">
        {/* Hairline Perimeter Ring (Imperceptible, ambient session progress) */}
        <svg className="w-80 h-80 md:w-96 md:h-96 transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="1.5"
            fill="transparent"
            className="text-white/5"
          />
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className={`${auraStyles.ringColor} transition-all duration-1000 ease-linear`}
          />
        </svg>

        {/* Concentric Orb 1: Outer Resonator */}
        <div 
          className={`absolute w-64 h-64 md:w-72 md:h-72 rounded-full bg-gradient-to-tr ${auraStyles.primary} border border-white/5 backdrop-blur-2xl animate-breathe`}
          style={{
            boxShadow: `0 0 60px ${auraStyles.glow}, inset 0 0 40px rgba(255,255,255,0.03)`
          }}
        />

        {/* Concentric Orb 2: Mid Harmonic Layer */}
        <div 
          className="absolute w-48 h-48 md:w-56 md:h-56 rounded-full bg-[#0a0a0a]/90 border border-white/10 flex items-center justify-center shadow-inner"
        >
          {/* Concentric Orb 3: Core Nucleus */}
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-black flex flex-col items-center justify-center p-3 text-center border border-white/5 shadow-2xl">
            {/* Center Typography: ZERO NUMERIC TIMERS */}
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-white/40 mb-1">
              FLOW STATE
            </span>
            <span className="text-sm md:text-base font-semibold tracking-[0.25em] text-white/90 drop-shadow">
              DEEP FOCUS
            </span>
            <span className={`text-[9px] font-mono tracking-widest mt-1.5 ${auraStyles.textColor}`}>
              CALM CADENCE
            </span>
          </div>
        </div>
      </div>

      {/* Ambient Breathing Cadence Subtitle */}
      <div className="mt-8 flex items-center space-x-2 text-white/30 text-xs font-mono tracking-widest uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span>4-Second Rhythmic Cycle</span>
      </div>
    </div>
  );
}
