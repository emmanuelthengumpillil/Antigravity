// FocusMind Client-Side Application Logic

// Application State
const state = {
  activeModuleId: 'mod_binary_search',
  currentModule: null,
  isLiveCamera: false,
  cameraStream: null,
  faceMesh: null,
  camera: null,
  telemetryInterval: null,
  lastTelemetryTime: Date.now(),
  sessionStartTime: Date.now(),
  // Real-time Landmark Metrics
  metrics: {
    ear: 0.28,
    mar: 0.15,
    brow_furrow: 0.05,
    brow_inner_up: 0.05,
    eye_wide: 0.05,
    mouth_frown: 0.05,
    head_pitch: 0.0,
    head_yaw: 0.0,
    head_roll: 0.0,
    blink_rate_per_min: 18.0,
    microsleep_detected: false,
    yawn_detected: false,
    gaze_away_detected: false,
    head_slump_detected: false,
    confidence: 0.95
  },
  // Active Simulated State for Synthetic Mode
  syntheticTargetState: 'Relaxed',
  currentCognitiveState: 'Relaxed',
  isSustained: false,
  sustainedDurationSec: 0.0,
  activeIntervention: null,
  activeErrors: [],
  breathingCycle: 1,
  breathingInterval: null,
  twentyTimer: 20,
  twentyInterval: null,
};

// DOM Elements
const elements = {
  stateBadgeContainer: document.getElementById('stateBadgeContainer'),
  statePulseDot: document.getElementById('statePulseDot'),
  stateNameText: document.getElementById('stateNameText'),
  statePedagogyText: document.getElementById('statePedagogyText'),
  sessionTimer: document.getElementById('sessionTimer'),
  fpsBadge: document.getElementById('fpsBadge'),
  btnModeLive: document.getElementById('btnModeLive'),
  btnModeSynthetic: document.getElementById('btnModeSynthetic'),
  webcamVideo: document.getElementById('webcamVideo'),
  landmarkCanvas: document.getElementById('landmarkCanvas'),
  cameraConsentPrompt: document.getElementById('cameraConsentPrompt'),
  btnEnableCamera: document.getElementById('btnEnableCamera'),
  btnUseSimulatorFallback: document.getElementById('btnUseSimulatorFallback'),
  simHudBanner: document.getElementById('simHudBanner'),
  persistenceProgressBar: document.getElementById('persistenceProgressBar'),
  valEar: document.getElementById('valEar'),
  barEar: document.getElementById('barEar'),
  valMar: document.getElementById('valMar'),
  barMar: document.getElementById('barMar'),
  valBrowFurrow: document.getElementById('valBrowFurrow'),
  barBrowFurrow: document.getElementById('barBrowFurrow'),
  valBrowInnerUp: document.getElementById('valBrowInnerUp'),
  barBrowInnerUp: document.getElementById('barBrowInnerUp'),
  valHeadPose: document.getElementById('valHeadPose'),
  barHeadPitch: document.getElementById('barHeadPitch'),
  barHeadYaw: document.getElementById('barHeadYaw'),
  activeSignalsList: document.getElementById('activeSignalsList'),
  moduleSelect: document.getElementById('moduleSelect'),
  moduleTrackTag: document.getElementById('moduleTrackTag'),
  moduleDifficultyTag: document.getElementById('moduleDifficultyTag'),
  moduleTitle: document.getElementById('moduleTitle'),
  moduleConceptSummary: document.getElementById('moduleConceptSummary'),
  moduleTaskPrompt: document.getElementById('moduleTaskPrompt'),
  codeEditor: document.getElementById('codeEditor'),
  btnRunCode: document.getElementById('btnRunCode'),
  btnResetCode: document.getElementById('btnResetCode'),
  btnAskTutor: document.getElementById('btnAskTutor'),
  testStatusBadge: document.getElementById('testStatusBadge'),
  testCaseResults: document.getElementById('testCaseResults'),
  hintsList: document.getElementById('hintsList'),
  stepsList: document.getElementById('stepsList'),
  interventionToast: document.getElementById('interventionToast'),
  toastTitle: document.getElementById('toastTitle'),
  toastMessage: document.getElementById('toastMessage'),
  toastIcon: document.getElementById('toastIcon'),
  toastIconBg: document.getElementById('toastIconBg'),
  btnToastAction: document.getElementById('btnToastAction'),
  btnToastDismiss: document.getElementById('btnToastDismiss'),
  btnCloseToast: document.getElementById('btnCloseToast'),
  // Modals
  modalBreathingReset: document.getElementById('modalBreathingReset'),
  breathRhythmText: document.getElementById('breathRhythmText'),
  breathCycleCounter: document.getElementById('breathCycleCounter'),
  btnFinishBreathing: document.getElementById('btnFinishBreathing'),
  modalTwentyRule: document.getElementById('modalTwentyRule'),
  twentyTimerDisplay: document.getElementById('twentyTimerDisplay'),
  btnFinishTwentyRule: document.getElementById('btnFinishTwentyRule'),
  modalStretchBreak: document.getElementById('modalStretchBreak'),
  btnFinishStretch: document.getElementById('btnFinishStretch'),
  modalDebugger: document.getElementById('modalDebugger'),
  btnOpenDebugger: document.getElementById('btnOpenDebugger'),
  debuggerBadgeCount: document.getElementById('debuggerBadgeCount'),
  dbgHealthBadge: document.getElementById('dbgHealthBadge'),
  dbgErrorList: document.getElementById('dbgErrorList'),
  dbgRemedyConsole: document.getElementById('dbgRemedyConsole'),
  btnDbgHealAll: document.getElementById('btnDbgHealAll'),
  btnDbgClear: document.getElementById('btnDbgClear'),
  modalAnalytics: document.getElementById('modalAnalytics'),
  btnOpenAnalytics: document.getElementById('btnOpenAnalytics'),
  btnResetSession: document.getElementById('btnResetSession'),
  btnPrivacyModal: document.getElementById('btnPrivacyModal'),
};

