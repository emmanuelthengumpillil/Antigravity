import time
import pytest
from app.models import (
    CognitiveStateEnum,
    LandmarkTelemetry,
    HealErrorRequest,
    DebuggerErrorCode
)
from app.ml_engine import MLEngine
from app.tutor_engine import TutorEngine
from app.debugger_service import DebuggerService
from app.curriculum import CURRICULUM_MODULES, get_module


def test_ml_classification_relaxed():
    engine = MLEngine()
    # Baseline neutral telemetry
    telemetry = LandmarkTelemetry(
        ear=0.28,
        mar=0.15,
        brow_furrow=0.1,
        brow_inner_up=0.1,
        eye_wide=0.1,
        mouth_frown=0.1,
        head_pitch=0.0,
        head_yaw=0.0,
        blink_rate_per_min=18.0
    )
    state, conf, signals = engine.classify_frame(telemetry)
    assert state == CognitiveStateEnum.RELAXED
    assert conf >= 0.70


def test_ml_classification_surprised():
    engine = MLEngine()
    # Surprised: elevated brows + wide eyes
    telemetry = LandmarkTelemetry(
        brow_inner_up=0.85,
        eye_wide=0.75,
        ear=0.35,
        brow_furrow=0.0,
        mar=0.25
    )
    state, conf, signals = engine.classify_frame(telemetry)
    assert state == CognitiveStateEnum.SURPRISED
    assert any("browInnerUp" in s for s in signals)


def test_ml_classification_angry():
    engine = MLEngine()
    # Angry: furrowed brow + narrowed eyes / jaw clench
    telemetry = LandmarkTelemetry(
        brow_furrow=0.88,
        ear=0.20,
        eye_wide=0.0,
        brow_inner_up=0.0,
        mouth_frown=0.45
    )
    state, conf, signals = engine.classify_frame(telemetry)
    assert state == CognitiveStateEnum.ANGRY
    assert any("browDown" in s or "Furrowed" in s for s in signals)


def test_ml_classification_sad():
    engine = MLEngine()
    # Sad: mouth frown + drooping tone
    telemetry = LandmarkTelemetry(
        mouth_frown=0.85,
        ear=0.21,
        brow_furrow=0.1,
        brow_inner_up=0.1,
        eye_wide=0.0
    )
    state, conf, signals = engine.classify_frame(telemetry)
    assert state == CognitiveStateEnum.SAD
    assert any("mouthFrown" in s or "Downward mouth" in s for s in signals)


def test_ml_classification_tedious_fatigue():
    engine = MLEngine()
    # Tedious: microsleep / high blink / head slump
    telemetry = LandmarkTelemetry(
        ear=0.12,
        microsleep_detected=True,
        head_pitch=-20.0,
        head_slump_detected=True,
        mar=0.60,
        yawn_detected=True
    )
    state, conf, signals = engine.classify_frame(telemetry)
    assert state == CognitiveStateEnum.TEDIOUS
    assert any("microsleep" in s.lower() or "slump" in s.lower() for s in signals)


def test_temporal_smoothing_buffer():
    engine = MLEngine(buffer_size=10, sustain_threshold_sec=1.5)
    
    # 1 momentary spike frame should NOT mark is_sustained = True
    spike_frame = LandmarkTelemetry(brow_furrow=0.9)
    res1 = engine.process_telemetry(spike_frame)
    assert res1.is_sustained is False

    # Simulate continuous sustained frames over duration > sustain_threshold_sec
    engine.state_start_time = time.time() - 2.5
    for _ in range(8):
        res = engine.process_telemetry(spike_frame)
    assert res.is_sustained is True
    assert res.state == CognitiveStateEnum.ANGRY


def test_tutor_interventions():
    tutor = TutorEngine(cooldown_seconds=0.0)
    engine = MLEngine()
    module = get_module("mod_binary_search")

    # Relaxed -> silent monitoring (None)
    res_relaxed = engine.process_telemetry(LandmarkTelemetry())
    res_relaxed.is_sustained = True
    int_relaxed = tutor.evaluate_intervention(res_relaxed, module)
    assert int_relaxed is None

    # Angry -> Breakdown or breathing reset
    res_angry = engine.process_telemetry(LandmarkTelemetry(brow_furrow=0.9))
    res_angry.state = CognitiveStateEnum.ANGRY
    res_angry.is_sustained = True
    int_angry = tutor.evaluate_intervention(res_angry, module)
    assert int_angry is not None
    assert "frustrat" in int_angry.message.lower() or "breath" in int_angry.message.lower()


