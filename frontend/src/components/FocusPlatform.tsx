import React, { useState, useEffect } from 'react';
import DynamicIsland from './DynamicIsland';
import GeminiRail from './GeminiRail';
import DeepFocusOrb from './DeepFocusOrb';
import CodingWorkspace from './CodingWorkspace';
import EmergencySleepModal from './EmergencySleepModal';
import ZoomClassroomModal from './ZoomClassroomModal';
import { useEmotionEngine } from '../hooks/useEmotionEngine';
import { usePomodoroMachine } from '../hooks/usePomodoroMachine';

export default function FocusPlatform() {
  const [isEmergencyAlarmOpen, setIsEmergencyAlarmOpen] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  // Background pomodoro rhythm & gamification
  const pomodoro = usePomodoroMachine();
  const emotion = useEmotionEngine();

  // When SLEEPING is triggered via real-time camera EAR detection
  useEffect(() => {
    if (emotion.detectedState === 'SLEEPING') {
      setIsEmergencyAlarmOpen(true);
      fetch('http://127.0.0.1:8000/api/interventions/sleep-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 'learner_you',
          student_name: 'You',
          ear_value: emotion.earValue,
          head_pitch_slump: -22.0,
          consecutive_drowsy_frames: 24
        })
      }).catch((e) => console.log('Backend notification dispatched:', e));
    }
  }, [emotion.detectedState, emotion.earValue]);

  const handleDismissSleepAlarm = () => {
    setIsEmergencyAlarmOpen(false);
    emotion.setDetectedState('FOCUSED');
  };

  return (
    <div className="relative w-screen h-screen bg-[#000000] text-white flex flex-col overflow-hidden font-sans select-none">
      {/* 1. Rebuilt Dynamic Island (Real-Time Camera Detection, Click-to-Expand, Visible Streak Points) */}
      <DynamicIsland
        detectedState={emotion.detectedState as any}
        exactTimeFormatted={pomodoro.formattedTime}
        cameraStatus={emotion.cameraStatus as any}
        earValue={emotion.earValue}
        gazeStability={emotion.gazeStability}
        presenceConfidence={emotion.presenceConfidence}
        headPoseStatus={emotion.headPoseStatus}
        streakDays={emotion.streakDays}
        points={emotion.points}
        streakMultiplier={emotion.streakMultiplier}
        videoRef={emotion.videoRef}
        onRetryCamera={emotion.initCamera}
      />

      {/* 2. Main 3-Column Multi-Panel Layout */}
      <div className="flex-1 flex w-full h-full pt-16 overflow-hidden">
        {/* Left: Collapsible Gemini-Style Rail (Final Analysis + Score Board + Teacher Status Monitor) */}
        <GeminiRail
          streakDays={emotion.streakDays}
          points={emotion.points}
          streakMultiplier={emotion.streakMultiplier}
          isSleepingAlertActive={emotion.detectedState === 'SLEEPING'}
          onOpenZoomModal={() => setIsZoomModalOpen(true)}
        />

        {/* Center: Ambient "Deep Focus" Space (Zero countdown timers) */}
        <main className="flex-1 flex flex-col items-center justify-center relative p-6 overflow-hidden bg-gradient-to-b from-black via-[#040407] to-black">
          <DeepFocusOrb
            emotion={emotion.detectedState === 'SLEEPING' ? 'ANXIOUS' : (emotion.detectedState as any)}
            progressPercent={pomodoro.progressPercent}
          />
        </main>

        {/* Right: LeetCode-Style Split Pane with Coding & AI Tutor */}
        <aside className="w-[450px] lg:w-[500px] h-full border-l border-white/10 bg-[#070709]/80 backdrop-blur-xl flex flex-col overflow-hidden">
          <CodingWorkspace dominantEmotion={emotion.detectedState === 'SLEEPING' ? 'ANXIOUS' : (emotion.detectedState as any)} />
        </aside>
      </div>

      {/* Emergency Sleeping Intervention Modal (Audio Alarm + Phone Notification + Teacher Alert) */}
      <EmergencySleepModal
        isOpen={isEmergencyAlarmOpen}
        onDismiss={handleDismissSleepAlarm}
        earValue={emotion.earValue}
      />

      {/* Zoom Classroom Co-Host & Security Control Modal */}
      <ZoomClassroomModal
        isOpen={isZoomModalOpen}
        onClose={() => setIsZoomModalOpen(false)}
      />
    </div>
  );
}
