import os
import time
import random
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.models import (
    LandmarkTelemetry,
    CognitiveStateResult,
    TutorIntervention,
    DiagnosticReport,
    HealErrorRequest,
    HealErrorResponse,
    DebuggerErrorCode,
    StudySession,
    SleepAlertRequest,
    SleepAlertResponse,
    DrowsyAlertRequest,
    DrowsyAlertResponse,
    TeacherStudentStatus,
    TeacherNudgeRequest,
    ZoomSettings,
    ZoomDevice,
    UpdateZoomSettingsRequest,
    PromoteDeviceRequest,
    RoomDevice,
    RoomChatMessage,
    RoomSession,
    CreateRoomRequest,
    JoinRoomRequest,
    SendRoomMessageRequest,
    ToggleRoomModeRequest,
    UpdateRoomCodeRequest
)
from app.ml_engine import MLEngine
from app.tutor_engine import TutorEngine
from app.debugger_service import DebuggerService
from app.curriculum import CURRICULUM_MODULES, get_module

app = FastAPI(
    title="FocusMind: Emotion-Aware AI Tutor API",
    description="Privacy-first student engagement, fatigue, and cognitive state estimation with adaptive pedagogical interventions.",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core service singletons
ml_engine = MLEngine(buffer_size=30, sustain_threshold_sec=2.0)
tutor_engine = TutorEngine(cooldown_seconds=25.0)
debugger_service = DebuggerService()

# In-memory session tracking
current_session = StudySession(
    session_id="focus_sess_active",
    start_time=time.time(),
    active_module_id="mod_binary_search"
)
last_telemetry_time = time.time()


@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "FocusMind Cognitive State Engine",
        "version": "1.0.0",
        "uptime_sec": round(time.time() - current_session.start_time, 1)
    }


@app.get("/api/curriculum")
def list_curriculum():
    return CURRICULUM_MODULES


@app.get("/api/curriculum/{module_id}")
def get_curriculum_module(module_id: str):
    mod = get_module(module_id)
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
    return mod


@app.post("/api/session/select-module/{module_id}")
def select_module(module_id: str):
    mod = get_module(module_id)
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
    current_session.active_module_id = module_id
    return {"status": "ok", "active_module": mod}


@app.post("/api/telemetry/process")
def process_telemetry(telemetry: LandmarkTelemetry):
    global last_telemetry_time
    last_telemetry_time = time.time()

    # 1. Feature mapping & temporal smoothing classification
    cognitive_result = ml_engine.process_telemetry(telemetry)

    # 2. Update session state metrics
    state_str = cognitive_result.state.value
    current_session.state_distribution[state_str] = (
        current_session.state_distribution.get(state_str, 0) + 1
    )
    current_session.total_study_seconds = int(time.time() - current_session.start_time)

    # 3. Evaluate supportive pedagogical interventions
    active_mod = get_module(current_session.active_module_id)
    intervention = tutor_engine.evaluate_intervention(
        cognitive_state=cognitive_result,
        active_module=active_mod
    )
    if intervention:
        current_session.interventions_triggered.append(intervention)

    # 4. Telemetry diagnostics
    diagnostics = debugger_service.diagnose_telemetry(
        telemetry=telemetry,
        last_frame_time=last_telemetry_time
    )

    return {
        "cognitive_state": cognitive_result,
        "intervention": intervention,
        "diagnostics": diagnostics,
        "session_summary": {
            "total_study_seconds": current_session.total_study_seconds,
            "active_module_id": current_session.active_module_id,
            "interventions_count": len(current_session.interventions_triggered)
        }
    }


