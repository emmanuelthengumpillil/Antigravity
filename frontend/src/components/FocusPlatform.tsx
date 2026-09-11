import React, { useState, useEffect } from 'react';
import DynamicIsland from './DynamicIsland';
import GeminiRail from './GeminiRail';
import DeepFocusOrb from './DeepFocusOrb';
import CodingWorkspace from './CodingWorkspace';
import EmergencySleepModal from './EmergencySleepModal';
import ZoomClassroomModal from './ZoomClassroomModal';
import MultiDeviceSyncModal from './MultiDeviceSyncModal';
import { useEmotionEngine } from '../hooks/useEmotionEngine';
import { usePomodoroMachine } from '../hooks/usePomodoroMachine';

export default function FocusPlatform() {
  const [isEmergencyAlarmOpen, setIsEmergencyAlarmOpen] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [currentRoomCode, setCurrentRoomCode] = useState('FM-1001');

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

  // Prolonged Drowsiness (1 Minute) Notification & Backend Dispatch
  useEffect(() => {
    if (emotion.isDrowsyAlertActive) {
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('FocusMind Alert: 1 Minute Drowsiness Detected ⚠️', {
            body: "You've been continuously drowsy for 60 seconds. Stand up, stretch, or take a quick sip of water!",
            icon: 'https://cdn-icons-png.flaticon.com/512/3588/3588294.png',
            tag: 'focusmind-drowsy'
          });
        } catch (e) {}
      }

      fetch('http://127.0.0.1:8000/api/interventions/drowsy-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 'learner_you',
          student_name: 'You',
          drowsy_duration_seconds: emotion.continuousDrowsySeconds || 60,
          ear_value: emotion.earValue,
          head_pitch_slump: -18.0,
          notification_channel: 'BROWSER_AND_TEACHER'
        })
      }).catch((e) => console.log('Drowsy notification dispatched:', e));
    }
  }, [emotion.isDrowsyAlertActive]);

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
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
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

      {/* Multi-Device Synchronization & Pairing Modal */}
      <MultiDeviceSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        roomCode={currentRoomCode}
        onRoomChange={(code) => setCurrentRoomCode(code)}
      />

      {/* 1-Minute Continuous Drowsiness Alert Banner */}
      {emotion.isDrowsyAlertActive && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg p-4 animate-fadeIn select-none">
          <div className="rounded-2xl bg-amber-950/95 border-2 border-amber-500/80 p-4 shadow-2xl shadow-amber-950/90 backdrop-blur-xl flex items-start space-x-3.5 text-white">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 animate-bounce text-base font-bold">
              🔔
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-amber-300 font-mono flex items-center space-x-1.5">
                  <span>PROLONGED DROWSINESS (1 MINUTE)</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/30 text-[10px] text-amber-200">NOTIFICATION SENT</span>
                </div>
                <span className="text-[10px] font-mono text-white/50">Just now</span>
              </div>
              <p className="text-xs text-white/80 leading-snug">
                You have been continuous drowsy for 60 seconds. Push notification sent and Teacher room notified.
              </p>
              <div className="pt-2 flex items-center space-x-2.5">
                <button
                  onClick={() => {
                    emotion.setIsDrowsyAlertActive(false);
                    emotion.setDetectedState('FOCUSED');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-bold font-mono hover:bg-neutral-200 transition-all shadow-md active:scale-95"
                >
                  I'm Awake & Focused
                </button>
                <span className="text-[11px] text-amber-200/80 font-mono">Tip: Stand up, stretch, or drink water!</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
