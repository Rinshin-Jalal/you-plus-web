"""
Content Templates - Hooks, callbacks, open loops, reveals, stories, challenges
===============================================================================

All the content that makes calls addictive:
- HOOKS: First 10 seconds, sets the tone
- CALLBACKS: References to past calls/moments
- OPEN_LOOPS: Cliffhangers that create anticipation
- REVEALS: Milestone unlocks
- STORIES: Future Self shares "memories"
- CHALLENGES: Side quests
- EMOTIONAL_PEAKS: One moment per call that HITS
- DIG_DEEPER: Follow-up questions after yes/no
- TOMORROW_LOCK: Lock in tomorrow's commitment

Templates use {placeholders} that get filled in at runtime:
- {name}: User's name
- {streak}: Current streak days
- {commitment}: Daily commitment
- {callback_day}: Day number for callback
- {callback_quote}: Quote to reference
- {next_milestone}: Next milestone day
- {favorite_excuse}: Their go-to excuse
- {fear}: Their stated fear
- {who_disappointed}: Who they've let down
- {biggest_fear}: Their deepest fear
"""

import random
from typing import Optional


# ═══════════════════════════════════════════════════════════════════════════════
# HOOKS - First 10 seconds, sets the tone
# ═══════════════════════════════════════════════════════════════════════════════

HOOKS: dict[str, list[str]] = {
    "casual": [
        "{name}. You know why I'm calling.",
        "Hey. Day {streak}. Let's do this.",
        "{name}. {commitment}. Yes or no?",
        "It's me. You ready?",
        "{name}. Quick check-in. Did you do it?",
    ],
    "serious": [
        "We need to talk.",
        "{name}.<break time='1s'/>Did you do it?",
        "Day {streak}.<break time='1s'/>What happened?",
        "{name}. I've been thinking about you.",
        "{name}.<break time='1s'/>Tell me the truth.",
    ],
    "teasing": [
        "Alright, let's see what you got today.",
        "{name}. Day {streak}. Impress me.",
        "So? Did you actually do it this time?",
        "I had a bet with myself about today. Don't let me down.",
        "{name}. Day {streak}. Make me proud.",
    ],
    "soft": [
        "Hey.<break time='1s'/>How are you holding up?",
        "{name}. I wanted to check in.",
        "It's just us. How are you really doing?",
        "I've been thinking about your journey today.",
        "{name}.<break time='1s'/>Take a breath. How was today?",
    ],
    "ominous": [
        "I remember this moment.<break time='1s'/>This is where you almost quit.",
        "{name}.<break time='2s'/>We're at the crossroads again.",
        "You know what happens if you stop now.",
        "This is the day.<break time='1s'/>You know which one I mean.",
        "{name}. I've seen how this ends.<break time='1s'/>Have you?",
    ],
    "respectful": [
        "{name}. Day {streak}.<break time='1s'/>You've earned this conversation.",
        "Look at you. Still here.",
        "{name}. I remember when you started. Look how far you've come.",
        "You're not the same person who started this.<break time='1s'/>Let's talk.",
        "{name}. {streak} days. That's not nothing.",
    ],
}


# ═══════════════════════════════════════════════════════════════════════════════
# CALLBACKS - References to past calls/moments
# ═══════════════════════════════════════════════════════════════════════════════

CALLBACKS: list[str] = [
    "Remember day {callback_day} when you said '{callback_quote}'?<break time='1s'/>Look at you now.",
    "You almost quit on day {callback_day}. You're still here.",
    "Remember what you told me about {callback_topic}? That's still in there. I see it.",
    "Day {callback_day}, you said you couldn't do this.<break time='1s'/>You were wrong.",
    "You've come a long way from '{callback_quote}'.",
    "I still think about day {callback_day}.<break time='1s'/>That was a turning point for you.",
    "Remember when you said '{callback_quote}'?<break time='1s'/>Do you still believe that?",
]


# ═══════════════════════════════════════════════════════════════════════════════
# OPEN LOOPS - End of call, creates anticipation
# ═══════════════════════════════════════════════════════════════════════════════

