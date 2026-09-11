import time
import uuid
from typing import Optional, List, Dict, Any
from app.models import (
    CognitiveStateEnum,
    CognitiveStateResult,
    TutorIntervention,
    InterventionType,
    LessonModule
)


class TutorEngine:
    def __init__(self, cooldown_seconds: float = 30.0):
        self.cooldown_seconds = cooldown_seconds
        self.last_intervention_time: float = 0.0
        self.session_start_time: float = time.time()
        self.triggered_interventions: List[TutorIntervention] = []

    def evaluate_intervention(
        self,
        cognitive_state: CognitiveStateResult,
        active_module: Optional[LessonModule] = None,
        force: bool = False
    ) -> Optional[TutorIntervention]:
        """
        Evaluates whether a supportive pedagogical intervention should be dispatched.
        Enforces sustained pattern requirement and anti-fatigue cooldowns.
        """
        now = time.time()
        study_duration_min = (now - self.session_start_time) / 60.0

        # Don't spam: check cooldown unless forced
        if not force and (now - self.last_intervention_time) < self.cooldown_seconds:
            return None

        # Rule 0: Long continuous session fatigue check (> 45 minutes)
        if study_duration_min >= 45.0 and (now - self.last_intervention_time) >= 300.0:
            intervention = TutorIntervention(
                id=str(uuid.uuid4())[:8],
                type=InterventionType.STRETCH_BREAK,
                title="45-Minute Milestone: Re-energize",
                message="You've been studying for 45 minutes. Want to take a 2-minute stretch break?",
                severity="supportive",
                action_prompt="Open Guided Stretch Routine",
                recommended_duration_sec=120,
                pedagogical_reason="Mitigate sustained physical fatigue and muscle tension after 45 minutes of intensive concentration."
            )
            self.last_intervention_time = now
            self.triggered_interventions.append(intervention)
            return intervention

        # If not sustained, do not trigger (per spec: "sustained pattern rather than a single movement")
        if not force and not cognitive_state.is_sustained:
            return None

        state = cognitive_state.state

        # Spec-defined Pedagogical Interventions:
        if state == CognitiveStateEnum.RELAXED:
            # Silent monitoring - do not interrupt flow state
            return None

        elif state == CognitiveStateEnum.SURPRISED:
            # Confusion, cognitive dissonance, or unexpected behavior
            hint_text = (
                active_module.clarifying_hints[0]
                if active_module and active_module.clarifying_hints
                else "Notice something unexpected? Let's examine the edge cases together."
            )
            intervention = TutorIntervention(
                id=str(uuid.uuid4())[:8],
                type=InterventionType.HINT,
                title="Concept Check-In",
                message=f"Looks like this part sparked some surprise or confusion. Here's a clarifying hint: {hint_text}",
                severity="info",
                action_prompt="View Clarifying Walkthrough",
                pedagogical_reason="Elevated brow and eye aperture suggest sudden cognitive dissonance. Clarifying hints resolve misunderstandings early."
            )

        elif state == CognitiveStateEnum.ANGRY:
            # Cognitive overload, persistent task friction, frustration
            # Choose between 3 deep breaths or breaking problem into steps
            if "Furrowed brow tension" in " ".join(cognitive_state.observable_signals):
                intervention = TutorIntervention(
                    id=str(uuid.uuid4())[:8],
                    type=InterventionType.BREAKDOWN,
                    title="Feeling Task Friction?",
                    message="This problem seems frustrating. Want to break it into smaller steps?",
                    severity="gentle_alert",
                    action_prompt="Break Problem Into Steps",
                    pedagogical_reason="Persistent brow furrowing indicates cognitive overload or code debugging friction."
                )
            else:
                intervention = TutorIntervention(
                    id=str(uuid.uuid4())[:8],
                    type=InterventionType.BREATHING_RESET,
                    title="Quick Breathing Reset",
                    message="Quick reset? Take 3 deep breaths and continue when you're ready.",
                    severity="gentle_alert",
                    action_prompt="Start 3-Breath Reset",
                    recommended_duration_sec=30,
                    pedagogical_reason="Physiological de-escalation reset to restore prefrontal cortex working memory."
                )

        elif state == CognitiveStateEnum.SAD:
            # Discouragement, low self-efficacy, loss of motivation
            intervention = TutorIntervention(
                id=str(uuid.uuid4())[:8],
                type=InterventionType.ENCOURAGEMENT,
                title="Keep Up the Momentum",
                message="You've been working hard. Tough problems stretch your thinking! Want to review a mastered concept before moving forward?",
                severity="supportive",
                action_prompt="Review Mastered Concept",
                pedagogical_reason="Downward facial valence indicates discouragement. Positive reinforcement validates difficulty and restores self-efficacy."
            )

        elif state == CognitiveStateEnum.TEDIOUS:
            # Monotony, mental exhaustion, microsleep, high blink rate, head slump, yawns
            has_eye_fatigue = any(
                "microsleep" in s.lower() or "blink" in s.lower() or "eye" in s.lower()
                for s in cognitive_state.observable_signals
            )
            has_slump_or_gaze = any(
                "slump" in s.lower() or "gaze" in s.lower() or "yawn" in s.lower()
                for s in cognitive_state.observable_signals
            )

            if has_eye_fatigue:
                intervention = TutorIntervention(
                    id=str(uuid.uuid4())[:8],
                    type=InterventionType.TWENTY_TWENTY_RULE,
                    title="Visual Fatigue Detected",
                    message="Your eyes may be getting tired. Try the 20-20-20 rule: look at an object 20 feet away for 20 seconds.",
                    severity="gentle_alert",
                    action_prompt="Start 20-20-20 Eye Rest",
                    recommended_duration_sec=20,
                    pedagogical_reason="Eye aperture drooping and blink rate acceleration indicate ocular strain."
                )
            elif has_slump_or_gaze:
                intervention = TutorIntervention(
                    id=str(uuid.uuid4())[:8],
                    type=InterventionType.STRETCH_BREAK,
                    title="Posture & Focus Refresh",
                    message="Looks like your attention drifted. Ready to refocus with a quick 2-minute posture stretch?",
                    severity="supportive",
                    action_prompt="Open Posture Stretch Guide",
                    recommended_duration_sec=120,
                    pedagogical_reason="Head pitch downward slump and yaw drift indicate physical lethargy and postural collapse."
                )
            else:
                intervention = TutorIntervention(
                    id=str(uuid.uuid4())[:8],
                    type=InterventionType.QUIZ_CHECKPOINT,
                    title="Quick Cognitive Ping",
                    message="Let's shake off the monotony with a quick 30-second interactive challenge!",
                    severity="info",
                    action_prompt="Answer Interactive Checkpoint",
                    pedagogical_reason="Dynamic micro-exercises re-engage dopamine and executive attention."
                )
        else:
            return None

        self.last_intervention_time = now
        self.triggered_interventions.append(intervention)
        return intervention

    def generate_dual_mode_reply(
        self,
        mode: str,
        topic: str,
        user_message: str,
        chat_history: Optional[List[Dict[str, Any]]] = None,
        user_code: str = ""
    ) -> Dict[str, Any]:
        """
        Generates contextual conversational responses for Dual-Mode AI Tutoring:
        1. Mode == 'TEACHER': AI acts as Expert Educator (scaffolding, physical analogies, comprehension quiz).
        2. Mode == 'STUDENT': AI acts as Inquisitive Learner (Feynman Technique, spots jargon, tests edge cases).
        """
        msg_lower = user_message.lower().strip()
        history = chat_history or []

        if mode.upper() == "STUDENT":
            # =========================================================================
            # Mode B: Feynman Technique Student Persona ("Sam")
            # The User is the teacher. The AI is an inquisitive, curious learner.
            # =========================================================================
            if any(term in msg_lower for term in ["hash", "map", "dict", "lookup"]):
                reply = (
                    "Ooh! So you're saying a hash map lets us find things instantly without looking through every single box one-by-one? "
                    "Wait, how does the computer actually know which box to check without searching? Could you explain that part simply, like I'm 10?"
                )
                quiz = "Can you give me an everyday real-world example of how that lookup works?"
            elif any(term in msg_lower for term in ["o(n)", "o(1)", "complexity", "big o", "linear", "quadratic"]):
                reply = (
                    "You mentioned Big-O! I hear that term a lot in computer science, but I always get confused. "
                    "Why is O(N) so much better than O(N²)? What happens to our program if the user enters 1 million items?"
                )
                quiz = "If we have 1,000 items, how many steps does each one take?"
            elif any(term in msg_lower for term in ["duplicate", "edge case", "negative", "empty", "zero"]):
                reply = (
                    "That's a clever catch! But wait, what if the input list has two identical numbers, like [3, 3] and the target is 6? "
                    "Does your code accidentally use the same number twice, or will it return two different indices?"
                )
                quiz = "How does your logic make sure it doesn't match an element with itself?"
            elif len(msg_lower.split()) > 12:
                reply = (
                    "I'm following your explanation! You explained that really clearly. "
                    "Let me try to repeat it back to you to make sure I understand: We scan each number once, and for each number, "
                    "we check if its partner (target minus current) has already been stored. Is that the core idea?"
                )
                quiz = "Did I get that right, or did I miss any subtle edge case?"
            else:
                reply = (
                    f"I'm really excited to learn about {topic} from you! "
                    "Could you walk me through the big picture first? What is the main problem we are trying to solve, and why does a naive brute-force approach get too slow?"
                )
                quiz = "Teach me the first step you would take!"

            return {
                "sender": "ai",
                "author_name": "Sam (Inquisitive Learner)",
                "mode": "STUDENT",
                "text": reply,
                "followup_prompt": quiz,
                "persona_note": "Feynman Technique Active: Explain in simple terms to test your mastery."
            }

        else:
            # =========================================================================
            # Mode A: Teacher Bot Persona (Master Educator & Socratic Mentor)
            # AI is the expert guide, scaffolding learning step-by-step.
            # =========================================================================
            if any(term in msg_lower for term in ["how", "explain", "what is", "start", "help"]):
                reply = (
                    f"Let's break down {topic} together step-by-step.\n\n"
                    "**Intuitive Analogy**: Imagine you're at a coat check with 1,000 coats. Instead of walking down the line checking each ticket one by one (O(N²)), "
                    "you have an organized index drawer where every coat number points directly to a locker (O(1) lookup).\n\n"
                    "For Two Sum: As you visit each number `x`, you only need to ask: *'Have I already seen (target - x)?'*"
                )
                quiz = "Comprehension Check: If `target = 9` and the current number is `2`, what specific value are we checking the drawer for?"
            elif any(term in msg_lower for term in ["7", "seven", "target - num", "complement"]):
                reply = (
                    "Spot on! We are looking for `7` (9 - 2). "
                    "If `7` isn't in our hash table yet, we store `2` mapped to its index `0`, and move forward. "
                    "When we later reach `7`, `2` will be waiting for us!"
                )
                quiz = "Now consider: What would happen if we checked for the complement AFTER storing the current number?"
            elif any(term in msg_lower for term in ["duplicate", "overwrite", "same index"]):
                reply = (
                    "Excellent analytical thinking! If you stored the number before checking, a target of `6` with number `3` "
                    "might falsely match with itself (returning `[0, 0]`). Checking before storing guarantees distinct indices."
                )
                quiz = "Ready to test the code implementation, or would you like to review edge cases?"
            else:
                reply = (
                    "Great question. Let's analyze this pedagogically. In algorithmic problem solving, the bottleneck is almost always redundant work. "
                    "By trading a small amount of memory (storing seen elements in a hash map), we eliminate redundant scans completely."
                )
                quiz = "What is the time and space complexity of this single-pass hash approach?"

            return {
                "sender": "ai",
                "author_name": "FocusMind Master Educator",
                "mode": "TEACHER",
                "text": reply,
                "followup_prompt": quiz,
                "persona_note": "Socratic Scaffolding: Guiding you to self-discovered mastery."
            }
