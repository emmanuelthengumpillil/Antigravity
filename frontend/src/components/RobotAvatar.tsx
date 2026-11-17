import React, { useState, useEffect } from 'react';

export type DetectedState = 'FOCUSED' | 'ENGAGED' | 'PRESENT' | 'AWAY' | 'DROWSY' | 'HAPPY' | 'EXCITED' | 'ANXIOUS' | 'SAD' | 'SLEEPING';

interface RobotAvatarProps {
  emotion?: DetectedState;
  size?: number;
}

export default function RobotAvatar({ emotion = 'FOCUSED', size = 44 }: RobotAvatarProps) {
  const [blink, setBlink] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  // Natural spontaneous blinking interval (only when awake & present)
  useEffect(() => {
    if (emotion === 'SLEEPING' || emotion === 'DROWSY' || emotion === 'AWAY') return;

    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3200 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, [emotion]);

  // Subtle cursor tracking or wandering eyes
  useEffect(() => {
    if (emotion === 'SLEEPING' || emotion === 'DROWSY') {
      setEyeOffset({ x: 0, y: 1.5 });
      return;
    }

    if (emotion === 'AWAY') {
      // Wandering looking around when user is away
      const wander = setInterval(() => {
        setEyeOffset({
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 3
        });
      }, 1500);
      return () => clearInterval(wander);
    }

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = 50;
      const deltaX = Math.max(-2.5, Math.min(2.5, (e.clientX - centerX) / 120));
      const deltaY = Math.max(-2, Math.min(2, (e.clientY - centerY) / 80));
      setEyeOffset({ x: deltaX, y: deltaY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [emotion]);

  // Eye and LED color based on detected camera state
  const eyeColor = emotion === 'HAPPY' || emotion === 'EXCITED' || emotion === 'ENGAGED'
    ? '#10b981' // Vibrant Emerald
    : emotion === 'ANXIOUS'
      ? '#f59e0b' // Soft Amber
      : emotion === 'SAD'
        ? '#60a5fa' // Soft Blue
        : emotion === 'SLEEPING' || emotion === 'DROWSY'
          ? '#ef4444' // Alert Red / Crimson
          : emotion === 'AWAY'
            ? '#a1a1aa' // Muted Zinc when user is away
            : '#06b6d4'; // Cyan LED for FOCUSED / PRESENT

  // Mouth path shape depending on state
  const mouthD = emotion === 'HAPPY' || emotion === 'EXCITED' || emotion === 'ENGAGED'
    ? 'M 14 26 Q 22 32 30 26' // Smile
    : emotion === 'ANXIOUS' || emotion === 'SAD'
      ? 'M 15 29 Q 22 24 29 29' // Empathetic curve
      : emotion === 'SLEEPING' || emotion === 'DROWSY'
        ? 'M 20 27 A 2 2 0 1 1 24 27 A 2 2 0 1 1 20 27' // Small open drowsy mouth
        : emotion === 'AWAY'
          ? 'M 18 28 Q 22 26 26 28' // Questioning neutral
          : 'M 16 27 L 28 27'; // Focused straight line

  return (
    <div 
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
      title={`AI Robot Companion [${emotion}]`}
    >
      {/* Floating Zzz for SLEEPING / DROWSY state */}
      {(emotion === 'SLEEPING' || emotion === 'DROWSY') && (
        <div className="absolute -top-3.5 right-0 font-mono font-bold text-[10px] text-amber-300 animate-bounce">
          Zzz...
        </div>
      )}

      {/* Away Question Mark badge */}
      {emotion === 'AWAY' && (
        <div className="absolute -top-3 right-0 font-mono font-bold text-[10px] text-zinc-400 animate-pulse">
          ?
        </div>
      )}

      <svg
        viewBox="0 0 44 44"
        width={size}
        height={size}
        className="transform transition-transform duration-300 hover:scale-105"
      >
        {/* Antenna with gentle pulse */}
        <line x1="22" y1="2" x2="22" y2="8" stroke="#52525b" strokeWidth="2" strokeLinecap="round" />
        <circle 
          cx="22" 
          cy="2" 
          r="2" 
          fill={eyeColor}
          className={emotion === 'SLEEPING' || emotion === 'DROWSY' ? 'animate-ping' : 'animate-pulse'}
        />

        {/* Outer Robot Head Chassis */}
        <rect
          x="6"
          y="8"
          width="32"
          height="28"
          rx="9"
          fill="#0f0f11"
          stroke={emotion === 'SLEEPING' || emotion === 'DROWSY' ? '#7f1d1d' : '#27272a'}
          strokeWidth="1.5"
        />

        {/* Inner OLED Visor Display */}
        <rect
          x="9"
          y="11"
          width="26"
          height="22"
          rx="6"
          fill="#000000"
        />

        {/* LED Eyes */}
        <g transform={`translate(${eyeOffset.x}, ${eyeOffset.y})`}>
          {emotion === 'SLEEPING' || emotion === 'DROWSY' ? (
            <>
              <path d="M 13 19 Q 16 22 19 19" fill="transparent" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
              <path d="M 25 19 Q 28 22 31 19" fill="transparent" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : blink ? (
            <>
              <line x1="13" y1="18" x2="19" y2="18" stroke={eyeColor} strokeWidth="2" strokeLinecap="round" />
              <line x1="25" y1="18" x2="31" y2="18" stroke={eyeColor} strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="16" cy="18" r="3.2" fill={eyeColor} />
              <circle cx="15.2" cy="17" r="1" fill="#ffffff" opacity="0.9" />
              
              <circle cx="28" cy="18" r="3.2" fill={eyeColor} />
              <circle cx="27.2" cy="17" r="1" fill="#ffffff" opacity="0.9" />
            </>
          )}

          {/* Expressive Mouth */}
          <path
            d={mouthD}
            fill={emotion === 'SLEEPING' || emotion === 'DROWSY' ? '#f87171' : 'transparent'}
            stroke={eyeColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </g>
      </svg>
    </div>
  );
}
