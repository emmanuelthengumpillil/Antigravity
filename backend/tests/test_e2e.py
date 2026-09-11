import sys
import requests
import json
import time

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def test_e2e_flow():
    print("--- 1. Testing Health & Website Root ---")
    r_health = requests.get(f"{BASE_URL}/api/health")
    assert r_health.status_code == 200, f"Health check failed: {r_health.status_code}"
    print("✅ Health check:", r_health.json())

    r_index = requests.get(f"{BASE_URL}/")
    assert r_index.status_code == 200, f"Static website failed: {r_index.status_code}"
    assert "FocusMind" in r_index.text, "Index HTML missing FocusMind title"
    print("✅ Standard website HTML served successfully (length:", len(r_index.text), "bytes)")

    print("\n--- 2. Testing Curriculum Endpoints ---")
    r_curr = requests.get(f"{BASE_URL}/api/curriculum")
    assert r_curr.status_code == 200
    modules = r_curr.json()
    assert len(modules) >= 3
    print(f"✅ Loaded {len(modules)} curriculum modules:")
    for m in modules:
        print(f"   - [{m['id']}] {m['title']} ({m['track']})")

    print("\n--- 3. Testing Real-time Telemetry & 5 Cognitive States ---")
    test_cases = [
        ("Relaxed", {"ear": 0.28, "mar": 0.15, "brow_furrow": 0.05, "brow_inner_up": 0.05, "head_pitch": 0.0}),
        ("Surprised", {"ear": 0.35, "eye_wide": 0.85, "brow_inner_up": 0.85, "mar": 0.2}),
        ("Angry", {"ear": 0.20, "brow_furrow": 0.88, "mouth_frown": 0.55}),
        ("Sad", {"ear": 0.21, "mouth_frown": 0.85, "head_yaw": -12.0}),
        ("Tedious", {"ear": 0.12, "microsleep_detected": True, "head_pitch": -18.0, "head_slump_detected": True, "mar": 0.60})
    ]

    for expected_state, payload in test_cases:
        # Reset session to test each state transition cleanly
        requests.post(f"{BASE_URL}/api/session/reset")
        # Feed sustained frames
        for _ in range(12):
            r = requests.post(f"{BASE_URL}/api/telemetry/process", json=payload)
            assert r.status_code == 200
        data = r.json()
        observed = data["cognitive_state"]["state"]
        print(f"   - Expected: {expected_state:9s} -> Classified: {observed:9s} (Confidence: {data['cognitive_state']['confidence']:.2f})")
        assert observed == expected_state, f"Mismatch: expected {expected_state}, got {observed}"

    print("✅ All 5 target states classified accurately with feature mapping!")

    print("\n--- 4. Testing Role 3 Debugger: Diagnosis & Non-Destructive Healing ---")
    # Simulate an error code
    r_sim = requests.post(f"{BASE_URL}/api/debugger/simulate-error/ERR_LOW_CONFIDENCE")
    assert r_sim.status_code == 200
    diag = r_sim.json()["diagnostics"]
    assert "ERR_LOW_CONFIDENCE" in diag["detected_errors"]
    assert diag["is_healthy"] is False
    print("✅ Error code simulated & detected:", diag["detected_errors"])

    # Non-destructive healing with student code
    student_code = "def binary_search(arr, target):\n    # CRITICAL: This student content must never be altered\n    return 42"
    heal_payload = {
        "error_code": "ERR_LOW_CONFIDENCE",
        "student_content_buffer": student_code,
        "recalibrate_baseline": True
    }
    r_heal = requests.post(f"{BASE_URL}/api/debugger/heal-error", json=heal_payload)
    assert r_heal.status_code == 200
    heal_res = r_heal.json()
    assert heal_res["resolved"] is True
    assert heal_res["student_content_preserved"] is True
    print("✅ Debugger Healed Error Code:", heal_res["error_code"])
    print("   - Status:", heal_res["status_message"])
    print("   - Recalibrated offsets:", heal_res["recalibrated_offsets"])
    print("   - Content preserved check: PASSED (SHA:", heal_res["preserved_content_hash"][:16], "...)")

    # Clear errors
    requests.post(f"{BASE_URL}/api/debugger/clear-errors")

    print("\n--- 5. Testing Session Summary ---")
    r_sum = requests.get(f"{BASE_URL}/api/session/summary")
    assert r_sum.status_code == 200
    summary = r_sum.json()
    print("✅ Session summary retrieved:")
    print("   - Total study seconds:", summary["total_study_seconds"])
    print("   - State distribution:", summary["state_distribution"])
    print("   - Total interventions:", summary["total_interventions"])
    print("   - ML calibration biases:", summary["ml_calibration"])

    print("\n🎉 ALL E2E TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_e2e_flow()
