"""
Content Templates - Minimal set used in prompt building
=======================================================
"""

from typing import Optional

# REVEALS - Milestone unlocks (keyed by day number)
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


# STORIES - Future Self shares "memories" (keyed by narrative arc)
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


# CHALLENGES - Side quests
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


def get_reveal(day: int) -> Optional[dict[str, str]]:
    """Get reveal content for a specific milestone day."""
    return REVEALS.get(day)