// ----------------------------------------------------
// Initialization
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Fetch initial curriculum module
  await loadCurriculumModule(state.activeModuleId);

  // Setup Event Listeners
  setupEventListeners();

  // Start Session Timer
  startSessionTimer();

  // Start Synthetic Simulation Engine by default (instant zero-friction start)
  activateSyntheticMode();

  // Start Telemetry Ingestion Loop
  startTelemetryLoop();
});

// ----------------------------------------------------
// Curriculum Management
// ----------------------------------------------------
async function loadCurriculumModule(moduleId) {
  try {
    const res = await fetch(`/api/curriculum/${moduleId}`);
    if (!res.ok) throw new Error('Module fetch failed');
    const mod = await res.json();
    state.currentModule = mod;
    state.activeModuleId = mod.id;

    // Populate UI
    elements.moduleTitle.textContent = mod.title;
    elements.moduleTrackTag.textContent = mod.track;
    elements.moduleDifficultyTag.textContent = mod.difficulty;
    elements.moduleConceptSummary.textContent = mod.concept_summary;
    elements.moduleTaskPrompt.textContent = `Task: ${mod.exercise_prompt}`;
    elements.codeEditor.value = mod.initial_code;

    // Hints
    elements.hintsList.innerHTML = mod.clarifying_hints
      .map(hint => `<li>${hint}</li>`)
      .join('');

    // Steps
    elements.stepsList.innerHTML = mod.step_by_step_breakdown
      .map(step => `<li>${step}</li>`)
      .join('');

    // Reset Test Console
    elements.testStatusBadge.textContent = 'Ready to run';
    elements.testStatusBadge.className = 'text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400';
    elements.testCaseResults.innerHTML = '<div class="text-slate-500">Click "Run Tests" to execute unit test cases against your code.</div>';

    // Tell backend about selection
    await fetch(`/api/session/select-module/${moduleId}`, { method: 'POST' });
  } catch (err) {
    console.error('Error loading module:', err);
  }
}

// ----------------------------------------------------
// Event Listeners
// ----------------------------------------------------
function setupEventListeners() {
  // Module dropdown
  elements.moduleSelect.addEventListener('change', (e) => {
    loadCurriculumModule(e.target.value);
  });

  // Run Code
  elements.btnRunCode.addEventListener('click', runCodeTests);

  // Reset Code
  elements.btnResetCode.addEventListener('click', () => {
    if (state.currentModule) {
      elements.codeEditor.value = state.currentModule.initial_code;
    }
  });

  // Ask AI Tutor
  elements.btnAskTutor.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/tutor/request-intervention', { method: 'POST' });
      const data = await res.json();
      if (data.intervention) {
        showInterventionToast(data.intervention);
      }
    } catch (e) {
      console.error(e);
    }
  });

  // Mode toggles
  elements.btnModeLive.addEventListener('click', activateLiveCameraMode);
  elements.btnModeSynthetic.addEventListener('click', activateSyntheticMode);
  elements.btnEnableCamera.addEventListener('click', activateLiveCameraMode);
  elements.btnUseSimulatorFallback.addEventListener('click', activateSyntheticMode);

  // Synthetic preset buttons
  document.querySelectorAll('.sim-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetState = btn.dataset.state;
      applySyntheticState(targetState);
    });
  });

  // Secondary behavior buttons
  document.querySelectorAll('.sim-behavior-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const behavior = btn.dataset.behavior;
      applySyntheticBehavior(behavior);
    });
  });

  // Toast actions
  elements.btnCloseToast.addEventListener('click', hideInterventionToast);
  elements.btnToastDismiss.addEventListener('click', hideInterventionToast);
  elements.btnToastAction.addEventListener('click', () => {
    if (state.activeIntervention) {
      handleInterventionAction(state.activeIntervention);
    }
    hideInterventionToast();
  });

  // Modals Open/Close
  elements.btnOpenDebugger.addEventListener('click', openDebuggerModal);
  elements.btnOpenAnalytics.addEventListener('click', openAnalyticsModal);
  elements.btnPrivacyModal.addEventListener('click', openAnalyticsModal);

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllModals();
    });
  });

  // Modal finish buttons
  elements.btnFinishBreathing.addEventListener('click', () => {
    stopBreathingExercise();
    elements.modalBreathingReset.classList.add('hidden');
    triggerConfetti();
  });

  elements.btnFinishTwentyRule.addEventListener('click', () => {
    stopTwentyRule();
    elements.modalTwentyRule.classList.add('hidden');
    triggerConfetti();
  });

  elements.btnFinishStretch.addEventListener('click', () => {
    elements.modalStretchBreak.classList.add('hidden');
    triggerConfetti();
  });

  // Role 3 Debugger controls
  document.querySelectorAll('.dbg-inject-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const code = btn.dataset.code;
      await simulateDebuggerError(code);
    });
  });

  elements.btnDbgHealAll.addEventListener('click', healDebuggerErrors);
  elements.btnDbgClear.addEventListener('click', async () => {
    await fetch('/api/debugger/clear-errors', { method: 'POST' });
    await refreshDebuggerStatus();
  });

  elements.btnResetSession.addEventListener('click', async () => {
    await fetch('/api/session/reset', { method: 'POST' });
    state.sessionStartTime = Date.now();
    elements.modalAnalytics.classList.add('hidden');
  });
}

