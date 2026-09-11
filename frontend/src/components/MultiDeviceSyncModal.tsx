import React, { useState, useEffect } from 'react';
import { Smartphone, Laptop, Tablet, QrCode, Copy, Check, X, Users, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';

interface RoomDevice {
  device_id: string;
  device_name: string;
  device_type: string;
  joined_at: number;
  is_host: boolean;
}

interface MultiDeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode?: string;
  activeMode?: 'TEACHER' | 'STUDENT';
  onRoomChange?: (newCode: string) => void;
}

export default function MultiDeviceSyncModal({
  isOpen,
  onClose,
  roomCode = 'FM-1001',
  activeMode = 'TEACHER',
  onRoomChange
}: MultiDeviceSyncModalProps) {
  const [copied, setCopied] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [devices, setDevices] = useState<RoomDevice[]>([
    { device_id: 'dev_primary', device_name: 'Primary Workstation', device_type: 'Desktop', joined_at: Date.now(), is_host: true },
    { device_id: 'dev_ipad', device_name: 'iPad Pro (Drawing/Annotating)', device_type: 'Tablet', joined_at: Date.now() - 120000, is_host: false }
  ]);
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch live room state and QR SVG
  useEffect(() => {
    if (!isOpen) return;

    fetch(`http://127.0.0.1:8000/api/rooms/${roomCode}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          if (data.qr_code_svg) setQrSvg(data.qr_code_svg);
          if (data.connected_devices) setDevices(data.connected_devices);
        }
      })
      .catch(e => console.log('Offline fallback for room sync:', e));
  }, [isOpen, roomCode]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    showToast('Room code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinOtherRoom = async () => {
    if (!joinCodeInput.trim()) return;
    const cleanCode = joinCodeInput.trim().toUpperCase();

    try {
      const res = await fetch('http://127.0.0.1:8000/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_code: cleanCode,
          device_name: 'Secondary Device',
          device_type: 'Tablet'
        })
      });

      if (res.ok) {
        showToast(`Successfully joined room ${cleanCode}`);
        if (onRoomChange) onRoomChange(cleanCode);
        setJoinCodeInput('');
        return;
      }
    } catch (e) {
      console.log('Join room error:', e);
    }

    // Fallback switch
    if (onRoomChange) onRoomChange(cleanCode);
    showToast(`Switched room to ${cleanCode}`);
    setJoinCodeInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 select-none animate-fadeIn">
      <div className="w-full max-w-xl rounded-3xl bg-neutral-950 border border-white/15 p-6 md:p-8 shadow-2xl shadow-black space-y-6 text-white max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">Cross-Device Synchronization</h2>
              <p className="text-xs text-white/50 font-mono">Real-time room pairing & state sharing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {notification && (
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono animate-fadeIn flex items-center space-x-2">
            <Check className="w-4 h-4 text-cyan-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Pairing Code & QR Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-4 rounded-2xl bg-neutral-900/60 border border-white/10">
          {/* QR Display */}
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/50 border border-white/5 space-y-2">
            {qrSvg ? (
              <div 
                dangerouslySetInnerHTML={{ __html: qrSvg }}
                className="w-36 h-36 flex items-center justify-center rounded-xl overflow-hidden shadow-inner"
              />
            ) : (
              <div className="w-36 h-36 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-white/30 space-y-1">
                <QrCode className="w-8 h-8" />
                <span className="text-[10px] font-mono">Scan on mobile/tablet</span>
              </div>
            )}
            <span className="text-[10px] font-mono text-white/40">Point secondary camera to pair</span>
          </div>

          {/* Secure Room Code */}
          <div className="space-y-3 text-left">
            <div>
              <div className="text-xs font-mono text-white/50 uppercase tracking-wider">Active Room Code</div>
              <div className="text-2xl font-black font-mono tracking-widest text-cyan-400 pt-1">
                {roomCode}
              </div>
            </div>

            <button
              onClick={handleCopyCode}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-mono text-white font-semibold flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Room Code'}</span>
            </button>

            <div className="text-[11px] text-white/60 leading-snug">
              Open FocusMind on your tablet, phone, or secondary display and enter this code to sync code, notes, and chat in real time.
            </div>
          </div>
        </div>

        {/* Join Other Room Box */}
        <div className="p-3.5 rounded-2xl bg-neutral-900/40 border border-white/10 space-y-2">
          <div className="text-xs font-mono text-white/60 font-semibold">Join an Existing Room Session:</div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="e.g. FM-9482"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinOtherRoom()}
              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              onClick={handleJoinOtherRoom}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium flex items-center space-x-1.5 transition-all active:scale-95"
            >
              <span>Connect</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Connected Devices Roster */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-white/40">
            <span>Connected Devices in Room ({devices.length})</span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Sync Active</span>
            </span>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {devices.map((dev) => (
              <div key={dev.device_id} className="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-cyan-400">
                    {dev.device_type.toLowerCase().includes('tablet') || dev.device_type.toLowerCase().includes('ipad') ? (
                      <Tablet className="w-3.5 h-3.5" />
                    ) : dev.device_type.toLowerCase().includes('mobile') || dev.device_type.toLowerCase().includes('phone') ? (
                      <Smartphone className="w-3.5 h-3.5" />
                    ) : (
                      <Laptop className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center space-x-1.5">
                      <span>{dev.device_name}</span>
                      {dev.is_host && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Host</span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/40">{dev.device_type} • Connected</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">Synced ✓</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs font-mono text-white/40">
          <span>Active Dual Mode: {activeMode === 'TEACHER' ? '🎓 Teacher' : '🧠 Feynman'}</span>
          <button onClick={onClose} className="px-4 py-1.5 rounded-xl bg-white text-black font-bold hover:bg-neutral-200 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
