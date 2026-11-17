import React, { useState } from 'react';
import { Camera, Eye, Smile, AlertCircle, Sparkles, Activity, ShieldCheck, Maximize2, Minimize2 } from 'lucide-react';
import { EMOTIONS } from '../hooks/useEmotionEngine';

export default function DynamicIsland({
  formattedTime,
  isActive,
  pomodoroState,
  dominantEmotion,
  confidence,
  distractionIndex,
  gazeStability,
  setManualEmotion,
  videoRef,
  isStreaming
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFaceMeshPreview, setShowFaceMeshPreview] = useState(true);

  const emotionMeta = EMOTIONS[dominantEmotion] || EMOTIONS.FOCUSED;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out select-none">
      <div
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        onClick={() => setIsExpanded(prev => !prev)}
        className={`bg-black text-white border border-white/10 rounded-full shadow-2xl transition-all duration-300 ease-spring backdrop-blur-xl cursor-pointer ${
          isExpanded
            ? 'w-[360px] md:w-[420px] rounded-[28px] p-4 bg-black/95 ring-1 ring-white/15'
            : 'h-10 px-4 flex items-center space-x-3 w-auto min-w-[210px] hover:scale-[1.02]'
        }`}
        style={{
          boxShadow: isExpanded ? '0 20px 45px rgba(0,0,0,0.9), 0 0 15px rgba(255,255,255,0.03)' : '0 8px 25px rgba(0,0,0,0.8)'
        }}
      >
        {/* COMPACT VIEW */}
        {!isExpanded && (
          <div className="flex items-center justify-between w-full space-x-3 text-xs font-mono">
            {/* Camera Pulsing Status Dot */}
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isStreaming ? 'bg-emerald-400' : 'bg-indigo-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isStreaming ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}></span>
              </span>
              <span className="text-[11px] font-medium tracking-tight text-white/80">
                {formattedTime}
              </span>
            </div>

            {/* Session Status Pill */}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
              isActive ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/40'
            }`}>
              {isActive ? 'FOCUS' : 'PAUSED'}
            </span>

            {/* Dominant Emotion Badge */}
            <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${emotionMeta.bg} ${emotionMeta.color} border ${emotionMeta.border}`}>
              <span>[{dominantEmotion}]</span>
            </div>
          </div>
        )}

        {/* EXPANDED VIEW */}
        {isExpanded && (
          <div className="flex flex-col space-y-3.5 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            {/* Header: Camera Indicator & Quick Status */}
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold tracking-wide text-white/90">Vision Telemetry Island</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                  {pomodoroState} • {formattedTime}
                </span>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Live Camera Feed Preview & Mini Landmark Overlay */}
            <div className="relative w-full h-36 bg-neutral-950 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center group">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${!isStreaming ? 'hidden' : ''}`}
              />
              
              {!isStreaming && (
                <div className="flex flex-col items-center justify-center text-white/40 space-y-1">
                  <Camera className="w-6 h-6 text-white/20 animate-pulse" />
                  <span className="text-xs font-mono">Vision Telemetry Active (Background)</span>
                  <span className="text-[10px] text-white/30">Client-Side Private Extraction</span>
                </div>
              )}

              {/* HUD Overlay Stats inside Camera View */}
              <div className="absolute top-2 left-2 flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur border border-white/10 text-[10px] font-mono text-white/80">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Zero Cloud Upload</span>
              </div>

              <div className="absolute bottom-2 right-2 flex items-center space-x-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur border border-white/10 text-[10px] font-mono text-white/80">
                <span>Stability: {gazeStability}%</span>
                <span className="text-white/30">|</span>
                <span>Distract: {distractionIndex}%</span>
              </div>
            </div>

            {/* Dominant Emotional State Selector / Confidence */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white/50 font-medium">Dominant Detected State:</span>
                <span className={`font-mono font-bold ${emotionMeta.color}`}>
                  [{dominantEmotion}] <span className="text-white/40 font-normal">({confidence}% Peak)</span>
                </span>
              </div>

              {/* Emotional State Selector Pills */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {Object.keys(EMOTIONS).map((emoKey) => {
                  const meta = EMOTIONS[emoKey];
                  const isSelected = dominantEmotion === emoKey;
                  return (
                    <button
                      key={emoKey}
                      onClick={() => setManualEmotion(emoKey)}
                      className={`py-1 px-1 rounded-lg text-[10px] font-mono font-semibold transition-all ${
                        isSelected
                          ? `${meta.bg} ${meta.color} border ${meta.border} ring-1 ring-white/20 scale-[1.03]`
                          : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10 hover:text-white/80'
                      }`}
                    >
                      {emoKey}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Session Status Footnote */}
            <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/5 font-mono">
              <span>Distraction-Free Background Mode</span>
              <span className="text-emerald-400">● Realtime Sync</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
