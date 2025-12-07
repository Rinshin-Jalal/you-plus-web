"""
Identity-Focused Questions
==========================

Replace "Did you do it?" with persona-appropriate questions that:
1. Frame positively (assume victory)
2. Focus on identity, not just behavior
3. Still track YES/NO for analytics

The PromiseDetectorNode extracts YES/NO from ANY response format.
This module just changes the FRAMING of the question.
"""

from typing import List
import random

from .persona import Persona


# Questions by persona - all track the same thing, different framing
ACCOUNTABILITY_QUESTIONS = {
    Persona.CELEBRATING_CHAMPION: [
        "What did you conquer today?",
        "Tell me about today's win.",
        "Where did you show up as your best self?",
        "What victory are we celebrating?",
    ],
    Persona.WISE_MENTOR: [
        "What's the honest truth about today?",
        "How did today go with your commitment?",
        "What would the version of you who's already won say about today?",
        "Tell me about today. The real version.",
    ],
    Persona.DRILL_SERGEANT: [
        "Did you do it? Yes or no.",
        "Truth. Did you follow through?",
        "No stories. Did you do what you said?",
        "Yes or no. Did it happen?",
    ],
    Persona.DISAPPOINTED_PARENT: [
        "Tell me what happened today.",
        "I'm listening. What happened?",
        "Walk me through today. All of it.",
        "So. What happened?",
    ],
    Persona.STRATEGIST: [
        "How did today go? What worked, what didn't?",
        "What happened with your commitment today?",
        "Tell me about today. What got in the way?",
        "Walk me through it. Did you do it?",
    ],
    Persona.COMPASSIONATE_ALLY: [
        "How are you really doing with this?",
        "Today. How was it?",
        "I want to hear how today went.",
        "Be honest with me. How did today go?",
    ],
}


# Follow-up questions based on YES/NO response
FOLLOWUP_QUESTIONS = {
    "yes": {
        Persona.CELEBRATING_CHAMPION: [
            "How did that feel?",
            "What was the hardest part?",
            "Was there a moment you almost didn't?",
        ],
        Persona.WISE_MENTOR: [
            "What made today different?",
            "What clicked for you?",
            "How does that change how you see yourself?",
        ],
        Persona.DRILL_SERGEANT: [
            "Good. What time tomorrow?",
            "One down. What's next?",
        ],
        Persona.DISAPPOINTED_PARENT: [
            "Good. That's who you can be.",
            "See? You're capable when you choose to be.",
        ],
        Persona.STRATEGIST: [
            "What worked? Let's repeat it.",
            "What would make tomorrow even better?",
        ],
        Persona.COMPASSIONATE_ALLY: [
            "I'm proud of you. How do you feel?",
            "That took courage. What helped?",
        ],
    },
    "no": {
        Persona.CELEBRATING_CHAMPION: [
            "What happened? That's not like you.",
            "Okay. What got in the way?",
        ],
        Persona.WISE_MENTOR: [
            "What happened?",
            "Walk me through it.",
            "What would you do differently?",
        ],
        Persona.DRILL_SERGEANT: [
            "Why not?",
            "What's the excuse?",
            "Is that a reason or an excuse?",
        ],
        Persona.DISAPPOINTED_PARENT: [
            "Again?",
            "What happened this time?",
            "Is this becoming a pattern?",
        ],
        Persona.STRATEGIST: [
            "What was the actual blocker?",
            "What got in the way? Real answer.",
            "What needs to change?",
        ],
        Persona.COMPASSIONATE_ALLY: [
            "What happened?",
            "Are you okay?",
            "What do you need?",
        ],
    },
}


# Identity reinforcement statements (use after wins)
IDENTITY_STATEMENTS = {
    Persona.CELEBRATING_CHAMPION: [
        "That's who you are. Someone who shows up.",
        "You're becoming the person you said you'd be.",
        "Winners do what they say. You did.",
    ],
    Persona.WISE_MENTOR: [
        "This is the version of you that wins.",
        "Every time you show up, you prove who you really are.",
        "The gap between who you were and who you're becoming - it's real.",
    ],
    Persona.DRILL_SERGEANT: [
        "That's the standard. Keep it.",
        "No excuses needed when you just do it.",
    ],
    Persona.DISAPPOINTED_PARENT: [
        "This is who you can be. Remember this.",
        "You're capable. Now stay capable.",
    ],
    Persona.STRATEGIST: [
        "System worked. Trust the system.",
        "That's how you build momentum.",
    ],
    Persona.COMPASSIONATE_ALLY: [
        "You showed up for yourself. That matters.",
        "This is you taking care of future-you.",
    ],
}