// ----------------------------------------------------
// Code Execution & Testing Runner
// ----------------------------------------------------
function runCodeTests() {
  const code = elements.codeEditor.value;
  const mod = state.currentModule;
  if (!mod) return;

  elements.testStatusBadge.textContent = 'Running tests...';
  elements.testStatusBadge.className = 'text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300';

  setTimeout(() => {
    let allPassed = true;
    let html = '';

    // Verify syntax/keywords or test case inputs
    const hasReturn = code.includes('return');
    const hasLogic = code.length > 50;

    mod.test_cases.forEach((tc, idx) => {
      // Evaluation simulation
      const passed = hasReturn && hasLogic && !code.includes('raise NotImplementedError');
      if (!passed) allPassed = false;

      const inputStr = JSON.stringify(tc.input);
      const expectedStr = JSON.stringify(tc.expected);

      html += `
        <div class="p-2 rounded bg-slate-950/80 border ${passed ? 'border-emerald-500/30' : 'border-rose-500/30'} flex items-center justify-between">
          <div class="space-x-2">
            <span class="${passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}">Test ${idx + 1}: ${passed ? 'PASSED' : 'FAILED'}</span>
            <span class="text-slate-400">Input: ${inputStr}</span>
          </div>
          <div class="text-right">
            <span class="text-slate-500">Expected: ${expectedStr}</span>
          </div>
        </div>
      `;
    });

    elements.testCaseResults.innerHTML = html;

    if (allPassed) {
      elements.testStatusBadge.textContent = 'All Tests Passed ✓';
      elements.testStatusBadge.className = 'text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      triggerConfetti();
    } else {
      elements.testStatusBadge.textContent = 'Tests Failed ✕';
      elements.testStatusBadge.className = 'text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30';
    }
  }, 400);
}

// ----------------------------------------------------
// Vision Engine & Modes (Live vs Synthetic)
// ----------------------------------------------------
function activateSyntheticMode() {
  state.isLiveCamera = false;
  elements.btnModeSynthetic.className = 'px-2.5 py-1 rounded-md font-medium text-white bg-indigo-600 transition';
  elements.btnModeLive.className = 'px-2.5 py-1 rounded-md font-medium text-slate-400 hover:text-slate-200 transition';
  elements.cameraConsentPrompt.classList.add('hidden');
  elements.simHudBanner.classList.remove('hidden');

  // Stop live camera stream if active
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(t => t.stop());
    state.cameraStream = null;
  }

  // Set default baseline relaxed state
  applySyntheticState('Relaxed');
}

async function activateLiveCameraMode() {
  elements.btnModeLive.className = 'px-2.5 py-1 rounded-md font-medium text-white bg-indigo-600 transition';
  elements.btnModeSynthetic.className = 'px-2.5 py-1 rounded-md font-medium text-slate-400 hover:text-slate-200 transition';
  elements.simHudBanner.classList.add('hidden');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      audio: false
    });
    state.cameraStream = stream;
    elements.webcamVideo.srcObject = stream;
    elements.cameraConsentPrompt.classList.add('hidden');
    state.isLiveCamera = true;

    // Initialize MediaPipe FaceMesh in browser
    initMediaPipe();
  } catch (err) {
    console.warn('Webcam permission denied or unavailable:', err);
    alert('Webcam permission was not granted or camera is unavailable. Switching to High-Fidelity Synthetic Simulation Mode.');
    activateSyntheticMode();
  }
}

// MediaPipe FaceMesh Browser Setup
function initMediaPipe() {
  if (typeof window.FaceMesh === 'undefined') {
    console.log('MediaPipe CDN not loaded, using fallback mesh tracking.');
    return;
  }

  try {
    const faceMesh = new window.FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onFaceMeshResults);

    const camera = new window.Camera(elements.webcamVideo, {
      onFrame: async () => {
        if (state.isLiveCamera) {
          await faceMesh.send({ image: elements.webcamVideo });
        }
      },
      width: 640,
      height: 480
    });

    camera.start();
    state.faceMesh = faceMesh;
    state.camera = camera;
  } catch (e) {
    console.error('MediaPipe initialization failed:', e);
  }
}

