from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import time
import uuid


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


class SleepAlertRequest(BaseModel):
    student_id: str = "learner_you"
    student_name: str = "You"
    ear_value: float = Field(0.14, description="Measured Eye Aspect Ratio below threshold")
    head_pitch_slump: float = Field(-22.0, description="Downward head tilt")
    consecutive_drowsy_frames: int = Field(24, description="Sustained frames eyes closed")
    phone_number: Optional[str] = "+1 (555) 019-2834"


class SleepAlertResponse(BaseModel):
    status: str = "EMERGENCY_ALARM_DISPATCHED"
    alarm_audio_frequency_hz: int = 1760
    phone_notification_sent: bool = True
    notification_title: str = "WAKE UP! Keep the focus streak alive! 🔥"
    notification_body: str = "FocusMind detected sustained eye closure. Resume focus or take an early break!"
    teacher_dashboard_flagged: bool = True
    flagged_student_id: str
    timestamp: float = Field(default_factory=lambda: time.time())


class DrowsyAlertRequest(BaseModel):
    student_id: str = "learner_you"
    student_name: str = "You"
    drowsy_duration_seconds: int = Field(60, description="Seconds student has been continuously drowsy")
    ear_value: float = Field(0.20, description="Average eye aspect ratio during drowsy interval")
    head_pitch_slump: float = Field(-15.0, description="Head pitch angle indicating slouching/drooping")
    notification_channel: str = Field("BROWSER_AND_TEACHER", description="Dispatch channel")


class DrowsyAlertResponse(BaseModel):
    status: str = "DROWSY_NOTIFICATION_SENT"
    notification_sent: bool = True
    drowsy_duration_seconds: int = 60
    notification_title: str = "Focus Alert: 1 Minute Drowsiness Detected"
    notification_body: str = "You've been drowsy for 60 seconds. Take a deep breath, sit upright, or take a quick sip of water!"
    teacher_dashboard_flagged: bool = True
    flagged_student_id: str
    timestamp: float = Field(default_factory=lambda: time.time())


class TeacherStudentStatus(BaseModel):
    student_id: str
    name: str
    status: str  # "Focusing", "On Break", "Idle", "SLEEPING", "DROWSY (1 min)"
    emotion: str  # "FOCUSED", "HAPPY", "EXCITED", "ANXIOUS", "SAD", "SLEEPING", "DROWSY"
    ear_value: float
    is_sleeping_flagged: bool = False
    is_drowsy_flagged: bool = False
    drowsy_duration_seconds: int = 0
    last_nudge_received: Optional[str] = None


class TeacherNudgeRequest(BaseModel):
    student_id: str
    nudge_type: str = "ENCOURAGEMENT"  # "WAKE_UP", "ENCOURAGEMENT", "BREATHER"
    custom_message: Optional[str] = None


class ZoomDevice(BaseModel):
    device_id: str
    name: str
    device_type: str  # "Primary Laptop", "Classroom Display", "Teacher Tablet", "Student Laptop"
    role: str  # "Host", "Co-Host", "Participant"
    email: Optional[str] = None
    is_in_waiting_room: bool = False
    connected_at: float = Field(default_factory=lambda: time.time())


class ZoomSettings(BaseModel):
    co_host_enabled: bool = True
    alternative_host_enabled: bool = True
    alternative_hosts: List[str] = Field(default_factory=lambda: ["teacher.lead@school.edu", "prof.math@school.edu"])
    waiting_room_enabled: bool = True
    allow_alt_hosts_polls_breakout: bool = True
    screen_share_rule: str = "Host and Co-hosts only"  # "Host and Co-hosts only" | "All Participants"
    meeting_verified: bool = True
    security_shield_active: bool = True
    connected_devices: List[ZoomDevice] = Field(default_factory=list)


class UpdateZoomSettingsRequest(BaseModel):
    co_host_enabled: Optional[bool] = None
    alternative_host_enabled: Optional[bool] = None
    alternative_hosts: Optional[List[str]] = None
    waiting_room_enabled: Optional[bool] = None
    allow_alt_hosts_polls_breakout: Optional[bool] = None
    screen_share_rule: Optional[str] = None


class PromoteDeviceRequest(BaseModel):
    device_id: str
    new_role: str  # "Host", "Co-Host", "Participant"
    admit_from_waiting_room: bool = False


# Cross-Device Sync & Dual-Mode AI Tutoring Models
class RoomDevice(BaseModel):
    device_id: str
    device_name: str
    device_type: str = "Desktop"  # "Desktop", "Tablet", "Mobile", "Display"
    joined_at: float = Field(default_factory=lambda: time.time())
    is_host: bool = False


class RoomChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    sender: str = "user"  # "user", "ai", "system"
    author_name: str = "You"
    mode: str = "TEACHER"  # "TEACHER" | "STUDENT"
    text: str
    hint: bool = False
    timestamp: float = Field(default_factory=lambda: time.time())
    device_id: Optional[str] = None


class RoomSession(BaseModel):
    room_code: str  # e.g. "FM-8421"
    session_id: str
    created_at: float = Field(default_factory=lambda: time.time())
    active_module_id: str = "mod_two_sum"
    active_mode: str = "TEACHER"  # "TEACHER" (Expert Educator) | "STUDENT" (Feynman Technique)
    current_topic: str = "Two Sum & Hash Tables"
    connected_devices: List[RoomDevice] = Field(default_factory=list)
    chat_history: List[RoomChatMessage] = Field(default_factory=list)
    shared_code: str = ""
    qr_code_svg: Optional[str] = None


class CreateRoomRequest(BaseModel):
    device_name: str = "Primary Desktop"
    device_type: str = "Desktop"
    initial_topic: Optional[str] = "Two Sum & Hash Tables"
    active_mode: Optional[str] = "TEACHER"


class JoinRoomRequest(BaseModel):
    room_code: str
    device_name: str = "Secondary Device"
    device_type: str = "Tablet"  # "Tablet", "Mobile", "Laptop"


class SendRoomMessageRequest(BaseModel):
    device_id: Optional[str] = None
    author_name: str = "You"
    text: Optional[str] = None
    message: Optional[str] = None
    user_code: Optional[str] = None

    @property
    def query_text(self) -> str:
        return (self.text or self.message or "").strip()


class ToggleRoomModeRequest(BaseModel):
    new_mode: str  # "TEACHER" | "STUDENT"
    device_id: Optional[str] = None


class UpdateRoomCodeRequest(BaseModel):
    code_content: str
    device_id: Optional[str] = None


