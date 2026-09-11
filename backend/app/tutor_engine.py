import time
import uuid
from typing import Optional, List, Dict
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