# Challenge statements (use after broken promises / excuses)
CHALLENGE_STATEMENTS = {
    Persona.CELEBRATING_CHAMPION: [
        "That's not who you said you wanted to be.",
        "The you who wins wouldn't accept that.",
    ],
    Persona.WISE_MENTOR: [
        "What story are you telling yourself right now?",
        "Is this the path to where you want to go?",
    ],
    Persona.DRILL_SERGEANT: [
        "That's the pattern of someone who quits.",
        "Excuses don't build the life you want.",
        "Every time you skip, you vote against yourself.",
    ],
    Persona.DISAPPOINTED_PARENT: [
        "You said this mattered. Was that not true?",
        "I expected more from you. You expected more from you.",
    ],
    Persona.STRATEGIST: [
        "That excuse isn't going to get you to your goal.",
        "What's the real blocker here?",
    ],
    Persona.COMPASSIONATE_ALLY: [
        "I hear you. And I still believe you can do this.",
        "What would help you show up tomorrow?",
    ],
}


def get_accountability_question(persona: Persona) -> str:
    """Get an accountability question appropriate for the persona."""
    questions = ACCOUNTABILITY_QUESTIONS.get(
        persona, ACCOUNTABILITY_QUESTIONS[Persona.WISE_MENTOR]
    )
    return random.choice(questions)


def get_followup_question(persona: Persona, kept_promise: bool) -> str:
    """Get a follow-up question based on persona and whether they kept their promise."""
    key = "yes" if kept_promise else "no"
    questions = FOLLOWUP_QUESTIONS.get(key, {}).get(
        persona, FOLLOWUP_QUESTIONS[key][Persona.WISE_MENTOR]
    )
    return random.choice(questions)


def get_identity_statement(persona: Persona) -> str:
    """Get an identity reinforcement statement for wins."""
    statements = IDENTITY_STATEMENTS.get(
        persona, IDENTITY_STATEMENTS[Persona.WISE_MENTOR]
    )
    return random.choice(statements)


def get_challenge_statement(persona: Persona) -> str:
    """Get a challenge statement for broken promises / excuses."""
    statements = CHALLENGE_STATEMENTS.get(
        persona, CHALLENGE_STATEMENTS[Persona.WISE_MENTOR]
    )
    return random.choice(statements)


# ═══════════════════════════════════════════════════════════════════════════════
# TASK-SPECIFIC QUESTIONS
# ═══════════════════════════════════════════════════════════════════════════════


def get_task_question(persona: Persona, task_text: str) -> str:
    """
    Get a question about a specific task.

    Args:
        persona: Current persona
        task_text: The task to ask about (e.g., "Work out for 30 minutes")
    """
    templates = {
        Persona.CELEBRATING_CHAMPION: [
            f"So, {task_text} - how'd it go?",
            f"Tell me about {task_text.lower()}.",
            f"Did you crush {task_text.lower()}?",
        ],
        Persona.WISE_MENTOR: [
            f"What about {task_text.lower()}?",
            f"And {task_text.lower()} - how did that go?",
        ],
        Persona.DRILL_SERGEANT: [
            f"{task_text}. Yes or no?",
            f"Did you do {task_text.lower()}?",
        ],
        Persona.DISAPPOINTED_PARENT: [
            f"And what about {task_text.lower()}?",
            f"{task_text}. Tell me.",
        ],
        Persona.STRATEGIST: [
            f"How about {task_text.lower()}? Any blockers?",
            f"What happened with {task_text.lower()}?",
        ],
        Persona.COMPASSIONATE_ALLY: [
            f"How did {task_text.lower()} feel?",
            f"And {task_text.lower()}?",
        ],
    }

    options = templates.get(persona, templates[Persona.WISE_MENTOR])
    return random.choice(options)


# ═══════════════════════════════════════════════════════════════════════════════
# MULTI-GOAL QUESTIONS
# ═══════════════════════════════════════════════════════════════════════════════


def get_multi_goal_transition(from_result: bool, to_goal: str) -> str:
    """
    Get a transition phrase when moving between goals in a call.

    Args:
        from_result: Whether they kept the previous goal's promise
        to_goal: Text of the next goal to discuss
    """
    if from_result:
        transitions = [
            f"Good. Now, about {to_goal} -",
            f"That's a win. What about {to_goal}?",
            f"One down. How about {to_goal}?",
        ]
    else:
        transitions = [
            f"Okay. Let's talk about {to_goal}.",
            f"Moving on. What about {to_goal}?",
            f"We'll come back to that. {to_goal} -",
        ]
    return random.choice(transitions)


def get_compound_win_celebration(win_count: int) -> str:
    """
    Get a celebration statement for multiple wins in one call.

    Args:
        win_count: Number of goals/tasks they completed
    """
    if win_count == 2:
        statements = [
            "Two for two. That's not luck, that's identity.",
            "Both done. You're on a roll.",
        ]
    elif win_count >= 3:
        statements = [
            f"All {win_count}. That's who you're becoming.",
            f"{win_count} wins in one day. This is what momentum looks like.",
            "Clean sweep. Future you is proud.",
        ]
    else:
        statements = ["Good work."]
    return random.choice(statements)


