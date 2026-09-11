import React, { useState } from 'react';
import { usePomodoroMachine } from './hooks/usePomodoroMachine';
import { useEmotionEngine } from './hooks/useEmotionEngine';
import DynamicIsland from './components/DynamicIsland';
import TopNav from './components/TopNav';
import PomodoroTimer from './components/PomodoroTimer';
import StreakHUD from './components/StreakHUD';
import ClassroomPortal from './components/ClassroomPortal';
import CameraPermissionModal from './components/CameraPermissionModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('Pomodoro');

  // Pomodoro state machine with ambient streak engine
  const pomodoro = usePomodoroMachine();

  // Background vision telemetry & emotion engine
  const emotion = useEmotionEngine();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-between font-sans selection:bg-white/20 selection:text-white relative overflow-hidden">
      {/* Background Ambient Glow (Subtle & OLED Friendly) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-950/20 rounded-full blur-[120px] pointer-events-none" />

      {/* 1. iPhone "Dynamic Island" Header Component */}
      <DynamicIsland
        formattedTime={pomodoro.formattedTime}
        isActive={pomodoro.isActive}
        pomodoroState={pomodoro.state}
        dominantEmotion={emotion.dominantEmotion}
        confidence={emotion.confidence}
        distractionIndex={emotion.distractionIndex}
        gazeStability={emotion.gazeStability}
        setManualEmotion={emotion.setManualEmotion}
        videoRef={emotion.videoRef}
        isStreaming={emotion.isStreaming}
      />

      {/* 2. Top Bar Navigation (Timer, Clock, Pomodoro, Stopwatch, Focus, Mini) */}
      <div className="w-full max-w-4xl px-4 flex flex-col items-center">
        <TopNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* 3. Main Interface Viewport (Distraction-Free) */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 relative z-10">
        {(activeTab === 'Pomodoro' || activeTab === 'Timer' || activeTab === 'Focus') && (
          <PomodoroTimer
            state={pomodoro.state}
            formattedTime={pomodoro.formattedTime}
            progressPercent={pomodoro.progressPercent}
            isActive={pomodoro.isActive}
            toggleActive={pomodoro.toggleActive}
            resetTimer={pomodoro.resetTimer}
            skipCurrent={pomodoro.skipCurrent}
            transitionTo={pomodoro.transitionTo}
            selectedPreset={pomodoro.selectedPreset}
            changePreset={pomodoro.changePreset}
            soundEnabled={pomodoro.soundEnabled}
            setSoundEnabled={pomodoro.setSoundEnabled}
            dominantEmotion={emotion.dominantEmotion}
          />
        )}

        {activeTab === 'Clock' && (
          <div className="flex flex-col items-center justify-center space-y-3 py-12">
            <span className="text-xs font-mono text-white/40 tracking-widest uppercase">Local Focus Clock</span>
            <div className="text-7xl md:text-8xl font-light font-mono tracking-tighter text-white">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <span className="text-xs font-mono text-white/30">Synced with system time</span>
          </div>
        )}

        {activeTab === 'Stopwatch' && (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <span className="text-xs font-mono text-white/40 tracking-widest uppercase">Continuous Flow Tracker</span>
            <div className="text-7xl font-light font-mono tracking-tighter text-white">
              00:00:00
            </div>
            <button className="px-6 py-2 rounded-full bg-white text-black font-mono text-xs font-bold hover:bg-neutral-200 transition-all">
              Start Flow
            </button>
          </div>
        )}

        {activeTab === 'Mini' && (
          <div className="flex flex-col items-center justify-center space-y-3 py-16">
            <span className="text-5xl font-mono font-light">{pomodoro.formattedTime}</span>
            <span className="text-xs font-mono text-white/40">Mini HUD Active</span>
          </div>
        )}
      </main>

      {/* 4. Ambient Streak System (Non-intrusive bottom right) */}
      <StreakHUD
        points={pomodoro.points}
        streakDays={pomodoro.streakDays}
        streakMultiplier={pomodoro.streakMultiplier}
        latestBadge={pomodoro.latestBadge}
      />

      {/* 5. Classroom & Collaborative Mode (Bottom left) */}
      <ClassroomPortal
        dominantEmotion={emotion.dominantEmotion}
        pomodoroState={pomodoro.state}
        isActive={pomodoro.isActive}
      />

      {/* 6. First-Visit Camera Permission Modal */}
      <CameraPermissionModal
        hasPermission={emotion.hasPermission}
        onGrant={emotion.requestPermission}
      />

      {/* Minimal Footer Signature */}
      <footer className="w-full py-4 text-center text-[11px] font-mono text-white/20 select-none">
        FocusMind OLED • Emotion-Aware Ambient Focus
      </footer>
    </div>
  );
}