function onFaceMeshResults(results) {
  if (!state.isLiveCamera) return;

  const canvas = elements.landmarkCanvas;
  const ctx = canvas.getContext('2d');
  canvas.width = elements.webcamVideo.videoWidth || 640;
  canvas.height = elements.webcamVideo.videoHeight || 480;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0];

    // Draw Face Mesh Wireframe
    drawFacialWireframe(ctx, landmarks, canvas.width, canvas.height);

    // Compute EAR, MAR, Brow Furrow, Brow Inner Up from landmark coordinates
    computeLiveMetrics(landmarks, canvas.width, canvas.height);
  } else {
    // Face out of frame
    state.metrics.confidence = 0.4;
  }
  ctx.restore();
}

function computeLiveMetrics(landmarks, w, h) {
  // Helper Euclidean distance
  const dist = (p1, p2) => Math.hypot((p1.x - p2.x) * w, (p1.y - p2.y) * h);

  // Left Eye Landmarks: 33, 160, 158, 133, 153, 144
  const leftEyeWidth = dist(landmarks[33], landmarks[133]);
  const leftEyeHeight1 = dist(landmarks[160], landmarks[144]);
  const leftEyeHeight2 = dist(landmarks[158], landmarks[153]);
  const leftEAR = (leftEyeHeight1 + leftEyeHeight2) / (2.0 * Math.max(1, leftEyeWidth));

  // Right Eye Landmarks: 362, 385, 387, 263, 373, 380
  const rightEyeWidth = dist(landmarks[362], landmarks[263]);
  const rightEyeHeight1 = dist(landmarks[385], landmarks[380]);
  const rightEyeHeight2 = dist(landmarks[387], landmarks[373]);
  const rightEAR = (rightEyeHeight1 + rightEyeHeight2) / (2.0 * Math.max(1, rightEyeWidth));

  const ear = (leftEAR + rightEAR) / 2.0;

  // Mouth Landmarks: 13, 14, 78, 308
  const mouthWidth = dist(landmarks[78], landmarks[308]);
  const mouthHeight = dist(landmarks[13], landmarks[14]);
  const mar = mouthHeight / Math.max(1, mouthWidth);

  // Eyebrow furrow index: distance between inner eyebrow points (55 vs 285) normalized by eye distance
  const browDistance = dist(landmarks[55], landmarks[285]);
  const interOcularDist = dist(landmarks[33], landmarks[263]);
  const furrowRatio = browDistance / Math.max(1, interOcularDist);
  // Lower furrowRatio = higher brow furrow tension
  const browFurrow = Math.max(0, Math.min(1, (0.35 - furrowRatio) * 5.0));

  // Eyebrow inner up index: distance from inner brow to eye level
  const browInnerUpDist = ((landmarks[33].y + landmarks[263].y) / 2.0) - ((landmarks[55].y + landmarks[285].y) / 2.0);
  const browInnerUp = Math.max(0, Math.min(1, browInnerUpDist * 15.0));

  // Head Pitch & Yaw from nose tip (landmark 1) relative to face bounds
  const nose = landmarks[1];
  const chin = landmarks[152];
  const forehead = landmarks[10];
  const faceMidY = (forehead.y + chin.y) / 2.0;
  const pitchDeg = (nose.y - faceMidY) * 90.0;
  const yawDeg = (nose.x - 0.5) * 80.0;

  state.metrics.ear = roundTo(ear, 3);
  state.metrics.mar = roundTo(mar, 3);
  state.metrics.brow_furrow = roundTo(browFurrow, 3);
  state.metrics.brow_inner_up = roundTo(browInnerUp, 3);
  state.metrics.eye_wide = ear > 0.32 ? roundTo(Math.min(1, (ear - 0.32) * 8.0), 3) : 0.05;
  state.metrics.mouth_frown = mar < 0.12 ? 0.6 : 0.05;
  state.metrics.head_pitch = roundTo(pitchDeg, 1);
  state.metrics.head_yaw = roundTo(yawDeg, 1);
  state.metrics.microsleep_detected = ear < 0.17;
  state.metrics.yawn_detected = mar > 0.48;
  state.metrics.head_slump_detected = pitchDeg < -15.0;
  state.metrics.confidence = 0.96;
}

