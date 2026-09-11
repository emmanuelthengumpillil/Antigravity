import { useState, useEffect, useCallback, useRef } from 'react';

export const POMODORO_STATES = {
  WORK: 'WORK',
  SHORT_BREAK: 'SHORT_BREAK',
  LONG_BREAK: 'LONG_BREAK'
};

export const PRESETS = {
  STANDARD: { name: '25/5 Standard', work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 },
  DEEP_WORK: { name: '50/10 Deep', work: 50 * 60, shortBreak: 10 * 60, longBreak: 20 * 60 },
  TEST_QUICK: { name: 'Quick Test', work: 10, shortBreak: 5, longBreak: 10 }
};

export function usePomodoroMachine() {
  const [selectedPreset, setSelectedPreset] = useState('STANDARD');
  const [state, setState] = useState(POMODORO_STATES.WORK);
  const [timeLeft, setTimeLeft] = useState(PRESETS.STANDARD.work);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Gamification state
  const [points, setPoints] = useState(() => {
    return parseInt(localStorage.getItem('focusmind_pts') || '450', 10);
  });
  const [streakDays, setStreakDays] = useState(() => {
    return parseInt(localStorage.getItem('focusmind_streak') || '5', 10);
  });
  const [streakMultiplier, setStreakMultiplier] = useState(1.0);
  const [latestBadge, setLatestBadge] = useState(null);

  const audioCtxRef = useRef(null);

  // Play gentle ambient chime using Web Audio API synthesis
  const playChime = useCallback((type = 'complete') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (type === 'complete') {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.3); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.6); // G5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      } else if (type === 'bonus') {
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.2); // A5
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.5);
    } catch (e) {
      console.warn('Audio chime failed:', e);
    }
  }, [soundEnabled]);

  // Save streak to storage
  useEffect(() => {
    localStorage.setItem('focusmind_pts', points.toString());
    localStorage.setItem('focusmind_streak', streakDays.toString());
  }, [points, streakDays]);

  // Award Points Helper
  const awardPoints = useCallback((amount, reason, bonus = false) => {
    const calculated = Math.round(amount * streakMultiplier);
    setPoints(prev => prev + calculated);
    setLatestBadge({ text: `+${calculated} pts: ${reason}`, timestamp: Date.now() });
    playChime(bonus ? 'bonus' : 'complete');

    setTimeout(() => {
      setLatestBadge(null);
    }, 4000);
  }, [streakMultiplier, playChime]);

  // Transition helper
  const transitionTo = useCallback((nextState, isEarlyReturn = false) => {
    const preset = PRESETS[selectedPreset] || PRESETS.STANDARD;
    
    // Early-bird bonus if returning to work before break expires
    if (nextState === POMODORO_STATES.WORK && (state === POMODORO_STATES.SHORT_BREAK || state === POMODORO_STATES.LONG_BREAK)) {
      if (isEarlyReturn && timeLeft > 0) {
        awardPoints(50, 'Early-Bird Resume Bonus', true);
      }
    }

    setState(nextState);
    if (nextState === POMODORO_STATES.WORK) {
      setTimeLeft(preset.work);
    } else if (nextState === POMODORO_STATES.SHORT_BREAK) {
      setTimeLeft(preset.shortBreak);
    } else {
      setTimeLeft(preset.longBreak);
    }
  }, [selectedPreset, state, timeLeft, awardPoints]);

  // Timer Tick
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft <= 0) {
      // Current session ended
      if (state === POMODORO_STATES.WORK) {
        const nextCompleted = sessionsCompleted + 1;
        setSessionsCompleted(nextCompleted);
        
        // Multiplier progression
        const newMultiplier = Math.min(2.0, 1.0 + nextCompleted * 0.1);
        setStreakMultiplier(newMultiplier);

        // +100 pts & +1 streak day rule
        awardPoints(100, 'Focus Session Completed');
        setStreakDays(prev => prev + 1);

        // After every 4 work sessions, take a long break
        if (nextCompleted % 4 === 0) {
          transitionTo(POMODORO_STATES.LONG_BREAK);
        } else {
          transitionTo(POMODORO_STATES.SHORT_BREAK);
        }
      } else {
        // Break finished, return to work
        transitionTo(POMODORO_STATES.WORK);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, state, sessionsCompleted, transitionTo, awardPoints]);

  const toggleActive = () => setIsActive(prev => !prev);

  const resetTimer = () => {
    setIsActive(false);
    const preset = PRESETS[selectedPreset] || PRESETS.STANDARD;
    if (state === POMODORO_STATES.WORK) setTimeLeft(preset.work);
    else if (state === POMODORO_STATES.SHORT_BREAK) setTimeLeft(preset.shortBreak);
    else setTimeLeft(preset.longBreak);
  };

  const skipCurrent = () => {
    if (state === POMODORO_STATES.WORK) {
      transitionTo(POMODORO_STATES.SHORT_BREAK);
    } else {
      transitionTo(POMODORO_STATES.WORK, true);
    }
  };

  const changePreset = (presetKey) => {
    if (PRESETS[presetKey]) {
      setSelectedPreset(presetKey);
      setIsActive(false);
      const preset = PRESETS[presetKey];
      if (state === POMODORO_STATES.WORK) setTimeLeft(preset.work);
      else if (state === POMODORO_STATES.SHORT_BREAK) setTimeLeft(preset.shortBreak);
      else setTimeLeft(preset.longBreak);
    }
  };

  // Format MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentDuration = state === POMODORO_STATES.WORK 
    ? (PRESETS[selectedPreset]?.work || 1500)
    : state === POMODORO_STATES.SHORT_BREAK 
      ? (PRESETS[selectedPreset]?.shortBreak || 300)
      : (PRESETS[selectedPreset]?.longBreak || 900);

  const progressPercent = Math.min(100, Math.max(0, ((currentDuration - timeLeft) / currentDuration) * 100));

  return {
    state,
    timeLeft,
    formattedTime: formatTime(timeLeft),
    progressPercent,
    isActive,
    toggleActive,
    resetTimer,
    skipCurrent,
    transitionTo,
    selectedPreset,
    changePreset,
    sessionsCompleted,
    points,
    streakDays,
    streakMultiplier,
    latestBadge,
    soundEnabled,
    setSoundEnabled
  };
}
