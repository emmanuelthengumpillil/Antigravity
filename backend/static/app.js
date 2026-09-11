/**
 * FocusMind OLED Coding & Deep Focus Platform
 * Rebuilt Dynamic Island with Real-Time Camera Detection, Modal Expansion, and Persistent Streak Gamification
 * Zero Manual Selectors
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // =========================================================================
  // State & Gamification (Persisted in localStorage)
  // =========================================================================
  let detectedState = 'FOCUSED'; // 'FOCUSED' | 'ENGAGED' | 'PRESENT' | 'AWAY' | 'DROWSY' | 'SLEEPING'
  let secondsRemaining = 25 * 60;
  const totalSessionSeconds = 25 * 60;
  let isTimerActive = true;
  let codeFailCount = 0;
  let isSleepingAlertActive = false;
  let continuousDrowsySeconds = 0;
  let hasDispatchedDrowsyAlert = false;
  const DROWSY_NOTIFICATION_THRESHOLD_SEC = 60; // 1 minute of sustained drowsiness

  // Real-time tracking biometrics
  let earValue = 0.28;
  let gazeStability = 98;
  let presenceConfidence = 98;
  let headPoseStatus = 'Upright (0°)';

  // Streak points loaded from localStorage
  let streakPoints = parseInt(localStorage.getItem('focusmind_streak_pts') || '450', 10);
  let streakDays = parseInt(localStorage.getItem('focusmind_streak_days') || '5', 10);
  let streakMultiplier = 1.0;

  // Web Audio Alarm Context
  let alarmAudioCtx = null;
  let alarmInterval = null;

  // Code templates
  const pythonCode = `def two_sum(nums: list[int], target: int) -> list[int]:
    # Single-pass Hash Table approach
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test execution:
print(two_sum([2, 7, 11, 15], 9))
`;

  const tsCode = `function twoSum(nums: number[], target: number): number[] {
    const seen = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
            return [seen.get(complement)!, i];
        }
        seen.set(nums[i], i);
    }
    return [];
}

console.log(twoSum([2, 7, 11, 15], 9));
`;

  const editorEl = document.getElementById('code-editor');
  if (editorEl) editorEl.value = pythonCode;

  // =========================================================================
  // 1. Continuous Streak Gamification System
  // =========================================================================
  function updateStreakDisplays() {
    const islandDays = document.getElementById('island-streak-days');
    const islandPts = document.getElementById('island-streak-points');
    const hudDays = document.getElementById('hud-streak-days');
    const hudPts = document.getElementById('hud-streak-pts');
    const railDaysComp = document.getElementById('rail-streak-days-compact');
    const railPtsComp = document.getElementById('rail-streak-pts-compact');
    const railDaysExp = document.getElementById('rail-streak-days-expanded');
    const railPtsExp = document.getElementById('rail-streak-pts-expanded');

    if (islandDays) islandDays.textContent = `${streakDays}d`;
    if (islandPts) islandPts.textContent = `${streakPoints} pts`;
    if (hudDays) hudDays.textContent = `${streakDays} Days Consecutive`;
    if (hudPts) hudPts.textContent = `${streakPoints} Pts (${streakMultiplier.toFixed(1)}x Multiplier)`;
    if (railDaysComp) railDaysComp.textContent = `${streakDays}d`;
    if (railPtsComp) railPtsComp.textContent = `${streakPoints}`;
    if (railDaysExp) railDaysExp.textContent = `${streakDays} Days Streak`;
    if (railPtsExp) railPtsExp.textContent = `${streakPoints} Pts (${streakMultiplier.toFixed(1)}x)`;
  }

  // Award +10 points every 30s of maintained positive state
  setInterval(() => {
    if (detectedState === 'FOCUSED' || detectedState === 'ENGAGED' || detectedState === 'PRESENT') {
      streakPoints += Math.round(10 * streakMultiplier);
      localStorage.setItem('focusmind_streak_pts', streakPoints.toString());
      updateStreakDisplays();
    }
  }, 30000);

  updateStreakDisplays();

  // =========================================================================
  // 2. Animated Expressive Micro-Robot Companion
  // =========================================================================
  const robotEyeLeft = document.getElementById('robot-eye-left');
  const robotEyeRight = document.getElementById('robot-eye-right');
  const robotBlinkLeft = document.getElementById('robot-blink-left');
  const robotBlinkRight = document.getElementById('robot-blink-right');
  const robotSleepLeft = document.getElementById('robot-sleep-left');
  const robotSleepRight = document.getElementById('robot-sleep-right');
  const robotMouth = document.getElementById('robot-mouth');
  const robotAntenna = document.getElementById('robot-antenna-light');
  const robotChassis = document.getElementById('robot-chassis');
  const robotZzz = document.getElementById('robot-zzz');

  // Eye blinking
  setInterval(() => {
    if (detectedState === 'SLEEPING' || detectedState === 'DROWSY' || detectedState === 'AWAY') return;

    if (robotEyeLeft && robotEyeRight && robotBlinkLeft && robotBlinkRight) {
      robotEyeLeft.classList.add('hidden');
      robotEyeRight.classList.add('hidden');
      robotBlinkLeft.classList.remove('hidden');
      robotBlinkRight.classList.remove('hidden');

      setTimeout(() => {
        robotEyeLeft.classList.remove('hidden');
        robotEyeRight.classList.remove('hidden');
        robotBlinkLeft.classList.add('hidden');
        robotBlinkRight.classList.add('hidden');
      }, 150);
    }
  }, 3500);

  // Eye tracking cursor
  window.addEventListener('mousemove', (e) => {
    if (detectedState === 'SLEEPING' || detectedState === 'DROWSY') return;

    const robotFeatures = document.getElementById('robot-face-features');
    if (robotFeatures) {
      const centerX = window.innerWidth / 2;
      const centerY = 50;
      const dx = Math.max(-2, Math.min(2, (e.clientX - centerX) / 150));
      const dy = Math.max(-1.5, Math.min(1.5, (e.clientY - centerY) / 90));
      robotFeatures.setAttribute('transform', `translate(${dx}, ${dy})`);
    }
  });

  function updateRobotAndHUD(state) {
    detectedState = state;

    let color = '#06b6d4'; // Cyan for FOCUSED / PRESENT
    let mouthPath = 'M 16 27 L 28 27'; // Neutral line

    if (state === 'SLEEPING' || state === 'DROWSY') {
      color = '#ef4444'; // Red
      mouthPath = 'M 20 27 A 2 2 0 1 1 24 27 A 2 2 0 1 1 20 27';
    } else if (state === 'ENGAGED') {
      color = '#10b981'; // Emerald
      mouthPath = 'M 14 26 Q 22 32 30 26'; // Smile
    } else if (state === 'AWAY') {
      color = '#a1a1aa'; // Zinc
      mouthPath = 'M 18 28 Q 22 26 26 28';
    }

    // Robot Eyes & Mouth
    if (state === 'SLEEPING' || state === 'DROWSY') {
      if (robotEyeLeft) robotEyeLeft.classList.add('hidden');
      if (robotEyeRight) robotEyeRight.classList.add('hidden');
      if (robotSleepLeft) robotSleepLeft.classList.remove('hidden');
      if (robotSleepRight) robotSleepRight.classList.remove('hidden');
      if (robotZzz) robotZzz.classList.remove('hidden');
      if (robotChassis) robotChassis.setAttribute('stroke', '#7f1d1d');
    } else {
      if (robotEyeLeft) robotEyeLeft.classList.remove('hidden');
      if (robotEyeRight) robotEyeRight.classList.remove('hidden');
      if (robotSleepLeft) robotSleepLeft.classList.add('hidden');
      if (robotSleepRight) robotSleepRight.classList.add('hidden');
      if (robotZzz) robotZzz.classList.add('hidden');
      if (robotChassis) robotChassis.setAttribute('stroke', '#27272a');
    }

    if (robotEyeLeft) robotEyeLeft.setAttribute('fill', color);
    if (robotEyeRight) robotEyeRight.setAttribute('fill', color);
    if (robotMouth) {
      robotMouth.setAttribute('stroke', color);
      robotMouth.setAttribute('d', mouthPath);
      robotMouth.setAttribute('fill', (state === 'SLEEPING' || state === 'DROWSY') ? '#f87171' : 'transparent');
    }
    if (robotAntenna) robotAntenna.setAttribute('fill', color);

    // Update Collapsed Dynamic Island Badge
    const badgeEl = document.getElementById('island-detected-badge');
    const hudStateLabel = document.getElementById('hud-state-label');
    if (badgeEl) {
      badgeEl.textContent = `[${state}]`;
      if (state === 'SLEEPING' || state === 'DROWSY') {
        badgeEl.className = 'px-2.5 py-1 rounded-full text-xs font-mono font-bold tracking-wider border border-red-500/50 text-red-400 bg-red-500/20 animate-pulse ring-2 ring-red-500/30';
      } else if (state === 'ENGAGED') {
        badgeEl.className = 'px-2.5 py-1 rounded-full text-xs font-mono font-bold tracking-wider border border-emerald-500/30 text-emerald-400 bg-emerald-500/10';
      } else if (state === 'AWAY') {
        badgeEl.className = 'px-2.5 py-1 rounded-full text-xs font-mono font-bold tracking-wider border border-zinc-500/30 text-zinc-400 bg-zinc-500/10';
      } else {
        badgeEl.className = 'px-2.5 py-1 rounded-full text-xs font-mono font-bold tracking-wider border border-cyan-500/30 text-cyan-400 bg-cyan-500/10';
      }
    }

    if (hudStateLabel) {
      hudStateLabel.textContent = `[${state}]`;
    }

    // Update Center Deep Focus Orb Aura
    updateOrbAura(state);

    // Emergency Sleep Intervention trigger
    if (state === 'SLEEPING' && !isSleepingAlertActive) {
      triggerEmergencySleepIntervention();
    }
  }

  // =========================================================================
  // 3. Click Interaction: Interactive Modal Expansion
  // =========================================================================
  const dynamicIsland = document.getElementById('dynamic-island');
  const modalIslandExpanded = document.getElementById('modal-island-expanded');
  const btnCloseIslandModal = document.getElementById('btn-close-island-modal');

  if (dynamicIsland && modalIslandExpanded) {
    dynamicIsland.addEventListener('click', () => {
      modalIslandExpanded.classList.remove('hidden');
      updateHUDMetrics();
    });
  }

  if (btnCloseIslandModal && modalIslandExpanded) {
    btnCloseIslandModal.addEventListener('click', (e) => {
      e.stopPropagation();
      modalIslandExpanded.classList.add('hidden');
    });

    modalIslandExpanded.addEventListener('click', (e) => {
      if (e.target === modalIslandExpanded) {
        modalIslandExpanded.classList.add('hidden');
      }
    });
  }

  function updateHUDMetrics() {
    const valPresence = document.getElementById('hud-val-presence');
    const valEar = document.getElementById('hud-val-ear');
    const valGaze = document.getElementById('hud-val-gaze');
    const valPosture = document.getElementById('hud-val-posture');

    if (valPresence) valPresence.textContent = `${presenceConfidence}% Confident`;
    if (valEar) valEar.textContent = `${earValue.toFixed(2)} ${earValue < 0.18 ? '⚠️ Drowsy' : '✓ Normal'}`;
    if (valGaze) valGaze.textContent = `${gazeStability}% Flow`;
    if (valPosture) valPosture.textContent = headPoseStatus;
  }

  // =========================================================================
  // 4. Real-Time Camera Access & MediaPipe Feature Extraction
  // =========================================================================
  const hudPreview = document.getElementById('hud-camera-preview');
  const bgWebcam = document.getElementById('bg-webcam');
  const camDotStreaming = document.getElementById('cam-dot-streaming');
  const camDotPending = document.getElementById('cam-dot-pending');
  const camDotDenied = document.getElementById('cam-dot-denied');
  const camOfflineBanner = document.getElementById('cam-offline-banner');

  function setCameraStatus(status) {
    if (status === 'streaming') {
      if (camDotStreaming) camDotStreaming.classList.remove('hidden');
      if (camDotPending) camDotPending.classList.add('hidden');
      if (camDotDenied) camDotDenied.classList.add('hidden');
      if (camOfflineBanner) camOfflineBanner.classList.add('hidden');
    } else if (status === 'pending') {
      if (camDotStreaming) camDotStreaming.classList.add('hidden');
      if (camDotPending) camDotPending.classList.remove('hidden');
      if (camDotPending) camDotPending.classList.add('inline-flex');
      if (camDotDenied) camDotDenied.classList.add('hidden');
    } else {
      // denied or unavailable
      if (camDotStreaming) camDotStreaming.classList.add('hidden');
      if (camDotPending) camDotPending.classList.add('hidden');
      if (camDotDenied) camDotDenied.classList.remove('hidden');
      if (camDotDenied) camDotDenied.classList.add('inline-flex');
      if (camOfflineBanner) camOfflineBanner.classList.remove('hidden');
    }
  }

  async function startWebcamAnalysis() {
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

      if (hudPreview) hudPreview.srcObject = stream;
      if (bgWebcam) bgWebcam.srcObject = stream;

      setCameraStatus('streaming');
      initializeMediaPipe();
    } catch (err) {
      console.warn('Camera permission denied or unavailable:', err);
      setCameraStatus('denied');
    }
  }

  // Camera re-init button
  const btnReInit = document.getElementById('btn-re-init-cam');
  if (btnReInit) {
    btnReInit.addEventListener('click', startWebcamAnalysis);
  }

  // MediaPipe FaceMesh
  let consecutiveEyesClosed = 0;
  let consecutiveNoFace = 0;

  function processLandmarks(landmarks) {
    consecutiveNoFace = 0;
    presenceConfidence = 99;

    // EAR: landmarks 159 & 145 (vertical), 33 & 133 (horizontal)
    const p159 = landmarks[159], p145 = landmarks[145], p33 = landmarks[33], p133 = landmarks[133];
    if (p159 && p145 && p33 && p133) {
      const vert = Math.hypot(p159.x - p145.x, p159.y - p145.y);
      const horiz = Math.hypot(p33.x - p133.x, p33.y - p133.y);
      earValue = horiz > 0 ? vert / horiz : 0.28;

      if (earValue < 0.18) {
        consecutiveEyesClosed++;
        if (consecutiveEyesClosed > 25) {
          updateRobotAndHUD('SLEEPING');
          return;
        } else if (consecutiveEyesClosed > 10) {
          updateRobotAndHUD('DROWSY');
          return;
        }
      } else {
        consecutiveEyesClosed = 0;
      }
    }

    // Head Pose / Yaw: landmark 1 (nose tip)
    const nose = landmarks[1];
    if (nose) {
      const devX = Math.abs(nose.x - 0.5);
      const devY = Math.abs(nose.y - 0.5);
      gazeStability = Math.max(70, Math.min(100, Math.round(100 - (devX + devY) * 50)));

      if (devX > 0.22) {
        headPoseStatus = 'Turned Away (>25°)';
        updateRobotAndHUD('AWAY');
      } else if (devY > 0.18) {
        headPoseStatus = 'Slumped Down';
        updateRobotAndHUD('DROWSY');
      } else {
        headPoseStatus = 'Upright (0°)';
        // Smile elevation check: mouth corners (61, 291) vs upper lip (0)
        const leftCorner = landmarks[61], rightCorner = landmarks[291], upperLip = landmarks[0];
        if (leftCorner && rightCorner && upperLip && ((leftCorner.y + rightCorner.y) / 2 < upperLip.y - 0.02)) {
          updateRobotAndHUD('ENGAGED');
        } else {
          updateRobotAndHUD('FOCUSED');
        }
      }
    }

    updateHUDMetrics();
  }

  function initializeMediaPipe() {
    if (typeof FaceMesh === 'undefined' || !bgWebcam) return;
    try {
      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMesh.onResults((results) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          processLandmarks(results.multiFaceLandmarks[0]);
        } else {
          // No face present
          consecutiveNoFace++;
          if (consecutiveNoFace > 15) {
            presenceConfidence = 0;
            headPoseStatus = 'No Face In View';
            updateRobotAndHUD('AWAY');
            updateHUDMetrics();
          }
        }
      });

      if (typeof Camera !== 'undefined') {
        const cam = new Camera(bgWebcam, {
          onFrame: async () => {
            if (bgWebcam.readyState >= 2) {
              await faceMesh.send({ image: bgWebcam });
            }
          },
          width: 640,
          height: 480
        });
        cam.start();
      }
    } catch (e) {
      console.warn('FaceMesh initialization failed:', e);
    }
  }

  startWebcamAnalysis();

  // =========================================================================
  // 5. Deep Focus Orb Aura Reactivity
  // =========================================================================
  function updateOrbAura(state) {
    const aura = document.getElementById('orb-ambient-aura');
    const resonator = document.getElementById('orb-resonator');
    const cadence = document.getElementById('orb-cadence-label');

    if (state === 'ENGAGED') {
      if (aura) aura.className = 'absolute w-72 h-72 rounded-full blur-[100px] transition-all duration-1000 pointer-events-none bg-emerald-500/20';
      if (resonator) {
        resonator.className = 'absolute w-64 h-64 md:w-72 md:h-72 rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-transparent border border-white/5 backdrop-blur-2xl animate-breathe';
        resonator.style.boxShadow = '0 0 60px rgba(16,185,129,0.25)';
      }
      if (cadence) {
        cadence.textContent = 'HIGH FLOW CADENCE';
        cadence.className = 'text-[9px] font-mono tracking-widest mt-1.5 text-emerald-300/70';
      }
    } else if (state === 'DROWSY' || state === 'SLEEPING') {
      if (aura) aura.className = 'absolute w-72 h-72 rounded-full blur-[100px] transition-all duration-1000 pointer-events-none bg-amber-500/20';
      if (resonator) {
        resonator.className = 'absolute w-64 h-64 md:w-72 md:h-72 rounded-full bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-transparent border border-white/5 backdrop-blur-2xl animate-breathe';
        resonator.style.boxShadow = '0 0 60px rgba(245,158,11,0.25)';
      }
      if (cadence) {
        cadence.textContent = 'RESTORATIVE BREATH';
        cadence.className = 'text-[9px] font-mono tracking-widest mt-1.5 text-amber-300/70';
      }
    } else if (state === 'AWAY') {
      if (aura) aura.className = 'absolute w-72 h-72 rounded-full blur-[100px] transition-all duration-1000 pointer-events-none bg-zinc-600/20';
      if (cadence) {
        cadence.textContent = 'PAUSED • STANDBY';
        cadence.className = 'text-[9px] font-mono tracking-widest mt-1.5 text-zinc-400';
      }
    } else {
      if (aura) aura.className = 'absolute w-72 h-72 rounded-full blur-[100px] transition-all duration-1000 pointer-events-none bg-cyan-500/20';
      if (resonator) {
        resonator.className = 'absolute w-64 h-64 md:w-72 md:h-72 rounded-full bg-gradient-to-tr from-cyan-500/20 via-indigo-600/15 to-transparent border border-white/5 backdrop-blur-2xl animate-breathe';
        resonator.style.boxShadow = '0 0 60px rgba(6,182,212,0.22)';
      }
      if (cadence) {
        cadence.textContent = 'CALM CADENCE';
        cadence.className = 'text-[9px] font-mono tracking-widest mt-1.5 text-cyan-300/60';
      }
    }
  }

  // =========================================================================
  // 6. Emergency Sleep Alarm Routine
  // =========================================================================
  const modalEmergencySleep = document.getElementById('modal-emergency-sleep');
  const btnDismissAlarm = document.getElementById('btn-dismiss-alarm');
  const teacherYouCard = document.getElementById('teacher-student-you-card');
  const teacherYouStatus = document.getElementById('teacher-student-you-status');
  const teacherNudgeContainer = document.getElementById('teacher-nudge-action-container');
  const railSleepPing = document.getElementById('rail-compact-sleep-ping');

  function startLoudAlarmAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!alarmAudioCtx && AudioCtx) {
        alarmAudioCtx = new AudioCtx();
      }
      if (alarmAudioCtx && alarmAudioCtx.state === 'suspended') {
        alarmAudioCtx.resume();
      }

      const soundBurst = () => {
        if (!alarmAudioCtx) return;
        const now = alarmAudioCtx.currentTime;
        const osc1 = alarmAudioCtx.createOscillator();
        const osc2 = alarmAudioCtx.createOscillator();
        const gain = alarmAudioCtx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.setValueAtTime(1760, now + 0.12);

        osc2.type = 'square';
        osc2.frequency.setValueAtTime(1200, now);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(alarmAudioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);
      };

      soundBurst();
      if (alarmInterval) clearInterval(alarmInterval);
      alarmInterval = setInterval(soundBurst, 500);
    } catch (e) {
      console.warn('Alarm audio blocked:', e);
    }
  }

  function stopAlarmAudio() {
    if (alarmInterval) {
      clearInterval(alarmInterval);
      alarmInterval = null;
    }
  }

  function triggerEmergencySleepIntervention() {
    isSleepingAlertActive = true;
    if (modalEmergencySleep) modalEmergencySleep.classList.remove('hidden');
    startLoudAlarmAudio();

    if (teacherYouCard && teacherYouStatus && teacherNudgeContainer) {
      teacherYouCard.className = 'p-2 rounded-xl border border-red-500/50 bg-red-950/40 text-xs font-mono text-red-300 animate-pulse';
      teacherYouStatus.className = 'text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40';
      teacherYouStatus.textContent = 'SLEEPING [Notification Sent]';
      teacherNudgeContainer.classList.remove('hidden');
    }
    if (railSleepPing) railSleepPing.classList.remove('hidden');

    fetch('/api/interventions/sleep-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'learner_you',
        student_name: 'You',
        ear_value: earValue,
        head_pitch_slump: -22.0,
        consecutive_drowsy_frames: 25
      })
    }).catch(e => console.log('Sleep alert sync:', e));

    if (window.lucide) window.lucide.createIcons();
  }

  function dismissSleepAlarm() {
    isSleepingAlertActive = false;
    stopAlarmAudio();

    if (modalEmergencySleep) modalEmergencySleep.classList.add('hidden');

    if (teacherYouCard && teacherYouStatus && teacherNudgeContainer) {
      teacherYouCard.className = 'p-2 rounded-xl border border-white/5 bg-white/5 text-xs font-mono text-white/80 transition-all';
      teacherYouStatus.className = 'text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400';
      teacherYouStatus.textContent = 'Focusing [EAR 0.28]';
      teacherNudgeContainer.classList.add('hidden');
    }
    if (railSleepPing) railSleepPing.classList.add('hidden');

    updateRobotAndHUD('FOCUSED');
  }

  if (btnDismissAlarm) {
    btnDismissAlarm.addEventListener('click', dismissSleepAlarm);
  }

  // Teacher Remote Nudge
  const btnTeacherSendNudge = document.getElementById('btn-teacher-send-nudge');
  if (btnTeacherSendNudge) {
    btnTeacherSendNudge.addEventListener('click', () => {
      fetch('/api/teacher/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 'learner_you',
          nudge_type: 'WAKE_UP',
          custom_message: "Wake up! You've got this! 🔥"
        })
      }).then(() => {
        dismissSleepAlarm();
      });
    });
  }

  // =========================================================================
  // 7. LeetCode Workspace & Socratic AI Tutor
  // =========================================================================
  const tabProblem = document.getElementById('tab-btn-problem');
  const tabCode = document.getElementById('tab-btn-code');
  const paneProblem = document.getElementById('pane-problem');
  const paneCode = document.getElementById('pane-code');

  if (tabProblem && tabCode && paneProblem && paneCode) {
    tabProblem.addEventListener('click', () => {
      tabProblem.className = 'flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 text-white transition-all';
      tabCode.className = 'flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all';
      paneProblem.classList.remove('hidden');
      paneCode.classList.add('hidden');
    });

    tabCode.addEventListener('click', () => {
      tabCode.className = 'flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 text-white transition-all';
      tabProblem.className = 'flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all';
      paneCode.classList.remove('hidden');
      paneProblem.classList.add('hidden');
    });
  }

  const btnPython = document.getElementById('btn-lang-python');
  const btnTs = document.getElementById('btn-lang-ts');

  if (btnPython && btnTs) {
    btnPython.addEventListener('click', () => {
      btnPython.className = 'px-2 py-0.5 rounded-md bg-white/15 text-white font-bold transition-all';
      btnTs.className = 'px-2 py-0.5 rounded-md text-white/40 hover:text-white transition-all';
      if (editorEl) editorEl.value = pythonCode;
    });

    btnTs.addEventListener('click', () => {
      btnTs.className = 'px-2 py-0.5 rounded-md bg-white/15 text-white font-bold transition-all';
      btnPython.className = 'px-2 py-0.5 rounded-md text-white/40 hover:text-white transition-all';
      if (editorEl) editorEl.value = tsCode;
    });
  }

  const btnRun = document.getElementById('btn-run-code');
  const paneOutput = document.getElementById('pane-output');
  const outputText = document.getElementById('output-text');
  const runLabel = document.getElementById('run-code-label');

  if (btnRun && paneOutput && outputText) {
    btnRun.addEventListener('click', () => {
      if (runLabel) runLabel.textContent = 'Testing...';

      setTimeout(() => {
        if (runLabel) runLabel.textContent = 'Run';
        paneOutput.classList.remove('hidden');

        const currentVal = editorEl ? editorEl.value : '';
        if (currentVal.includes('seen') && (currentVal.includes('target -') || currentVal.includes('target-'))) {
          outputText.innerHTML = `Output: [0, 1]\nCase 1: Passed ✅ (target=9, nums=[2,7,11,15])\nCase 2: Passed ✅ (target=6, nums=[3,2,4])\nRuntime: 54ms • Memory: 15.2MB`;
          codeFailCount = 0;
        } else {
          outputText.innerHTML = `Runtime Error: Test Case 2 failed. Expected [1, 2], got [].\nTip: Validate complement storage in map.`;
          codeFailCount++;
          if (codeFailCount >= 2) {
            addTutorMessage("Notice that iterating with nested loops takes O(N²). How can the dictionary index lookup reduce this to a single O(N) pass?", true);
          }
        }
        if (window.lucide) window.lucide.createIcons();
      }, 500);
    });

    const btnCloseOut = document.getElementById('btn-close-output');
    if (btnCloseOut) {
      btnCloseOut.addEventListener('click', () => {
        paneOutput.classList.add('hidden');
      });
    }
  }

  // Socratic AI Tutor
  const tutorHeader = document.getElementById('tutor-header');
  const tutorContent = document.getElementById('tutor-content');
  const tutorChevron = document.getElementById('tutor-chevron');
  const tutorChat = document.getElementById('tutor-chat-history');
  const tutorInput = document.getElementById('tutor-input');
  const btnTutorSend = document.getElementById('btn-tutor-send');
  let isTutorOpen = true;

  if (tutorHeader && tutorContent) {
    tutorHeader.addEventListener('click', () => {
      isTutorOpen = !isTutorOpen;
      tutorContent.classList.toggle('hidden');
      if (tutorChevron) {
        tutorChevron.setAttribute('data-lucide', isTutorOpen ? 'chevron-down' : 'chevron-up');
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  function addTutorMessage(text, isHint = false) {
    if (!tutorChat) return;
    const msg = document.createElement('div');
    if (isHint) {
      msg.className = 'p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200/90 leading-relaxed animate-fadeIn';
      msg.innerHTML = `
        <div class="flex items-center space-x-1 text-[10px] text-amber-400 font-mono mb-1 font-semibold">
          <i data-lucide="lightbulb" class="w-3 h-3"></i>
          <span>Gentle Micro-Hint</span>
        </div>
        <p>${text}</p>
      `;
    } else {
      msg.className = 'p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 leading-relaxed animate-fadeIn';
      msg.innerHTML = `<p>${text}</p>`;
    }
    tutorChat.appendChild(msg);
    tutorChat.scrollTop = tutorChat.scrollHeight;
    if (window.lucide) window.lucide.createIcons();
  }

  function handleTutorSend() {
    if (!tutorInput || !tutorInput.value.trim()) return;
    const q = tutorInput.value.trim();
    tutorInput.value = '';

    const userMsg = document.createElement('div');
    userMsg.className = 'p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 ml-6 text-right leading-relaxed animate-fadeIn';
    userMsg.innerHTML = `<p>${q}</p>`;
    tutorChat.appendChild(userMsg);
    tutorChat.scrollTop = tutorChat.scrollHeight;

    setTimeout(() => {
      let reply = "Good thought. What data structure would give you O(1) instant recall of numbers you've already traversed?";
      if (q.toLowerCase().includes('hash') || q.toLowerCase().includes('map') || q.toLowerCase().includes('dict')) {
        reply = "Exactly right! Storing `target - num` allows you to solve it in a single linear scan.";
      } else if (q.toLowerCase().includes('hint') || q.toLowerCase().includes('stuck')) {
        reply = "Try writing out the first 2 iterations by hand: for num=2, target-2 is 7. Where can you save 2 for fast lookup?";
      }
      addTutorMessage(reply);
    }, 600);
  }

  if (btnTutorSend) btnTutorSend.addEventListener('click', handleTutorSend);
  if (tutorInput) {
    tutorInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleTutorSend();
    });
  }

  // =========================================================================
  // 8. Hidden Time Metric on Hover
  // =========================================================================
  function formatMMSS(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  setInterval(() => {
    if (isTimerActive && secondsRemaining > 0 && detectedState !== 'SLEEPING') {
      secondsRemaining--;
      const timeText = document.getElementById('revealed-time-text');
      if (timeText) timeText.textContent = formatMMSS(secondsRemaining);

      const elapsed = totalSessionSeconds - secondsRemaining;
      const pct = elapsed / totalSessionSeconds;
      const offset = 1005.3 - pct * 1005.3;
      const ring = document.getElementById('orb-hairline-progress');
      if (ring) ring.style.strokeDashoffset = offset;
    }

    // Continuous 1-Minute Drowsiness Tracking
    if (detectedState === 'DROWSY' || (earValue < 0.22 && detectedState !== 'AWAY')) {
      continuousDrowsySeconds++;
      const islandDrowsyBadge = document.getElementById('island-drowsy-badge');
      const islandDrowsyTimerText = document.getElementById('island-drowsy-timer-text');
      if (islandDrowsyBadge && islandDrowsyTimerText) {
        islandDrowsyBadge.classList.remove('hidden');
        islandDrowsyTimerText.textContent = `${continuousDrowsySeconds}s / 60s`;
      }

      if (continuousDrowsySeconds >= DROWSY_NOTIFICATION_THRESHOLD_SEC && !hasDispatchedDrowsyAlert) {
        trigger1MinDrowsinessNotification();
        hasDispatchedDrowsyAlert = true;
      }
    } else {
      if (continuousDrowsySeconds > 0) {
        continuousDrowsySeconds = 0;
        hasDispatchedDrowsyAlert = false;
        const islandDrowsyBadge = document.getElementById('island-drowsy-badge');
        if (islandDrowsyBadge) islandDrowsyBadge.classList.add('hidden');
      }
    }
  }, 1000);

  // =========================================================================
  // 8b. Prolonged Drowsiness Notification System (1 Minute)
  // =========================================================================
  const bannerDrowsy1Min = document.getElementById('banner-drowsy-1min');
  const btnDismissDrowsy = document.getElementById('btn-dismiss-drowsy');

  function playGentleWakingChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = ctx.currentTime + (idx * 0.16);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.001, start);
          gain.gain.exponentialRampToValueAtTime(0.3, start + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + 0.36);
        });
      }
    } catch (e) {
      console.warn('Audio chime blocked or unavailable:', e);
    }
  }

  function trigger1MinDrowsinessNotification() {
    // 1. Play gentle waking chime
    playGentleWakingChime();

    // 2. Show in-app banner
    if (bannerDrowsy1Min) {
      bannerDrowsy1Min.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }

    // 3. Dispatch Desktop / Browser Push Notification
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification('FocusMind Alert: 1 Minute Drowsiness Detected ⚠️', {
            body: "You've been drowsy for 60 seconds. Sit upright, stretch, or take a quick sip of water!",
            icon: 'https://cdn-icons-png.flaticon.com/512/3588/3588294.png',
            tag: 'focusmind-drowsy-alert'
          });
        } catch (err) {
          console.warn('Notification dispatch failed:', err);
        }
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            try {
              new Notification('FocusMind Alert: 1 Minute Drowsiness Detected ⚠️', {
                body: "You've been drowsy for 60 seconds. Sit upright, stretch, or take a quick sip of water!"
              });
            } catch (err) {}
          }
        });
      }
    }

    // 4. Update Teacher Realtime Monitor
    const teacherYouCard = document.getElementById('teacher-student-you-card');
    const teacherYouStatus = document.getElementById('teacher-student-you-status');
    const teacherNudgeContainer = document.getElementById('teacher-nudge-action-container');
    if (teacherYouCard && teacherYouStatus && teacherNudgeContainer) {
      teacherYouCard.className = 'p-2 rounded-xl border border-amber-500/50 bg-amber-950/40 text-xs font-mono text-amber-300 animate-pulse';
      teacherYouStatus.className = 'text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40';
      teacherYouStatus.textContent = 'DROWSY (1 min) [Notification Sent]';
      teacherNudgeContainer.classList.remove('hidden');
    }

    // 5. Dispatch Backend API Notification
    fetch('/api/interventions/drowsy-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'learner_you',
        student_name: 'You',
        drowsy_duration_seconds: continuousDrowsySeconds,
        ear_value: earValue,
        head_pitch_slump: -18.0,
        notification_channel: 'BROWSER_AND_TEACHER'
      })
    }).catch(e => console.log('Drowsy notification sync error:', e));
  }

  function dismissDrowsyAlert() {
    continuousDrowsySeconds = 0;
    hasDispatchedDrowsyAlert = false;
    if (bannerDrowsy1Min) bannerDrowsy1Min.classList.add('hidden');
    const islandDrowsyBadge = document.getElementById('island-drowsy-badge');
    if (islandDrowsyBadge) islandDrowsyBadge.classList.add('hidden');

    const teacherYouCard = document.getElementById('teacher-student-you-card');
    const teacherYouStatus = document.getElementById('teacher-student-you-status');
    const teacherNudgeContainer = document.getElementById('teacher-nudge-action-container');
    if (teacherYouCard && teacherYouStatus && teacherNudgeContainer) {
      teacherYouCard.className = 'p-2 rounded-xl border border-white/5 bg-white/5 text-xs font-mono text-white/80 transition-all';
      teacherYouStatus.className = 'text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400';
      teacherYouStatus.textContent = 'Focusing [EAR 0.28]';
      teacherNudgeContainer.classList.add('hidden');
    }
    updateRobotAndHUD('FOCUSED');
  }

  if (btnDismissDrowsy) {
    btnDismissDrowsy.addEventListener('click', dismissDrowsyAlert);
  }

  // Request notification permission smoothly on first click anywhere
  window.addEventListener('click', () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, { once: true });


  // =========================================================================
  // 9. Zoom Classroom & Co-Host Manager System
  // =========================================================================
  const modalZoom = document.getElementById('modal-zoom-classroom');
  const btnOpenZoomCompact = document.getElementById('btn-open-zoom-compact');
  const btnOpenZoomExpanded = document.getElementById('btn-open-zoom-expanded');
  const btnCloseZoomModal = document.getElementById('btn-close-zoom-modal');
  const btnSaveZoomSettings = document.getElementById('btn-save-zoom-settings');
  const zoomToast = document.getElementById('zoom-toast');
  const zoomToastText = document.getElementById('zoom-toast-text');

  // Tabs
  const btnZoomTabHost = document.getElementById('btn-zoom-tab-host');
  const btnZoomTabSecurity = document.getElementById('btn-zoom-tab-security');
  const btnZoomTabDevices = document.getElementById('btn-zoom-tab-devices');
  const tabContentHost = document.getElementById('zoom-tab-content-host');
  const tabContentSecurity = document.getElementById('zoom-tab-content-security');
  const tabContentDevices = document.getElementById('zoom-tab-content-devices');

  // Tab 1 controls
  const zoomToggleCohost = document.getElementById('zoom-toggle-cohost');
  const zoomToggleAlthost = document.getElementById('zoom-toggle-althost');
  const zoomInputAltEmail = document.getElementById('zoom-input-althost-email');
  const btnZoomAddAltEmail = document.getElementById('btn-zoom-add-althost');
  const zoomAltHostsContainer = document.getElementById('zoom-althosts-container');

  // Tab 2 controls
  const zoomToggleWaitingRoom = document.getElementById('zoom-toggle-waitingroom');
  const zoomTogglePolls = document.getElementById('zoom-toggle-polls');
  const zoomSelectScreenshare = document.getElementById('zoom-select-screenshare');
  const zoomShieldCard = document.getElementById('zoom-security-shield-card');

  // Tab 3 controls
  const zoomDevicesContainer = document.getElementById('zoom-devices-container');

  // Local state mirror
  let zoomState = {
    co_host_enabled: true,
    alternative_host_enabled: true,
    alternative_hosts: ['teacher.lead@school.edu', 'prof.math@school.edu'],
    waiting_room_enabled: true,
    allow_alt_hosts_polls_breakout: true,
    screen_share_rule: 'Host and Co-hosts only',
    security_shield_active: true,
    meeting_verified: true,
    connected_devices: [
      { device_id: 'dev_primary_laptop', name: 'Teacher Laptop (Primary)', device_type: 'Primary Laptop', role: 'Host', email: 'teacher.lead@school.edu' },
      { device_id: 'dev_display_1', name: 'Classroom Smartboard 302', device_type: 'Classroom Display', role: 'Co-Host', email: 'prof.math@school.edu' },
      { device_id: 'dev_tablet_1', name: 'Teacher iPad Pro', device_type: 'Teacher Tablet', role: 'Co-Host', email: 'teacher.lead@school.edu' },
      { device_id: 'dev_student_1', name: 'Student Lab Device', device_type: 'Student Laptop', role: 'Participant', email: 'student@school.edu' }
    ]
  };

  function showZoomToast(msg) {
    if (!zoomToast || !zoomToastText) return;
    zoomToastText.textContent = msg;
    zoomToast.classList.remove('hidden');
    setTimeout(() => {
      zoomToast.classList.add('hidden');
    }, 3500);
  }

  function switchZoomTab(tabName) {
    const tabs = [
      { name: 'host', btn: btnZoomTabHost, content: tabContentHost },
      { name: 'security', btn: btnZoomTabSecurity, content: tabContentSecurity },
      { name: 'devices', btn: btnZoomTabDevices, content: tabContentDevices }
    ];

    tabs.forEach(t => {
      if (!t.btn || !t.content) return;
      if (t.name === tabName) {
        t.content.classList.remove('hidden');
        t.btn.className = 'flex-1 py-2 rounded-xl transition-all font-semibold flex items-center justify-center space-x-2 bg-white/15 text-white shadow';
      } else {
        t.content.classList.add('hidden');
        t.btn.className = 'flex-1 py-2 rounded-xl transition-all font-semibold flex items-center justify-center space-x-2 text-white/40 hover:text-white';
      }
    });
    if (window.lucide) window.lucide.createIcons();
  }

  if (btnZoomTabHost) btnZoomTabHost.addEventListener('click', () => switchZoomTab('host'));
  if (btnZoomTabSecurity) btnZoomTabSecurity.addEventListener('click', () => switchZoomTab('security'));
  if (btnZoomTabDevices) btnZoomTabDevices.addEventListener('click', () => switchZoomTab('devices'));

  function updateSecurityShieldUI() {
    const isWaitingRoom = zoomToggleWaitingRoom ? zoomToggleWaitingRoom.checked : true;
    const isRestrictedShare = zoomSelectScreenshare ? (zoomSelectScreenshare.value === 'Host and Co-hosts only') : true;
    const isShieldActive = isWaitingRoom && isRestrictedShare;

    if (zoomShieldCard) {
      if (isShieldActive) {
        zoomShieldCard.className = 'p-4 rounded-2xl border transition-all bg-emerald-950/20 border-emerald-500/40 text-emerald-300';
        zoomShieldCard.innerHTML = `
          <div class="flex items-center space-x-2.5">
            <i data-lucide="shield-check" class="w-5 h-5 text-emerald-400"></i>
            <div>
              <div class="text-xs font-bold">In-Meeting Security Shield: ACTIVE</div>
              <div class="text-[11px] text-white/70">Waiting Room is active & Screen Sharing restricted to Host and Co-hosts.</div>
            </div>
          </div>
        `;
      } else {
        zoomShieldCard.className = 'p-4 rounded-2xl border transition-all bg-amber-950/20 border-amber-500/40 text-amber-300';
        zoomShieldCard.innerHTML = `
          <div class="flex items-center space-x-2.5">
            <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-400"></i>
            <div>
              <div class="text-xs font-bold">In-Meeting Security Shield: ATTENTION</div>
              <div class="text-[11px] text-white/70">Enable Waiting Room and restrict screen share to Host & Co-hosts for maximum security.</div>
            </div>
          </div>
        `;
      }
      if (window.lucide) window.lucide.createIcons();
    }
  }

  if (zoomToggleWaitingRoom) zoomToggleWaitingRoom.addEventListener('change', updateSecurityShieldUI);
  if (zoomSelectScreenshare) zoomSelectScreenshare.addEventListener('change', updateSecurityShieldUI);

  function renderAltHostsList() {
    if (!zoomAltHostsContainer) return;
    zoomAltHostsContainer.innerHTML = '';

    zoomState.alternative_hosts.forEach((email) => {
      const item = document.createElement('div');
      item.className = 'flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs font-mono';
      item.innerHTML = `
        <div class="flex items-center space-x-2">
          <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-400"></i>
          <span class="text-white">${email}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Alternative Host</span>
        </div>
        <button data-email="${email}" class="btn-remove-alt-host text-white/30 hover:text-red-400 transition-colors p-1" title="Remove">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
      `;
      zoomAltHostsContainer.appendChild(item);
    });

    // Wire delete buttons
    zoomAltHostsContainer.querySelectorAll('.btn-remove-alt-host').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetEmail = btn.getAttribute('data-email');
        zoomState.alternative_hosts = zoomState.alternative_hosts.filter(em => em !== targetEmail);
        renderAltHostsList();
        showZoomToast(`Removed ${targetEmail} from Alternative Hosts`);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function handleAddAltHost() {
    if (!zoomInputAltEmail || !zoomInputAltEmail.value.trim()) return;
    const email = zoomInputAltEmail.value.trim();
    if (!email.includes('@')) {
      showZoomToast('Please enter a valid email address');
      return;
    }
    if (zoomState.alternative_hosts.includes(email)) {
      showZoomToast('Email is already registered as Alternative Host');
      return;
    }
    zoomState.alternative_hosts.push(email);
    zoomInputAltEmail.value = '';
    renderAltHostsList();
    showZoomToast(`Added ${email} to Alternative Hosts`);
  }

  if (btnZoomAddAltEmail) btnZoomAddAltEmail.addEventListener('click', handleAddAltHost);
  if (zoomInputAltEmail) {
    zoomInputAltEmail.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleAddAltHost();
    });
  }

  function renderDevicesList() {
    if (!zoomDevicesContainer) return;
    zoomDevicesContainer.innerHTML = '';

    zoomState.connected_devices.forEach((dev) => {
      const card = document.createElement('div');
      card.className = 'p-3 rounded-2xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs';

      let iconHtml = '<i data-lucide="laptop" class="w-4 h-4 text-cyan-400"></i>';
      if (dev.device_type.toLowerCase().includes('display') || dev.device_type.toLowerCase().includes('board')) {
        iconHtml = '<i data-lucide="monitor" class="w-4 h-4 text-indigo-400"></i>';
      } else if (dev.device_type.toLowerCase().includes('tablet') || dev.device_type.toLowerCase().includes('ipad')) {
        iconHtml = '<i data-lucide="tablet" class="w-4 h-4 text-emerald-400"></i>';
      }

      let roleBadge = '';
      if (dev.role === 'Host') {
        roleBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Host</span>';
      } else if (dev.role === 'Co-Host') {
        roleBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Co-Host</span>';
      } else {
        roleBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-mono text-white/50 bg-white/5 border border-white/10">Participant</span>';
      }

      let actionsHtml = '';
      if (dev.role !== 'Host') {
        if (dev.role !== 'Co-Host') {
          actionsHtml += `
            <button data-id="${dev.device_id}" data-role="Co-Host" class="btn-promote-dev px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono transition-all">
              Make Co-Host
            </button>
          `;
        }
        actionsHtml += `
          <button data-id="${dev.device_id}" data-role="Host" class="btn-promote-dev px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-[11px] font-mono transition-all">
            Make Host
          </button>
        `;
      } else {
        actionsHtml = '<span class="text-[10px] text-white/40 font-mono">Primary Session Leader</span>';
      }

      card.innerHTML = `
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
            ${iconHtml}
          </div>
          <div>
            <div class="font-bold text-white flex items-center space-x-2">
              <span>${dev.name}</span>
              ${roleBadge}
            </div>
            <div class="text-[11px] text-white/40 font-mono">${dev.device_type} • ${dev.email || 'device@school.edu'}</div>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          ${actionsHtml}
        </div>
      `;

      zoomDevicesContainer.appendChild(card);
    });

    // Wire device promotion buttons
    zoomDevicesContainer.querySelectorAll('.btn-promote-dev').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const devId = btn.getAttribute('data-id');
        const newRole = btn.getAttribute('data-role');
        try {
          const res = await fetch('/api/zoom/devices/role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_id: devId, new_role: newRole, admit_from_waiting_room: true })
          });
          if (res.ok) {
            const dev = zoomState.connected_devices.find(d => d.device_id === devId);
            if (dev) dev.role = newRole;
            renderDevicesList();
            showZoomToast(`Device role updated to ${newRole}`);
            return;
          }
        } catch (e) {
          console.log('Offline fallback for device role promotion:', e);
        }
        // Fallback locally
        const dev = zoomState.connected_devices.find(d => d.device_id === devId);
        if (dev) dev.role = newRole;
        renderDevicesList();
        showZoomToast(`Device promoted to ${newRole}`);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  async function fetchZoomSettingsFromServer() {
    try {
      const res = await fetch('/api/zoom/settings');
      if (res.ok) {
        const data = await res.json();
        zoomState = data;
        if (zoomToggleCohost) zoomToggleCohost.checked = data.co_host_enabled;
        if (zoomToggleAlthost) zoomToggleAlthost.checked = data.alternative_host_enabled;
        if (zoomToggleWaitingRoom) zoomToggleWaitingRoom.checked = data.waiting_room_enabled;
        if (zoomTogglePolls) zoomTogglePolls.checked = data.allow_alt_hosts_polls_breakout;
        if (zoomSelectScreenshare) zoomSelectScreenshare.value = data.screen_share_rule;
      }
    } catch (e) {
      console.log('Using default zoom settings:', e);
    }
    renderAltHostsList();
    renderDevicesList();
    updateSecurityShieldUI();
  }

  function openZoomModal() {
    if (!modalZoom) return;
    modalZoom.classList.remove('hidden');
    fetchZoomSettingsFromServer();
  }

  function closeZoomModal() {
    if (!modalZoom) return;
    modalZoom.classList.add('hidden');
  }

  if (btnOpenZoomCompact) btnOpenZoomCompact.addEventListener('click', openZoomModal);
  if (btnOpenZoomExpanded) btnOpenZoomExpanded.addEventListener('click', openZoomModal);
  if (btnCloseZoomModal) btnCloseZoomModal.addEventListener('click', closeZoomModal);

  // Close on backdrop click
  if (modalZoom) {
    modalZoom.addEventListener('click', (e) => {
      if (e.target === modalZoom) closeZoomModal();
    });
  }

  // Save Settings & Sync button
  if (btnSaveZoomSettings) {
    btnSaveZoomSettings.addEventListener('click', async () => {
      const payload = {
        co_host_enabled: zoomToggleCohost ? zoomToggleCohost.checked : true,
        alternative_host_enabled: zoomToggleAlthost ? zoomToggleAlthost.checked : true,
        alternative_hosts: zoomState.alternative_hosts,
        waiting_room_enabled: zoomToggleWaitingRoom ? zoomToggleWaitingRoom.checked : true,
        allow_alt_hosts_polls_breakout: zoomTogglePolls ? zoomTogglePolls.checked : true,
        screen_share_rule: zoomSelectScreenshare ? zoomSelectScreenshare.value : 'Host and Co-hosts only'
      };

      try {
        const res = await fetch('/api/zoom/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          zoomState = data;
          showZoomToast('✓ Zoom Classroom Settings Synchronized & Verified');
          updateSecurityShieldUI();
          return;
        }
      } catch (e) {
        console.log('Offline fallback for save zoom settings:', e);
      }
      showZoomToast('✓ Zoom Classroom Settings Saved Locally');
      updateSecurityShieldUI();
    });
  }

  // Initialize Default State
  updateRobotAndHUD('FOCUSED');
});
