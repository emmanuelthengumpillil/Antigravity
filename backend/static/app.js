/**
 * FocusMind OLED Coding & Deep Focus Platform
 * Ambient Multi-Panel Architecture & Robot Companion
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // =========================================================================
  // State
  // =========================================================================
  let dominantEmotion = 'FOCUSED'; // 'FOCUSED' | 'HAPPY' | 'EXCITED' | 'ANXIOUS' | 'SAD'
  let secondsRemaining = 25 * 60;
  const totalSessionSeconds = 25 * 60;
  let isTimerActive = true;
  let codeFailCount = 0;

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
  // 1. Animated Expressive Micro-Robot Companion
  // =========================================================================
  const robotEyeLeft = document.getElementById('robot-eye-left');
  const robotEyeRight = document.getElementById('robot-eye-right');
  const robotBlinkLeft = document.getElementById('robot-blink-left');
  const robotBlinkRight = document.getElementById('robot-blink-right');
  const robotMouth = document.getElementById('robot-mouth');
  const robotAntenna = document.getElementById('robot-antenna-light');

  // Eye blinking
  setInterval(() => {
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
    const robotFeatures = document.getElementById('robot-face-features');
    if (robotFeatures) {
      const centerX = window.innerWidth / 2;
      const centerY = 50;
      const dx = Math.max(-2, Math.min(2, (e.clientX - centerX) / 150));
      const dy = Math.max(-1.5, Math.min(1.5, (e.clientY - centerY) / 90));
      robotFeatures.setAttribute('transform', `translate(${dx}, ${dy})`);
    }
  });

  function updateRobotEmotion(emo) {
    let color = '#06b6d4'; // Cyan for FOCUSED
    let mouthPath = 'M 16 27 L 28 27'; // Neutral line

    if (emo === 'HAPPY' || emo === 'EXCITED') {
      color = '#10b981'; // Emerald
      mouthPath = 'M 14 26 Q 22 32 30 26'; // Smile
    } else if (emo === 'ANXIOUS') {
      color = '#f59e0b'; // Amber
      mouthPath = 'M 15 29 Q 22 24 29 29'; // Empathetic curve
    } else if (emo === 'SAD') {
      color = '#60a5fa'; // Blue
      mouthPath = 'M 15 29 Q 22 24 29 29';
    }

    if (robotEyeLeft) robotEyeLeft.setAttribute('fill', color);
    if (robotEyeRight) robotEyeRight.setAttribute('fill', color);
    if (robotBlinkLeft) robotBlinkLeft.setAttribute('stroke', color);
    if (robotBlinkRight) robotBlinkRight.setAttribute('stroke', color);
    if (robotMouth) {
      robotMouth.setAttribute('stroke', color);
      robotMouth.setAttribute('d', mouthPath);
    }
    if (robotAntenna) robotAntenna.setAttribute('fill', color);

    // Update island badge
    const labelEl = document.getElementById('island-emotion-label');
    const btnDrop = document.getElementById('btn-emotion-dropdown');
    if (labelEl) labelEl.textContent = `[${emo}]`;

    if (btnDrop) {
      if (emo === 'HAPPY' || emo === 'EXCITED') {
        btnDrop.className = 'flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 transition-all hover:scale-105 active:scale-95';
      } else if (emo === 'ANXIOUS') {
        btnDrop.className = 'flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider border border-amber-500/30 text-amber-400 bg-amber-500/10 transition-all hover:scale-105 active:scale-95';
      } else if (emo === 'SAD') {
        btnDrop.className = 'flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider border border-blue-500/30 text-blue-400 bg-blue-500/10 transition-all hover:scale-105 active:scale-95';
      } else {
        btnDrop.className = 'flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider border border-cyan-500/30 text-cyan-400 bg-cyan-500/10 transition-all hover:scale-105 active:scale-95';
      }
    }

    // Update Deep Focus Orb aura
    updateOrbAura(emo);

    // Socratic AI Tutor notification on anxiety/stress
    if (emo === 'ANXIOUS' || emo === 'SAD') {
      addTutorMessage(
        "Take a slow, deep breath. You're tackling complex constraints. What if you used a dictionary to store previously checked targets in O(1)?",
        true
      );
    }
  }

  // Emotion Dropdown Toggle
  const btnEmoDrop = document.getElementById('btn-emotion-dropdown');
  const menuEmoDrop = document.getElementById('emotion-dropdown-menu');
  if (btnEmoDrop && menuEmoDrop) {
    btnEmoDrop.addEventListener('click', () => {
      menuEmoDrop.classList.toggle('hidden');
    });

    document.querySelectorAll('.btn-select-emo').forEach(b => {
      b.addEventListener('click', () => {
        const emo = b.getAttribute('data-emotion');
        dominantEmotion = emo;
        updateRobotEmotion(emo);
        menuEmoDrop.classList.add('hidden');
      });
    });
  }

  // =========================================================================
  // 2. Hidden Metric: Exact Time Reveal on Hover / Tap
  // =========================================================================
  const metricContainer = document.getElementById('hidden-metric-container');
  const ambientIndicator = document.getElementById('ambient-flow-indicator');
  const revealedTimePill = document.getElementById('revealed-time-pill');
  const revealedTimeText = document.getElementById('revealed-time-text');

  function formatMMSS(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  if (metricContainer && ambientIndicator && revealedTimePill) {
    metricContainer.addEventListener('mouseenter', () => {
      if (revealedTimeText) revealedTimeText.textContent = formatMMSS(secondsRemaining);
      ambientIndicator.classList.add('hidden');
      revealedTimePill.classList.remove('hidden');
      revealedTimePill.classList.add('flex');
    });

    metricContainer.addEventListener('mouseleave', () => {
      revealedTimePill.classList.add('hidden');
      revealedTimePill.classList.remove('flex');
      ambientIndicator.classList.remove('hidden');
    });
  }

  // Ambient Session Tick (imperceptible perimeter ring progression, NO NUMERIC DIGITS in center)
  setInterval(() => {
    if (isTimerActive && secondsRemaining > 0) {
      secondsRemaining--;
      if (revealedTimeText) revealedTimeText.textContent = formatMMSS(secondsRemaining);

      // Hairline progress circumference = 2 * PI * 160 = 1005.3
      const elapsed = totalSessionSeconds - secondsRemaining;
      const pct = elapsed / totalSessionSeconds;
      const offset = 1005.3 - pct * 1005.3;
      const ring = document.getElementById('orb-hairline-progress');
      if (ring) ring.style.strokeDashoffset = offset;
    }
  }, 1000);

  // =========================================================================
  // 3. Center Canvas Deep Focus Orb Aura Shifts
  // =========================================================================
  function updateOrbAura(emo) {
    const aura = document.getElementById('orb-ambient-aura');
    const resonator = document.getElementById('orb-resonator');
    const cadence = document.getElementById('orb-cadence-label');

    if (emo === 'HAPPY' || emo === 'EXCITED') {
      if (aura) aura.className = 'absolute w-72 h-72 rounded-full blur-[100px] transition-all duration-1000 pointer-events-none bg-emerald-500/20';
      if (resonator) {
        resonator.className = 'absolute w-64 h-64 md:w-72 md:h-72 rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-transparent border border-white/5 backdrop-blur-2xl animate-breathe';
        resonator.style.boxShadow = '0 0 60px rgba(16,185,129,0.25)';
      }
      if (cadence) {
        cadence.textContent = 'HIGH FLOW CADENCE';
        cadence.className = 'text-[9px] font-mono tracking-widest mt-1.5 text-emerald-300/70';
      }
    } else if (emo === 'ANXIOUS') {
      if (aura) aura.className = 'absolute w-72 h-72 rounded-full blur-[100px] transition-all duration-1000 pointer-events-none bg-amber-500/20';
      if (resonator) {
        resonator.className = 'absolute w-64 h-64 md:w-72 md:h-72 rounded-full bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-transparent border border-white/5 backdrop-blur-2xl animate-breathe';
        resonator.style.boxShadow = '0 0 60px rgba(245,158,11,0.25)';
      }
      if (cadence) {
        cadence.textContent = 'RESTORATIVE BREATH';
        cadence.className = 'text-[9px] font-mono tracking-widest mt-1.5 text-amber-300/70';
      }
    } else if (emo === 'SAD') {
      if (aura) aura.className = 'absolute w-72 h-72 rounded-full blur-[100px] transition-all duration-1000 pointer-events-none bg-blue-500/20';
      if (resonator) {
        resonator.className = 'absolute w-64 h-64 md:w-72 md:h-72 rounded-full bg-gradient-to-tr from-blue-500/20 via-indigo-500/15 to-transparent border border-white/5 backdrop-blur-2xl animate-breathe';
        resonator.style.boxShadow = '0 0 60px rgba(59,130,246,0.25)';
      }
      if (cadence) {
        cadence.textContent = 'GENTLE RECOVERY';
        cadence.className = 'text-[9px] font-mono tracking-widest mt-1.5 text-blue-300/70';
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
  // 4. Right Panel: LeetCode Workspace & Code Runner
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
          outputText.innerHTML = `Output: [0, 1]\nCase 1: Passed ✅ (target=9, nums=[2,7,11,15])\nCase 2: Passed ✅ (target=6, nums=[3,2,4])\nRuntime: 54ms • Memory: 15.2MB (Beats 91.4%)`;
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

  // =========================================================================
  // 5. Embedded Socratic AI Tutor ("AI Bot Here")
  // =========================================================================
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

    // Add user message
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
  // 6. Camera Popover & MediaPipe Background Telemetry
  // =========================================================================
  const btnPopCamera = document.getElementById('btn-pop-camera');
  const modalCamera = document.getElementById('modal-camera-hud');
  const btnCloseCam = document.getElementById('btn-close-cam-modal');
  const hudPreview = document.getElementById('hud-camera-preview');
  const bgWebcam = document.getElementById('bg-webcam');

  if (btnPopCamera && modalCamera) {
    btnPopCamera.addEventListener('click', () => {
      modalCamera.classList.remove('hidden');
    });
  }

  if (btnCloseCam && modalCamera) {
    btnCloseCam.addEventListener('click', () => {
      modalCamera.classList.add('hidden');
    });
  }

  async function startBackgroundCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      if (hudPreview) hudPreview.srcObject = stream;
      if (bgWebcam) bgWebcam.srcObject = stream;
    } catch (err) {
      console.log('Camera running in synthetic mode or permission pending');
    }
  }

  startBackgroundCamera();

  // Initialize
  updateRobotEmotion('FOCUSED');
});