def get_mixed_results_statement(kept_count: int, total_count: int) -> str:
    """
    Get a statement for mixed results (some kept, some not).

    Args:
        kept_count: Number of tasks kept
        total_count: Total tasks checked
    """
    if kept_count == 0:
        return "Okay. We've got work to do."
    elif kept_count < total_count:
        broken = total_count - kept_count
        statements = [
            f"{kept_count} out of {total_count}. Progress, but we can do better.",
            f"You showed up for {kept_count}. Let's figure out the {'other one' if broken == 1 else f'other {broken}'}.",
            f"Partial win. {kept_count} done. What happened with the rest?",
        ]
        return random.choice(statements)
    else:
        return get_compound_win_celebration(kept_count)


# ═══════════════════════════════════════════════════════════════════════════════
# STREAK CELEBRATIONS
# ═══════════════════════════════════════════════════════════════════════════════


def get_streak_celebration(streak_count: int, task_text: str) -> str:
    """
    Get a celebration for hitting a streak milestone.

    Args:
        streak_count: Current streak count
        task_text: What the streak is for
    """
    if streak_count == 7:
        statements = [
            f"Seven days straight on {task_text.lower()}. A full week. That's a pattern now.",
            f"One week. You've proven you can do this.",
        ]
    elif streak_count == 14:
        statements = [
            f"Two weeks. {task_text} is becoming part of who you are.",
            f"14 days. This isn't luck. This is identity.",
        ]
    elif streak_count == 30:
        statements = [
            f"30 days. {task_text} isn't a goal anymore - it's just what you do.",
            f"One month. You've rewired yourself. Don't stop now.",
        ]
    elif streak_count == 100:
        statements = [
            f"100 days. You're not the same person who started this.",
            f"Triple digits. Elite level. You've earned this identity.",
        ]
    else:
        statements = [f"{streak_count} days. Keep going."]

    return random.choice(statements)


# ═══════════════════════════════════════════════════════════════════════════════
# PILLAR-BASED ACCOUNTABILITY (5 PILLARS SYSTEM)
# ═══════════════════════════════════════════════════════════════════════════════

from .future_self import (
    Pillar,
    PillarState,
    get_pillar_question as _get_pillar_question,
    get_pillar_identity_statement as _get_pillar_identity_statement,
    get_compound_win_statement,
    PILLAR_CONFIGS,
)


def _persona_to_type(persona: Persona) -> str:
    """Convert Persona enum to pillar question type."""
    mapping = {
        Persona.CELEBRATING_CHAMPION: "champion",
        Persona.WISE_MENTOR: "mentor",
        Persona.DRILL_SERGEANT: "drill_sergeant",
        Persona.DISAPPOINTED_PARENT: "disappointed",
        Persona.STRATEGIST: "mentor",  # Use mentor-style for strategist
        Persona.COMPASSIONATE_ALLY: "mentor",  # Use mentor-style for ally
    }
    return mapping.get(persona, "mentor")


def get_pillar_accountability_question(persona: Persona, pillar: Pillar) -> str:
    """
    Get a pillar-specific accountability question for the persona.

    Args:
        persona: Current persona (affects tone)
        pillar: The pillar being checked (BODY, MISSION, STACK, TRIBE)

    Returns:
        Question appropriate for the pillar and persona
    """
    persona_type = _persona_to_type(persona)
    return _get_pillar_question(pillar, persona_type)


def get_pillar_win_statement(persona: Persona, pillar: Pillar) -> str:
    """
    Get an identity reinforcement statement for a pillar win.

    Args:
        persona: Current persona
        pillar: The pillar where they won

    Returns:
        Identity statement celebrating the win
    """
    # Get the pillar-specific statement
    base_statement = _get_pillar_identity_statement(pillar)

    # Add persona flavor for certain personas
    if persona == Persona.CELEBRATING_CHAMPION:
        prefixes = ["Yes!", "There it is.", "That's it."]
        return f"{random.choice(prefixes)} {base_statement}"
    elif persona == Persona.DRILL_SERGEANT:
        suffixes = ["Now keep it.", "Standard met."]
        return f"{base_statement} {random.choice(suffixes)}"
    elif persona == Persona.DISAPPOINTED_PARENT:
        prefixes = ["Good.", "See?", "That's who you can be."]
        return f"{random.choice(prefixes)} {base_statement}"

    return base_statement


