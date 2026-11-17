import React, { useState } from 'react';
import { Users, Shield, Heart, Send, BellRing, Sparkles, ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';
import { EMOTIONS } from '../hooks/useEmotionEngine';

export default function ClassroomPortal({ dominantEmotion, pomodoroState, isActive }) {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState('STUDENT'); // 'STUDENT' | 'TEACHER'
  const [teacherMessage, setTeacherMessage] = useState(null);

  // Connected study room peers mock state
  const [students, setStudents] = useState([
    { id: '1', name: 'Alex K.', status: 'Focusing', emotion: 'EXCITED', time: '18:42', alert: false },
    { id: '2', name: 'Elena R.', status: 'Focusing', emotion: 'FOCUSED', time: '21:10', alert: false },
    { id: '3', name: 'David M.', status: 'Focusing', emotion: 'ANXIOUS', time: '09:15', alert: true },
    { id: '4', name: 'Maya S.', status: 'On Break', emotion: 'HAPPY', time: '03:45', alert: false },
    { id: '5', name: 'Liam T.', status: 'Idle', emotion: 'SAD', time: '00:00', alert: true }
  ]);

  const sendTeacherAction = (studentName, actionText) => {
    setTeacherMessage(`Sent to ${studentName}: "${actionText}"`);
    setTimeout(() => setTeacherMessage(null), 3500);
  };

  const syncClassTimer = () => {
    setTeacherMessage('Class-wide synchronized 25-minute Pomodoro initiated!');
    setTimeout(() => setTeacherMessage(null), 4000);
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 select-none">
      {/* Drawer Toggle Pill */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center space-x-2.5 px-4 py-2 rounded-full bg-neutral-950/90 border border-white/10 shadow-xl backdrop-blur-md hover:border-white/20 transition-all text-xs font-mono text-white/80 hover:text-white"
      >
        <Users className="w-3.5 h-3.5 text-indigo-400" />
        <span>Study Room (5 Active)</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      {/* Expanded Classroom Panel */}
      {isOpen && (
        <div className="absolute bottom-12 left-0 w-80 md:w-96 rounded-2xl bg-neutral-950/95 border border-white/10 shadow-2xl p-4 backdrop-blur-xl animate-fadeIn text-white">
          {/* Header & Role Switcher */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold font-sans">Collaborative Space</span>
            </div>

            {/* Role Switcher Pill */}
            <div className="flex items-center p-0.5 rounded-full bg-neutral-900 border border-white/10 text-[10px] font-mono">
              <button
                onClick={() => setRole('STUDENT')}
                className={`px-2 py-0.5 rounded-full transition-all ${
                  role === 'STUDENT' ? 'bg-white text-black font-semibold' : 'text-white/40 hover:text-white'
                }`}
              >
                Peer
              </button>
              <button
                onClick={() => setRole('TEACHER')}
                className={`px-2 py-0.5 rounded-full transition-all ${
                  role === 'TEACHER' ? 'bg-white text-black font-semibold' : 'text-white/40 hover:text-white'
                }`}
              >
                Teacher
              </button>
            </div>
          </div>

          {/* Broadcast confirmation toast */}
          {teacherMessage && (
            <div className="my-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono flex items-center space-x-2 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{teacherMessage}</span>
            </div>
          )}

          {/* STUDENT VIEW */}
          {role === 'STUDENT' && (
            <div className="mt-3 space-y-2">
              <div className="text-[11px] text-white/40 font-mono">Connected Peers:</div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {/* Current User */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                      You
                    </div>
                    <span className="font-medium text-white/90">You</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] text-white/40">{isActive ? 'Focusing' : 'Paused'}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      [{dominantEmotion}]
                    </span>
                  </div>
                </div>

                {/* Other Peers */}
                {students.map((student) => {
                  const meta = EMOTIONS[student.emotion] || EMOTIONS.FOCUSED;
                  return (
                    <div key={student.id} className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/50 border border-white/5 text-xs hover:bg-white/5 transition-all">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-white/10 text-white/60 font-medium flex items-center justify-center text-[10px]">
                          {student.name.charAt(0)}
                        </div>
                        <span className="text-white/80">{student.name}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] text-white/40">{student.status}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${meta.bg} ${meta.color} border ${meta.border}`}>
                          [{student.emotion}]
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TEACHER / MENTOR DASHBOARD */}
          {role === 'TEACHER' && (
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/40 font-mono">Emotional Well-Being Monitor</span>
                <button
                  onClick={syncClassTimer}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-all font-mono"
                >
                  Sync Class Timer
                </button>
              </div>

              {/* Student Well-Being List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {students.map((student) => {
                  const isStressed = student.emotion === 'ANXIOUS' || student.emotion === 'SAD';
                  return (
                    <div
                      key={student.id}
                      className={`p-2.5 rounded-xl border text-xs transition-all ${
                        isStressed
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : 'bg-neutral-900/40 border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white/90">{student.name}</span>
                          <span className="text-[10px] text-white/40 font-mono">{student.status} ({student.time})</span>
                        </div>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          isStressed
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          [{student.emotion}]
                        </span>
                      </div>

                      {/* Discreet Interventions for Flagged Students */}
                      {isStressed && (
                        <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-white/5">
                          <button
                            onClick={() => sendTeacherAction(student.name, 'You are doing great! Keep going!')}
                            className="flex-1 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] text-white/80 font-mono transition-all"
                          >
                            Send "Keep Going!"
                          </button>
                          <button
                            onClick={() => sendTeacherAction(student.name, 'Take a gentle 2-min breather')}
                            className="flex-1 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-[10px] text-indigo-300 font-mono transition-all"
                          >
                            Suggest Breather
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