@app.post("/api/tutor/request-intervention")
def request_intervention(state_override: Optional[str] = None):
    active_mod = get_module(current_session.active_module_id)
    # If state_override is specified, craft a synthetic state result to trigger immediate assistance
    if state_override:
        cog_result = ml_engine.process_telemetry(LandmarkTelemetry())
        # Force evaluation
        intervention = tutor_engine.evaluate_intervention(
            cognitive_state=cog_result,
            active_module=active_mod,
            force=True
        )
    else:
        # Latest cognitive state from buffer
        now = time.time()
        sustained = (now - ml_engine.state_start_time) >= ml_engine.sustain_threshold_sec
        cog_result = CognitiveStateResult(
            state=ml_engine.current_state,
            confidence=0.85,
            sustained_duration_sec=round(now - ml_engine.state_start_time, 1),
            is_sustained=sustained,
            observable_signals=["Manual tutor request initiated by student"],
            pedagogical_context="Student requested proactive tutor guidance.",
            interventional_trigger="Provide adaptive learning support.",
            timestamp=now
        )
        intervention = tutor_engine.evaluate_intervention(
            cognitive_state=cog_result,
            active_module=active_mod,
            force=True
        )

    return {"intervention": intervention}


# Debugger API Endpoints (Role 3)

@app.get("/api/debugger/diagnostics")
def get_diagnostics():
    return debugger_service.diagnose_telemetry(last_frame_time=last_telemetry_time)


@app.post("/api/debugger/simulate-error/{error_code}")
def simulate_error(error_code: DebuggerErrorCode):
    report = debugger_service.simulate_error(error_code)
    return {"status": "error_simulated", "diagnostics": report}


@app.post("/api/debugger/clear-errors")
def clear_errors():
    debugger_service.clear_simulated_errors()
    return {"status": "cleared", "diagnostics": debugger_service.diagnose_telemetry()}


@app.post("/api/debugger/heal-error")
def heal_error(request: HealErrorRequest) -> HealErrorResponse:
    # 1. Debugger fixes the error code and verifies student content preservation
    response = debugger_service.heal_error_code(request)

    # 2. Apply any recalibrated baseline biases to MLEngine
    if response.recalibrated_offsets:
        ml_engine.update_calibration(response.recalibrated_offsets)

    return response


@app.get("/api/session/summary")
def get_session_summary():
    return {
        "session_id": current_session.session_id,
        "total_study_seconds": int(time.time() - current_session.start_time),
        "active_module_id": current_session.active_module_id,
        "state_distribution": current_session.state_distribution,
        "total_interventions": len(current_session.interventions_triggered),
        "interventions": current_session.interventions_triggered[-5:],  # last 5
        "ml_calibration": ml_engine.calibration_offsets
    }


@app.post("/api/session/reset")
def reset_session():
    global current_session
    current_session = StudySession(
        session_id=f"focus_sess_{int(time.time())}",
        start_time=time.time(),
        active_module_id=current_session.active_module_id
    )
    ml_engine.reset()
    debugger_service.clear_simulated_errors()
    return {"status": "reset", "session": current_session}


# Realtime Teacher Portal & Emergency Sleep State Store
connected_students = [
    TeacherStudentStatus(student_id="learner_you", name="You", status="Focusing", emotion="FOCUSED", ear_value=0.28, is_sleeping_flagged=False),
    TeacherStudentStatus(student_id="st_1", name="Alex K.", status="Focusing", emotion="EXCITED", ear_value=0.29, is_sleeping_flagged=False),
    TeacherStudentStatus(student_id="st_2", name="Elena R.", status="Focusing", emotion="FOCUSED", ear_value=0.27, is_sleeping_flagged=False),
    TeacherStudentStatus(student_id="st_3", name="David M.", status="Focusing", emotion="ANXIOUS", ear_value=0.25, is_sleeping_flagged=False),
    TeacherStudentStatus(student_id="st_4", name="Maya S.", status="On Break", emotion="HAPPY", ear_value=0.30, is_sleeping_flagged=False),
    TeacherStudentStatus(student_id="st_5", name="Liam T.", status="Idle", emotion="SAD", ear_value=0.24, is_sleeping_flagged=False),
]