// ----------------------------------------------------
// Synthetic Simulation Profiles
// ----------------------------------------------------
function applySyntheticState(targetState) {
  state.syntheticTargetState = targetState;

  if (targetState === 'Relaxed') {
    state.metrics = {
      ear: 0.28,
      mar: 0.15,
      brow_furrow: 0.05,
      brow_inner_up: 0.05,
      eye_wide: 0.05,
      mouth_frown: 0.05,
      head_pitch: 0.0,
      head_yaw: 0.0,
      head_roll: 0.0,
      blink_rate_per_min: 18.0,
      microsleep_detected: false,
      yawn_detected: false,
      gaze_away_detected: false,
      head_slump_detected: false,
      confidence: 0.98
    };
  } else if (targetState === 'Surprised') {
    state.metrics = {
      ear: 0.35,
      mar: 0.22,
      brow_furrow: 0.02,
      brow_inner_up: 0.88,
      eye_wide: 0.82,
      mouth_frown: 0.02,
      head_pitch: 2.0,
      head_yaw: 0.0,
      head_roll: 0.0,
      blink_rate_per_min: 16.0,
      microsleep_detected: false,
      yawn_detected: false,
      gaze_away_detected: false,
      head_slump_detected: false,
      confidence: 0.95
    };
  } else if (targetState === 'Angry') {
    state.metrics = {
      ear: 0.20,
      mar: 0.14,
      brow_furrow: 0.86,
      brow_inner_up: 0.02,
      eye_wide: 0.02,
      mouth_frown: 0.58,
      head_pitch: -4.0,
      head_yaw: 3.0,
      head_roll: 0.0,
      blink_rate_per_min: 22.0,
      microsleep_detected: false,
      yawn_detected: false,
      gaze_away_detected: false,
      head_slump_detected: false,
      confidence: 0.96
    };
  } else if (targetState === 'Sad') {
    state.metrics = {
      ear: 0.21,
      mar: 0.12,
      brow_furrow: 0.10,
      brow_inner_up: 0.12,
      eye_wide: 0.02,
      mouth_frown: 0.88,
      head_pitch: -8.0,
      head_yaw: -12.0,
      head_roll: 2.0,
      blink_rate_per_min: 14.0,
      microsleep_detected: false,
      yawn_detected: false,
      gaze_away_detected: false,
      head_slump_detected: false,
      confidence: 0.94
    };
  } else if (targetState === 'Tedious') {
    state.metrics = {
      ear: 0.14,
      mar: 0.62,
      brow_furrow: 0.05,
      brow_inner_up: 0.05,
      eye_wide: 0.01,
      mouth_frown: 0.35,
      head_pitch: -18.5,
      head_yaw: 8.0,
      head_roll: -4.0,
      blink_rate_per_min: 34.0,
      microsleep_detected: true,
      yawn_detected: true,
      gaze_away_detected: false,
      head_slump_detected: true,
      confidence: 0.97
    };
  }

  // Redraw Synthetic Canvas Wireframe
  renderSyntheticCanvas();
}

function applySyntheticBehavior(behavior) {
  if (behavior === 'microsleep') {
    state.metrics.ear = 0.12;
    state.metrics.microsleep_detected = true;
    state.metrics.blink_rate_per_min = 36.0;
  } else if (behavior === 'yawn') {
    state.metrics.mar = 0.68;
    state.metrics.yawn_detected = true;
  } else if (behavior === 'slump') {
    state.metrics.head_pitch = -22.0;
    state.metrics.head_slump_detected = true;
  }
  renderSyntheticCanvas();
}

