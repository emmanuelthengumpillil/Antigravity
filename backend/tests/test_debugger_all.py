import sys
import requests

sys.stdout.reconfigure(encoding='utf-8')
BASE_URL = "http://127.0.0.1:8000"

def test_all_error_codes():
    print("--- Testing All Debugger Error Codes & Non-Destructive Healing ---")
    
    error_codes = [
        "ERR_FACE_NOT_FOUND",
        "ERR_LOW_CONFIDENCE",
        "ERR_LANDMARK_JITTER",
        "ERR_OCCLUSION",
        "ERR_CAMERA_STALL",
        "ERR_BASELINE_DRIFT",
        "ERR_STATE_CONFLICT"
    ]

    original_student_content = (
        "def quicksort(arr):\n"
        "    if len(arr) <= 1:\n"
        "        return arr\n"
        "    pivot = arr[len(arr) // 2]\n"
        "    left = [x for x in arr if x < pivot]\n"
        "    middle = [x for x in arr if x == pivot]\n"
        "    right = [x for x in arr if x > pivot]\n"
        "    return quicksort(left) + middle + quicksort(right)\n"
    )

    for code in error_codes:
        # 1. Simulate the error code
        r_sim = requests.post(f"{BASE_URL}/api/debugger/simulate-error/{code}")
        assert r_sim.status_code == 200
        diag = r_sim.json()["diagnostics"]
        assert code in diag["detected_errors"], f"Failed to detect {code}"

        # 2. Heal error code with student content buffer
        heal_req = {
            "error_code": code,
            "student_content_buffer": original_student_content,
            "recalibrate_baseline": True
        }
        r_heal = requests.post(f"{BASE_URL}/api/debugger/heal-error", json=heal_req)
        assert r_heal.status_code == 200
        res = r_heal.json()

        assert res["resolved"] is True
        assert res["student_content_preserved"] is True
        print(f"✅ {code:25s} -> Healed: {res['status_message'][:45]}... | Content Preserved: {res['student_content_preserved']}")

    # Send a heartbeat telemetry frame to refresh last_frame_time
    requests.post(f"{BASE_URL}/api/telemetry/process", json={"ear": 0.28, "mar": 0.15})

    # Check that system is healthy again
    r_diag = requests.get(f"{BASE_URL}/api/debugger/diagnostics")
    final_diag = r_diag.json()
    assert final_diag["is_healthy"] is True
    print("\n✅ All 7 error codes healed non-destructively. System health:", final_diag["is_healthy"])

if __name__ == "__main__":
    test_all_error_codes()
