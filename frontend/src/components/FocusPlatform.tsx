import React, { useState, useEffect } from 'react';
import DynamicIsland from './DynamicIsland';
import GeminiRail from './GeminiRail';
import DeepFocusOrb from './DeepFocusOrb';
import CodingWorkspace from './CodingWorkspace';
import CameraPermissionModal from './CameraPermissionModal';
import { useEmotionEngine } from '../hooks/useEmotionEngine';
import { usePomodoroMachine } from '../hooks/usePomodoroMachine';

export default function FocusPlatform() {
  const [dominantEmotion, setDominantEmotion] = useState<'FOCUSED' | 'HAPPY' | 'EXCITED' | 'ANXIOUS' | 'SAD'>('FOCUSED');
  const [showCameraModal, setShowCameraModal] = useState(false);

  // Background pomodoro rhythm & gamification
  const pomodoro = usePomodoroMachine();
  const emotion = useEmotionEngine();

  // Sync detected emotion when it changes
  useEffect(() => {
    if (emotion.dominantEmotion) {
      setDominantEmotion(emotion.dominantEmotion as any);
    }
  }, [emotion.dominantEmotion]);

  return (
    <div className="relative w-screen h-screen bg-[#000000] text-white flex flex-col overflow-hidden font-sans select-none">
      {/* Dynamic Island Header Component (Top Centered) */}
      <DynamicIsland
        dominantEmotion={dominantEmotion}
        exactTimeFormatted={pomodoro.formattedTime}
        isCameraActive={emotion.isStreaming}
        onToggleCameraModal={() => setShowCameraModal(true)}
        onSelectEmotion={(emo) => {
          setDominantEmotion(emo);
          emotion.setManualEmotion(emo);
        }}
      />

      {/* Main 3-Column Multi-Panel Layout */}
      <div className="flex-1 flex w-full h-full pt-16 overflow-hidden">
        {/* 1. Left: Collapsible Gemini-Style Rail (Final Analysis + Score Board) */}
        <GeminiRail
          streakDays={pomodoro.streakDays}
          points={pomodoro.points}
          streakMultiplier={pomodoro.streakMultiplier}
        />

        {/* 2. Center: Ambient "Deep Focus" Space (Zero countdown timers) */}
        <main className="flex-1 flex flex-col items-center justify-center relative p-6 overflow-hidden bg-gradient-to-b from-black via-[#040407] to-black">
          <DeepFocusOrb
            emotion={dominantEmotion}
            progressPercent={pomodoro.progressPercent}
          />
        </main>

        {/* 3. Right: LeetCode-Style Split Pane with Coding & AI Tutor */}
        <aside className="w-[450px] lg:w-[500px] h-full border-l border-white/10 bg-[#070709]/80 backdrop-blur-xl flex flex-col overflow-hidden">
          <CodingWorkspace dominantEmotion={dominantEmotion} />
        </aside>
      </div>

      {/* Camera Preview Modal (Triggered on-demand via the green dot inside the Dynamic Island) */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-neutral-950 border border-white/15 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold text-white/90">Vision Telemetry Monitor</span>
              <button 
                onClick={() => setShowCameraModal(false)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="relative w-full h-52 bg-black rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
              <video
                ref={emotion.videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[10px] font-mono text-emerald-400">
                On-Device Extraction Active
              </div>
            </div>

            <p className="text-xs text-white/60 leading-relaxed font-sans">
              All facial landmarks (EAR, MAR, Head Pose) are computed directly on your device. Video frames never leave your computer.
            </p>
          </div>
        </div>
      )}

      {/* First-visit onboarding permission modal */}
      <CameraPermissionModal
        hasPermission={emotion.hasPermission}
        onGrant={emotion.requestPermission}
      />
    </div>
  );
}