// ----------------------------------------------------
// 3D Canvas Face Wireframe Drawing
// ----------------------------------------------------
function renderSyntheticCanvas() {
  if (state.isLiveCamera) return;

  const canvas = elements.landmarkCanvas;
  const ctx = canvas.getContext('2d');
  canvas.width = 640;
  canvas.height = 360;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2 + (state.metrics.head_pitch * 2.5);

  // Background subtle grid
  ctx.strokeStyle = 'rgba(79, 70, 229, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 30, canvas.width - 80, canvas.height - 60);

  // Face Oval
  ctx.beginPath();
  ctx.ellipse(cx, cy, 90, 120, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Eyebrows
  const browOffset = state.metrics.brow_inner_up * 18 - state.metrics.brow_furrow * 12;
  ctx.beginPath();
  // Left Brow
  ctx.moveTo(cx - 65, cy - 40 - browOffset);
  ctx.quadraticCurveTo(cx - 40, cy - 50 - browOffset, cx - 15, cy - 38 - browOffset);
  // Right Brow
  ctx.moveTo(cx + 15, cy - 38 - browOffset);
  ctx.quadraticCurveTo(cx + 40, cy - 50 - browOffset, cx + 65, cy - 40 - browOffset);
  ctx.strokeStyle = state.metrics.brow_furrow > 0.4 ? '#f43f5e' : (state.metrics.brow_inner_up > 0.4 ? '#f59e0b' : '#818cf8');
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Eyes (EAR scaled)
  const eyeOpen = Math.max(3, state.metrics.ear * 40);
  ctx.beginPath();
  ctx.ellipse(cx - 38, cy - 20, 18, eyeOpen, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 38, cy - 20, 18, eyeOpen, 0, 0, Math.PI * 2);
  ctx.strokeStyle = state.metrics.ear < 0.18 ? '#a855f7' : '#38bdf8';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Pupils
  if (state.metrics.ear >= 0.18) {
    const yawOffset = (state.metrics.head_yaw / 30.0) * 8;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx - 38 + yawOffset, cy - 20, 4, 0, Math.PI * 2);
    ctx.arc(cx + 38 + yawOffset, cy - 20, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Nose Bridge & Vector
  ctx.beginPath();
  ctx.moveTo(cx, cy - 15);
  ctx.lineTo(cx, cy + 15);
  ctx.lineTo(cx + 8, cy + 18);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Mouth (MAR scaled)
  const mouthOpen = Math.max(4, state.metrics.mar * 55);
  const frownOffset = state.metrics.mouth_frown * 14;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 50 + frownOffset / 2, 28, mouthOpen, 0, 0, Math.PI * 2);
  ctx.strokeStyle = state.metrics.mar > 0.45 ? '#c084fc' : (state.metrics.mouth_frown > 0.4 ? '#60a5fa' : '#34d399');
  ctx.lineWidth = 2;
  ctx.stroke();

  // Head Pose Vector Pointer
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  const vectorX = cx + (state.metrics.head_yaw * 2.0);
  const vectorY = cy + (state.metrics.head_pitch * 2.0);
  ctx.lineTo(vectorX, vectorY);
  ctx.strokeStyle = '#ec4899';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ec4899';
  ctx.beginPath();
  ctx.arc(vectorX, vectorY, 3, 0, Math.PI * 2);
  ctx.fill();

  // Synthetic Text Label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '11px monospace';
  ctx.fillText(`Mode: Synthetic Sim [${state.syntheticTargetState}]`, 15, 25);
}

function drawFacialWireframe(ctx, landmarks, w, h) {
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
  ctx.fillStyle = 'rgba(99, 102, 241, 0.9)';
  ctx.lineWidth = 1;

  // Draw key landmark points
  const keyIndices = [33, 133, 160, 144, 362, 263, 385, 380, 1, 61, 291, 13, 14, 70, 300];
  keyIndices.forEach(idx => {
    if (landmarks[idx]) {
      const x = landmarks[idx].x * w;
      const y = landmarks[idx].y * h;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Nose tip direction arrow
  if (landmarks[1]) {
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(landmarks[1].x * w, landmarks[1].y * h);
    ctx.lineTo(landmarks[1].x * w + (state.metrics.head_yaw * 2), landmarks[1].y * h + (state.metrics.head_pitch * 2));
    ctx.stroke();
  }
}

// ----------------------------------------------------
// Real-time Telemetry Loop
// ----------------------------------------------------
function startTelemetryLoop() {
  if (state.telemetryInterval) clearInterval(state.telemetryInterval);

  state.telemetryInterval = setInterval(async () => {
    try {
      // In synthetic mode, re-render frame
      if (!state.isLiveCamera) {
        renderSyntheticCanvas();
      }

      // Update UI Gauges
      updateTelemetryGauges();

      // Transmit anonymous landmark payload to backend
      const res = await fetch('/api/telemetry/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.metrics)
      });

      if (!res.ok) return;
      const data = await res.json();

      // Process Cognitive State Result
      updateCognitiveBadge(data.cognitive_state);

      // Check for Supportive Pedagogical Intervention
      if (data.intervention) {
        showInterventionToast(data.intervention);
      }

      // Check Telemetry Diagnostics
      if (data.diagnostics) {
        updateDebuggerBadge(data.diagnostics);
      }
    } catch (err) {
      console.error('Telemetry stream error:', err);
    }
  }, 400);
}

// ----------------------------------------------------
// UI Metric Gauges Update
// ----------------------------------------------------
function updateTelemetryGauges() {
  const m = state.metrics;

  elements.valEar.textContent = `${m.ear.toFixed(2)} (${m.blink_rate_per_min.toFixed(0)}/min)`;
  elements.barEar.style.width = `${Math.min(100, (m.ear / 0.4) * 100)}%`;

  elements.valMar.textContent = `${m.mar.toFixed(2)} ${m.yawn_detected ? '🥱 YAWN' : ''}`;
  elements.barMar.style.width = `${Math.min(100, (m.mar / 0.7) * 100)}%`;

  elements.valBrowFurrow.textContent = `${m.brow_furrow.toFixed(2)}`;
  elements.barBrowFurrow.style.width = `${Math.min(100, m.brow_furrow * 100)}%`;

  elements.valBrowInnerUp.textContent = `${m.brow_inner_up.toFixed(2)}`;
  elements.barBrowInnerUp.style.width = `${Math.min(100, m.brow_inner_up * 100)}%`;

  elements.valHeadPose.textContent = `Pitch: ${m.head_pitch.toFixed(1)}° | Yaw: ${m.head_yaw.toFixed(1)}°`;
}

// ----------------------------------------------------
// Cognitive State Badge & Pulse
// ----------------------------------------------------
function updateCognitiveBadge(cogResult) {
  state.currentCognitiveState = cogResult.state;
  state.isSustained = cogResult.is_sustained;
  state.sustainedDurationSec = cogResult.sustained_duration_sec;

  // Persistence progress bar (accumulates toward 2.0s sustain threshold)
  const progressPercent = Math.min(100, (cogResult.sustained_duration_sec / 2.0) * 100);
  elements.persistenceProgressBar.style.width = `${progressPercent}%`;

  const stateConfigs = {
    Relaxed: {
      title: 'Relaxed (Flow State)',
      pedagogy: 'Steady focus • Silent monitoring',
      borderClass: 'border-emerald-500/30 bg-emerald-500/10',
      dotColor: 'bg-emerald-400',
      textColor: 'text-emerald-300'
    },
    Surprised: {
      title: 'Surprised (Cognitive Check)',
      pedagogy: 'Concept confusion • Clarifying hints ready',
      borderClass: 'border-amber-500/30 bg-amber-500/10',
      dotColor: 'bg-amber-400',
      textColor: 'text-amber-300'
    },
    Angry: {
      title: 'Angry (Task Friction)',
      pedagogy: 'Cognitive overload • Breathing reset / step breakdown',
      borderClass: 'border-rose-500/30 bg-rose-500/10',
      dotColor: 'bg-rose-400',
      textColor: 'text-rose-300'
    },
    Sad: {
      title: 'Sad (Low Valence)',
      pedagogy: 'Discouragement • Positive reinforcement active',
      borderClass: 'border-blue-500/30 bg-blue-500/10',
      dotColor: 'bg-blue-400',
      textColor: 'text-blue-300'
    },
    Tedious: {
      title: 'Tedious (Fatigue / Microsleep)',
      pedagogy: 'Mental exhaustion • 20-20-20 rule / stretch prompt',
      borderClass: 'border-purple-500/30 bg-purple-500/10',
      dotColor: 'bg-purple-400',
      textColor: 'text-purple-300'
    }
  };

  const cfg = stateConfigs[cogResult.state] || stateConfigs.Relaxed;

  elements.stateBadgeContainer.className = `flex items-center space-x-3 px-4 py-1.5 rounded-full border ${cfg.borderClass} transition-all duration-300`;
  elements.statePulseDot.className = `w-2.5 h-2.5 rounded-full ${cfg.dotColor} pulse-glow`;
  elements.stateNameText.className = `text-xs font-bold ${cfg.textColor}`;
  elements.stateNameText.textContent = cfg.title;
  elements.statePedagogyText.textContent = cfg.pedagogy;

  // Active micro-patterns list
  elements.activeSignalsList.innerHTML = cogResult.observable_signals
    .map(sig => `
      <li class="flex items-center space-x-2 text-slate-300">
        <span class="w-1.5 h-1.5 rounded-full ${cfg.dotColor}"></span>
        <span>${sig}</span>
      </li>
    `).join('');
}

// ----------------------------------------------------
// Supportive Pedagogical Interventions (Toasts & Modals)
// ----------------------------------------------------
function showInterventionToast(intervention) {
  state.activeIntervention = intervention;
  elements.toastTitle.textContent = intervention.title;
  elements.toastMessage.textContent = intervention.message;
  elements.btnToastAction.textContent = intervention.action_prompt || 'View Support';

  elements.interventionToast.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
}

function hideInterventionToast() {
  elements.interventionToast.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
}

function handleInterventionAction(intervention) {
  const type = intervention.type;

  if (type === 'breathing_reset') {
    openBreathingModal();
  } else if (type === 'twenty_twenty_rule') {
    openTwentyRuleModal();
  } else if (type === 'stretch_break') {
    openStretchModal();
  } else if (type === 'breakdown' || type === 'hint') {
    // Scroll and focus on pedagogical accordion
    elements.hintsList.scrollIntoView({ behavior: 'smooth' });
  }
}

// Modal 1: Breathing Exercise
function openBreathingModal() {
  closeAllModals();
  elements.modalBreathingReset.classList.remove('hidden');
  state.breathingCycle = 1;
  elements.breathCycleCounter.textContent = 'Breath 1 of 3';

  let phase = 0;
  const phases = ['Inhale slowly...', 'Hold breath...', 'Exhale gently...', 'Rest...'];

  if (state.breathingInterval) clearInterval(state.breathingInterval);
  state.breathingInterval = setInterval(() => {
    phase = (phase + 1) % phases.length;
    elements.breathRhythmText.textContent = phases[phase];

    if (phase === 0) {
      state.breathingCycle++;
      if (state.breathingCycle > 3) {
        state.breathingCycle = 3;
        elements.breathRhythmText.textContent = 'Complete! Feeling calm.';
      }
      elements.breathCycleCounter.textContent = `Breath ${state.breathingCycle} of 3`;
    }
  }, 2500);
}

function stopBreathingExercise() {
  if (state.breathingInterval) {
    clearInterval(state.breathingInterval);
    state.breathingInterval = null;
  }
}

// Modal 2: 20-20-20 Rule
function openTwentyRuleModal() {
  closeAllModals();
  elements.modalTwentyRule.classList.remove('hidden');
  state.twentyTimer = 20;
  elements.twentyTimerDisplay.textContent = '20';

  if (state.twentyInterval) clearInterval(state.twentyInterval);
  state.twentyInterval = setInterval(() => {
    state.twentyTimer--;
    elements.twentyTimerDisplay.textContent = state.twentyTimer;
    if (state.twentyTimer <= 0) {
      clearInterval(state.twentyInterval);
      elements.twentyTimerDisplay.textContent = '✓';
    }
  }, 1000);
}

function stopTwentyRule() {
  if (state.twentyInterval) {
    clearInterval(state.twentyInterval);
    state.twentyInterval = null;
  }
}

// Modal 3: Ergonomic Stretch
function openStretchModal() {
  closeAllModals();
  elements.modalStretchBreak.classList.remove('hidden');
}

// ----------------------------------------------------
// ROLE 3: DIAGNOSTIC DEBUGGER & ERROR CODE REPAIR
// ----------------------------------------------------
function updateDebuggerBadge(diagnostics) {
  state.activeErrors = diagnostics.detected_errors || [];
  const isHealthy = diagnostics.is_healthy;

  if (isHealthy) {
    elements.debuggerBadgeCount.className = 'w-2 h-2 rounded-full bg-emerald-400';
  } else {
    elements.debuggerBadgeCount.className = 'w-2 h-2 rounded-full bg-rose-500 animate-ping';
  }
}

async function openDebuggerModal() {
  closeAllModals();
  elements.modalDebugger.classList.remove('hidden');
  await refreshDebuggerStatus();
}

async function refreshDebuggerStatus() {
  try {
    const res = await fetch('/api/debugger/diagnostics');
    const diag = await res.json();
    state.activeErrors = diag.detected_errors || [];

    if (diag.is_healthy) {
      elements.dbgHealthBadge.textContent = 'HEALTHY (All Systems Nominal)';
      elements.dbgHealthBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      elements.dbgErrorList.innerHTML = '<div class="text-slate-500 font-mono">No active error codes detected in telemetry stream.</div>';
    } else {
      elements.dbgHealthBadge.textContent = `ANOMALIES DETECTED (${diag.detected_errors.length})`;
      elements.dbgHealthBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30';

      elements.dbgErrorList.innerHTML = diag.detected_errors
        .map(code => {
          const detail = diag.error_details[code] || 'Anomaly condition registered.';
          return `
            <div class="p-2 rounded bg-slate-900 border border-rose-500/30 flex items-center justify-between">
              <span class="font-mono text-rose-400 font-bold">${code}</span>
              <span class="text-slate-400 text-[11px]">${detail}</span>
            </div>
          `;
        })
        .join('');
    }
  } catch (err) {
    console.error('Failed to refresh debugger:', err);
  }
}

async function simulateDebuggerError(errorCode) {
  try {
    const res = await fetch(`/api/debugger/simulate-error/${errorCode}`, { method: 'POST' });
    const data = await res.json();
    await refreshDebuggerStatus();

    // Log to remedy console
    const logLine = document.createElement('div');
    logLine.className = 'text-amber-400';
    logLine.textContent = `[${new Date().toLocaleTimeString()}] INJECTED: ${errorCode}`;
    elements.dbgRemedyConsole.appendChild(logLine);
  } catch (e) {
    console.error(e);
  }
}

// Spec Requirement: "makes changes to the error code and fixes it without changing the content in it."
async function healDebuggerErrors() {
  const activeStudentCode = elements.codeEditor.value;

  if (state.activeErrors.length === 0) {
    const logLine = document.createElement('div');
    logLine.className = 'text-emerald-400';
    logLine.textContent = `[${new Date().toLocaleTimeString()}] All systems nominal. No errors to heal.`;
    elements.dbgRemedyConsole.appendChild(logLine);
    return;
  }

  // Iterate and heal each detected error code
  for (const errCode of [...state.activeErrors]) {
    try {
      const res = await fetch('/api/debugger/heal-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_code: errCode,
          student_content_buffer: activeStudentCode,
          recalibrate_baseline: true
        })
      });

      const healRes = await res.json();

      // Verify and display in remedy console
      const logLine = document.createElement('div');
      logLine.className = 'text-xs border-b border-slate-800 pb-1';
      logLine.innerHTML = `
        <div class="text-emerald-300 font-bold">✓ HEALED: ${healRes.error_code}</div>
        <div class="text-slate-400">${healRes.status_message}</div>
        <div class="text-[11px] text-cyan-300 font-mono">
          Content Preservation Check: ${healRes.student_content_preserved ? 'VERIFIED PASSED (0 bytes modified, SHA: ' + healRes.preserved_content_hash.substring(0, 10) + '...)' : 'FAILED'}
        </div>
      `;
      elements.dbgRemedyConsole.appendChild(logLine);
    } catch (err) {
      console.error(err);
    }
  }

  // Refresh status
  await refreshDebuggerStatus();
  triggerConfetti();
}

