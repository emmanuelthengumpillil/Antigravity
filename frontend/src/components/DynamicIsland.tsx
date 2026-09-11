import React, { useState } from 'react';
import { Camera, ShieldCheck, Eye, Sparkles, ChevronDown, Clock, Activity } from 'lucide-react';
import RobotAvatar from './RobotAvatar';

interface DynamicIslandProps {
  dominantEmotion: 'FOCUSED' | 'HAPPY' | 'EXCITED' | 'ANXIOUS' | 'SAD';
  exactTimeFormatted?: string;
  isCameraActive?: boolean;
  onToggleCameraModal?: () => void;
  onSelectEmotion?: (emotion: 'FOCUSED' | 'HAPPY' | 'EXCITED' | 'ANXIOUS' | 'SAD') => void;
}

export default function DynamicIsland({
  dominantEmotion = 'FOCUSED',
  exactTimeFormatted = '24:48',
  isCameraActive = true,
  onToggleCameraModal,
  onSelectEmotion
}: DynamicIslandProps) {
  const [showTimeTooltip, setShowTimeTooltip] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const emotionColor = dominantEmotion === 'HAPPY' || dominantEmotion === 'EXCITED'
    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    : dominantEmotion === 'ANXIOUS'
      ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
      : dominantEmotion === 'SAD'
        ? 'text-blue-400 border-blue-500/30 bg-blue-500/10'
        : 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 select-none">
      <div 
        onMouseEnter={() => setShowTimeTooltip(true)}
        onMouseLeave={() => setShowTimeTooltip(false)}
        className="h-14 md:h-16 px-4 md:px-5 rounded-full bg-[#0a0a0a] border border-white/10 shadow-2xl backdrop-blur-xl flex items-center space-x-3.5 transition-all duration-300 hover:border-white/20 hover:shadow-cyan-950/20"
        style={{
          boxShadow: '0 10px 30px rgba(0,0,0,0.9), 0 0 15px rgba(255,255,255,0.02)'
        }}
      >
        {/* 1. Interactive Robot Companion (Left) */}
        <div className="flex items-center">
          <RobotAvatar emotion={dominantEmotion} size={42} />
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-white/10" />

        {/* 2. Dominant State Badge */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(prev => !prev)}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider border transition-all hover:scale-105 active:scale-95 ${emotionColor}`}
            title="Click to test different emotional states"
          >
            <span>[{dominantEmotion}]</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* Quick Emotion Switcher Dropdown */}
          {isMenuOpen && (
            <div className="absolute top-10 left-0 w-36 py-1.5 rounded-2xl bg-neutral-950 border border-white/15 shadow-2xl z-50 animate-fadeIn">
              {(['FOCUSED', 'HAPPY', 'EXCITED', 'ANXIOUS', 'SAD'] as const).map((emo) => (
                <button
                  key={emo}
                  onClick={() => {
                    if (onSelectEmotion) onSelectEmotion(emo);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1 text-xs font-mono transition-colors hover:bg-white/10 ${
                    dominantEmotion === emo ? 'text-white font-bold' : 'text-white/60'
                  }`}
                >
                  [{emo}]
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Discreet Green Camera Indicator ("Pop Camera" toggle) */}
        <button
          onClick={onToggleCameraModal}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-white/70 transition-all hover:text-white"
          title="Vision Telemetry Active • Click for Camera View"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline text-xs text-emerald-400/90 font-medium">Vision HUD</span>
        </button>

        {/* 4. Core Directive: Zero Timer Obsession — Hidden Metric */}
        {/* Exact time only reveals on subtle hover/tap inside the Dynamic Island */}
        <div className="flex items-center pl-1">
          {showTimeTooltip ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white font-mono text-xs animate-fadeIn border border-white/15">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>{exactTimeFormatted}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-white/30 text-[11px] font-mono cursor-pointer" title="Hover to view exact remaining time">
              <Activity className="w-3.5 h-3.5 text-white/20 animate-pulse" />
              <span className="hidden md:inline">Ambient Flow</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
