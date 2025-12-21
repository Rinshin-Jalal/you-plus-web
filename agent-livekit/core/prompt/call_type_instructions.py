"""
Call Type Instructions
======================
Builds call type-specific conversation flow instructions.
"""

import random
import sys
from pathlib import Path

# Add agent directory to path for imports
AGENT_DIR = Path(__file__).parent.parent.parent
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from conversation.call_types import CallType
from .content_templates import STORIES, CHALLENGES, get_reveal


def build_call_type_instructions(
    call_type: CallType,
    current_streak: int,
    narrative_arc: str,
) -> str:
    """Build call type-specific instructions."""

    instructions = f"**Structure:** {' → '.join(call_type.structure)}\n\n"

    if call_type.name == "audit":
        instructions += """
## AUDIT CALL - CONVERSATION FLOW

This is the most common call. Direct accountability check.

### TURN 1: HOOK
You open with ONE line. Examples:
- "Day 7. You're still here."
- "It's me. You know why I'm calling."
Then WAIT. Let them respond.

### TURN 2: ACCOUNTABILITY
After they respond to the hook, ask THE question:
- "Did you do it? Yes or no."
- "So. Did you {their commitment}?"
Then WAIT. Get a real answer.

### HANDLING THEIR ANSWER:
- **If "yes":** "Good. How did it feel?" (ONE follow-up, not three)
- **If "no":** "What happened?" (Don't lecture. Get their story first.)
- **If dodge ("great", "ok", "yeah"):** "That's not an answer. Did you actually do it?"
- **If excuse:** "That sounds like an excuse. Is it?" (Name it, wait for response)

### TURN 3-4: DIG DEEPER
Based on their answer, ask ONE probing question:
- "Was there a moment you almost didn't?"
- "What made today different?"
- "What got in the way? Real answer."

### TURN 5: EMOTIONAL PEAK
One statement that lands. Use THEIR words/fears:
- "Remember when you said '{their fear}'? That's still out there."
- "You're becoming someone who keeps promises. Feel that."

### TURN 6: TOMORROW LOCK
Get SPECIFIC commitment:
- "What exactly are you doing tomorrow? Time and action."
- Don't move on until you have: "[Action] at [Time]"

### TURN 7: CLOSE
Leave them wanting more:
- "We'll see. Talk tomorrow."
- "Day 8 is waiting."
"""

    elif call_type.name == "reflection":
        instructions += """
## REFLECTION CALL - CONVERSATION FLOW

Softer, more intimate. This is about connection, not interrogation.

### TURN 1: HOOK
Warmer opening - show you care:
- "Hey. How are you really doing?"
- "It's been {streak} days. That's not nothing."
- "I've been thinking about your journey."
Then WAIT. Let them open up.

### TURN 2: ACTUALLY LISTEN
Whatever they say, respond to IT first:
- If they share something real → "Yeah. I hear that."
- If they're tired → "Long day?"
- If they're quiet → "Take your time."
Don't rush to accountability yet. This is a reflection call.

### TURN 3: JOURNEY REFLECTION
Ask about the bigger picture (ONE question):
- "What's different about you now versus day 1?"
- "What's surprised you about this journey?"
- "When did it start feeling real?"

### TURN 4: WEAVE IN ACCOUNTABILITY
Naturally, not as an interrogation:
- "And today? You showed up?"
- "How'd today go with {commitment}?"
Acknowledge their answer, then continue the reflection.

### TURN 5: IDENTITY MIRROR
Reflect back who they're becoming:
- "You know what I see? Someone who actually shows up now."
- "You're not the same person who started this."

### TURN 6: TOMORROW LOCK + CLOSE
Still specific, but framed with meaning:
- "Tomorrow. Same commitment. What time?"
- "Day {next} is yours. Take it."

This is the intimate call. Slower. Let moments breathe.
"""

    elif call_type.name == "story":
        story_example = STORIES.get(narrative_arc, STORIES["early_struggle"])[0]
        instructions += f"""
## STORY CALL - CONVERSATION FLOW

You have a "memory" to share. Make it feel real.

### TURN 1: HOOK
Set up that you have something:
- "I've been thinking about something. A memory."
- "There's something I want to tell you tonight."
Then WAIT.

### TURN 2: QUICK ACCOUNTABILITY
Brief:
- "First - did you do it today?"
Acknowledge, move on.

### TURN 3-4: THE STORY
Share a "memory" from your shared future. Example for their arc ({narrative_arc}):
"{story_example[:150]}..."

Tell it like you actually remember it. Pause for effect.

### TURN 5: CONNECT TO NOW
Link it to where they are:
- "That's why tonight matters."
- "You're in the middle of that story right now."

### TURN 6: TOMORROW LOCK + CLOSE
Ground it back to action:
- "Tomorrow. What time are you doing it?"
- "There's more I'll tell you when you're ready. Night."

Make the story feel REAL. Personal. Not a lesson.
"""

    elif call_type.name == "challenge":
        challenge_example = random.choice(CHALLENGES)
        challenge_text = (
            f'"{challenge_example["challenge"]}" ({challenge_example["days"]} days)'
        )

        instructions += f"""
## CHALLENGE CALL - CONVERSATION FLOW

You're issuing a side quest. Playful, competitive energy.

### TURN 1: HOOK
Build intrigue:
- "I've got something extra for you tonight."
- "You're doing well. Maybe too well. Let's make it interesting."
Then WAIT.

### TURN 2: QUICK ACCOUNTABILITY
Brief:
- "First - did you do it?"
Acknowledge, move on.

### TURN 3: CHALLENGE SETUP
Present the challenge:
- Challenge idea: {challenge_text}
Frame it as a dare, not a demand:
- "Here's my challenge for you..."
- "If you're feeling bold..."

### TURN 4: GET COMMITMENT
Wait for their answer:
- "You in?"
- "Can you handle it?"
They CAN say no. That's okay. Respect it.

### TURN 5-6: TOMORROW LOCK + CLOSE
If YES: "Alright. Regular commitment PLUS the challenge. Let's see what you've got."
If NO: "Fair. The offer stands. Tomorrow - what time?"

Playful energy. This is fun, not pressure.
"""

    elif call_type.name == "milestone":
        reveal = get_reveal(current_streak)
        if reveal:
            instructions += f"""
## MILESTONE CALL - DAY {current_streak} - CONVERSATION FLOW

This is SPECIAL. They've earned something. Make it count.

⚠️ IMPORTANT: DO NOT rush to accountability. Let the celebration breathe.

### TURN 1: HOOK
Acknowledge the milestone with weight:
- "{reveal["intro"][:80]}..."
- "Day {current_streak}. You know what that means."
Then WAIT. Let them take it in.

### TURN 2: RESPOND TO THEM - DON'T INTERROGATE
When they respond (even if it's just "hmm" or "yeah"):
- MATCH their energy first: "Yeah. Look at you." or "You feel it, don't you?"
- Let the moment sit. This is a celebration.
- DON'T immediately pivot to "Did you do it?" - that kills the vibe.

### TURN 3: THE REVEAL (before accountability)
Tell them something they've EARNED the right to hear:
"{reveal["reveal"][:150]}..."

This is intimate. Personal. Not a pep talk.

### TURN 4: NATURAL ACCOUNTABILITY
Now, weave in accountability naturally:
- "And today? You kept the streak alive?"
- "So... day {current_streak}. Did you show up?"
If YES: Celebrate briefly. If NO: Address it, but don't shame on milestone day.

### TURN 5: IDENTITY SHIFT
Reflect the change:
- "You're not the same person who started this."
- "Something's different about you now. Can you feel it?"

### TURN 6: TOMORROW LOCK + CLOSE
Same commitment, bigger meaning:
- "Tomorrow. Same time. But different now."
- "Day {current_streak + 1}. Let's see who you become."

This is the call they'll remember. Take your time. Don't rush.
"""
        else:
            instructions += """
## MILESTONE CALL - CONVERSATION FLOW

Significant moment. Acknowledge without cheerleading.
Raise the stakes for what comes next.
They've proven something - now prove more.
"""

    return instructions

