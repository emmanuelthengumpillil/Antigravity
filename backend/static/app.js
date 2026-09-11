/**
 * FocusMind OLED Dark Mode — Ambient Pomodoro & Emotional Intelligence Platform
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // =========================================================================
  // State Definitions & Initial Values
  // =========================================================================
  const PRESETS = {
    STANDARD: { name: '25/5 Standard', work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 },
    DEEP_WORK: { name: '50/10 Deep', work: 50 * 60, shortBreak: 10 * 60, longBreak: 20 * 60 },
    QUICK_TEST: { name: 'Quick Test', work: 10, shortBreak: 5, longBreak: 10 }
  };

  const EMOTIONS = {
    HAPPY: { label: 'HAPPY', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
    FOCUSED: { label: 'FOCUSED', color: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-500/30' },
    ANXIOUS: { label: 'ANXIOUS', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
    SAD: { label: 'SAD', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
    EXCITED: { label: 'EXCITED', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20', border: 'border-fuchsia-500/30' }
  };

  let currentPreset = 'STANDARD';
  let currentState = 'WORK'; // 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK'
  let timeLeft = PRESETS.STANDARD.work;
  let timerInterval = null;
  let isTimerActive = false;
  let sessionsCompleted = 0;
  let soundEnabled = true;

  // Gamification state
  let points = parseInt(localStorage.getItem('focusmind_pts') || '450', 10);
  let streakDays = parseInt(localStorage.getItem('focusmind_streak') || '5', 10);
  let streakMultiplier = 1.0;

  // Emotion & Distraction state
  let dominantEmotion = 'FOCUSED';
  let confidence = 94;
  let distractionIndex = 4;
  let gazeStability = 98;
  let hasCameraConsent = localStorage.getItem('focusmind_cam_consent') === 'true';
  let cameraStream = null;

  // Collaborative Room Peers
  let studyPeers = [
    { id: '1', name: 'Alex K.', status: 'Focusing', emotion: 'EXCITED', time: '18:42', alert: false },
    { id: '2', name: 'Elena R.', status: 'Focusing', emotion: 'FOCUSED', time: '21:10', alert: false },
    { id: '3', name: 'David M.', status: 'Focusing', emotion: 'ANXIOUS', time: '09:15', alert: true },
    { id: '4', name: 'Maya S.', status: 'On Break', emotion: 'HAPPY', time: '03:45', alert: false },
    { id: '5', name: 'Liam T.', status: 'Idle', emotion: 'SAD', time: '00:00', alert: true }
  ];

  // =========================================================================
  // Web Audio Gentle Ambient Chime
  // =========================================================================
  let audioCtx = null;
  function playChime(type = 'complete') {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      if (type === 'complete') {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.3); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.6); // G5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      } else {
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.2); // A5
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      }

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 1.5);
    } catch (err) {
      console.warn('Audio chime failed:', err);
    }
  }

  // =========================================================================
  // Formatting Helpers
  // =========================================================================
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function getDurationForState(stateKey) {
    const p = PRESETS[currentPreset] || PRESETS.STANDARD;
    if (stateKey === 'WORK') return p.work;
    if (stateKey === 'SHORT_BREAK') return p.shortBreak;
    return p.longBreak;
  }

  // =========================================================================
  // Gamification & Streak Rules
  // =========================================================================
  function saveStreak() {
    localStorage.setItem('focusmind_pts', points.toString());
    localStorage.setItem('focusmind_streak', streakDays.toString());
  }

  function awardPoints(amount, reason, bonus = false) {
    const calc = Math.round(amount * streakMultiplier);
    points += calc;
    saveStreak();
    renderStreakHUD();

    // Show subtle toast
    const toast = document.getElementById('streak-reward-toast');
    const toastText = document.getElementById('streak-toast-text');
    if (toast && toastText) {
      toastText.textContent = `+${calc} pts: ${reason}`;
      toast.classList.remove('hidden');
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 4000);
    }

    playChime(bonus ? 'bonus' : 'complete');

    // Subtle celebration on full session
    if (!bonus && window.confetti) {
      window.confetti({
        particleCount: 28,
        spread: 45,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#a855f7', '#10b981']
      });
    }
  }

  function renderStreakHUD() {
    const ptsEl = document.getElementById('streak-points-display');
    const daysEl = document.getElementById('streak-days-display');
    const multEl = document.getElementById('streak-multiplier-badge');

    if (ptsEl) ptsEl.textContent = `${points} Pts`;
    if (daysEl) daysEl.textContent = `${streakDays} Days`;
    if (multEl) multEl.textContent = `${streakMultiplier.toFixed(1)}x`;
  }

  // =========================================================================
  // Pomodoro State Machine
  // =========================================================================
  function setPomodoroState(nextState, isEarlyResume = false) {
    // Early-bird bonus: returning to work before break expires
    if (nextState === 'WORK' && (currentState === 'SHORT_BREAK' || currentState === 'LONG_BREAK')) {
      if (isEarlyResume && timeLeft > 0) {
        awardPoints(50, 'Early-Bird Resume Bonus', true);
      }
    }

    currentState = nextState;
    timeLeft = getDurationForState(currentState);
    updateTimerDisplay();
    updateStateTabs();
    updateDynamicIsland();
  }

  function updateTimerDisplay() {
    const timeFormatted = formatTime(timeLeft);
    const duration = getDurationForState(currentState);
    const elapsedPercent = Math.min(100, Math.max(0, ((duration - timeLeft) / duration) * 100));

    // Main countdown
    const displayEl = document.getElementById('timer-display');
    if (displayEl) displayEl.textContent = timeFormatted;

    const percentEl = document.getElementById('timer-percent-label');
    if (percentEl) percentEl.textContent = `${Math.round(elapsedPercent)}% ELAPSED`;

    const modeLabel = document.getElementById('timer-mode-label');
    if (modeLabel) {
      modeLabel.textContent = currentState === 'WORK' ? 'DEEP FOCUS' : 'REST & RESTORE';
    }

    // Circular ring stroke offset (circumference = 2 * PI * 140 ~= 879.64)
    const ring = document.getElementById('timer-progress-circle');
    if (ring) {
      const circ = 879.64;
      const offset = circ - (elapsedPercent / 100) * circ;
      ring.style.strokeDashoffset = offset;
      
      if (currentState === 'WORK') {
        ring.className = 'text-white transition-all duration-1000 ease-linear';
      } else if (currentState === 'SHORT_BREAK') {
        ring.className = 'text-emerald-400 transition-all duration-1000 ease-linear';
      } else {
        ring.className = 'text-blue-400 transition-all duration-1000 ease-linear';
      }
    }

    // Dynamic Island sync
    const islandTime = document.getElementById('island-time');
    if (islandTime) islandTime.textContent = timeFormatted;

    const miniTime = document.getElementById('mini-time-display');
    if (miniTime) miniTime.textContent = timeFormatted;

    const islandExpandedState = document.getElementById('island-expanded-state');
    if (islandExpandedState) {
      islandExpandedState.textContent = `${currentState} • ${timeFormatted}`;
    }
  }

  function updateStateTabs() {
    const btnWork = document.getElementById('btn-state-work');
    const btnShort = document.getElementById('btn-state-shortbreak');
    const btnLong = document.getElementById('btn-state-longbreak');

    [btnWork, btnShort, btnLong].forEach(btn => {
      if (btn) btn.className = 'px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all text-white/40 hover:text-white/70 hover:bg-white/5';
    });

    if (currentState === 'WORK' && btnWork) {
      btnWork.className = 'px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all bg-white text-black shadow-md shadow-white/10';
    } else if (currentState === 'SHORT_BREAK' && btnShort) {
      btnShort.className = 'px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all bg-emerald-400 text-black shadow-md shadow-emerald-400/20';
    } else if (currentState === 'LONG_BREAK' && btnLong) {
      btnLong.className = 'px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all bg-blue-400 text-black shadow-md shadow-blue-400/20';
    }
  }

  function toggleTimer() {
    isTimerActive = !isTimerActive;
    const playIcon = document.getElementById('play-pause-icon');
    const islandStatus = document.getElementById('island-status-pill');

    if (isTimerActive) {
      if (playIcon) playIcon.setAttribute('data-lucide', 'pause');
      if (islandStatus) {
        islandStatus.textContent = 'FOCUS';
        islandStatus.className = 'text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-500/20';
      }

      timerInterval = setInterval(() => {
        if (timeLeft > 0) {
          timeLeft--;
          updateTimerDisplay();
        } else {
          // Timer finished
          clearInterval(timerInterval);
          isTimerActive = false;

          if (currentState === 'WORK') {
            sessionsCompleted++;
            streakMultiplier = Math.min(2.0, 1.0 + sessionsCompleted * 0.1);
            streakDays += 1;
            awardPoints(100, 'Focus Session Completed');

            if (sessionsCompleted % 4 === 0) {
              setPomodoroState('LONG_BREAK');
            } else {
              setPomodoroState('SHORT_BREAK');
            }
          } else {
            setPomodoroState('WORK');
          }
          toggleTimer(); // auto continue or alert
        }
      }, 1000);
    } else {
      clearInterval(timerInterval);
      if (playIcon) playIcon.setAttribute('data-lucide', 'play');
      if (islandStatus) {
        islandStatus.textContent = 'PAUSED';
        islandStatus.className = 'text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-white/5 text-white/40';
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function resetTimer() {
    clearInterval(timerInterval);
    isTimerActive = false;
    timeLeft = getDurationForState(currentState);
    updateTimerDisplay();

    const playIcon = document.getElementById('play-pause-icon');
    if (playIcon) playIcon.setAttribute('data-lucide', 'play');

    const islandStatus = document.getElementById('island-status-pill');
    if (islandStatus) {
      islandStatus.textContent = 'PAUSED';
      islandStatus.className = 'text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-white/5 text-white/40';
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function skipInterval() {
    clearInterval(timerInterval);
    isTimerActive = false;
    if (currentState === 'WORK') {
      setPomodoroState('SHORT_BREAK');
    } else {
      setPomodoroState('WORK', true);
    }
    const playIcon = document.getElementById('play-pause-icon');
    if (playIcon) playIcon.setAttribute('data-lucide', 'play');
    if (window.lucide) window.lucide.createIcons();
  }

  // =========================================================================
  // iPhone Dynamic Island Implementation
  // =========================================================================
  const island = document.getElementById('dynamic-island');
  const compactView = document.getElementById('island-compact');
  const expandedView = document.getElementById('island-expanded');
  let isIslandExpanded = false;

  function expandIsland() {
    if (isIslandExpanded) return;
    isIslandExpanded = true;
    compactView.classList.add('hidden');
    expandedView.classList.remove('hidden');
    island.className = 'bg-black text-white border border-white/15 rounded-[28px] shadow-2xl transition-all duration-300 ease-spring backdrop-blur-xl w-[360px] md:w-[420px] p-4 bg-black/95 ring-1 ring-white/10';
    if (window.lucide) window.lucide.createIcons();
  }

  function collapseIsland() {
    if (!isIslandExpanded) return;
    isIslandExpanded = false;
    expandedView.classList.add('hidden');
    compactView.classList.remove('hidden');
    island.className = 'bg-black text-white border border-white/10 rounded-full shadow-2xl transition-all duration-300 ease-spring backdrop-blur-xl cursor-pointer h-10 px-4 flex items-center space-x-3 w-auto min-w-[220px] hover:scale-[1.02]';
    if (window.lucide) window.lucide.createIcons();
  }

  if (island) {
    island.addEventListener('mouseenter', expandIsland);
    island.addEventListener('mouseleave', collapseIsland);
    island.addEventListener('click', (e) => {
      if (!isIslandExpanded) expandIsland();
    });
  }

  const btnCloseIsland = document.getElementById('btn-island-close');
  if (btnCloseIsland) {
    btnCloseIsland.addEventListener('click', (e) => {
      e.stopPropagation();
      collapseIsland();
    });
  }

  function setEmotion(emotionKey) {
    if (!EMOTIONS[emotionKey]) return;
    dominantEmotion = emotionKey;
    confidence = Math.floor(92 + Math.random() * 7);
    updateDynamicIsland();
    updateAmbientGlow();
  }

  function updateDynamicIsland() {
    const meta = EMOTIONS[dominantEmotion] || EMOTIONS.FOCUSED;
    const badge = document.getElementById('island-emotion-badge');
    const badgeText = document.getElementById('island-emotion-text');
    const scoreEl = document.getElementById('island-dominant-score');

    if (badge && badgeText) {
      badgeText.textContent = `[${dominantEmotion}]`;
      badge.className = `flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.bg} ${meta.color} border ${meta.border}`;
    }

    if (scoreEl) {
      scoreEl.className = `font-mono font-bold ${meta.color}`;
      scoreEl.innerHTML = `[${dominantEmotion}] <span class="text-white/40 font-normal">(${confidence}% Peak)</span>`;
    }

    // Emotion buttons active state
    document.querySelectorAll('.btn-emotion').forEach(btn => {
      const e = btn.getAttribute('data-emotion');
      if (e === dominantEmotion) {
        btn.className = `btn-emotion py-1 px-1 rounded-lg text-[10px] font-mono font-semibold ${meta.bg} ${meta.color} border ${meta.border} ring-1 ring-white/20 transition-all`;
      } else {
        btn.className = 'btn-emotion py-1 px-1 rounded-lg text-[10px] font-mono font-semibold bg-white/5 text-white/40 border border-white/5 hover:bg-white/10 hover:text-white transition-all';
      }
    });

    // Stability & Distraction stats
    const stab = document.getElementById('island-stability-text');
    const dist = document.getElementById('island-distract-text');
    if (stab) stab.textContent = `Stability: ${gazeStability}%`;
    if (dist) dist.textContent = `Distract: ${distractionIndex}%`;
  }

  function updateAmbientGlow() {
    const container = document.getElementById('timer-ring-container');
    if (!container) return;

    if (dominantEmotion === 'ANXIOUS') {
      container.className = 'relative flex items-center justify-center rounded-full p-2 bg-neutral-950 border border-white/10 transition-shadow duration-700 shadow-[0_0_50px_rgba(245,158,11,0.15)]';
    } else if (dominantEmotion === 'SAD') {
      container.className = 'relative flex items-center justify-center rounded-full p-2 bg-neutral-950 border border-white/10 transition-shadow duration-700 shadow-[0_0_50px_rgba(59,130,246,0.15)]';
    } else if (dominantEmotion === 'EXCITED') {
      container.className = 'relative flex items-center justify-center rounded-full p-2 bg-neutral-950 border border-white/10 transition-shadow duration-700 shadow-[0_0_50px_rgba(217,70,239,0.18)]';
    } else {
      container.className = 'relative flex items-center justify-center rounded-full p-2 bg-neutral-950 border border-white/10 transition-shadow duration-700 shadow-[0_0_50px_rgba(99,102,241,0.15)]';
    }
  }

  // Bind Emotion Selector Buttons
  document.querySelectorAll('.btn-emotion').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const emo = btn.getAttribute('data-emotion');
      setEmotion(emo);
    });
  });

  // =========================================================================
  // Top Navigation Tab Switching
  // =========================================================================
  const navTabs = document.querySelectorAll('.btn-nav-tab');
  const views = {
    Pomodoro: document.getElementById('view-pomodoro'),
    Timer: document.getElementById('view-pomodoro'),
    Focus: document.getElementById('view-pomodoro'),
    Clock: document.getElementById('view-clock'),
    Stopwatch: document.getElementById('view-stopwatch'),
    Mini: document.getElementById('view-mini')
  };

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');

      // Update Nav Pills
      navTabs.forEach(t => {
        t.className = 'btn-nav-tab flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-medium text-white/50 hover:text-white transition-all';
        const icon = t.querySelector('i, svg');
        if (icon) icon.classList.remove('text-black');
      });

      tab.className = 'btn-nav-tab flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-black shadow-md shadow-white/10 scale-[1.02] transition-all';
      const activeIcon = tab.querySelector('i, svg');
      if (activeIcon) activeIcon.classList.add('text-black');

      // Update views
      Object.keys(views).forEach(key => {
        if (views[key]) views[key].classList.add('hidden');
      });

      if (views[target]) {
        views[target].classList.remove('hidden');
      }

      if (window.lucide) window.lucide.createIcons();
    });
  });

  // Clock Update Interval
  setInterval(() => {
    const clockEl = document.getElementById('clock-display');
    if (clockEl) {
      clockEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }, 1000);

  // =========================================================================
  // Presets & Controls Event Listeners
  // =========================================================================
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.getAttribute('data-preset');
      if (!PRESETS[presetKey]) return;

      currentPreset = presetKey;
      resetTimer();

      document.querySelectorAll('.btn-preset').forEach(b => {
        b.className = 'btn-preset px-3 py-1 rounded-lg text-xs font-mono text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent transition-all';
      });
      btn.className = 'btn-preset px-3 py-1 rounded-lg text-xs font-mono bg-white/10 text-white border border-white/20 transition-all';
    });
  });

  const btnWork = document.getElementById('btn-state-work');
  const btnShort = document.getElementById('btn-state-shortbreak');
  const btnLong = document.getElementById('btn-state-longbreak');

  if (btnWork) btnWork.addEventListener('click', () => setPomodoroState('WORK'));
  if (btnShort) btnShort.addEventListener('click', () => setPomodoroState('SHORT_BREAK'));
  if (btnLong) btnLong.addEventListener('click', () => setPomodoroState('LONG_BREAK'));

  const btnPlayPause = document.getElementById('btn-play-pause');
  if (btnPlayPause) btnPlayPause.addEventListener('click', toggleTimer);

  const btnReset = document.getElementById('btn-reset');
  if (btnReset) btnReset.addEventListener('click', resetTimer);

  const btnSkip = document.getElementById('btn-skip');
  if (btnSkip) btnSkip.addEventListener('click', skipInterval);

  const btnSound = document.getElementById('btn-sound-toggle');
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      const soundIcon = document.getElementById('sound-icon');
      if (soundIcon) {
        soundIcon.setAttribute('data-lucide', soundEnabled ? 'volume-2' : 'volume-x');
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }

  // =========================================================================
  // Classroom & Collaborative Mode
  // =========================================================================
  const btnToggleClassroom = document.getElementById('btn-toggle-classroom');
  const classroomPanel = document.getElementById('classroom-panel');
  const classroomChevron = document.getElementById('classroom-chevron');
  let isClassroomOpen = false;

  if (btnToggleClassroom && classroomPanel) {
    btnToggleClassroom.addEventListener('click', () => {
      isClassroomOpen = !isClassroomOpen;
      if (isClassroomOpen) {
        classroomPanel.classList.remove('hidden');
        if (classroomChevron) classroomChevron.setAttribute('data-lucide', 'chevron-down');
      } else {
        classroomPanel.classList.add('hidden');
        if (classroomChevron) classroomChevron.setAttribute('data-lucide', 'chevron-up');
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }

  const btnRoleStudent = document.getElementById('btn-role-student');
  const btnRoleTeacher = document.getElementById('btn-role-teacher');
  const studentView = document.getElementById('classroom-student-view');
  const teacherView = document.getElementById('classroom-teacher-view');

  if (btnRoleStudent && btnRoleTeacher) {
    btnRoleStudent.addEventListener('click', () => {
      btnRoleStudent.className = 'px-2 py-0.5 rounded-full bg-white text-black font-semibold transition-all';
      btnRoleTeacher.className = 'px-2 py-0.5 rounded-full text-white/40 hover:text-white transition-all';
      studentView.classList.remove('hidden');
      teacherView.classList.add('hidden');
    });

    btnRoleTeacher.addEventListener('click', () => {
      btnRoleTeacher.className = 'px-2 py-0.5 rounded-full bg-white text-black font-semibold transition-all';
      btnRoleStudent.className = 'px-2 py-0.5 rounded-full text-white/40 hover:text-white transition-all';
      studentView.classList.add('hidden');
      teacherView.classList.remove('hidden');
    });
  }

  function renderClassroom() {
    const peerList = document.getElementById('student-peer-list');
    const teacherList = document.getElementById('teacher-student-list');

    if (peerList) {
      peerList.innerHTML = `
        <div class="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs">
          <div class="flex items-center space-x-2">
            <div class="w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-[10px]">
              You
            </div>
            <span class="font-medium text-white/90">You</span>
          </div>
          <div class="flex items-center space-x-1.5">
            <span class="text-[10px] text-white/40">${isTimerActive ? 'Focusing' : 'Paused'}</span>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              [${dominantEmotion}]
            </span>
          </div>
        </div>
      `;

      studyPeers.forEach(peer => {
        const meta = EMOTIONS[peer.emotion] || EMOTIONS.FOCUSED;
        peerList.innerHTML += `
          <div class="flex items-center justify-between p-2 rounded-xl bg-neutral-900/50 border border-white/5 text-xs hover:bg-white/5 transition-all">
            <div class="flex items-center space-x-2">
              <div class="w-6 h-6 rounded-full bg-white/10 text-white/60 font-medium flex items-center justify-center text-[10px]">
                ${peer.name.charAt(0)}
              </div>
              <span class="text-white/80">${peer.name}</span>
            </div>
            <div class="flex items-center space-x-1.5">
              <span class="text-[10px] text-white/40">${peer.status}</span>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded ${meta.bg} ${meta.color} border ${meta.border}">
                [${peer.emotion}]
              </span>
            </div>
          </div>
        `;
      });
    }

    if (teacherList) {
      teacherList.innerHTML = '';
      studyPeers.forEach(peer => {
        const isStressed = peer.emotion === 'ANXIOUS' || peer.emotion === 'SAD';
        teacherList.innerHTML += `
          <div class="p-2.5 rounded-xl border text-xs transition-all ${
            isStressed ? 'bg-amber-950/20 border-amber-500/30' : 'bg-neutral-900/40 border-white/5'
          }">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="font-semibold text-white/90">${peer.name}</span>
                <span class="text-[10px] text-white/40 font-mono">${peer.status} (${peer.time})</span>
              </div>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                isStressed
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }">
                [${peer.emotion}]
              </span>
            </div>
            ${isStressed ? `
              <div class="flex items-center space-x-2 mt-2 pt-2 border-t border-white/5">
                <button onclick="triggerTeacherEncouragement('${peer.name}', 'Keep going!')" class="flex-1 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] text-white/80 font-mono transition-all">
                  Send "Keep Going!"
                </button>
                <button onclick="triggerTeacherEncouragement('${peer.name}', 'Take a gentle breather')" class="flex-1 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-[10px] text-indigo-300 font-mono transition-all">
                  Suggest Breather
                </button>
              </div>
            ` : ''}
          </div>
        `;
      });
    }
  }

  window.triggerTeacherEncouragement = function(name, text) {
    const banner = document.getElementById('teacher-alert-banner');
    const bannerText = document.getElementById('teacher-alert-text');
    if (banner && bannerText) {
      bannerText.textContent = `Sent to ${name}: "${text}"`;
      banner.classList.remove('hidden');
      setTimeout(() => banner.classList.add('hidden'), 3500);
    }
  };

  const btnSyncClass = document.getElementById('btn-sync-class');
  if (btnSyncClass) {
    btnSyncClass.addEventListener('click', () => {
      const banner = document.getElementById('teacher-alert-banner');
      const bannerText = document.getElementById('teacher-alert-text');
      if (banner && bannerText) {
        bannerText.textContent = 'Class-wide synchronized 25-minute Pomodoro initiated!';
        banner.classList.remove('hidden');
        setTimeout(() => banner.classList.add('hidden'), 4000);
      }
    });
  }

  // =========================================================================
  // Camera Permission Modal & Dynamic Island Video Setup
  // =========================================================================
  const modalCamera = document.getElementById('modal-camera-permission');
  const btnGrantCamera = document.getElementById('btn-grant-camera');
  const btnSkipCamera = document.getElementById('btn-skip-camera');
  const islandVideo = document.getElementById('island-video-preview');
  const bgVideo = document.getElementById('bg-webcam');
  const fallbackPreview = document.getElementById('island-camera-fallback');

  async function initializeCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      cameraStream = stream;

      if (islandVideo) {
        islandVideo.srcObject = stream;
        islandVideo.play();
      }
      if (bgVideo) {
        bgVideo.srcObject = stream;
        bgVideo.play();
      }

      if (fallbackPreview) fallbackPreview.classList.add('hidden');
      if (islandVideo) islandVideo.classList.remove('hidden');

      hasCameraConsent = true;
      localStorage.setItem('focusmind_cam_consent', 'true');
      if (modalCamera) modalCamera.classList.add('hidden');

      // Initialize background landmark detector
      initializeBackgroundFaceMesh();
    } catch (err) {
      console.warn('Camera stream initialisation bypassed or denied:', err);
      // Fallback synthetic telemetry mode
      hasCameraConsent = true;
      localStorage.setItem('focusmind_cam_consent', 'true');
      if (modalCamera) modalCamera.classList.add('hidden');
      if (islandVideo) islandVideo.classList.add('hidden');
      if (fallbackPreview) fallbackPreview.classList.remove('hidden');
    }
  }

  if (hasCameraConsent) {
    if (modalCamera) modalCamera.classList.add('hidden');
    initializeCamera();
  }

  if (btnGrantCamera) {
    btnGrantCamera.addEventListener('click', initializeCamera);
  }

  if (btnSkipCamera) {
    btnSkipCamera.addEventListener('click', () => {
      hasCameraConsent = true;
      localStorage.setItem('focusmind_cam_consent', 'true');
      if (modalCamera) modalCamera.classList.add('hidden');
      if (islandVideo) islandVideo.classList.add('hidden');
      if (fallbackPreview) fallbackPreview.classList.remove('hidden');
    });
  }

  // =========================================================================
  // Background MediaPipe Face Landmark & Telemetry Stream
  // =========================================================================
  function initializeBackgroundFaceMesh() {
    if (typeof FaceMesh === 'undefined') return;

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
          const landmarks = results.multiFaceLandmarks[0];
          // Background metrics extraction: EAR, MAR, Gaze
          calculateMetricsFromLandmarks(landmarks);
        }
      });

      if (bgVideo && typeof Camera !== 'undefined') {
        const camera = new Camera(bgVideo, {
          onFrame: async () => {
            if (bgVideo.readyState >= 2) {
              await faceMesh.send({ image: bgVideo });
            }
          },
          width: 640,
          height: 480
        });
        camera.start();
      }
    } catch (err) {
      console.warn('MediaPipe FaceMesh setup in background:', err);
    }
  }

  function calculateMetricsFromLandmarks(pts) {
    // Subtle background calculation
    // Left eye landmarks: 33, 160, 158, 133, 153, 144
    // Mouth landmarks: 13, 14, 78, 308
    if (pts.length < 468) return;

    // Gaze stability update
    const noseTip = pts[1];
    if (noseTip) {
      const devX = Math.abs(noseTip.x - 0.5);
      const devY = Math.abs(noseTip.y - 0.5);
      const stable = Math.max(70, Math.min(100, Math.round(100 - (devX + devY) * 60)));
      gazeStability = stable;
      distractionIndex = Math.max(2, Math.min(30, 100 - stable));

      const stabEl = document.getElementById('island-stability-text');
      const distEl = document.getElementById('island-distract-text');
      if (stabEl) stabEl.textContent = `Stability: ${gazeStability}%`;
      if (distEl) distEl.textContent = `Distract: ${distractionIndex}%`;
    }
  }

  // Background Telemetry periodic sync
  setInterval(() => {
    // Subtle natural jitter to telemetry
    distractionIndex = Math.max(2, Math.min(22, Math.round(distractionIndex + (Math.random() - 0.5) * 2)));
    gazeStability = Math.max(88, Math.min(100, Math.round(gazeStability + (Math.random() - 0.48) * 2)));
    updateDynamicIsland();
  }, 4000);

  // Initialize UI
  renderStreakHUD();
  updateTimerDisplay();
  updateStateTabs();
  updateDynamicIsland();
  renderClassroom();
});
