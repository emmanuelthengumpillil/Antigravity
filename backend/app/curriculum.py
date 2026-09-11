from typing import List, Dict, Optional
from app.models import LessonModule

CURRICULUM_MODULES: List[LessonModule] = [
    LessonModule(
        id="mod_binary_search",
        track="Algorithms & Complexity",
        title="Binary Search & Boundary Conditions",
        difficulty="Intermediate",
        estimated_minutes=15,
        concept_summary=(
            "Binary search is an efficient O(log n) search algorithm on sorted arrays. "
            "The most common pitfalls occur at boundary conditions: `low <= high` vs `low < high`, "
            "and calculating `mid = low + (high - low) // 2` to prevent integer overflow."
        ),
        initial_code=(
            "def binary_search(arr, target):\n"
            "    low = 0\n"
            "    high = len(arr) - 1\n"
            "    \n"
            "    # TODO: Implement the search loop\n"
            "    while low <= high:\n"
            "        mid = low + (high - low) // 2\n"
            "        if arr[mid] == target:\n"
            "            return mid\n"
            "        elif arr[mid] < target:\n"
            "            # Search right half\n"
            "            low = mid + 1\n"
            "        else:\n"
            "            # Search left half\n"
            "            high = mid - 1\n"
            "    return -1\n"
        ),
        exercise_prompt=(
            "Task: Verify and run the binary search implementation. "
            "Make sure it properly returns the index of the target in a sorted list, or -1 if not found."
        ),
        solution_code=(
            "def binary_search(arr, target):\n"
            "    low = 0\n"
            "    high = len(arr) - 1\n"
            "    while low <= high:\n"
            "        mid = low + (high - low) // 2\n"
            "        if arr[mid] == target:\n"
            "            return mid\n"
            "        elif arr[mid] < target:\n"
            "            low = mid + 1\n"
            "        else:\n"
            "            high = mid - 1\n"
            "    return -1\n"
        ),
        test_cases=[
            {"input": {"arr": [1, 3, 5, 7, 9, 11], "target": 7}, "expected": 3},
            {"input": {"arr": [2, 4, 6, 8, 10], "target": 5}, "expected": -1},
            {"input": {"arr": [42], "target": 42}, "expected": 0}
        ],
        clarifying_hints=[
            "Remember that binary search requires the input array to be strictly sorted.",
            "Watch the while condition: `low <= high` ensures single-element subarrays are evaluated.",
            "Updating `low = mid + 1` and `high = mid - 1` guarantees the search space shrinks on every iteration."
        ],
        step_by_step_breakdown=[
            "Step 1: Initialize two pointers: `low = 0` and `high = len(arr) - 1`.",
            "Step 2: Loop while `low <= high`.",
            "Step 3: Calculate middle index `mid = low + (high - low) // 2`.",
            "Step 4: If `arr[mid] == target`, return `mid`.",
            "Step 5: If `arr[mid] < target`, discard left half by setting `low = mid + 1`.",
            "Step 6: If `arr[mid] > target`, discard right half by setting `high = mid - 1`.",
            "Step 7: If the loop terminates without finding the target, return -1."
        ]
    ),
    LessonModule(
        id="mod_neural_loss",
        track="Machine Learning Foundations",
        title="Cross-Entropy Loss & Softmax Activations",
        difficulty="Foundational",
        estimated_minutes=20,
        concept_summary=(
            "Cross-entropy loss quantifies the divergence between a predicted probability distribution "
            "and the true categorical one-hot target. For numerical stability, libraries compute "
            "LogSoftmax combined with Negative Log Likelihood (NLLLoss)."
        ),
        initial_code=(
            "import math\n\n"
            "def categorical_cross_entropy(y_true, y_pred):\n"
            "    # y_true is a one-hot list, e.g. [0, 1, 0]\n"
            "    # y_pred is predicted probabilities, e.g. [0.1, 0.7, 0.2]\n"
            "    epsilon = 1e-15  # Prevent log(0)\n"
            "    loss = 0.0\n"
            "    for yt, yp in zip(y_true, y_pred):\n"
            "        yp_clipped = max(epsilon, min(1.0 - epsilon, yp))\n"
            "        loss -= yt * math.log(yp_clipped)\n"
            "    return round(loss, 4)\n"
        ),
        exercise_prompt=(
            "Task: Implement or test numerical stability in the cross-entropy function. "
            "Ensure clipping prevents `math.log(0)` ValueError when `y_pred` contains exact zeros."
        ),
        solution_code=(
            "import math\n\n"
            "def categorical_cross_entropy(y_true, y_pred):\n"
            "    epsilon = 1e-15\n"
            "    loss = 0.0\n"
            "    for yt, yp in zip(y_true, y_pred):\n"
            "        yp_clipped = max(epsilon, min(1.0 - epsilon, yp))\n"
            "        loss -= yt * math.log(yp_clipped)\n"
            "    return round(loss, 4)\n"
        ),
        test_cases=[
            {"input": {"y_true": [1, 0, 0], "y_pred": [0.9, 0.05, 0.05]}, "expected": 0.1054},
            {"input": {"y_true": [0, 1, 0], "y_pred": [0.2, 0.6, 0.2]}, "expected": 0.5108}
        ],
        clarifying_hints=[
            "Cross-entropy measures penalty: if the model is confident and wrong, loss skyrockets.",
            "Epsilon clipping keeps values strictly in (0, 1) to prevent log of zero domain errors.",
            "Softmax turns raw logits into valid probability distributions that sum to 1.0."
        ],
        step_by_step_breakdown=[
            "Step 1: Set a tiny numerical epsilon `1e-15`.",
            "Step 2: Clip predicted probability `yp` between `epsilon` and `1.0 - epsilon`.",
            "Step 3: Multiply target `yt` by the natural log of clipped `yp`.",
            "Step 4: Sum and negate the result across all classes."
        ]
    ),
    LessonModule(
        id="mod_dynamic_prog",
        track="Algorithms & Complexity",
        title="Dynamic Programming: Memoization vs Tabulation",
        difficulty="Advanced",
        estimated_minutes=25,
        concept_summary=(
            "Dynamic Programming solves complex problems by breaking them down into overlapping "
            "subproblems and optimal substructure. Memoization uses top-down recursion with caching, "
            "while Tabulation builds up solutions iteratively bottom-up."
        ),
        initial_code=(
            "def fib_memo(n, memo=None):\n"
            "    if memo is None:\n"
            "        memo = {}\n"
            "    if n in memo:\n"
            "        return memo[n]\n"
            "    if n <= 1:\n"
            "        return n\n"
            "    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)\n"
            "    return memo[n]\n"
        ),
        exercise_prompt=(
            "Task: Explore the memoized Fibonacci sequence. Observe how the recursion depth "
            "drops from O(2^n) to O(n) linear time with O(n) call stack space."
        ),
        solution_code=(
            "def fib_memo(n, memo=None):\n"
            "    if memo is None:\n"
            "        memo = {}\n"
            "    if n in memo:\n"
            "        return memo[n]\n"
            "    if n <= 1:\n"
            "        return n\n"
            "    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)\n"
            "    return memo[n]\n"
        ),
        test_cases=[
            {"input": {"n": 0}, "expected": 0},
            {"input": {"n": 10}, "expected": 55},
            {"input": {"n": 30}, "expected": 832040}
        ],
        clarifying_hints=[
            "Without memoization, computing fib(30) makes over 2 billion recursive calls!",
            "Memoization caches previously solved inputs in a dictionary.",
            "If recursion depth becomes an issue, convert to bottom-up tabulation with an array."
        ],
        step_by_step_breakdown=[
            "Step 1: Check base cases `n <= 1` returning `n`.",
            "Step 2: Check if `n` already exists in `memo` dictionary.",
            "Step 3: If absent, compute recursively: `fib_memo(n-1) + fib_memo(n-2)`.",
            "Step 4: Save result in `memo[n]` before returning."
        ]
    )
]

def get_module(module_id: str) -> Optional[LessonModule]:
    for m in CURRICULUM_MODULES:
        if m.id == module_id:
            return m
    return None
