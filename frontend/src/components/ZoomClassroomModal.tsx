import React, { useState } from 'react';
import { Video, Shield, ShieldCheck, Users, Monitor, Tablet, Laptop, CheckCircle2, AlertCircle, X, Lock, Settings, UserPlus, Sliders } from 'lucide-react';

interface ZoomDevice {
  device_id: string;
  name: string;
  device_type: string;
  role: string;
  email?: string;
  is_in_waiting_room?: boolean;
}

interface ZoomClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ZoomClassroomModal({ isOpen, onClose }: ZoomClassroomModalProps) {
  const [activeTab, setActiveTab] = useState<'host' | 'security' | 'devices'>('host');

  // Step 1: Host & Alternative Host state
  const [coHostEnabled, setCoHostEnabled] = useState(true);
  const [altHostEnabled, setAltHostEnabled] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [altHosts, setAltHosts] = useState<string[]>([
    'teacher.lead@school.edu',
    'prof.math@school.edu'
  ]);

  // Step 2: In-Meeting Security & Control Rules
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(true);
  const [allowAltPollsBreakout, setAllowAltPollsBreakout] = useState(true);
  const [screenShareRule, setScreenShareRule] = useState<'Host and Co-hosts only' | 'All Participants'>('Host and Co-hosts only');