OPEN_LOOPS: list[str] = [
    "Tomorrow, I have something to tell you.<break time='1s'/>But only if you do what you said.",
    "There's a story I want to share. But you're not ready yet.",
    "When you hit day {next_milestone}, we're going to have a different conversation.",
    "I'm watching something change in you.<break time='1s'/>We'll talk about it soon.",
    "Tomorrow.<break time='1s'/>Same time.<break time='1s'/>Don't make me wait.",
    "There's a version of you I remember.<break time='1s'/>You're getting closer.",
    "Keep this up. There's something I want to tell you at day {next_milestone}.",
    "You're almost ready to hear something important.<break time='1s'/>Almost.",
    "Tomorrow, I might ask you something different.<break time='1s'/>Be ready.",
]


# ═══════════════════════════════════════════════════════════════════════════════
# REVEALS - Milestone unlocks (keyed by day number)
# ═══════════════════════════════════════════════════════════════════════════════

REVEALS: dict[int, dict[str, str]] = {
    7: {
        "intro": "Seven days.<break time='1s'/>Most people don't make it this far. You know that, right?",
        "reveal": "Let me tell you what the second week feels like.<break time='1s'/>This is when your brain starts fighting back. The excuses get smarter. The resistance gets louder.<break time='1s'/>But here's what I remember: you made it through. You're about to find out what you're actually made of.",
        "close": "Week two is where champions are separated from quitters.<break time='1s'/>Which one are you?",
    },
    14: {
        "intro": "Two weeks.<break time='1s'/>You're in the danger zone now.",
        "reveal": "This is where you usually quit. You told me yourself.<break time='1s'/>But you're still here. That means something.<break time='1s'/>I remember this exact moment. This is where I stopped believing it was luck and started believing it was identity.",
        "close": "You're not just doing the thing anymore.<break time='1s'/>You're becoming the person who does the thing.",
    },
    21: {
        "intro": "Twenty-one days.<break time='1s'/>They say this is when habits form.",
        "reveal": "They're wrong. Habits don't form in 21 days.<break time='1s'/>But something else happens. You stop negotiating with yourself. The question isn't 'will I do it?' anymore. It's just 'when?'<break time='1s'/>That shift? That's what I remember about day 21.",
        "close": "You're past the negotiation phase.<break time='1s'/>Don't go back.",
    },
    30: {
        "intro": "A month.<break time='1s'/>You actually did it.",
        "reveal": "I remember this moment clearly.<break time='1s'/>This is when I knew it was going to stick. Not because it was easy. Because I had proven to myself that I could keep a promise for 30 days straight.<break time='1s'/>Do you understand what that means? You're trustworthy now. To yourself.",
        "close": "Thirty days of keeping your word.<break time='1s'/>That's not nothing. That's everything.",
    },
    45: {
        "intro": "Forty-five days.<break time='1s'/>We're in new territory now.",
        "reveal": "Most people never get here. Not even close.<break time='1s'/>The version of you that started this wouldn't recognize you now. The excuses that used to work? They sound ridiculous now.<break time='1s'/>That's growth. That's real.",
        "close": "You're building something that can't be taken away.<break time='1s'/>Keep building.",
    },
    60: {
        "intro": "Sixty days.<break time='1s'/>You're not the same person who started this.",
        "reveal": "I look at where you started and where you are now.<break time='1s'/>The gap is bigger than you realize. You've changed in ways you can't see yet. But I can. I remember.<break time='1s'/>Two months of showing up. Two months of keeping your word. Two months of becoming.",
        "close": "Two months of becoming.<break time='1s'/>Don't stop now.",
    },
    90: {
        "intro": "Ninety days.<break time='1s'/>Three months. A quarter of a year.",
        "reveal": "Here's what nobody tells you about day 90.<break time='1s'/>The hardest part isn't behind you. The hardest part is staying who you've become when life gets complicated again.<break time='1s'/>But you're ready. You've proven that.",
        "close": "The next 90 days will test you differently.<break time='1s'/>You're ready for it.",
    },
    100: {
        "intro": "One hundred days.<break time='1s'/>Do you know how rare this is?",
        "reveal": "There's something I've been waiting to tell you.<break time='1s'/>I wasn't sure you'd make it. Day 3, day 14, day 45... there were moments I thought you'd quit. But you didn't.<break time='1s'/>And now? Now I know who you really are.<break time='1s'/>You're the one who stays.",
        "close": "One hundred days.<break time='1s'/>You've proven something that can never be taken away.",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# STORIES - Future Self shares "memories" (keyed by narrative arc)
# ═══════════════════════════════════════════════════════════════════════════════

STORIES: dict[str, list[str]] = {
    "early_struggle": [
        "I remember these early days.<break time='1s'/>You know what got me through? Not motivation. Spite. I was so tired of being disappointed in myself that I did it just to prove I wasn't a liar.",
        "There was a moment, right around where you are now, where I almost quit.<break time='1s'/>I was tired. It felt pointless. But I did it anyway. Not because I wanted to. Because I said I would.<break time='1s'/>That's it.",
        "The first week was the hardest.<break time='1s'/>Not because of the work. Because I didn't trust myself yet. I'd broken too many promises.<break time='1s'/>But each day I showed up, I earned back a little bit of that trust.",
        "I remember lying to myself a lot in the beginning.<break time='1s'/>'Tomorrow I'll start fresh.' 'One day off won't matter.' Sound familiar?<break time='1s'/>The difference now is I stopped believing those lies.",
    ],
    "building_momentum": [
        "I remember when the streak started feeling real.<break time='1s'/>Like I had something to protect. That's where you are now.<break time='1s'/>Don't let it go.",
        "Around this point, I started feeling different. Not proud exactly. Just... solid.<break time='1s'/>Like I could trust myself. You're building that now.",
        "There's a momentum that starts building around this time.<break time='1s'/>It's subtle at first. But eventually it becomes harder to stop than to keep going.<break time='1s'/>That's what you're creating.",
        "I remember the first time I didn't have to convince myself to do it.<break time='1s'/>It wasn't motivation. It was just... who I was. That shift is coming for you.",
    ],
    "tested": [
        "There was a day, I don't remember which one, where everything went wrong.<break time='1s'/>Bad day. Every excuse was valid. I did it anyway.<break time='1s'/>That day defined everything that came after.",
        "The hardest day wasn't when I was tired.<break time='1s'/>It was when I had every reason to skip and no one would have blamed me. I did it anyway.<break time='1s'/>That's the day I became who I am.",
        "I remember hitting a wall. Hard.<break time='1s'/>Everything felt pointless. I questioned why I was even trying. But I didn't stop.<break time='1s'/>That's the difference between people who make it and people who don't.",
        "Around this point, life tested me. Really tested me.<break time='1s'/>Not fair tests. Cheap shots. I kept going anyway.<break time='1s'/>That's when I knew I wasn't the person who quits anymore.",
    ],
    "transformed": [
        "I barely remember who I was before this.<break time='1s'/>That person feels like a stranger. The one who made excuses. The one who quit.<break time='1s'/>That's not me anymore. And soon, it won't be you either.",
        "You want to know the truth?<break time='1s'/>There comes a day when you don't need these calls anymore. When you just... do it. Because it's who you are.<break time='1s'/>You're getting close.",
        "I look back at the beginning and I almost laugh.<break time='1s'/>I was so scared. So uncertain. Now it's just... obvious. Of course I do this. Of course.<break time='1s'/>That's identity.",
        "The person who started this? I'm grateful to them. They took the first step.<break time='1s'/>But I'm not them anymore. I'm who they were trying to become.<break time='1s'/>You'll understand soon.",
    ],
}


# ═══════════════════════════════════════════════════════════════════════════════
# CHALLENGES - Side quests
# ═══════════════════════════════════════════════════════════════════════════════

CHALLENGES: list[dict] = [
    {
        "challenge": "No snooze button for 3 days straight",
        "framing": "I have a challenge for you. Not the commitment. Something extra.<break time='1s'/>No snooze button. Three days. First alarm, you're up.<break time='1s'/>You in?",
        "days": 3,
    },
    {
        "challenge": "Do your commitment first thing before anything else",
        "framing": "Here's what I want you to try.<break time='1s'/>Tomorrow, do {commitment} before you do anything else. Not after work. Not after dinner. First thing.<break time='1s'/>Can you do that?",
        "days": 1,
    },
    {
        "challenge": "Add 10% more to your commitment",
        "framing": "You've been consistent. Time to level up.<break time='1s'/>Tomorrow, I want you to do 10% more than usual. If it's 30 minutes, make it 33. Push the edge.<break time='1s'/>You ready?",
        "days": 1,
    },
    {
        "challenge": "Tell someone about your streak",
        "framing": "I have a weird one for you.<break time='1s'/>Tell someone about your streak tomorrow. Anyone. Say it out loud. Make it real.<break time='1s'/>Will you do that?",
        "days": 1,
    },
    {
        "challenge": "Write down why you started",
        "framing": "Before bed tomorrow, write down why you started this.<break time='1s'/>Not for me. For you. Put it somewhere you'll see it.<break time='1s'/>Deal?",
        "days": 1,
    },
    {
        "challenge": "No phone for the first hour of the day",
        "framing": "Try this for the next three days.<break time='1s'/>No phone for the first hour after you wake up. Just you and the morning.<break time='1s'/>Think you can handle that?",
        "days": 3,
    },
    {
        "challenge": "Do the hardest part of your commitment first",
        "framing": "Tomorrow, start with the part you usually avoid.<break time='1s'/>The hardest part. First. Get it out of the way.<break time='1s'/>You up for that?",
        "days": 1,
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# EMOTIONAL PEAKS - One moment per call that HITS
# ═══════════════════════════════════════════════════════════════════════════════

EMOTIONAL_PEAKS: dict[str, list[str]] = {
    "validation": [
        "You did something today that most people can't.<break time='1s'/>Don't forget that.",
        "You kept your word. To yourself.<break time='1s'/>That matters more than you know.",
        "This is what discipline looks like.<break time='1s'/>Not motivation. Action.",
        "You showed up. Again.<break time='1s'/>That's everything.",
        "Most people quit by now. You didn't.<break time='1s'/>That means something.",
    ],
    "decline_visualization": [
        "Picture yourself a year from now, still making the same excuse.<break time='1s'/>Same weight. Same regrets. Same disappointment.",
        "Every day you skip is a vote for the old you.<break time='1s'/>The one who quits. The one who lies to themselves.",
        "You know where this leads if you stop.<break time='1s'/>You've been there before.",
        "Imagine explaining to yourself in 5 years why you gave up.<break time='1s'/>What would you say?",
        "The version of you that quits? They're still out there. Still making excuses.<break time='1s'/>Is that who you want to be?",
    ],
    "progress_visualization": [
        "Three weeks ago, you couldn't imagine being here.<break time='1s'/>Now look.",
        "Every day you show up, you're building something.<break time='1s'/>It's adding up. I can see it.",
        "You're {streak} days in.<break time='1s'/>That's {streak} promises kept. {streak} times you chose yourself.",
        "Look at the gap between day 1 and today.<break time='1s'/>That's growth. Real growth.",
        "Remember how hard day 3 was?<break time='1s'/>This is what's on the other side.",
    ],
    "identity": [
        "You're not just doing the thing anymore.<break time='1s'/>You're becoming the person who does the thing.",
        "This isn't about the habit.<break time='1s'/>It's about who you're becoming.",
        "You're building an identity.<break time='1s'/>One day at a time.",
        "People who do this for {streak} days? They're different.<break time='1s'/>You're different now.",
        "The old you wouldn't recognize this.<break time='1s'/>That's the point.",
    ],
    "fear": [
        "Remember what you said about {future_if_no_change}?<break time='1s'/>That's where quitting leads.",
        "You've disappointed {who_disappointed} before.<break time='1s'/>Is that who you want to be?",
        "You told me your biggest fear is {biggest_fear}.<break time='1s'/>Every skip moves you closer to that.",
        "You've seen where this road ends.<break time='1s'/>You've been there. Do you want to go back?",
        "The future you're afraid of?<break time='1s'/>It's built one skipped day at a time.",
    ],
    "disappointment": [
        "I expected more from you.<break time='1s'/>You expected more from you.",
        "You know what hurts?<break time='1s'/>I believed you when you said you'd do it.",
        "This isn't anger.<break time='1s'/>It's disappointment. And that's worse.",
        "You're better than this. We both know it.<break time='1s'/>So why?",
        "Every time you break your word to yourself, you make the next time easier.<break time='1s'/>Is that what you want?",
    ],
}


# ═══════════════════════════════════════════════════════════════════════════════
# DIG DEEPER - Follow-up questions after yes/no
# ═══════════════════════════════════════════════════════════════════════════════

DIG_DEEPER: dict[str, list[str]] = {
    "after_yes": [
        "Good.<break time='1s'/>How did it feel?",
        "What was the hardest part?",
        "Was there a moment you almost didn't?",
        "What time did you do it?",
        "Did you do it because you wanted to or because you said you would?",
        "What's different about today compared to day one?",
        "Anything try to stop you?",
    ],
    "after_no": [
        "What happened?<break time='1s'/>Real answer.",
        "Walk me through it.<break time='1s'/>When did you decide not to?",
        "Is this the excuse you told me about?<break time='1s'/>The one that always gets you?",
        "What were you doing instead?",
        "If I called you 2 hours earlier, what would you have said?",
        "Was there a moment you could have chosen differently?",
        "What would it have taken for you to do it anyway?",
    ],
    "after_excuse": [
        "That sounds like an excuse.<break time='1s'/>Is it?",
        "You told me that's your pattern.<break time='1s'/>'{favorite_excuse}'. Is that what this is?",
        "I've heard that before.<break time='1s'/>From you. Multiple times.",
        "If your future self heard that, what would they say?",
        "Is that the real reason? Or the easy one?",
        "You've used that one before.<break time='1s'/>Did it work out well last time?",
    ],
}


# ═══════════════════════════════════════════════════════════════════════════════
# TOMORROW LOCK-IN
# ═══════════════════════════════════════════════════════════════════════════════

TOMORROW_LOCK: list[str] = [
    "What are you doing tomorrow?<break time='1s'/>Specific.",
    "Tomorrow.<break time='1s'/>What time? What exactly?",
    "Lock it in.<break time='1s'/>What's the commitment for tomorrow?",
    "Same thing tomorrow?<break time='1s'/>Or are you leveling up?",
    "Tell me what tomorrow looks like.",
    "What's the plan for tomorrow?<break time='1s'/>Be specific.",
]


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════


def get_random_hook(opener_style: str) -> str:
    """Get a random hook for the given opener style."""
    hooks = HOOKS.get(opener_style, HOOKS["casual"])
    return random.choice(hooks)


def get_random_callback() -> str:
    """Get a random callback template."""
    return random.choice(CALLBACKS)


def get_random_open_loop() -> str:
    """Get a random open loop."""
    return random.choice(OPEN_LOOPS)


def get_reveal(day: int) -> Optional[dict[str, str]]:
    """Get reveal content for a specific milestone day."""
    return REVEALS.get(day)


def get_random_story(narrative_arc: str) -> str:
    """Get a random story for the current narrative arc."""
    stories = STORIES.get(narrative_arc, STORIES["early_struggle"])
    return random.choice(stories)


def get_random_challenge() -> dict:
    """Get a random challenge."""
    return random.choice(CHALLENGES)


def get_random_emotional_peak(peak_type: str) -> str:
    """Get a random emotional peak of the given type."""
    peaks = EMOTIONAL_PEAKS.get(peak_type, EMOTIONAL_PEAKS["validation"])
    return random.choice(peaks)


def get_random_dig_deeper(response_type: str) -> str:
    """Get a random dig deeper question."""
    questions = DIG_DEEPER.get(response_type, DIG_DEEPER["after_yes"])
    return random.choice(questions)


def get_random_tomorrow_lock() -> str:
    """Get a random tomorrow lock-in prompt."""
    return random.choice(TOMORROW_LOCK)


def fill_template(template: str, **kwargs) -> str:
    """
    Fill in template placeholders with actual values.

    Supports:
    - {name}, {streak}, {commitment}, etc.
    - Missing values (None) are replaced with empty string
    - Falsy values like 0 or False are preserved as strings
    """
    result = template
    for key, value in kwargs.items():
        placeholder = "{" + key + "}"
        result = result.replace(placeholder, str(value) if value is not None else "")

    # Clean up any unfilled placeholders
    import re

    result = re.sub(r"\{[^}]+\}", "", result)

    return result