def test_debugger_non_destructive_healing():
    debugger = DebuggerService()
    student_content = "def solve_puzzle(n):\n    # Student code that must never be altered\n    return n * 2"

    # Simulate camera stall and low confidence
    debugger.simulate_error(DebuggerErrorCode.ERR_LOW_CONFIDENCE)
    diag = debugger.diagnose_telemetry()
    assert DebuggerErrorCode.ERR_LOW_CONFIDENCE in diag.detected_errors
    assert diag.is_healthy is False

    # Heal the error code with the student content buffer attached
    req = HealErrorRequest(
        error_code=DebuggerErrorCode.ERR_LOW_CONFIDENCE,
        student_content_buffer=student_content
    )
    heal_res = debugger.heal_error_code(req)

    # Validate error code was resolved
    assert heal_res.resolved is True
    assert DebuggerErrorCode.ERR_LOW_CONFIDENCE not in debugger.active_simulated_errors

    # Crucial spec requirement: student content MUST be preserved without mutation
    assert heal_res.student_content_preserved is True
    assert heal_res.preserved_content_hash is not None


def test_sleep_emergency_intervention():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    response = client.post(
        "/api/interventions/sleep-alert",
        json={
            "student_id": "learner_you",
            "student_name": "You",
            "ear_value": 0.13,
            "head_pitch_slump": -25.0,
            "consecutive_drowsy_frames": 28
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "EMERGENCY_ALARM_DISPATCHED"
    assert data["phone_notification_sent"] is True
    assert "WAKE UP" in data["notification_title"]
    assert data["teacher_dashboard_flagged"] is True

    # Check that teacher live status has the student flagged
    teacher_res = client.get("/api/teacher/students")
    assert teacher_res.status_code == 200
    students = teacher_res.json()["students"]
    you = next(s for s in students if s["name"] == "You")
    assert you["status"] == "SLEEPING"
    assert you["is_sleeping_flagged"] is True


def test_zoom_classroom_settings_and_device_promotion():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)

    # 1. Fetch current settings
    res = client.get("/api/zoom/settings")
    assert res.status_code == 200
    data = res.json()
    assert data["co_host_enabled"] is True
    assert data["alternative_host_enabled"] is True
    assert "teacher.lead@school.edu" in data["alternative_hosts"]
    assert len(data["connected_devices"]) >= 3

    # 2. Update settings: Add alternative host email & enforce security rules
    update_res = client.post(
        "/api/zoom/settings",
        json={
            "co_host_enabled": True,
            "alternative_host_enabled": True,
            "alternative_hosts": ["teacher.lead@school.edu", "prof.math@school.edu", "substitute.teacher@school.edu"],
            "waiting_room_enabled": True,
            "allow_alt_hosts_polls_breakout": True,
            "screen_share_rule": "Host and Co-hosts only"
        }
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert "substitute.teacher@school.edu" in updated["alternative_hosts"]
    assert updated["waiting_room_enabled"] is True
    assert updated["screen_share_rule"] == "Host and Co-hosts only"
    assert updated["security_shield_active"] is True
    assert updated["meeting_verified"] is True

    # 3. Promote an unassigned classroom device to Co-Host
    promote_res = client.post(
        "/api/zoom/devices/role",
        json={
            "device_id": "dev_student_1",
            "new_role": "Co-Host",
            "admit_from_waiting_room": True
        }
    )
    assert promote_res.status_code == 200
    p_data = promote_res.json()
    assert p_data["status"] == "device_role_updated"
    assert p_data["device"]["role"] == "Co-Host"
    assert p_data["device"]["is_in_waiting_room"] is False

    # 4. Verify 404 on nonexistent device
    bad_res = client.post(
        "/api/zoom/devices/role",
        json={
            "device_id": "dev_unknown_999",
            "new_role": "Co-Host"
        }
    )
    assert bad_res.status_code == 404


def test_prolonged_drowsiness_1min_alert():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)

    # Trigger 1-minute drowsiness alert
    alert_res = client.post(
        "/api/interventions/drowsy-alert",
        json={
            "student_id": "learner_you",
            "student_name": "You",
            "drowsy_duration_seconds": 60,
            "ear_value": 0.19,
            "head_pitch_slump": -18.5,
            "notification_channel": "BROWSER_AND_TEACHER"
        }
    )
    assert alert_res.status_code == 200
    data = alert_res.json()
    assert data["status"] == "DROWSY_NOTIFICATION_SENT"
    assert data["notification_sent"] is True
    assert data["drowsy_duration_seconds"] == 60
    assert "1 Minute Drowsiness" in data["notification_title"]
    assert data["teacher_dashboard_flagged"] is True

    # Check student in teacher roster is flagged as drowsy
    teacher_res = client.get("/api/teacher/students")
    assert teacher_res.status_code == 200
    students = teacher_res.json()["students"]
    you = next(s for s in students if s["name"] == "You")
    assert you["is_drowsy_flagged"] is True
    assert you["drowsy_duration_seconds"] == 60
    assert "DROWSY" in you["status"]

