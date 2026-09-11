import os
import time
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
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
    StudySession
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


# Mount static frontend files
static_path = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(static_path):
    app.mount("/", StaticFiles(directory=static_path, html=True), name="static")

