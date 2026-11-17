import React, { useState, useEffect } from 'react';
import { Camera, ShieldCheck, Eye, Flame, Trophy, Activity, AlertCircle, X, Maximize2, CheckCircle2, VideoOff, User, Upload, ScanFace } from 'lucide-react';
import RobotAvatar, { DetectedState } from './RobotAvatar';

interface DynamicIslandProps {
  detectedState: DetectedState;
  exactTimeFormatted?: string;
  cameraStatus: 'streaming' | 'pending' | 'denied' | 'unavailable';
  earValue?: number;
  gazeStability?: number;
  presenceConfidence?: number;
  headPoseStatus?: string;
  streakDays: number;
  points: number;
  streakMultiplier?: number;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onRetryCamera?: () => void;
}

export default function DynamicIsland({
  detectedState = 'FOCUSED',
  exactTimeFormatted = '24:48',
  cameraStatus = 'streaming',
  earValue = 0.28,
  gazeStability = 98,
  presenceConfidence = 96,
  headPoseStatus = 'Upright (0°)',
  streakDays = 5,
  points = 450,
  streakMultiplier = 1.0,
  videoRef,
  onRetryCamera
}: DynamicIslandProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTimeTooltip, setShowTimeTooltip] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('fm_profile_name') || 'You');
  const [userPhoto, setUserPhoto] = useState(() => localStorage.getItem('fm_profile_photo') || '');
  const [targetPersonOnly, setTargetPersonOnly] = useState(() => localStorage.getItem('fm_target_person_only') === 'true');
  const [tempPhoto, setTempPhoto] = useState(userPhoto);

  // Styling based strictly on real-time detected state
  const stateStyles = {
    FOCUSED: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    ENGAGED: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    HAPPY: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    EXCITED: 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/10',
    PRESENT: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
    AWAY: 'text-zinc-400 border-zinc-500/30 bg-zinc-500/10',
    DROWSY: 'text-amber-400 border-amber-500/30 bg-amber-500/10 animate-pulse',
    ANXIOUS: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    SAD: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    SLEEPING: 'text-red-400 border-red-500/50 bg-red-500/20 animate-pulse ring-2 ring-red-500/30'
  }[detectedState] || 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';

  return (
    <>
      {/* =================================================================== */}
      {/* 1. Collapsed Dynamic Island (Top Centered)                          */}
      {/* =================================================================== */}
      <header className="fixed top-3 left-1/2 -translate-x-1/2 z-50 select-none">
        <div
          onClick={() => setIsExpanded(true)}
          onMouseEnter={() => setShowTimeTooltip(true)}
          onMouseLeave={() => setShowTimeTooltip(false)}
          className="h-14 md:h-16 px-4 md:px-5 rounded-full bg-[#0a0a0a] border border-white/10 shadow-2xl backdrop-blur-xl flex items-center space-x-3.5 transition-all duration-300 hover:border-white/20 hover:scale-[1.02] cursor-pointer"
          style={{
            boxShadow: detectedState === 'SLEEPING' || detectedState === 'DROWSY'
              ? '0 0 35px rgba(239,68,68,0.35), 0 10px 30px rgba(0,0,0,0.9)'
              : '0 10px 30px rgba(0,0,0,0.9), 0 0 15px rgba(255,255,255,0.02)'
          }}
          title="Click to expand Live Telemetry & Streak HUD"
        >
          {/* Animated Robot Avatar matching real-time detected state */}
          <div className="flex items-center">
            <RobotAvatar emotion={detectedState} size={42} />
          </div>

          <div className="w-px h-6 bg-white/10" />

          {/* Real-time Camera Detected State Badge (NO MANUAL SELECTORS) */}
          <div className="flex items-center space-x-1.5">
            <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold tracking-wider border ${stateStyles}`}>
              [{detectedState}]
            </span>
          </div>

          {/* Camera Permission Status Indicator Dot */}
          <div className="flex items-center">
            {cameraStatus === 'streaming' && (
              <span className="relative flex h-2 w-2" title="Webcam Active • Live Feature Extraction">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
            {cameraStatus === 'pending' && (
              <span className="relative flex h-2 w-2" title="Initializing Camera...">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
            {(cameraStatus === 'denied' || cameraStatus === 'unavailable') && (
              <span className="flex items-center text-red-400 text-[10px] font-mono" title="Camera Access Denied or Unavailable">
                <VideoOff className="w-3 h-3 text-red-400 mr-1" />
                <span className="hidden sm:inline">Offline</span>
              </span>
            )}
          </div>

          <div className="w-px h-6 bg-white/10" />

          {/* Visible Persistent Streak Counter inside the Island */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            <div className="flex items-center space-x-1 text-amber-400">
              <Flame className="w-3.5 h-3.5 fill-amber-400/20" />
              <span className="font-bold">{streakDays}d</span>
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-center space-x-1 text-white/80">
              <Trophy className="w-3 h-3 text-indigo-400" />
              <span>{points} pts</span>
            </div>
          </div>

          {/* Hidden Time Metric Revealed on Hover */}
          {showTimeTooltip && (
            <div className="hidden md:flex items-center space-x-1 pl-1 text-[11px] font-mono text-cyan-300 animate-fadeIn">
              <span>({exactTimeFormatted})</span>
            </div>
          )}

          <div className="w-px h-6 bg-white/10" />

          {/* User Profile Avatar & Face Lock Indicator */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTempPhoto(userPhoto);
              setIsProfileModalOpen(true);
            }}
            className="relative group flex items-center justify-center focus:outline-none"
            title="User Profile & Face Lock Tracking"
          >
            {userPhoto ? (
              <img src={userPhoto} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-cyan-400 shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500/30 to-indigo-500/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs font-mono font-bold shadow-sm group-hover:border-cyan-400 transition-all">
                <User className="w-4 h-4 text-cyan-300" />
              </div>
            )}
            {targetPersonOnly && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-black" title="Target Person Lock Active" />
            )}
          </button>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. Interactive Expanded Modal (Triggered on Click)                  */}
      {/* =================================================================== */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn select-none"
          onClick={() => setIsExpanded(false)}
        >
          <div 
            className="w-full max-w-xl rounded-3xl bg-neutral-950 border border-white/15 p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2.5">
                <RobotAvatar emotion={detectedState} size={32} />
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Vision Telemetry & Streak HUD</h3>
                  <p className="text-[11px] text-white/40 font-mono">Real-Time Client-Side Biometrics</p>
                </div>
              </div>
              <button 
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Camera Feed Preview */}
            <div className="relative w-full h-56 bg-black rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
              {cameraStatus === 'streaming' ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 text-white/40">
                  <VideoOff className="w-8 h-8 text-white/20" />
                  <span className="text-xs font-mono">Camera Blocked or Unavailable</span>
                  {onRetryCamera && (
                    <button
                      onClick={onRetryCamera}
                      className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-all"
                    >
                      Retry Permission
                    </button>
                  )}
                </div>
              )}

              {/* Status Badge Over Video */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur border border-white/10 flex items-center space-x-2 text-[11px] font-mono">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-white/90">State: <strong className="text-emerald-400">[{detectedState}]</strong></span>
              </div>

              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur border border-white/10 text-[10px] font-mono text-emerald-400 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Server Upload • On-Device Only</span>
              </div>
            </div>

            {/* Real-time Tracking Data Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5 space-y-0.5">
                <div className="text-[10px] text-white/40">Presence</div>
                <div className="text-white font-bold">{presenceConfidence}% Confident</div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5 space-y-0.5">
                <div className="text-[10px] text-white/40">Eye Aspect (EAR)</div>
                <div className="text-white font-bold">{earValue.toFixed(2)} {earValue < 0.18 ? '⚠️ Drowsy' : '✓ Normal'}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5 space-y-0.5">
                <div className="text-[10px] text-white/40">Gaze Stability</div>
                <div className="text-white font-bold">{gazeStability}% Flow</div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5 space-y-0.5">
                <div className="text-[10px] text-white/40">Head Posture</div>
                <div className="text-white font-bold">{headPoseStatus}</div>
              </div>
            </div>

            {/* Streak Gamification Breakdown */}
            <div className="p-3.5 rounded-2xl bg-neutral-900/40 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/50">Continuous Streak Tracker:</span>
                <span className="text-amber-400 font-bold flex items-center space-x-1">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>{streakDays} Days Consecutive</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/50">Total Accumulated Points:</span>
                <span className="text-indigo-400 font-bold">{points} Pts ({streakMultiplier.toFixed(1)}x Multiplier)</span>
              </div>
              <div className="text-[11px] font-mono text-emerald-400/80 pt-1 border-t border-white/5 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>+10 pts continuously awarded for every 30s maintained focus.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. User Profile & Biometric Face Lock Modal                         */}
      {/* =================================================================== */}
      {isProfileModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn select-none"
          onClick={() => setIsProfileModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-neutral-950 border border-white/15 p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Student Profile & Biometric Lock</h3>
                  <p className="text-[11px] text-white/40 font-mono">Personalized Attention & Target Face Lock</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Upload & Preview */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative group">
                {tempPhoto ? (
                  <img src={tempPhoto} alt="Profile Preview" className="w-24 h-24 rounded-full object-cover border-2 border-cyan-400 shadow-xl" />
                ) : (
                  <div
                    onClick={() => document.getElementById('react-file-upload-input')?.click()}
                    className="w-24 h-24 rounded-full bg-neutral-900 border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/40 hover:border-cyan-400/60 transition-all cursor-pointer shadow-inner"
                  >
                    <Camera className="w-6 h-6 mb-1 text-white/30" />
                    <span className="text-[10px] font-mono">Upload Photo</span>
                  </div>
                )}
                <input
                  id="react-file-upload-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onload = () => setTempPhoto(r.result as string);
                      r.readAsDataURL(f);
                    }
                  }}
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => document.getElementById('react-file-upload-input')?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-white font-mono flex items-center space-x-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Image</span>
                </button>
                {tempPhoto && (
                  <button
                    onClick={() => setTempPhoto('')}
                    className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs text-red-400 font-mono transition-all"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Student Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-white/60">Learner Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter student name..."
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 font-sans focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Target Person Only Lock Toggle */}
            <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ScanFace className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white">Target Person Only Lock</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetPersonOnly}
                    onChange={(e) => setTargetPersonOnly(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed">
                When toggled ON, the AI tracking engine filters out passersby or background persons, tracking only the calibrated profile face geometry. If another face enters the frame, focus tracking ignores them.
              </p>
              {targetPersonOnly && (
                <div className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  ● Calibrated Biometric Lock Active
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={() => {
                setUserPhoto(tempPhoto);
                localStorage.setItem('fm_profile_name', userName);
                localStorage.setItem('fm_profile_photo', tempPhoto);
                localStorage.setItem('fm_target_person_only', targetPersonOnly.toString());
                setIsProfileModalOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all shadow-md"
            >
              Save Profile & Apply Biometrics
            </button>
          </div>
        </div>
      )}
    </>
  );
}
