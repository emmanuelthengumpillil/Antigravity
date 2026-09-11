import React, { useEffect, useRef } from 'react';
import { BellRing, Smartphone, AlertTriangle, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface EmergencySleepModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  earValue?: number;
}

export default function EmergencySleepModal({ isOpen, onDismiss, earValue = 0.14 }: EmergencySleepModalProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<any>(null);

  // Play loud pulsing emergency wake-up alarm sound
  useEffect(() => {
    if (!isOpen) {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }

      const triggerAlarmBurst = () => {
        if (!audioCtxRef.current) return;
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;
        // High frequency dual tone buzzer (1760Hz and 880Hz square wave)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.setValueAtTime(1760, now + 0.15);

        osc2.type = 'square';
        osc2.frequency.setValueAtTime(1200, now);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);
      };

      // Sound immediately
      triggerAlarmBurst();
      // Repeat rapid alarm every 500ms
      alarmIntervalRef.current = setInterval(triggerAlarmBurst, 500);
    } catch (e) {
      console.warn('Audio alarm could not play:', e);
    }

    return () => {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 select-none animate-fadeIn">
      {/* Red Alert Ring Backdrop */}
      <div className="absolute inset-0 bg-red-950/25 animate-pulse pointer-events-none" />

      <div className="relative w-full max-w-lg rounded-3xl bg-neutral-950 border-2 border-red-500/60 p-6 md:p-8 shadow-2xl shadow-red-950/80 space-y-6 text-center">
        
        {/* Pulsing Alarm Siren Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400 animate-bounce shadow-lg shadow-red-500/40">
          <BellRing className="w-10 h-10 animate-spin" style={{ animationDuration: '3s' }} />
        </div>

        {/* Warning Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-mono font-bold tracking-widest uppercase">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Drowsiness / Sleep Detected</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            WAKE UP!
          </h2>
          <p className="text-xs md:text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
            EAR dropped to <span className="font-mono text-red-400 font-bold">{earValue.toFixed(2)}</span> (eyes closed for &gt; 3.0s). Don't let your 5-day streak slip away!
          </p>
        </div>

        {/* Realtime Phone Notification Simulation Card */}
        <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-3.5 text-left space-y-2 shadow-inner">
          <div className="flex items-center justify-between text-[11px] font-mono text-white/40 border-b border-white/5 pb-1.5">
            <div className="flex items-center space-x-1.5">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mobile Phone Push Notification Sent</span>
            </div>
            <span className="text-emerald-400">● Delivered Now</span>
          </div>

          <div className="flex items-start space-x-3 pt-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-white flex-shrink-0">
              <Flame className="w-4 h-4 fill-white" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center space-x-1">
                <span>FocusMind Companion</span>
                <span className="text-[10px] text-white/40 font-normal">Just now</span>
              </div>
              <p className="text-xs text-amber-300 font-medium">
                WAKE UP! Keep the focus streak alive! 🔥
              </p>
              <p className="text-[11px] text-white/50">
                Teacher room has been notified. Tap to confirm you are awake.
              </p>
            </div>
          </div>
        </div>

        {/* Teacher Portal Alert Confirmation */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-red-950/30 border border-red-500/20 text-xs font-mono text-red-300">
          <span className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Teacher Portal: Student Flagged</span>
          </span>
          <span className="text-red-400 font-bold">[Notification Sent]</span>
        </div>

        {/* Action Button to Silence Alarm */}
        <button
          onClick={onDismiss}
          className="w-full py-3.5 px-6 rounded-2xl bg-white text-black font-bold text-sm tracking-wide hover:bg-neutral-200 transition-all active:scale-[0.98] shadow-xl shadow-white/10"
        >
          I'm Awake! Silence Alarm & Resume Focus
        </button>
      </div>
    </div>
  );
}
