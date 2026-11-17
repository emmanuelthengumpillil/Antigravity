import React from 'react';
import { Flame, Trophy, Award, Zap } from 'lucide-react';

export default function StreakHUD({ points, streakDays, streakMultiplier, latestBadge }) {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end space-y-2 select-none pointer-events-auto">
      {/* Floating Animated Reward Notification (Subtle & Non-blocking) */}
      {latestBadge && (
        <div className="animate-bounce bg-neutral-900/95 border border-amber-500/30 text-amber-300 text-xs px-3.5 py-1.5 rounded-full shadow-lg shadow-black/80 flex items-center space-x-2 font-mono backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{latestBadge.text}</span>
        </div>
      )}

      {/* Ambient Persistent Streak Pill */}
      <div className="flex items-center space-x-2.5 px-4 py-2 rounded-full bg-neutral-950/90 border border-white/10 shadow-xl backdrop-blur-md hover:border-white/20 transition-all cursor-default">
        <div className="flex items-center space-x-1.5 text-amber-400">
          <Flame className="w-4 h-4 fill-amber-400/20" />
          <span className="font-bold text-xs font-mono">{streakDays} Days</span>
        </div>

        <span className="text-white/20">|</span>

        <div className="flex items-center space-x-1 text-white/80">
          <Trophy className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-mono font-medium">{points} Pts</span>
        </div>

        {streakMultiplier > 1.0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-bold">
            {streakMultiplier}x
          </span>
        )}
      </div>
    </div>
  );
}
