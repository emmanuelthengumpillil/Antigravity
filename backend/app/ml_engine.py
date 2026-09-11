import time
from collections import deque
from typing import List, Tuple, Optional, Dict
from app.models import (
    CognitiveStateEnum,
    LandmarkTelemetry,
    CognitiveStateResult
)


class MLEngine:
    def __init__(self, buffer_size: int = 30, sustain_threshold_sec: float = 2.0):
        self.buffer_size = buffer_size
        self.sustain_threshold_sec = sustain_threshold_sec
        # Rolling telemetry history: deque of (timestamp, LandmarkTelemetry, CognitiveStateEnum)
        self.history: deque[Tuple[float, LandmarkTelemetry, CognitiveStateEnum]] = deque(maxlen=buffer_size)
        
        # State duration tracking: state -> timestamp when this contiguous state streak began
        self.current_state: CognitiveStateEnum = CognitiveStateEnum.RELAXED
        self.state_start_time: float = time.time()
        
        # Calibration offsets (managed and tuned by Debugger service)
        self.calibration_offsets: Dict[str, float] = {
            "ear_bias": 0.0,
            "mar_bias": 0.0,
            "brow_furrow_bias": 0.0,
            "brow_inner_up_bias": 0.0,
            "pitch_bias": 0.0,
            "yaw_bias": 0.0,
        }

    def reset(self):
        self.history.clear()
        self.current_state = CognitiveStateEnum.RELAXED
        self.state_start_time = time.time()

    def update_calibration(self, offsets: Dict[str, float]):
        self.calibration_offsets.update(offsets)

    def classify_frame(self, raw_telemetry: LandmarkTelemetry) -> Tuple[CognitiveStateEnum, float, List[str]]:
        """
        Classifies a single telemetry snapshot using normalized feature mapping.
        Returns: (instant_state, confidence, observable_signals)
        """
        # Apply calibration offsets
        ear = max(0.0, raw_telemetry.ear + self.calibration_offsets["ear_bias"])
        mar = max(0.0, raw_telemetry.mar + self.calibration_offsets["mar_bias"])
        brow_furrow = max(0.0, raw_telemetry.brow_furrow + self.calibration_offsets["brow_furrow_bias"])
        brow_inner_up = max(0.0, raw_telemetry.brow_inner_up + self.calibration_offsets["brow_inner_up_bias"])
        eye_wide = raw_telemetry.eye_wide
        mouth_frown = raw_telemetry.mouth_frown
        head_pitch = raw_telemetry.head_pitch + self.calibration_offsets["pitch_bias"]
        head_yaw = raw_telemetry.head_yaw + self.calibration_offsets["yaw_bias"]
        blink_rate = raw_telemetry.blink_rate_per_min

        signals: List[str] = []
        state_scores: Dict[CognitiveStateEnum, float] = {
            CognitiveStateEnum.RELAXED: 0.25,
            CognitiveStateEnum.SURPRISED: 0.0,
            CognitiveStateEnum.ANGRY: 0.0,
            CognitiveStateEnum.SAD: 0.0,
            CognitiveStateEnum.TEDIOUS: 0.0
        }

        # 1. Check TEDIOUS (Boredom / Fatigue / Microsleep)
        # Microsleep events, high blink rate, slumped head pose, yawning, blank gaze
        tedious_score = 0.0
        if raw_telemetry.microsleep_detected or ear < 0.18:
            tedious_score += 0.50
            signals.append("Prolonged eye closure / potential microsleep (EAR < 0.18)")
        if raw_telemetry.yawn_detected or mar > 0.48:
            tedious_score += 0.45
            signals.append("Yawning detected (prolonged high MAR)")
        if raw_telemetry.head_slump_detected or head_pitch < -14.0:
            tedious_score += 0.35
            signals.append("Slumped head pose (downward pitch drift)")
        if blink_rate > 28.0:
            tedious_score += 0.20
            signals.append("High blink frequency (>28/min)")
        if raw_telemetry.gaze_away_detected or abs(head_yaw) > 22.0:
            tedious_score += 0.25
            signals.append("Prolonged gaze averted from screen")
        state_scores[CognitiveStateEnum.TEDIOUS] = min(1.0, tedious_score)

        # 2. Check ANGRY (Cognitive overload, persistent task friction, frustration)
        # Furrowed brow, narrowed eyes, jaw clench
        angry_score = 0.0
        if brow_furrow > 0.45:
            angry_score += 0.55 * (brow_furrow / 0.8)
            signals.append("Furrowed brow tension (browDownLeft/Right)")
        if ear < 0.23 and ear >= 0.18:
            angry_score += 0.25
            signals.append("Narrowed/squinting eye aperture")
        if brow_furrow > 0.50 and mouth_frown > 0.30:
            angry_score += 0.25
            signals.append("Facial strain indicating task friction")
        state_scores[CognitiveStateEnum.ANGRY] = min(1.0, angry_score)

        # 3. Check SURPRISED (Sudden discovery, cognitive dissonance, confusion)
        # Elevated eyebrows (browInnerUp), widened eye aperture (eyeWide)
        surprised_score = 0.0
        if brow_inner_up > 0.45:
            surprised_score += 0.50 * (brow_inner_up / 0.8)
            signals.append("Elevated eyebrows (browInnerUp)")
        if eye_wide > 0.45 or (ear > 0.32 and brow_inner_up > 0.40):
            surprised_score += 0.40
            signals.append("Widened eye aperture (eyeWide)")
        state_scores[CognitiveStateEnum.SURPRISED] = min(1.0, surprised_score)

        # 4. Check SAD (Downward mouth curvature, drooping eyelids, gaze aversion)
        # Discouragement, low self-efficacy, loss of motivation
        sad_score = 0.0
        if mouth_frown > 0.45:
            sad_score += 0.55 * (mouth_frown / 0.8)
            signals.append("Downward mouth curvature (mouthFrown)")
        if ear < 0.24 and brow_furrow < 0.35 and brow_inner_up < 0.35:
            sad_score += 0.30
            signals.append("Drooping eyelids and low facial tone")
        if abs(head_yaw) > 15.0 and mouth_frown > 0.35:
            sad_score += 0.20
            signals.append("Gaze aversion with low valence")
        state_scores[CognitiveStateEnum.SAD] = min(1.0, sad_score)

        # 5. Check RELAXED (Flow state, neutral baseline, steady gaze)
        relaxed_score = 0.0
        if (
            brow_furrow < 0.35
            and brow_inner_up < 0.35
            and mouth_frown < 0.35
            and mar < 0.35
            and ear >= 0.22
            and ear <= 0.34
            and abs(head_pitch) < 12.0
            and abs(head_yaw) < 15.0
        ):
            relaxed_score = 0.85
            signals.append("Baseline neutral facial muscles, steady gaze, normal blink cadence")
        state_scores[CognitiveStateEnum.RELAXED] = relaxed_score

        # Select highest scoring state
        best_state = max(state_scores, key=state_scores.get)
        confidence = state_scores[best_state]

        # If highest score is weak, fallback to Relaxed (neutral default)
        if confidence < 0.35:
            best_state = CognitiveStateEnum.RELAXED
            confidence = 0.70
            if not signals:
                signals.append("Steady focus, baseline engagement")

        return best_state, round(confidence, 2), signals

    def process_telemetry(self, telemetry: LandmarkTelemetry) -> CognitiveStateResult:
        """
        Processes incoming telemetry with temporal smoothing over a rolling buffer.
        Filters momentary flickers so interventions trigger only on sustained patterns.
        """
        now = time.time()
        instant_state, instant_conf, signals = self.classify_frame(telemetry)
        
        # Add to rolling history
        self.history.append((now, telemetry, instant_state))

        # Check sustained duration
        # Count frequency of states within the active history window
        recent_states = [item[2] for item in self.history]
        dominant_state = max(set(recent_states), key=recent_states.count)
        dominant_count = recent_states.count(dominant_state)
        dominant_ratio = dominant_count / max(1, len(recent_states))

        if dominant_state != self.current_state:
            # Transition to candidate state if supported by >= 60% of recent frames
            if dominant_ratio >= 0.60:
                self.current_state = dominant_state
                self.state_start_time = now
        
        sustained_duration = max(0.0, now - self.state_start_time)
        is_sustained = (
            sustained_duration >= self.sustain_threshold_sec
            and dominant_ratio >= 0.65
        )

        # Pedagogical descriptions based on spec
        pedagogical_contexts = {
            CognitiveStateEnum.RELAXED: "Steady focus, flow state.",
            CognitiveStateEnum.SURPRISED: "Sudden discovery, cognitive dissonance, or confusion.",
            CognitiveStateEnum.ANGRY: "Cognitive overload, persistent task friction, or frustration.",
            CognitiveStateEnum.SAD: "Discouragement, low self-efficacy, loss of motivation.",
            CognitiveStateEnum.TEDIOUS: "Monotony, mental exhaustion, disengagement."
        }

        interventional_triggers = {
            CognitiveStateEnum.RELAXED: "No intervention; maintain silent monitoring.",
            CognitiveStateEnum.SURPRISED: "Offer a clarifying hint, alternative explanation, or conceptual recap.",
            CognitiveStateEnum.ANGRY: "Suggest breaking the problem down, switching difficulty, or taking a 60-second breathing reset.",
            CognitiveStateEnum.SAD: "Deliver positive reinforcement, validate problem difficulty, or review prior mastered concepts.",
            CognitiveStateEnum.TEDIOUS: "Prompt a dynamic quiz question, interactive exercise, or a 5-minute physical movement break."
        }

        return CognitiveStateResult(
            state=self.current_state,
            confidence=instant_conf,
            sustained_duration_sec=round(sustained_duration, 1),
            is_sustained=is_sustained,
            observable_signals=signals,
            pedagogical_context=pedagogical_contexts[self.current_state],
            interventional_trigger=interventional_triggers[self.current_state],
            timestamp=now
        )
