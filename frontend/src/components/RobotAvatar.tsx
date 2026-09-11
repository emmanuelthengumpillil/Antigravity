import React, { useState, useEffect } from 'react';

interface RobotAvatarProps {
  emotion?: 'FOCUSED' | 'HAPPY' | 'EXCITED' | 'ANXIOUS' | 'SAD' | 'SLEEPING';
  size?: number;
}

export default function RobotAvatar({ emotion = 'FOCUSED', size = 44 }: RobotAvatarProps) {
  const [blink, setBlink] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  // Natural spontaneous blinking interval (only when awake)
  useEffect(() => {
    if (emotion === 'SLEEPING') return;

    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3200 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, [emotion]);

  // Subtle cursor tracking for robot eyes (only when awake)
  useEffect(() => {
    if (emotion === 'SLEEPING') {
      setEyeOffset({ x: 0, y: 1 });
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = 50; // Dynamic Island top zone
      const deltaX = Math.max(-2.5, Math.min(2.5, (e.clientX - centerX) / 120));
      const deltaY = Math.max(-2, Math.min(2, (e.clientY - centerY) / 80));
      setEyeOffset({ x: deltaX, y: deltaY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [emotion]);

  // Eye and LED color based on emotional state
  const eyeColor = emotion === 'HAPPY' || emotion === 'EXCITED'
    ? '#10b981' // Vibrant Emerald
    : emotion === 'ANXIOUS'
      ? '#f59e0b' // Soft Amber
      : emotion === 'SAD'
        ? '#60a5fa' // Soft Blue
        : emotion === 'SLEEPING'
          ? '#ef4444' // Alert Red / Soft Crimson
          : '#06b6d4'; // Cyan LED for FOCUSED

  // Mouth path shape depending on emotion
  const mouthD = emotion === 'HAPPY' || emotion === 'EXCITED'
    ? 'M 14 26 Q 22 32 30 26'
    : emotion === 'ANXIOUS' || emotion === 'SAD'
      ? 'M 15 29 Q 22 24 29 29'
      : emotion === 'SLEEPING'
        ? 'M 20 27 A 2 2 0 1 1 24 27 A 2 2 0 1 1 20 27' // Small open sleeping mouth
        : 'M 16 27 L 28 27';

  return (
    <div 
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
      title={`AI Robot Companion [${emotion}]`}
    >
      {/* Floating Zzz for SLEEPING state */}
      {emotion === 'SLEEPING' && (
        <div className="absolute -top-3 right-0 font-mono font-bold text-[10px] text-amber-300 animate-bounce">
          Zzz...
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
          className={emotion === 'SLEEPING' ? 'animate-ping text-red-500' : 'animate-pulse'}
        />

        {/* Outer Robot Head Chassis */}
        <rect
          x="6"
          y="8"
          width="32"
          height="28"
          rx="9"
          fill="#0f0f11"
          stroke={emotion === 'SLEEPING' ? '#7f1d1d' : '#27272a'}
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

        {/* LED Eyes with natural blinking, tracking, or SLEEPING droop */}
        <g transform={`translate(${eyeOffset.x}, ${eyeOffset.y})`}>
          {emotion === 'SLEEPING' ? (
            <>
              {/* Drooping closed sleeping eyes */}
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
              {/* Left Eye */}
              <circle cx="16" cy="18" r="3.2" fill={eyeColor} />
              <circle cx="15.2" cy="17" r="1" fill="#ffffff" opacity="0.9" />
              
              {/* Right Eye */}
              <circle cx="28" cy="18" r="3.2" fill={eyeColor} />
              <circle cx="27.2" cy="17" r="1" fill="#ffffff" opacity="0.9" />
            </>
          )}

          {/* Expressive Mouth */}
          <path
            d={mouthD}
            fill={emotion === 'SLEEPING' ? '#f87171' : 'transparent'}
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