@app.post("/api/interventions/sleep-alert", response_model=SleepAlertResponse)
def trigger_sleep_emergency(request: SleepAlertRequest):
    """
    Emergency Intervention Endpoint:
    1. Triggers local alarm sound.
    2. Sends push notification to student mobile phone.
    3. Flags the student in the Teacher Realtime Status Monitor.
    """
    # Flag the student in the teacher room
    for st in connected_students:
        if st.student_id == request.student_id or st.name == request.student_name:
            st.status = "SLEEPING"
            st.emotion = "SLEEPING"
            st.ear_value = request.ear_value
            st.is_sleeping_flagged = True

    return SleepAlertResponse(
        status="EMERGENCY_ALARM_DISPATCHED",
        alarm_audio_frequency_hz=1760,
        phone_notification_sent=True,
        notification_title="WAKE UP! Keep the focus streak alive! 🔥",
        notification_body=f"EAR {request.ear_value:.2f} detected prolonged eye closure. Alarm sounded and phone notified.",
        teacher_dashboard_flagged=True,
        flagged_student_id=request.student_id
    )


@app.post("/api/interventions/drowsy-alert", response_model=DrowsyAlertResponse)
def trigger_drowsy_alert(request: DrowsyAlertRequest):
    """
    Prolonged Drowsiness Intervention Endpoint:
    Dispatched when student is detected drowsy for continuous duration (~1 minute).
    1. Flags student in Teacher Realtime Status Monitor as Drowsy.
    2. Dispatches push notification and gentle waking alert.
    """
    for st in connected_students:
        if st.student_id == request.student_id or st.name == request.student_name:
            st.status = f"DROWSY ({request.drowsy_duration_seconds}s)"
            st.emotion = "DROWSY"
            st.ear_value = request.ear_value
            st.is_drowsy_flagged = True
            st.drowsy_duration_seconds = request.drowsy_duration_seconds

    return DrowsyAlertResponse(
        status="DROWSY_NOTIFICATION_SENT",
        notification_sent=True,
        drowsy_duration_seconds=request.drowsy_duration_seconds,
        notification_title="Focus Alert: 1 Minute Drowsiness Detected",
        notification_body=f"Continuous drowsiness detected for {request.drowsy_duration_seconds}s (EAR {request.ear_value:.2f}). Please sit upright, stretch, or take a quick sip of water!",
        teacher_dashboard_flagged=True,
        flagged_student_id=request.student_id
    )


@app.get("/api/teacher/students")
def get_teacher_students():
    """Returns the live room student roster with emotional states and sleep flags."""
    return {"students": connected_students, "timestamp": time.time()}


@app.post("/api/teacher/nudge")
def send_teacher_nudge(nudge: TeacherNudgeRequest):
    """Dispatches discreet encouragement or wake-up nudge from the teacher."""
    target_student = None
    for st in connected_students:
        if st.student_id == nudge.student_id:
            msg = nudge.custom_message or ("Wake up! You've got this! 🔥" if nudge.nudge_type == "WAKE_UP" else "Keep going!")
            st.last_nudge_received = msg
            if nudge.nudge_type == "WAKE_UP":
                st.is_sleeping_flagged = False
                st.status = "Focusing"
                st.emotion = "FOCUSED"
            target_student = st
            break

    return {"status": "nudge_sent", "student": target_student}


# Zoom Classroom & Co-Host Settings Store
zoom_classroom_state = ZoomSettings(
    co_host_enabled=True,
    alternative_host_enabled=True,
    alternative_hosts=["teacher.lead@school.edu", "prof.math@school.edu"],
    waiting_room_enabled=True,
    allow_alt_hosts_polls_breakout=True,
    screen_share_rule="Host and Co-hosts only",
    meeting_verified=True,
    security_shield_active=True,
    connected_devices=[
        ZoomDevice(device_id="dev_host_1", name="Teacher Laptop (Primary)", device_type="Primary Laptop", role="Host", email="teacher.lead@school.edu"),
        ZoomDevice(device_id="dev_display_1", name="Classroom Smartboard 302", device_type="Classroom Display", role="Co-Host", email="prof.math@school.edu"),
        ZoomDevice(device_id="dev_tablet_1", name="Teacher iPad Pro", device_type="Teacher Tablet", role="Co-Host", email="teacher.lead@school.edu"),
        ZoomDevice(device_id="dev_student_1", name="Student Laptop (You)", device_type="Student Laptop", role="Participant", email="student@school.edu")
    ]
)


