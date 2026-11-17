import React, { useState } from 'react';
import { Camera, ShieldCheck, Eye, Sparkles, Lock } from 'lucide-react';

export default function CameraPermissionModal({ onGrant, hasPermission }) {
  const [loading, setLoading] = useState(false);

  if (hasPermission) return null;

  const handleEnableCamera = async () => {
    setLoading(true);
    await onGrant();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl bg-neutral-950 border border-white/15 p-6 shadow-2xl shadow-black text-center space-y-5">
        {/* Visual Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Camera className="w-8 h-8" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-white">Enable Vision Telemetry</h2>
          <p className="text-xs text-white/60 leading-relaxed max-w-sm mx-auto">
            FocusMind observes engagement, blink rate, and fatigue to protect your focus flow. Once enabled, the camera tucks into your <span className="text-white font-medium">Dynamic Island</span>.
          </p>
        </div>

        {/* Privacy Bullet Points */}
        <div className="space-y-2 text-left bg-neutral-900/60 p-3.5 rounded-2xl border border-white/5 text-xs text-white/70">
          <div className="flex items-center space-x-2.5">
            <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span><strong>100% On-Device:</strong> No video or audio is ever recorded or uploaded.</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <Eye className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span><strong>Distraction-Free:</strong> Heavy reports run quietly in the background.</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleEnableCamera}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-white text-black font-semibold text-xs tracking-wide hover:bg-neutral-200 transition-all active:scale-[0.98] shadow-lg shadow-white/10 disabled:opacity-50"
        >
          {loading ? 'Initializing Sensor...' : 'Enable Camera & Launch Dynamic Island'}
        </button>

        <button
          onClick={() => onGrant()}
          className="text-[11px] text-white/40 hover:text-white/70 transition-colors font-mono"
        >
          Continue with Synthetic Telemetry
        </button>
      </div>
    </div>
  );
}