  // Step 3: Classroom External Devices
  const [devices, setDevices] = useState<ZoomDevice[]>([
    { device_id: 'dev_1', name: 'Teacher Laptop (Primary)', device_type: 'Primary Laptop', role: 'Host', email: 'teacher.lead@school.edu' },
    { device_id: 'dev_2', name: 'Classroom Smartboard 302', device_type: 'Classroom Display', role: 'Co-Host', email: 'prof.math@school.edu' },
    { device_id: 'dev_3', name: 'Teacher iPad Pro', device_type: 'Teacher Tablet', role: 'Co-Host', email: 'teacher.lead@school.edu' },
    { device_id: 'dev_4', name: 'Student Lab Device', device_type: 'Student Laptop', role: 'Participant', email: 'student@school.edu' }
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAddEmail = () => {
    if (!emailInput.trim() || !emailInput.includes('@')) return;
    if (!altHosts.includes(emailInput.trim())) {
      setAltHosts(prev => [...prev, emailInput.trim()]);
      showToast(`Added ${emailInput.trim()} to Alternative Hosts list`);
    }
    setEmailInput('');
  };

  const handleRemoveEmail = (email: string) => {
    setAltHosts(prev => prev.filter(e => e !== email));
  };

  const handlePromoteDevice = (deviceId: string, newRole: string) => {
    setDevices(prev => prev.map(d => {
      if (d.device_id === deviceId) {
        return { ...d, role: newRole };
      }
      return d;
    }));
    showToast(`Device promoted to ${newRole}`);
  };

  if (!isOpen) return null;

  const isSecurityShieldActive = waitingRoomEnabled && screenShareRule === 'Host and Co-hosts only';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 select-none animate-fadeIn">
      <div className="w-full max-w-2xl rounded-3xl bg-neutral-950 border border-white/15 p-6 md:p-8 shadow-2xl shadow-black space-y-6 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">Zoom Classroom & Co-Host Manager</h2>
              <p className="text-xs text-white/50 font-mono">Web Portal Configuration & Classroom Co-Hosts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 p-1 rounded-2xl bg-neutral-900 border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab('host')}
            className={`flex-1 py-2 rounded-xl transition-all font-semibold ${
              activeTab === 'host' ? 'bg-white text-black shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            1. Host & Alt Hosts
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2 rounded-xl transition-all font-semibold ${
              activeTab === 'security' ? 'bg-white text-black shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            2. Security & Controls
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex-1 py-2 rounded-xl transition-all font-semibold ${
              activeTab === 'devices' ? 'bg-white text-black shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            3. Classroom Co-Hosts ({devices.filter(d => d.role !== 'Participant').length})
          </button>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 1: Host & Alternative Host Settings (Zoom Web Portal)         */}
        {/* ================================================================= */}
        {activeTab === 'host' && (
          <div className="space-y-4 animate-fadeIn text-xs font-sans">
            <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Co-host Permissions</div>
                  <p className="text-[11px] text-white/50">Allows assigning co-hosts during the session</p>
                </div>
                <button
                  onClick={() => setCoHostEnabled(prev => !prev)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${coHostEnabled ? 'bg-emerald-500' : 'bg-neutral-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${coHostEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div>
                  <div className="font-bold text-white">Alternative Host Scheduling</div>
                  <p className="text-[11px] text-white/50">Grants full host privileges upon teachers entering</p>
                </div>
                <button
                  onClick={() => setAltHostEnabled(prev => !prev)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${altHostEnabled ? 'bg-emerald-500' : 'bg-neutral-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${altHostEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Alternative Hosts Input & Verification List */}
            <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Assigned Alternative Hosts:</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified in Scheduled Meeting</span>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                  placeholder="teacher.name@school.edu"
                  className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                />
                <button
                  onClick={handleAddEmail}
                  className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs font-mono hover:bg-neutral-200 transition-colors"
                >
                  Add Teacher
                </button>
              </div>

              {/* Tag Cloud */}
              <div className="flex flex-wrap gap-2 pt-1">
                {altHosts.map(email => (
                  <span key={email} className="px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] flex items-center space-x-1.5">
                    <span>{email}</span>
                    <button onClick={() => handleRemoveEmail(email)} className="hover:text-red-400 font-bold">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: In-Meeting Security & Control Rules (Web Portal)            */}
        {/* ================================================================= */}
        {activeTab === 'security' && (
          <div className="space-y-4 animate-fadeIn text-xs font-sans">
            {/* Security Shield Indicator */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
              isSecurityShieldActive
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
            }`}>
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="font-bold">In-Meeting Security Shield Active</div>
                  <div className="text-[11px] text-white/60">Waiting Room ON • Screen Share locked to Host/Co-hosts</div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10">
                {isSecurityShieldActive ? 'PASSED VERIFICATION' : 'CHECK RULES'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Waiting Room Enabled</div>
                  <p className="text-[11px] text-white/50">Controls participant entry and prevents unverified intrusions</p>
                </div>
                <button
                  onClick={() => setWaitingRoomEnabled(prev => !prev)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${waitingRoomEnabled ? 'bg-emerald-500' : 'bg-neutral-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${waitingRoomEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div>
                  <div className="font-bold text-white">Allow Alternative Hosts to Edit Polls & Breakouts</div>
                  <p className="text-[11px] text-white/50">Grants secondary teachers in-session management controls</p>
                </div>
                <button
                  onClick={() => setAllowAltPollsBreakout(prev => !prev)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${allowAltPollsBreakout ? 'bg-emerald-500' : 'bg-neutral-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${allowAltPollsBreakout ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div>
                  <div className="font-bold text-white">Default Screen Sharing Rule</div>
                  <p className="text-[11px] text-white/50">Restricts student interruptions</p>
                </div>
                <select
                  value={screenShareRule}
                  onChange={(e: any) => setScreenShareRule(e.target.value)}
                  className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1 text-xs font-mono text-white focus:outline-none"
                >
                  <option value="Host and Co-hosts only">Host and Co-hosts only (Default)</option>
                  <option value="All Participants">All Participants</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: Connect External Devices as Co-Hosts                       */}
        {/* ================================================================= */}
        {activeTab === 'devices' && (
          <div className="space-y-4 animate-fadeIn text-xs font-sans">
            <div className="text-[11px] text-white/50 font-mono">
              Secondary laptops, classroom displays, and tablets can be assigned Host / Co-Host privileges:
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {devices.map(dev => (
                <div
                  key={dev.device_id}
                  className="p-3 rounded-2xl bg-neutral-900/60 border border-white/10 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-cyan-400">
                      {dev.device_type.includes('Display') ? <Monitor className="w-4 h-4" /> :
                       dev.device_type.includes('Tablet') ? <Tablet className="w-4 h-4" /> :
                       <Laptop className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center space-x-2">
                        <span>{dev.name}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          dev.role === 'Host' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                          dev.role === 'Co-Host' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          'bg-neutral-800 text-white/50'
                        }`}>
                          ({dev.role})
                        </span>
                      </div>
                      <div className="text-[10px] text-white/40 font-mono">{dev.email}</div>
                    </div>
                  </div>

                  {/* Role Promotion Actions */}
                  <div className="flex items-center space-x-1.5 font-mono text-[10px]">
                    {dev.role !== 'Co-Host' && (
                      <button
                        onClick={() => handlePromoteDevice(dev.device_id, 'Co-Host')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
                      >
                        Make Co-Host
                      </button>
                    )}
                    {dev.role !== 'Host' && (
                      <button
                        onClick={() => handlePromoteDevice(dev.device_id, 'Host')}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all"
                      >
                        Make Host
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 font-mono text-xs">
          <span className="text-white/40">Verified Zoom Meeting ID: 842 1902 4891</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white text-black font-bold hover:bg-neutral-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
