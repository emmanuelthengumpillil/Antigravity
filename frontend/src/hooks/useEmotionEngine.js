import { useState, useEffect, useRef, useCallback } from 'react';

export function useEmotionEngine() {
  const [cameraStatus, setCameraStatus] = useState('pending'); // 'streaming' | 'pending' | 'denied' | 'unavailable'
  const [detectedState, setDetectedState] = useState('FOCUSED');
  const [earValue, setEarValue] = useState(0.28);
  const [gazeStability, setGazeStability] = useState(98);
  const [presenceConfidence, setPresenceConfidence] = useState(96);
  const [headPoseStatus, setHeadPoseStatus] = useState('Upright (0°)');
  const [continuousDrowsySeconds, setContinuousDrowsySeconds] = useState(0);
  const [isDrowsyAlertActive, setIsDrowsyAlertActive] = useState(false);

  // Streak points persisted in localStorage
  const [points, setPoints] = useState(() => {
    return parseInt(localStorage.getItem('focusmind_streak_pts') || '450', 10);
  });
  const [streakDays, setStreakDays] = useState(() => {
    return parseInt(localStorage.getItem('focusmind_streak_days') || '5', 10);
  });
  const [streakMultiplier, setStreakMultiplier] = useState(1.0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Request camera access via getUserMedia
  const initCamera = useCallback(async () => {
    setCameraStatus('pending');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraStatus('unavailable');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setCameraStatus('streaming');
      setDetectedState('FOCUSED');
    } catch (err) {
      console.warn('Camera permission issue:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
      } else {
        setCameraStatus('unavailable');
      }
    }
  }, []);

  useEffect(() => {
    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [initCamera]);

  // Check and update daily streak
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastActiveDate = localStorage.getItem('focusmind_last_active_date');
    if (!lastActiveDate) {
      localStorage.setItem('focusmind_last_active_date', todayStr);
    } else if (lastActiveDate !== todayStr) {
      const lastDate = new Date(lastActiveDate);
      const today = new Date(todayStr);
      const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        setStreakDays(prev => {
          const next = prev + 1;
          localStorage.setItem('focusmind_streak_days', next.toString());
          return next;
        });
      }
      localStorage.setItem('focusmind_last_active_date', todayStr);
    }
  }, []);

  // Continuous Streak Gamification: +5 pts every 10s of active focus scaled by multiplier
  useEffect(() => {
    let focusSeconds = 0;
    const interval = setInterval(() => {
      if (detectedState === 'FOCUSED' || detectedState === 'ENGAGED' || detectedState === 'PRESENT') {
        focusSeconds += 10;
        let currentMultiplier = 1.0;
        if (focusSeconds > 300) {
          currentMultiplier = 1.5;
        } else if (focusSeconds > 90) {
          currentMultiplier = 1.2;
        }
        setStreakMultiplier(currentMultiplier);

        const gained = Math.round(5 * currentMultiplier);
        setPoints(prev => {
          const next = prev + gained;
          localStorage.setItem('focusmind_streak_pts', next.toString());
          return next;
        });
      } else if (detectedState === 'AWAY' || detectedState === 'SLEEPING') {
        focusSeconds = 0;
        setStreakMultiplier(1.0);
      }
    }, 10000); // every 10 seconds

    return () => clearInterval(interval);
  }, [detectedState]);

  const awardPoints = useCallback((pts) => {
    setPoints(prev => {
      const next = prev + pts;
      localStorage.setItem('focusmind_streak_pts', next.toString());
      return next;
    });
  }, []);

  // Automated Facial State Inference simulation from video stream
  useEffect(() => {
    if (cameraStatus !== 'streaming') return;

    const inferenceInterval = setInterval(() => {
      // Natural subtle telemetry fluctuation
      const newGaze = Math.max(85, Math.min(100, Math.round(98 + (Math.random() - 0.45) * 3)));
      const newEar = Math.max(0.24, Math.min(0.32, 0.28 + (Math.random() - 0.5) * 0.04));

      setGazeStability(newGaze);
      setEarValue(newEar);

      // Automated state mapping based on metrics
      if (newGaze > 95) {
        setDetectedState('FOCUSED');
        setHeadPoseStatus('Upright (0°)');
        setPresenceConfidence(98);
      } else if (newGaze > 90) {
        setDetectedState('ENGAGED');
        setHeadPoseStatus('Upright (+2°)');
        setPresenceConfidence(95);
      }
    }, 4000);

    return () => clearInterval(inferenceInterval);
  }, [cameraStatus]);

  // 1-minute continuous drowsiness tracking
  useEffect(() => {
    const timer = setInterval(() => {
      if (detectedState === 'DROWSY' || (earValue < 0.22 && detectedState !== 'AWAY')) {
        setContinuousDrowsySeconds(prev => {
          const next = prev + 1;
          if (next >= 60) {
            setIsDrowsyAlertActive(true);
          }
          return next;
        });
      } else {
        setContinuousDrowsySeconds(0);
        setIsDrowsyAlertActive(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [detectedState, earValue]);

  return {
    cameraStatus,
    detectedState,
    setDetectedState,
    earValue,
    gazeStability,
    presenceConfidence,
    headPoseStatus,
    continuousDrowsySeconds,
    isDrowsyAlertActive,
    setIsDrowsyAlertActive,
    points,
    streakDays,
    streakMultiplier,
    videoRef,
    initCamera,
    awardPoints
  };
}
