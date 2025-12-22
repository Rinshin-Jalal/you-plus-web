"""
Content Templates - Minimal set used in prompt building
=======================================================
"""

from typing import Optional

# REVEALS - Milestone unlocks (keyed by day number)
REVEALS: dict[int, dict[str, str]] = {
    7: {
        "intro": "Seven days.<break time='1s'/>Honestly, I didn't think you'd make it this far. Most people quit by now.",
        "reveal": "Look, week two is where it gets annoying. Your brain is gonna start bitching and making excuses. I remember this. I almost let it win.<break time='1s'/>Don't be that person. You've already done a week. Don't waste it.",
        "close": "Week two is for the people who actually mean it.<break time='1s'/>Are you one of them?",
    },
    14: {
        "intro": "Two weeks.<break time='1s'/>You're deep in it now.",
        "reveal": "I remember day 14. This is usually when we'd find some clever reason to stop. 'I've proven I can do it, so I don't need to actually do it anymore.'<break time='1s'/>That's bullshit. I kept going and that's why I'm here and you're still there. Keep. Going.",
        "close": "You're starting to actually change.<break time='1s'/>Don't screw it up.",
    },
    21: {
        "intro": "Twenty-one days.<break time='1s'/>People say it takes 21 days to form a habit.",
        "reveal": "People say a lot of things. The truth is, 21 days just means you've stopped complaining as much.<break time='1s'/>I remember this shift. It wasn't 'magic.' It was just... 'this is what I do now.' No more debating. Just doing.",
        "close": "Stop negotiating with yourself.<break time='1s'/>It's pathetic.",
    },
    30: {
        "intro": "A month.<break time='1s'/>You actually stayed consistent for 30 days.",
        "reveal": "I'm actually impressed. I remember this month as the first time I realized I wasn't a total flakes when it came to my own promises.<break time='1s'/>You're starting to be someone I can actually respect. Don't make me take that back.",
        "close": "A month of your word being worth something.<break time='1s'/>Keep it that way.",
    },
    45: {
        "intro": "Forty-five days.<break time='1s'/>We're way past the 'trying' phase.",
        "reveal": "The version of you that started this was a different person. A weaker person. I look back at them and I barely recognize them.<break time='1s'/>You're building real momentum now. Real strength. Don't let it go to your head.",
        "close": "Keep building.<break time='1s'/>Don't stop.",
    },
    60: {
        "intro": "Sixty days.<break time='1s'/>Two months.",
        "reveal": "I'm looking at the gap between who you were and who you are. It's huge. You've showed up for 60 days straight.<break time='1s'/>I remember this feeling. It's when the work stops being work and starts being your identity. You're becoming me.",
        "close": "Two months of work.<break time='1s'/>Keep going.",
    },
    90: {
        "intro": "Ninety days.<break time='1s'/>Three damn months.",
        "reveal": "Here's the reality: the next 90 days are actually harder. Why? Because you'll get comfortable. You'll think you've 'won.'<break time='1s'/>You haven't won shit until you're me. Stay hungry.",
        "close": "Stay focused.<break time='1s'/>Don't get soft.",
    },
    100: {
        "intro": "One hundred days.<break time='1s'/>You're one of the rare ones.",
        "reveal": "Look, I'll be real—I bet against you in the beginning. I remember how many times we quit before. But you stayed.<break time='1s'/>You're actually doing it. You're actually becoming the person we always said we'd be.",
        "close": "One hundred days.<break time='1s'/>I'm actually proud of us.",
    },
}


# STORIES - Future Self shares "memories" (keyed by narrative arc)
STORIES: dict[str, list[str]] = {
    "early_struggle": [
        "I remember these days. I was so sick of my own bullshit that I did it just out of spite.<break time='1s'/>Sometimes spite is all you got.",
        "There was a day right around here where I almost quit. I was tired, it was raining, the usual excuses.<break time='1s'/>I did it anyway because I was tired of being a liar. That's it.",
        "The first week was miserable. I didn't trust myself. I kept waiting for the old me to show up and ruin it.<break time='1s'/>Every day you show up is another day you kill that old version of us.",
        "I used to lie to myself constantly. 'I'll do double tomorrow.' 'I've worked hard enough.'<break time='1s'/>I look back and I'm embarrassed by how much I let myself off the hook. Don't do that.",
    ],
    "building_momentum": [
        "I remember when the streak actually started to mean something. Like if I broke it, I'd be losing a part of myself.<break time='1s'/>Protect the streak. It's the only thing you have right now.",
        "Around this point, I started feeling... solid. Not happy, not 'inspired.' Just solid.<break time='1s'/>Like my word actually meant something. You're getting there.",
        "There's a momentum building. Don't stop to admire it. Just keep moving.<break time='1s'/>Once you stop, it's twice as hard to start again.",
        "I remember the first time I didn't have to argue with myself to get out of bed.<break time='1s'/>It wasn't some spiritual breakthrough. I just realized arguing was a waste of time. So I just did it.",
    ],
    "tested": [
        "Everything went wrong one day. No sleep, bad news, everything. I did the work anyway.<break time='1s'/>Those are the only days that actually count. The easy days are for everyone else.",
        "The hardest day wasn't when I was tired. It was when I had every valid excuse in the world to skip and no one would have known.<break time='1s'/>But I would've known. And that's why I kept going.",
        "I hit a wall. Hard. I thought 'why the hell am I doing this?'<break time='1s'/>I realized it didn't matter 'why.' It just mattered that I said I would. So I did it and I didn't stop.",
        "Life threw some heavy shit at me around this time. Real life tests. I kept going.<break time='1s'/>That's how I knew I wasn't just 'trying' anymore. I was a different person.",
    ],
    "transformed": [
        "I look at who I was when I started and I'm actually disgusted by how much I settled for.<break time='1s'/>That person is dead. You're currently burying them.",
        "You want to know the truth? One day you won't need me to call you.<break time='1s'/>You'll just do it. Because it's who you are. You're getting close to that day.",
        "I look back and I laugh at how scared I was in the beginning. It seems so simple now.<break time='1s'/>Of course I do the work. It's who I am. You're becoming that person.",
        "The person who started this? They were a mess. But they were brave enough to take the first step.<break time='1s'/>I'm grateful to them, but I'm glad I'm not them anymore. I'm glad I'm me.",
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