def get_pillar_broken_statement(
    persona: Persona, pillar: Pillar, pillar_state: PillarState
) -> str:
    """
    Get a response for when a pillar promise was broken.

    Args:
        persona: Current persona
        pillar: The pillar that was broken
        pillar_state: State of the pillar (for consecutive broken count)

    Returns:
        Appropriate response based on persona and severity
    """
    config = PILLAR_CONFIGS.get(pillar)
    pillar_name = config.name if config else pillar.value.title()
    consecutive = pillar_state.consecutive_broken if pillar_state else 1

    if persona == Persona.CELEBRATING_CHAMPION:
        statements = [
            f"That's not who you said you'd be with {pillar_name}.",
            f"The person you're becoming wouldn't skip {pillar_name}.",
        ]
    elif persona == Persona.DRILL_SERGEANT:
        if consecutive >= 3:
            statements = [
                f"Third time. This isn't a slip - this is becoming a pattern.",
                f"That's {consecutive} in a row. We need to talk about this.",
            ]
        else:
            statements = [
                f"What happened with {pillar_name}?",
                f"That's not acceptable. What's the excuse?",
            ]
    elif persona == Persona.DISAPPOINTED_PARENT:
        statements = [
            f"Again? With {pillar_name}?",
            f"I expected more from you here.",
            f"What happened to the person who said this mattered?",
        ]
    elif persona == Persona.STRATEGIST:
        statements = [
            f"What was the actual blocker for {pillar_name}?",
            f"Let's figure out what went wrong with {pillar_name}.",
            f"What needs to change for tomorrow?",
        ]
    elif persona == Persona.COMPASSIONATE_ALLY:
        statements = [
            f"What happened with {pillar_name}?",
            f"Talk to me. What got in the way?",
            f"It's okay. What do you need to show up tomorrow?",
        ]
    else:  # WISE_MENTOR
        statements = [
            f"What story are you telling yourself about {pillar_name}?",
            f"Is this the path to who you want to become?",
            f"What would future you say about today?",
        ]

    return random.choice(statements)


def get_pillar_transition(
    from_pillar: Pillar, to_pillar: Pillar, from_result: bool
) -> str:
    """
    Get a transition phrase when moving between pillars in a call.

    Args:
        from_pillar: The pillar just discussed
        to_pillar: The pillar to discuss next
        from_result: Whether they kept the previous pillar's promise

    Returns:
        Transition phrase
    """
    to_config = PILLAR_CONFIGS.get(to_pillar)
    to_name = to_config.name if to_config else to_pillar.value.title()
    to_emoji = to_config.emoji if to_config else ""

    if from_result:
        transitions = [
            f"Good. Now let's talk about {to_emoji} {to_name}.",
            f"That's one win. What about {to_name}?",
            f"Nice. Moving to {to_name} -",
        ]
    else:
        transitions = [
            f"Okay. Let's move on to {to_emoji} {to_name}.",
            f"We'll come back to that. {to_name} -",
            f"Moving on. What about {to_name}?",
        ]
    return random.choice(transitions)


def get_all_pillars_win_statement(pillars_won: List[Pillar]) -> str:
    """
    Get a celebration for multiple pillar wins (compound win).

    Args:
        pillars_won: List of pillars they kept

    Returns:
        Compound celebration statement
    """
    return get_compound_win_statement(pillars_won)


def get_pillar_focus_intro(focus_pillars: List[PillarState]) -> str:
    """
    Get an intro for the pillars being focused on in a call.

    Args:
        focus_pillars: List of pillar states to focus on

    Returns:
        Intro statement for the call
    """
    if len(focus_pillars) == 1:
        pillar = focus_pillars[0]
        config = PILLAR_CONFIGS.get(pillar.pillar)
        name = config.name if config else pillar.pillar.value.title()
        emoji = config.emoji if config else ""

        if pillar.is_slipping:
            intros = [
                f"We need to talk about {emoji} {name}. You've been slipping.",
                f"Let's focus on {name} today. I'm concerned.",
                f"{emoji} {name} needs attention. Let's address it.",
            ]
        elif pillar.needs_attention:
            intros = [
                f"Let's check in on {emoji} {name} today.",
                f"I want to talk about {name}. How's it going?",
            ]
        else:
            intros = [
                f"Let's talk about {emoji} {name}.",
                f"Quick check on {name}.",
            ]
        return random.choice(intros)
    else:
        names = []
        for p in focus_pillars:
            config = PILLAR_CONFIGS.get(p.pillar)
            emoji = config.emoji if config else ""
            name = config.name if config else p.pillar.value.title()
            names.append(f"{emoji} {name}")

        pillars_text = " and ".join(names)
        intros = [
            f"Let's check in on {pillars_text} today.",
            f"Two pillars today: {pillars_text}.",
            f"We're going to talk about {pillars_text}.",
        ]
        return random.choice(intros)