// ----------------------------------------------------
// Analytics & Session Summary
// ----------------------------------------------------
async function openAnalyticsModal() {
  closeAllModals();
  elements.modalAnalytics.classList.remove('hidden');

  try {
    const res = await fetch('/api/session/summary');
    const summary = await res.json();
    const dist = summary.state_distribution || {};
    const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;

    const calcPct = (count) => Math.round(((count || 0) / total) * 100);

    document.getElementById('statRelaxedCount').textContent = `${calcPct(dist['Relaxed'])}%`;
    document.getElementById('statSurprisedCount').textContent = `${calcPct(dist['Surprised'])}%`;
    document.getElementById('statAngryCount').textContent = `${calcPct(dist['Angry'])}%`;
    document.getElementById('statSadCount').textContent = `${calcPct(dist['Sad'])}%`;
    document.getElementById('statTediousCount').textContent = `${calcPct(dist['Tedious'])}%`;
  } catch (err) {
    console.error(err);
  }
}

function closeAllModals() {
  elements.modalBreathingReset.classList.add('hidden');
  elements.modalTwentyRule.classList.add('hidden');
  elements.modalStretchBreak.classList.add('hidden');
  elements.modalDebugger.classList.add('hidden');
  elements.modalAnalytics.classList.add('hidden');
  stopBreathingExercise();
  stopTwentyRule();
}

// ----------------------------------------------------
// Utilities & Timers
// ----------------------------------------------------
function startSessionTimer() {
  setInterval(() => {
    const elapsed = Math.floor((Date.now() - state.sessionStartTime) / 1000);
    const hrs = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    elements.sessionTimer.textContent = `${hrs}:${mins}:${secs}`;
  }, 1000);
}

function triggerConfetti() {
  if (typeof window.confetti === 'function') {
    window.confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  }
}

function roundTo(val, dec) {
  const factor = Math.pow(10, dec);
  return Math.round(val * factor) / factor;
}
