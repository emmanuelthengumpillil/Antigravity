import os
import json
import time
import uuid
import urllib.request
import urllib.error
from typing import Optional, List, Dict, Any
from app.models import (
    CognitiveStateEnum,
    CognitiveStateResult,
    TutorIntervention,
    InterventionType,
    LessonModule
)

# Attempt to import official google-genai SDK
try:
    from google import genai
    from google.genai import types as genai_types
    GENAI_AVAILABLE = True
except ImportError:
    genai = None
    genai_types = None
    GENAI_AVAILABLE = False


class TutorEngine:
    def __init__(self, cooldown_seconds: float = 30.0):
        self.cooldown_seconds = cooldown_seconds
        self.last_intervention_time: float = 0.0
        self.session_start_time: float = time.time()
        self.triggered_interventions: List[TutorIntervention] = []
        self._gemini_client = None

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

    def _get_gemini_client(self):
        """Initializes and returns google.genai.Client if API key is present."""
        if not GENAI_AVAILABLE:
            return None
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return None
        if self._gemini_client is None:
            try:
                self._gemini_client = genai.Client(api_key=api_key)
            except Exception as e:
                print(f"[TutorEngine] Failed to initialize google-genai Client: {e}")
                return None
        return self._gemini_client

    def _call_gemini_api(self, system_instruction: str, prompt: str) -> Optional[str]:
        """Calls Google Gemini model (gemini-2.5-flash) via official SDK or REST."""
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return None

        # 1. Try official google-genai SDK
        client = self._get_gemini_client()
        if client:
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.7,
                        max_output_tokens=600
                    ) if genai_types else None
                )
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                print(f"[TutorEngine] google-genai SDK call failed, trying REST: {e}")

        # 2. REST API fallback for Gemini
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            payload = {
                "system_instruction": {
                    "parts": [{"text": system_instruction}]
                },
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": prompt}]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 600
                }
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"].strip()
        except Exception as e:
            print(f"[TutorEngine] Gemini REST call failed: {e}")

        return None

    def _call_free_fallback_model(self, system_instruction: str, prompt: str) -> Optional[str]:
        """
        Calls free open models (e.g. via OpenRouter or Groq if free keys exist,
        or HuggingFace free inference).
        """
        openrouter_key = os.environ.get("OPENROUTER_API_KEY")
        if openrouter_key:
            try:
                url = "https://openrouter.ai/api/v1/chat/completions"
                payload = {
                    "model": "meta-llama/llama-3.2-3b-instruct:free",
                    "messages": [
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 500
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {openrouter_key}"
                    },
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    choices = data.get("choices", [])
                    if choices:
                        return choices[0]["message"]["content"].strip()
            except Exception as e:
                print(f"[TutorEngine] OpenRouter free model call failed: {e}")
        return None

    def generate_dual_mode_reply(
        self,
        mode: str,
        topic: str,
        user_message: str,
        chat_history: Optional[List[Dict[str, Any]]] = None,
        user_code: str = ""
    ) -> Dict[str, Any]:
        """
        Generates contextual conversational responses for Dual-Mode AI Tutoring powered by Gemini AI:
        1. Mode == 'TEACHER': AI acts as Expert Educator (scaffolding, physical analogies, comprehension quiz).
        2. Mode == 'STUDENT': AI acts as Inquisitive Learner (Feynman Technique, spots jargon, tests edge cases).
        """
        msg_lower = user_message.lower().strip()
        history = chat_history or []
        is_student = mode.upper() == "STUDENT"

        # Build prompts
        if is_student:
            system_prompt = (
                "You are 'Sam', a curious, intelligent 10-year-old student practicing the Feynman Technique. "
                "The user is your TEACHER explaining a computer science or algorithmic concept to you.\n"
                "YOUR RULES:\n"
                "1. Treat the user as your respected instructor.\n"
                "2. If the user uses technical jargon (e.g. 'hash table', 'O(N)', 'pointer', 'binary heap'), politely ask them to explain it like you are 10, using everyday real-world analogies (mailboxes, toy boxes, books).\n"
                "3. Enthusiastically reflect back what you understood.\n"
                "4. Ask 1 gentle edge case question or testing question (e.g., 'What happens if the box is empty?' or 'What if two numbers are the same?').\n"
                "5. Keep your tone encouraging, inquisitive, and concise (under 120 words)."
            )
            context_block = f"Topic: {topic}\nCode being discussed:\n```\n{user_code}\n```\n" if user_code else f"Topic: {topic}\n"
            user_prompt = f"{context_block}Teacher's Explanation to you:\n{user_message}\n\nRespond as Sam:"
            author_name = "Sam (Inquisitive Learner)"
            persona_note = "Gemini Feynman Technique: Explain in simple terms to test your mastery."
        else:
            system_prompt = (
                "You are FocusMind Master Educator, an elite Socratic computer science tutor.\n"
                "YOUR RULES:\n"
                "1. Never write out the full direct solution or spoil answers immediately.\n"
                "2. Provide intuitive analogies (e.g., coat-check tickets, lockers, library index cards).\n"
                "3. Break complex concepts into small, scaffolded steps.\n"
                "4. End your reply with an engaging Comprehension Check question to test understanding.\n"
                "5. Tone: Warm, empowering, concise, and intellectually stimulating (under 150 words)."
            )
            context_block = f"Topic: {topic}\nStudent's current code:\n```\n{user_code}\n```\n" if user_code else f"Topic: {topic}\n"
            user_prompt = f"{context_block}Student says:\n{user_message}\n\nRespond as FocusMind Master Educator:"
            author_name = "FocusMind Master Educator"
            persona_note = "Gemini Socratic Scaffolding: Guiding you to self-discovered mastery."

        # 1. Attempt Gemini generation
        ai_reply = self._call_gemini_api(system_prompt, user_prompt)
        ai_provider = "Gemini (gemini-2.5-flash)"

        # 2. Attempt Free Open model fallback if Gemini unavailable
        if not ai_reply:
            ai_reply = self._call_free_fallback_model(system_prompt, user_prompt)
            if ai_reply:
                ai_provider = "Llama-3.2 (OpenRouter Free)"

        # 3. Fallback to rich built-in pedagogical heuristic response if offline or no keys
        if not ai_reply:
            ai_provider = "FocusMind Cognitive Heuristic"
            if is_student:
                if any(term in msg_lower for term in ["hash", "map", "dict", "lookup"]):
                    ai_reply = (
                        "Ooh! So you're saying a hash map lets us find things instantly without looking through every single box one-by-one? "
                        "Wait, how does the computer actually know which box to check without searching? Could you explain that part simply, like I'm 10?"
                    )
                elif any(term in msg_lower for term in ["o(n)", "o(1)", "complexity", "big o", "linear", "quadratic"]):
                    ai_reply = (
                        "You mentioned Big-O! I hear that term a lot in computer science, but I always get confused. "
                        "Why is O(N) so much better than O(N²)? What happens to our program if the user enters 1 million items?"
                    )
                elif any(term in msg_lower for term in ["duplicate", "edge case", "negative", "empty", "zero"]):
                    ai_reply = (
                        "That's a clever catch! But wait, what if the input list has two identical numbers, like [3, 3] and the target is 6? "
                        "Does your code accidentally use the same number twice, or will it return two different indices?"
                    )
                elif len(msg_lower.split()) > 10:
                    ai_reply = (
                        "I'm following your explanation! You explained that really clearly. "
                        "Let me try to repeat it back to you to make sure I understand: We scan each number once, and for each number, "
                        "we check if its partner (target minus current) has already been stored. Is that the core idea?"
                    )
                else:
                    ai_reply = (
                        f"I'm really excited to learn about {topic} from you! "
                        "Could you walk me through the big picture first? What is the main problem we are trying to solve, and why does a naive brute-force approach get too slow?"
                    )
            else:
                if any(term in msg_lower for term in ["how", "explain", "what is", "start", "help"]):
                    ai_reply = (
                        f"Let's break down {topic} together step-by-step.\n\n"
                        "**Intuitive Analogy**: Imagine you're at a coat check with 1,000 coats. Instead of walking down the line checking each ticket one by one (O(N²)), "
                        "you have an organized index drawer where every coat number points directly to a locker (O(1) lookup).\n\n"
                        "For Two Sum: As you visit each number `x`, you only need to ask: *'Have I already seen (target - x)?'*"
                    )
                elif any(term in msg_lower for term in ["7", "seven", "target - num", "complement"]):
                    ai_reply = (
                        "Spot on! We are looking for `7` (9 - 2). "
                        "If `7` isn't in our hash table yet, we store `2` mapped to its index `0`, and move forward. "
                        "When we later reach `7`, `2` will be waiting for us!"
                    )
                elif any(term in msg_lower for term in ["duplicate", "overwrite", "same index"]):
                    ai_reply = (
                        "Excellent analytical thinking! If you stored the number before checking, a target of `6` with number `3` "
                        "might falsely match with itself (returning `[0, 0]`). Checking before storing guarantees distinct indices."
                    )
                else:
                    ai_reply = (
                        "Great question. Let's analyze this pedagogically. In algorithmic problem solving, the bottleneck is almost always redundant work. "
                        "By trading a small amount of memory (storing seen elements in a hash map), we eliminate redundant scans completely."
                    )

        return {
            "sender": "ai",
            "author_name": author_name,
            "mode": mode.upper(),
            "text": ai_reply,
            "provider": ai_provider,
            "persona_note": persona_note
        }
