from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import time


class CognitiveStateEnum(str, Enum):
    RELAXED = "Relaxed"
    SURPRISED = "Surprised"
    ANGRY = "Angry"
    SAD = "Sad"
    TEDIOUS = "Tedious"


class LandmarkTelemetry(BaseModel):
    timestamp: float = Field(default_factory=lambda: time.time())
    ear: float = Field(0.28, description="Eye Aspect Ratio (~0.28 baseline, <0.18 closed/drooping)")
    mar: float = Field(0.15, description="Mouth Aspect Ratio (~0.15 baseline, >0.50 yawn)")
    brow_furrow: float = Field(0.0, description="Brow Furrow index (0.0 neutral, >0.55 furrowed/frown)")
    brow_inner_up: float = Field(0.0, description="Brow Inner Up elevation (0.0 neutral, >0.55 raised)")
    eye_wide: float = Field(0.0, description="Eye wide aperture index (0.0 neutral, >0.55 widened)")
    mouth_frown: float = Field(0.0, description="Downward mouth curvature (0.0 neutral, >0.50 frowned)")
    head_pitch: float = Field(0.0, description="Degrees pitch (+up, -down slump)")
    head_yaw: float = Field(0.0, description="Degrees yaw (horizontal turn, >20° gaze away)")
    head_roll: float = Field(0.0, description="Degrees roll (lateral tilt)")
    blink_rate_per_min: float = Field(18.0, description="Estimated blink rate per minute")
    microsleep_detected: bool = Field(False, description="EAR < 0.18 for sustained frames")
    yawn_detected: bool = Field(False, description="MAR > 0.50 for sustained frames")
    gaze_away_detected: bool = Field(False, description="Yaw > 22° or persistent eye gaze aversion")
    head_slump_detected: bool = Field(False, description="Head pitch drift < -15° downward")
    confidence: float = Field(0.95, description="Model tracking confidence [0.0 - 1.0]")
    client_frame_id: Optional[int] = None


class CognitiveStateResult(BaseModel):
    state: CognitiveStateEnum
    confidence: float
    sustained_duration_sec: float
    is_sustained: bool
    observable_signals: List[str]
    pedagogical_context: str
    interventional_trigger: str
    timestamp: float = Field(default_factory=lambda: time.time())


class InterventionType(str, Enum):
    NONE = "none"
    HINT = "hint"
    BREAKDOWN = "breakdown"
    ENCOURAGEMENT = "encouragement"
    STRETCH_BREAK = "stretch_break"
    BREATHING_RESET = "breathing_reset"
    TWENTY_TWENTY_RULE = "twenty_twenty_rule"
    QUIZ_CHECKPOINT = "quiz_checkpoint"


class TutorIntervention(BaseModel):
    id: str
    type: InterventionType
    title: str
    message: str
    severity: str = "supportive"  # info, supportive, gentle_alert
    action_prompt: str
    recommended_duration_sec: Optional[int] = None
    created_at: float = Field(default_factory=lambda: time.time())
    pedagogical_reason: str


class StudySession(BaseModel):
    session_id: str
    student_id: str = "learner_1"
    start_time: float = Field(default_factory=lambda: time.time())
    active_module_id: str = "mod_dsa_binary_search"
    total_study_seconds: int = 0
    state_distribution: Dict[str, int] = Field(default_factory=dict)
    interventions_triggered: List[TutorIntervention] = Field(default_factory=list)
    recent_telemetry: List[LandmarkTelemetry] = Field(default_factory=list)


class DebuggerErrorCode(str, Enum):
    ERR_FACE_NOT_FOUND = "ERR_FACE_NOT_FOUND"
    ERR_LOW_CONFIDENCE = "ERR_LOW_CONFIDENCE"
    ERR_LANDMARK_JITTER = "ERR_LANDMARK_JITTER"
    ERR_OCCLUSION = "ERR_OCCLUSION"
    ERR_CAMERA_STALL = "ERR_CAMERA_STALL"
    ERR_BASELINE_DRIFT = "ERR_BASELINE_DRIFT"
    ERR_STATE_CONFLICT = "ERR_STATE_CONFLICT"


class DiagnosticReport(BaseModel):
    timestamp: float = Field(default_factory=lambda: time.time())
    is_healthy: bool
    detected_errors: List[DebuggerErrorCode]
    error_details: Dict[str, str]
    system_metrics: Dict[str, Any]
    remediation_status: str


class HealErrorRequest(BaseModel):
    error_code: DebuggerErrorCode
    student_content_buffer: Optional[str] = Field(None, description="Student code/answers buffer to verify preservation")
    recalibrate_baseline: bool = True


class HealErrorResponse(BaseModel):
    error_code: DebuggerErrorCode
    resolved: bool
    status_message: str
    recalibrated_offsets: Dict[str, float]
    student_content_preserved: bool
    preserved_content_hash: Optional[str] = None
    timestamp: float = Field(default_factory=lambda: time.time())


class LessonModule(BaseModel):
    id: str
    track: str
    title: str
    difficulty: str
    estimated_minutes: int
    concept_summary: str
    initial_code: str
    exercise_prompt: str
    solution_code: str
    test_cases: List[Dict[str, Any]]
    clarifying_hints: List[str]
    step_by_step_breakdown: List[str]
