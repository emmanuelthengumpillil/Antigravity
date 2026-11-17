import React from 'react';
import { Timer, Clock, Flame, Hourglass, Zap, Minimize } from 'lucide-react';

export default function TopNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'Timer', label: 'Timer', icon: Timer },
    { id: 'Clock', label: 'Clock', icon: Clock },
    { id: 'Pomodoro', label: 'Pomodoro', icon: Flame },
    { id: 'Stopwatch', label: 'Stopwatch', icon: Hourglass },
    { id: 'Focus', label: 'Focus', icon: Zap },
    { id: 'Mini', label: 'Mini', icon: Minimize },
  ];

  return (
    <nav className="w-full flex items-center justify-center pt-16 pb-4">
      <div className="inline-flex items-center p-1 rounded-full bg-neutral-900/90 border border-white/10 backdrop-blur-md shadow-lg shadow-black/60">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white text-black font-semibold shadow-md shadow-white/10 scale-[1.02]'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-white/40'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
