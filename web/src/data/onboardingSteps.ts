export const STEPS = [
    // 1. The Hook - Grab attention immediately
    { id: 1, type: 'commentary', lines: [
        "Hey.",
        "It's me.",
        "You.",
        "From the future."
    ]},
    { id: 2, type: 'commentary', lines: [
        "Remember that thing you started?",
        "The one you were so excited about?",
        "Yeah. That one."
    ]},
    { id: 3, type: 'commentary', lines: [
        "You quit.",
        "Again.",
        "But this time, we're going to fix that."
    ]},
    
    // 2. Identity - Get to know them
    { id: 4, type: 'input', label: "First things first. What's your name?", placeholder: "Your name" },
    { id: 5, type: 'commentary', lines: [
        "Good to meet you.",
        "Now let's get serious."
    ]},
    { id: 6, type: 'input', label: "What's the one thing you keep starting but never finish?", placeholder: "Be specific" },
    { id: 7, type: 'date', label: "When do you need this done by?" },
    { id: 8, type: 'slider', label: "On a scale of 1-10, how much does this actually matter to you?", min: 1, max: 10 },
    { id: 9, type: 'commentary', lines: [
        "Interesting.",
        "Now I need to hear it from you.",
        "Out loud."
    ]},
    { id: 10, type: 'voice', label: "Tell me why this matters.", subtext: "Speak from the heart. I'm listening." },
    
    // 3. Pattern Recognition - Understand their failure patterns
    { id: 11, type: 'commentary', lines: [
        "Let's talk about the elephant in the room.",
        "The pattern.",
        "The one you pretend doesn't exist."
    ]},
    { id: 12, type: 'choice', label: "When you failed before, who did you really let down?", choices: ["Myself", "My family", "My partner", "Everyone who believed in me"] },
    { id: 13, type: 'choice', label: "Be honest. What actually stopped you?", choices: ["I ran out of time", "I got scared", "I got lazy", "I didn't know what to do next"] },
    { id: 14, type: 'slider', label: "How many times have you tried this before?", min: 0, max: 20 },
    { id: 15, type: 'choice', label: "How does it usually end?", choices: ["I slowly drift away", "I crash and burn", "I just... stop one day"] },
    { id: 16, type: 'choice', label: "What's your go-to excuse?", choices: ["I'll start tomorrow", "I'm too tired today", "I'm not ready yet", "Something came up"] },
    { id: 17, type: 'choice', label: "When do you usually give up?", choices: ["Day 1-3", "First week", "First month", "Right before the finish line"] },
    { id: 18, type: 'commentary', lines: [
        "I see the pattern now.",
        "It's not pretty.",
        "But I've seen worse.",
        "You can break this."
    ]},
    
    // 4. Quick Demographics
    { id: 19, type: 'slider', label: "How old are you?", min: 13, max: 99 },
    { id: 20, type: 'choice', label: "How should I address you?", choices: ["He/Him", "She/Her", "They/Them", "Just use my name"] },
    { id: 21, type: 'input', label: "Where in the world are you?", placeholder: "City or country" },
    
    // 5. Stakes - Make it real
    { id: 22, type: 'commentary', lines: [
        "Now let's talk about what's at stake.",
        "This is the part most people skip.",
        "Don't skip it."
    ]},
    { id: 23, type: 'input', label: "Paint me a picture. What does victory look like?", placeholder: "Be vivid. Be specific." },
    { id: 24, type: 'voice', label: "What part of you dies if you quit again?", subtext: "Say it out loud. Make it real." },
    { id: 25, type: 'choice', label: "If nothing changes, where will you be in 6 months?", choices: ["Better than now", "Worse than now", "Exactly the same (that's the scary one)"] },
    { id: 26, type: 'choice', label: "What have you already wasted by quitting?", choices: ["Time I'll never get back", "Money I can't recover", "Potential I'll never know"] },
    { id: 27, type: 'choice', label: "What scares you more?", choices: ["Failing publicly", "Actually succeeding", "Dying with regret"] },
    { id: 28, type: 'commentary', lines: [
        "Heavy, right?",
        "Good.",
        "That weight is your fuel.",
        "Let's use it."
    ]},

    // 6. System Setup
    { id: 29, type: 'loader', label: "Building your accountability system..." },
    { id: 30, type: 'commentary', lines: [
        "Your system is ready.",
        "I'll be checking in on you.",
        "Every. Single. Day."
    ]},

    // 7. Belief Check
    { id: 31, type: 'slider', label: "Right now, how much do you believe you can actually do this?", min: 1, max: 10 },
    { id: 32, type: 'commentary', lines: [
        "That's honest.",
        "Belief grows with action.",
        "Let's build some."
    ]},

    // 8. Commitment Setup
    { id: 33, type: 'commentary', lines: [
        "Time to set the rules.",
        "These are non-negotiable.",
        "You set them. You follow them."
    ]},
    { id: 34, type: 'choice', label: "Can I interrupt your day to check on you?", choices: ["Yes, hold me accountable", "No, I'll check in myself"] },
    { id: 35, type: 'choice', label: "Will you let me hear your voice?", choices: ["Yes, I'll speak my truth", "No, text only"] },
    { id: 36, type: 'input', label: "What's one thing you'll do every single day toward your goal?", placeholder: "I will..." },
    { id: 37, type: 'time', label: "What time should I check in with you?" },
    { id: 38, type: 'slider', label: "How many strikes before I get ruthless?", min: 1, max: 5 },
    
    // 9. Final Commitment
    { id: 39, type: 'commentary', lines: [
        "This is it.",
        "The moment of commitment.",
        "No turning back after this."
    ]},
    { id: 40, type: 'voice', label: "Make your pledge.", subtext: "Promise yourself. Out loud. I'm recording this." },

    // 10. Seal the Deal
    { id: 41, type: 'card', label: "Your Commitment" },
    
    // 11. Welcome
    { id: 42, type: 'paywall' }
];
