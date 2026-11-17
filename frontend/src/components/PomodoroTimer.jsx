import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { POMODORO_STATES, PRESETS } from '../hooks/usePomodoroMachine';

export default function PomodoroTimer({
  state,
  formattedTime,
  progressPercent,
  isActive,
  toggleActive,
  resetTimer,
  skipCurrent,
  transitionTo,
  selectedPreset,
  changePreset,
  soundEnabled,
  setSoundEnabled,
  dominantEmotion
}) {
  // SVG circular ring calculations
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const isWork = state === POMODORO_STATES.WORK;
  const isShortBreak = state === POMODORO_STATES.SHORT_BREAK;
  const isLongBreak = state === POMODORO_STATES.LONG_BREAK;

  // Emotion-reactive subtle ambient glow tint
  const glowClass = dominantEmotion === 'ANXIOUS'
    ? 'shadow-[0_0_50px_rgba(245,158,11,0.15)]'
    : dominantEmotion === 'SAD'
      ? 'shadow-[0_0_50px_rgba(59,130,246,0.15)]'
      : dominantEmotion === 'EXCITED'
        ? 'shadow-[0_0_50px_rgba(217,70,239,0.18)]'
        : 'shadow-[0_0_50px_rgba(99,102,241,0.15)]';

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto py-6">
      {/* Session State Switcher Pills */}
      <div className="flex items-center space-x-2 p-1 rounded-full bg-neutral-950 border border-white/10 mb-8 backdrop-blur">
        <button
          onClick={() => transitionTo(POMODORO_STATES.WORK)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
            isWork
              ? 'bg-white text-black shadow-md shadow-white/10'
              : 'text-white/40 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          Work
        </button>
        <button
          onClick={() => transitionTo(POMODORO_STATES.SHORT_BREAK)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
            isShortBreak
              ? 'bg-emerald-400 text-black shadow-md shadow-emerald-400/20'
              : 'text-white/40 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          Short Break
        </button>
        <button
          onClick={() => transitionTo(POMODORO_STATES.LONG_BREAK)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
            isLongBreak
              ? 'bg-blue-400 text-black shadow-md shadow-blue-400/20'
              : 'text-white/40 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          Long Break
        </button>
      </div>

      {/* Main OLED Timer Ring */}
      <div className={`relative flex items-center justify-center rounded-full p-2 bg-neutral-950 border border-white/10 transition-shadow duration-700 ${glowClass}`}>
        <svg className="w-72 h-72 md:w-80 md:h-80 transform -rotate-90">
          {/* Background Ring */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            className="text-neutral-900"
          />
          {/* Animated Progress Ring */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className={`transition-all duration-1000 ease-linear ${
              isWork
                ? 'text-white'
                : isShortBreak
                  ? 'text-emerald-400'
                  : 'text-blue-400'
            }`}
          />
        </svg>

        {/* Center Countdown Display */}
        <div className="absolute flex flex-col items-center justify-center text-center select-none">
          <span className="text-[11px] font-mono tracking-widest uppercase text-white/40 mb-1">
            {isWork ? 'DEEP FOCUS' : 'REST & RESTORE'}
          </span>
          <span className="text-6xl md:text-7xl font-light tracking-tighter text-white font-mono drop-shadow-md">
            {formattedTime}
          </span>
          <span className="text-[11px] font-mono text-white/30 mt-2">
            {Math.round(progressPercent)}% ELAPSED
          </span>
        </div>
      </div>

      {/* Presets Selector (25/5, 50/10, Quick) */}
      <div className="flex items-center space-x-2 mt-6">
        {Object.keys(PRESETS).map((key) => {
          const preset = PRESETS[key];
          const isSelected = selectedPreset === key;
          return (
            <button
              key={key}
              onClick={() => changePreset(key)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                isSelected
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
              }`}
            >
              {preset.name}
            </button>
          );
        })}
      </div>

      {/* Main Controls: Play/Pause, Skip, Reset, Sound */}
      <div className="flex items-center space-x-4 mt-8">
        <button
          onClick={resetTimer}
          title="Reset Session"
          className="p-3 rounded-full bg-neutral-900 border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-all duration-200 active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={toggleActive}
          className={`flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 active:scale-95 shadow-xl ${
            isActive
              ? 'bg-white text-black hover:bg-neutral-200 shadow-white/15'
              : 'bg-white text-black hover:bg-neutral-200 shadow-white/20 ring-4 ring-white/10'
          }`}
        >
          {isActive ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-1" />
          )}
        </button>

        <button
          onClick={skipCurrent}
          title="Skip Interval"
          className="p-3 rounded-full bg-neutral-900 border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-all duration-200 active:scale-95"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Sound Chime Toggle */}
        <button
          onClick={() => setSoundEnabled(prev => !prev)}
          title={soundEnabled ? 'Chime Active' : 'Chime Muted'}
          className={`p-3 rounded-full border transition-all duration-200 active:scale-95 ${
            soundEnabled
              ? 'bg-neutral-900 border-white/10 text-white/70 hover:text-white'
              : 'bg-neutral-900/50 border-white/5 text-white/20 hover:text-white/40'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
