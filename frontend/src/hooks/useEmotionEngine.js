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
    } catch (err: any) {
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

  // Continuous Streak Gamification System
  // +10 pts awarded every 30s of maintained positive state (FOCUSED / ENGAGED / PRESENT)
  useEffect(() => {
    const interval = setInterval(() => {
      if (detectedState === 'FOCUSED' || detectedState === 'ENGAGED' || detectedState === 'PRESENT') {
        setPoints(prev => {
          const next = prev + 10;
          localStorage.setItem('focusmind_streak_pts', next.toString());
          return next;
        });
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [detectedState]);

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
    initCamera
  };
}