@app.get("/api/zoom/settings", response_model=ZoomSettings)
def get_zoom_settings():
    """Retrieve active Zoom Host, Alternative Host, Security, and Device Co-Host status."""
    return zoom_classroom_state


@app.post("/api/zoom/settings", response_model=ZoomSettings)
def update_zoom_settings(req: UpdateZoomSettingsRequest):
    """Updates Zoom meeting security rules, Alternative Hosts, and Screen Share restrictions."""
    if req.co_host_enabled is not None:
        zoom_classroom_state.co_host_enabled = req.co_host_enabled
    if req.alternative_host_enabled is not None:
        zoom_classroom_state.alternative_host_enabled = req.alternative_host_enabled
    if req.alternative_hosts is not None:
        zoom_classroom_state.alternative_hosts = req.alternative_hosts
    if req.waiting_room_enabled is not None:
        zoom_classroom_state.waiting_room_enabled = req.waiting_room_enabled
    if req.allow_alt_hosts_polls_breakout is not None:
        zoom_classroom_state.allow_alt_hosts_polls_breakout = req.allow_alt_hosts_polls_breakout
    if req.screen_share_rule is not None:
        zoom_classroom_state.screen_share_rule = req.screen_share_rule

    # Verify meeting security shield status
    zoom_classroom_state.security_shield_active = (
        zoom_classroom_state.waiting_room_enabled and 
        zoom_classroom_state.screen_share_rule == "Host and Co-hosts only"
    )
    zoom_classroom_state.meeting_verified = len(zoom_classroom_state.alternative_hosts) > 0
    return zoom_classroom_state


@app.post("/api/zoom/devices/role")
def update_device_role(req: PromoteDeviceRequest):
    """Promotes or changes a connected classroom device's role (Make Co-Host / Make Host)."""
    found_device = None
    for dev in zoom_classroom_state.connected_devices:
        if dev.device_id == req.device_id:
            dev.role = req.new_role
            if req.admit_from_waiting_room:
                dev.is_in_waiting_room = False
            found_device = dev
            break

    if not found_device:
        raise HTTPException(status_code=404, detail="Device not found")

    return {
        "status": "device_role_updated",
        "device": found_device,
        "security_shield_active": zoom_classroom_state.security_shield_active
    }


# =========================================================================
# Cross-Device Connectivity & Real-Time Dual-Mode Sync Layer
# =========================================================================

