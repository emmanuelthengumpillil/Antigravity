import { useState, useEffect, useRef, useCallback } from 'react';

export const EMOTIONS = {
  HAPPY: { label: 'HAPPY', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
  FOCUSED: { label: 'FOCUSED', color: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-500/30' },
  ANXIOUS: { label: 'ANXIOUS', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  SAD: { label: 'SAD', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  EXCITED: { label: 'EXCITED', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20', border: 'border-fuchsia-500/30' }
};

export function useEmotionEngine() {
  const [hasPermission, setHasPermission] = useState(() => {
    return localStorage.getItem('focusmind_cam_consent') === 'true';
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [dominantEmotion, setDominantEmotion] = useState('FOCUSED');
  const [confidence, setConfidence] = useState(0.94);
  const [distractionIndex, setDistractionIndex] = useState(4); // 0-100 scale (low is great)
  const [gazeStability, setGazeStability] = useState(98);
  const [yawnCount, setYawnCount] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Request camera permission
  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setHasPermission(true);
      setIsStreaming(true);
      localStorage.setItem('focusmind_cam_consent', 'true');
      return true;
    } catch (err) {
      console.warn('Camera access denied or unattached:', err);
      // Even if denied/no hardware, allow continuing in synthetic telemetry mode
      setHasPermission(true);
      localStorage.setItem('focusmind_cam_consent', 'true');
      return false;
    }
  }, []);

  // Background subtle emotion & distraction simulator when camera runs
  useEffect(() => {
    if (!hasPermission) return;

    const interval = setInterval(() => {
      // Periodic subtle fluctuation to keep background analytics lively
      setDistractionIndex(prev => {
        const delta = (Math.random() - 0.5) * 4;
        return Math.max(2, Math.min(25, Math.round(prev + delta)));
      });
      setGazeStability(prev => {
        const delta = (Math.random() - 0.45) * 3;
        return Math.max(88, Math.min(100, Math.round(prev + delta)));
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [hasPermission]);

  const setManualEmotion = (emotionKey) => {
    if (EMOTIONS[emotionKey]) {
      setDominantEmotion(emotionKey);
      setConfidence(0.92 + Math.random() * 0.07);
    }
  };

  return {
    hasPermission,
    requestPermission,
    isStreaming,
    videoRef,
    dominantEmotion,
    confidence: Math.round(confidence * 100),
    distractionIndex,
    gazeStability,
    yawnCount,
    setManualEmotion,
    emotionMeta: EMOTIONS[dominantEmotion] || EMOTIONS.FOCUSED
  };
}