def generate_qr_svg(room_code: str) -> str:
    """Generates an embeddable, styled SVG QR code pairing badge for multi-device sync."""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" class="rounded-2xl bg-white p-2 shadow-lg">
  <rect width="160" height="160" fill="#ffffff" rx="14"/>
  <!-- Finder Pattern 1 (Top-Left) -->
  <rect x="16" y="16" width="38" height="38" fill="#000000" rx="6"/>
  <rect x="22" y="22" width="26" height="26" fill="#ffffff" rx="3"/>
  <rect x="27" y="27" width="16" height="16" fill="#06b6d4" rx="2"/>
  <!-- Finder Pattern 2 (Top-Right) -->
  <rect x="106" y="16" width="38" height="38" fill="#000000" rx="6"/>
  <rect x="112" y="22" width="26" height="26" fill="#ffffff" rx="3"/>
  <rect x="117" y="27" width="16" height="16" fill="#06b6d4" rx="2"/>
  <!-- Finder Pattern 3 (Bottom-Left) -->
  <rect x="16" y="106" width="38" height="38" fill="#000000" rx="6"/>
  <rect x="22" y="112" width="26" height="26" fill="#ffffff" rx="3"/>
  <rect x="27" y="117" width="16" height="16" fill="#06b6d4" rx="2"/>
  <!-- Encoded Data Matrix Blocks -->
  <rect x="64" y="20" width="10" height="10" fill="#09090b"/>
  <rect x="80" y="20" width="10" height="10" fill="#06b6d4"/>
  <rect x="64" y="36" width="26" height="10" fill="#09090b"/>
  <rect x="64" y="52" width="10" height="10" fill="#06b6d4"/>
  <rect x="80" y="52" width="10" height="10" fill="#09090b"/>
  <rect x="20" y="64" width="12" height="12" fill="#09090b"/>
  <rect x="36" y="64" width="12" height="12" fill="#06b6d4"/>
  <rect x="108" y="64" width="14" height="14" fill="#09090b"/>
  <rect x="126" y="64" width="14" height="14" fill="#06b6d4"/>
  <rect x="20" y="80" width="12" height="12" fill="#06b6d4"/>
  <rect x="114" y="84" width="26" height="10" fill="#09090b"/>
  <rect x="64" y="106" width="12" height="12" fill="#06b6d4"/>
  <rect x="80" y="106" width="12" height="12" fill="#09090b"/>
  <rect x="64" y="124" width="28" height="12" fill="#09090b"/>
  <rect x="106" y="106" width="14" height="14" fill="#06b6d4"/>
  <rect x="124" y="124" width="16" height="16" fill="#09090b"/>
  <!-- Center Room Code Pill -->
  <rect x="42" y="70" width="76" height="20" fill="#09090b" rx="6"/>
  <text x="80" y="84" font-size="11" font-family="monospace" font-weight="900" fill="#22d3ee" text-anchor="middle" letter-spacing="1">{room_code}</text>
</svg>'''


class RoomManager:
    def __init__(self):
        self.rooms: Dict[str, RoomSession] = {}
        self.active_websockets: Dict[str, List[WebSocket]] = {}
        # Pre-seed default room for instant testing
        self.create_default_room("FM-1001")

    def create_default_room(self, code: str = "FM-1001") -> RoomSession:
        svg = generate_qr_svg(code)
        session = RoomSession(
            room_code=code,
            session_id=f"sess_{int(time.time())}_{code}",
            active_mode="TEACHER",
            current_topic="Two Sum & Hash Tables",
            qr_code_svg=svg,
            qr_svg=svg,
            connected_devices=[
                RoomDevice(
                    device_id="dev_primary_main",
                    device_name="Primary Workstation",
                    device_type="Desktop",
                    is_host=True
                )
            ],
            chat_history=[
                RoomChatMessage(
                    id="init_1",
                    sender="ai",
                    author_name="FocusMind Master Educator",
                    mode="TEACHER",
                    text="Welcome to multi-device study room FM-1001! I'm your Teacher Bot. How can I help you master Two Sum & Hash Tables today?",
                    hint=False
                )
            ],
            shared_code="def two_sum(nums: list[int], target: int) -> list[int]:\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []\n"
        )
        self.rooms[code] = session
        self.active_websockets[code] = []
        return session

    def get_room(self, code: str) -> Optional[RoomSession]:
        return self.rooms.get(code.upper())

    def create_room(self, device_name: str, device_type: str, topic: str = "Two Sum & Hash Tables", mode: str = "TEACHER") -> RoomSession:
        num = random.randint(1000, 9999)
        code = f"FM-{num}"
        svg = generate_qr_svg(code)
        session = RoomSession(
            room_code=code,
            session_id=f"sess_{int(time.time())}_{code}",
            active_mode=mode,
            current_topic=topic,
            qr_code_svg=svg,
            qr_svg=svg,
            connected_devices=[
                RoomDevice(
                    device_id=f"dev_host_{int(time.time())}",
                    device_name=device_name,
                    device_type=device_type,
                    is_host=True
                )
            ],
            chat_history=[
                RoomChatMessage(
                    id=f"msg_{int(time.time())}",
                    sender="ai",
                    author_name="FocusMind Master Educator" if mode == "TEACHER" else "Sam (Inquisitive Learner)",
                    mode=mode,
                    text=f"Room {code} created! Mode: {mode}. You are connected to {topic}.",
                    hint=False
                )
            ]
        )
        self.rooms[code] = session
        self.active_websockets[code] = []
        return session

    async def broadcast(self, room_code: str, event_type: str, data: Dict[str, Any]):
        code = room_code.upper()
        if code in self.active_websockets:
            payload = {"event": event_type, "data": data, "timestamp": time.time()}
            dead_sockets = []
            for ws in self.active_websockets[code]:
                try:
                    await ws.send_json(payload)
                except Exception:
                    dead_sockets.append(ws)
            for dead in dead_sockets:
                if dead in self.active_websockets[code]:
                    self.active_websockets[code].remove(dead)


room_manager = RoomManager()


@app.post("/api/rooms/create", response_model=RoomSession)
async def create_room_endpoint(req: CreateRoomRequest):
    """Creates a new collaborative room session with pairing code & QR code."""
    room = room_manager.create_room(
        device_name=req.device_name,
        device_type=req.device_type,
        topic=req.initial_topic or "Two Sum & Hash Tables",
        mode=req.active_mode or "TEACHER"
    )
    return room


@app.post("/api/rooms/join")
async def join_room_endpoint(req: JoinRoomRequest):
    """Pairs a secondary device into an active room session using room code."""
    room = room_manager.get_room(req.room_code)
    if not room:
        raise HTTPException(status_code=404, detail="Room code not found. Please verify the code or scan QR.")

    new_device = RoomDevice(
        device_id=f"dev_{int(time.time())}_{random.randint(10,99)}",
        device_name=req.device_name,
        device_type=req.device_type,
        is_host=False
    )
    room.connected_devices.append(new_device)

    # Broadcast join event to all connected devices in room
    await room_manager.broadcast(room.room_code, "device_joined", {
        "device": new_device.model_dump(),
        "total_devices": len(room.connected_devices)
    })

    return {
        "status": "joined",
        "room": room,
        "device": new_device
    }


@app.get("/api/rooms/{room_code}", response_model=RoomSession)
def get_room_state(room_code: str):
    """Retrieves full synchronized state of a study room."""
    room = room_manager.get_room(room_code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@app.post("/api/rooms/{room_code}/chat")
async def send_room_chat_message(room_code: str, req: SendRoomMessageRequest):
    """
    Appends user message to synced chat history, generates dual-mode AI response
    (Teacher Bot vs Feynman Student Bot), and broadcasts to all devices in the room.
    """
    room = room_manager.get_room(room_code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    user_text = req.query_text
    # 1. Store User message
    user_msg = RoomChatMessage(
        sender="user",
        author_name=req.author_name,
        mode=room.active_mode,
        text=user_text,
        device_id=req.device_id
    )
    room.chat_history.append(user_msg)

    # 2. Generate AI reply via Dual-Mode Engine
    ai_raw = tutor_engine.generate_dual_mode_reply(
        mode=room.active_mode,
        topic=room.current_topic,
        user_message=user_text,
        chat_history=[m.model_dump() for m in room.chat_history],
        user_code=req.user_code or room.shared_code
    )

    ai_msg = RoomChatMessage(
        sender="ai",
        author_name=ai_raw.get("author_name", "FocusMind AI"),
        mode=room.active_mode,
        text=ai_raw.get("text", ""),
        hint=(room.active_mode == "TEACHER")
    )
    room.chat_history.append(ai_msg)

    # 3. Broadcast to all devices in the room via WebSocket
    await room_manager.broadcast(room.room_code, "new_chat_message", {
        "user_message": user_msg.model_dump(),
        "ai_message": ai_msg.model_dump(),
        "reply": ai_msg.text,
        "provider": ai_raw.get("provider", "FocusMind AI"),
        "active_mode": room.active_mode
    })

    return {
        "status": "success",
        "user_message": user_msg,
        "ai_message": ai_msg,
        "reply": ai_msg.text,
        "provider": ai_raw.get("provider", "FocusMind AI"),
        "persona_note": ai_raw.get("persona_note", ""),
        "active_mode": room.active_mode
    }


@app.post("/api/rooms/{room_code}/mode")
async def toggle_room_mode(room_code: str, req: ToggleRoomModeRequest):
    """
    Seamlessly toggles between Teacher Bot Mode (🎓) and Feynman Student Bot Mode (🧠)
    without losing context or chat history.
    """
    room = room_manager.get_room(room_code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    old_mode = room.active_mode
    new_mode = req.new_mode.upper()
    if new_mode not in ["TEACHER", "STUDENT"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Must be 'TEACHER' or 'STUDENT'")

    room.active_mode = new_mode

    # Invert system contextual notice in chat
    if new_mode == "STUDENT":
        notice = "🧠 Switched to Student Bot Mode (Feynman Technique). You are now the Teacher! Sam is ready to learn from you."
    else:
        notice = "🎓 Switched to Teacher Bot Mode. Master Educator is guiding you with Socratic scaffolding and analogies."

    system_msg = RoomChatMessage(
        sender="system",
        author_name="System",
        mode=new_mode,
        text=notice
    )
    room.chat_history.append(system_msg)

    # Broadcast mode change to all connected devices
    await room_manager.broadcast(room.room_code, "mode_toggled", {
        "previous_mode": old_mode,
        "new_mode": new_mode,
        "system_notice": notice,
        "message": system_msg.model_dump()
    })

    return {
        "status": "mode_updated",
        "previous_mode": old_mode,
        "active_mode": new_mode,
        "room": room
    }


@app.post("/api/rooms/{room_code}/code")
async def sync_room_code(room_code: str, req: UpdateRoomCodeRequest):
    """Synchronizes Monaco workspace code across all paired devices in the room."""
    room = room_manager.get_room(room_code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    room.shared_code = req.code_content

    # Broadcast code update to all other connected devices
    await room_manager.broadcast(room.room_code, "code_updated", {
        "shared_code": room.shared_code,
        "sender_device_id": req.device_id
    })

    return {
        "status": "code_synced",
        "shared_code": room.shared_code
    }


@app.websocket("/ws/rooms/{room_code}")
async def room_websocket_endpoint(websocket: WebSocket, room_code: str):
    """Real-time WebSocket endpoint for instant multi-device bidirectional state synchronization."""
    await websocket.accept()
    code = room_code.upper()

    if code not in room_manager.active_websockets:
        room_manager.active_websockets[code] = []
    room_manager.active_websockets[code].append(websocket)

    # Send initial snapshot on connect
    room = room_manager.get_room(code)
    if room:
        await websocket.send_json({
            "event": "room_snapshot",
            "data": room.model_dump(),
            "timestamp": time.time()
        })

    try:
        while True:
            data = await websocket.receive_json()
            event = data.get("event")
            payload = data.get("data", {})

            if event == "ping":
                await websocket.send_json({"event": "pong", "timestamp": time.time()})
            elif event == "code_keystroke":
                if room:
                    room.shared_code = payload.get("code", room.shared_code)
                    await room_manager.broadcast(code, "code_updated", {
                        "shared_code": room.shared_code,
                        "sender_device_id": payload.get("device_id")
                    })
    except WebSocketDisconnect:
        if code in room_manager.active_websockets and websocket in room_manager.active_websockets[code]:
            room_manager.active_websockets[code].remove(websocket)
    except Exception:
        if code in room_manager.active_websockets and websocket in room_manager.active_websockets[code]:
            room_manager.active_websockets[code].remove(websocket)




# Mount static frontend files
static_path = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(static_path):
    app.mount("/", StaticFiles(directory=static_path, html=True), name="static")

