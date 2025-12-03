// Simple personalization for onboarding AI messages
// Uses if-else logic based on user's previous answers

type OnboardingData = Record<string | number, any>;

export function getPersonalizedLines(stepId: number, data: OnboardingData): string[] | null {
  const name = data[4] || "friend"; // Step 4 is name
  const goal = data[6] || "your goal"; // Step 6 is the goal
  const importance = data[8] || 5; // Step 8 is importance slider
  const whoLetDown = data[12]; // Who they let down
  const whatStopped = data[13]; // What stopped them
  const timesTriedBefore = data[14] || 0; // How many times tried
  const howEnds = data[15]; // How it usually ends
  const excuse = data[16]; // Go-to excuse
  const whenGiveUp = data[17]; // When they give up
  const age = data[19]; // Age
  const pronounChoice = data[20]; // Pronouns
  const belief = data[30] || 5; // Belief slider
  const allowInterrupt = data[33]; // Can interrupt
  const allowVoice = data[34]; // Allow voice

  // Helper to get pronoun
  const getPronoun = () => {
    if (pronounChoice === "He/Him") return "he";
    if (pronounChoice === "She/Her") return "she";
    if (pronounChoice === "They/Them") return "they";
    return name;
  };

  switch (stepId) {
    // After name input (step 5)
    case 5:
      if (name && name.length > 0) {
        return [
          `${name}.`,
          "Good to meet you.",
          "Now let's get serious."
        ];
      }
      return null;

    // After goal + date + importance (step 9) - before first voice
    case 9:
      if (importance >= 8) {
        return [
          "Okay, this really matters to you.",
          "I can feel it.",
          "Now I need to hear it from you.",
          "Out loud."
        ];
      } else if (importance >= 5) {
        return [
          "Interesting.",
          "Not your top priority, but it matters.",
          "Now I need to hear it from you.",
          "Out loud."
        ];
      } else {
        return [
          "Hmm. Only a " + importance + "?",
          "We need to dig deeper.",
          "Tell me why this should matter more.",
          "Out loud."
        ];
      }

    // Pattern recognition intro (step 11)
    case 11:
      if (timesTriedBefore > 10) {
        return [
          "Let's talk about the elephant in the room.",
          "You've been here before. Many times.",
          "The pattern is deep.",
          "But patterns can be broken."
        ];
      } else if (timesTriedBefore > 5) {
        return [
          "Let's talk about the elephant in the room.",
          "This isn't your first rodeo.",
          "You know the pattern.",
          "Let's expose it."
        ];
      }
      return [
        "Let's talk about the elephant in the room.",
        "The pattern.",
        "The one you pretend doesn't exist."
      ];

    // After pattern questions (step 18)
    case 18:
      // Personalize based on their failure patterns
      if (whatStopped === "I got scared") {
        return [
          "Fear is your pattern.",
          "It's not about ability. It's about avoidance.",
          "But fear shrinks when you face it.",
          "Let's face it together."
        ];
      } else if (whatStopped === "I got lazy") {
        return [
          "At least you're honest.",
          "Laziness isn't a character flaw.",
          "It's a systems problem.",
          "We're going to fix your system."
        ];
      } else if (whatStopped === "I ran out of time") {
        return [
          "Time isn't the real problem.",
          "Priorities are.",
          "You had time for other things.",
          "Let's make this a priority."
        ];
      } else if (whatStopped === "I didn't know what to do next") {
        return [
          "Clarity kills procrastination.",
          "You weren't lost. You were overwhelmed.",
          "We'll break this into tiny steps.",
          "So small you can't fail."
        ];
      }

      // Also consider how it usually ends
      if (howEnds === "I slowly drift away") {
        return [
          "You're a drifter.",
          "Not a quitter. A forgetter.",
          "That's actually easier to fix.",
          "You just need anchors."
        ];
      } else if (howEnds === "I crash and burn") {
        return [
          "You go hard. Then you break.",
          "It's not sustainable.",
          "This time, we pace ourselves.",
          "Slow and steady wins."
        ];
      }

      return [
        "I see the pattern now.",
        "It's not pretty.",
        "But I've seen worse.",
        "You can break this."
      ];

    // After stakes (step 28)
    case 28:
      const fear = data[27]; // What scares them more
      
      if (fear === "Dying with regret") {
        return [
          "Regret is the heaviest weight.",
          "You feel it already, don't you?",
          "That feeling? That's your fuel.",
          "Let's use it."
        ];
      } else if (fear === "Actually succeeding") {
        return [
          "Interesting.",
          "You're afraid of what success demands.",
          "The responsibility. The change.",
          "But you're ready. Let's prove it."
        ];
      } else if (fear === "Failing publicly") {
        return [
          "The fear of judgment.",
          "But here's the truth:",
          "People are too busy with their own failures to notice yours.",
          "Let's move forward."
        ];
      }

      return [
        "Heavy, right?",
        "Good.",
        "That weight is your fuel.",
        "Let's use it."
      ];

    // System ready (step 29)
    case 29:
      if (whenGiveUp === "Day 1-3") {
        return [
          `Alright ${name}.`,
          "You tend to quit early.",
          "So I'll be checking in on you.",
          "Especially in those first 3 days.",
          "Every. Single. Day."
        ];
      } else if (whenGiveUp === "Right before the finish line") {
        return [
          `${name}, you're a near-finisher.`,
          "You get close, then stop.",
          "This time, I won't let you.",
          "I'll be there at the finish line.",
          "Waiting."
        ];
      }

      return [
        "Your system is ready.",
        "I'll be checking in on you.",
        "Every. Single. Day."
      ];

    // After belief slider (step 31)
    case 31:
      if (belief >= 8) {
        return [
          "That confidence is powerful.",
          "Now let's back it up with action.",
          "Belief without action is just hope.",
          "Let's make it real."
        ];
      } else if (belief >= 5) {
        return [
          "That's honest.",
          "Belief grows with action.",
          "Small wins build confidence.",
          "Let's start building."
        ];
      } else if (belief >= 3) {
        return [
          "Low confidence. I get it.",
          "You've been burned before.",
          "But this time you have me.",
          "Let's prove yourself wrong."
        ];
      } else {
        return [
          `Only a ${belief}? ${name}, listen to me.`,
          "That's exactly why you need this.",
          "You've lost faith in yourself.",
          "We're going to rebuild it. Day by day."
        ];
      }

    // Commitment rules intro (step 32)
    case 32:
      if (timesTriedBefore > 5) {
        return [
          "Time to set the rules.",
          "You've done this " + timesTriedBefore + " times before.",
          "This time, we do it differently.",
          "Non-negotiable commitments."
        ];
      }
      return [
        "Time to set the rules.",
        "These are non-negotiable.",
        "You set them. You follow them."
      ];

    // Final commitment intro (step 38)
    case 38:
      if (allowInterrupt === "Yes, hold me accountable" && allowVoice === "Yes, I'll speak my truth") {
        return [
          `${name}, you're going all in.`,
          "Voice. Daily check-ins. Full accountability.",
          "This is the moment of commitment.",
          "No turning back after this."
        ];
      } else if (allowInterrupt === "No, I'll check in myself") {
        return [
          "You want to do this on your own terms.",
          "I respect that.",
          "But remember: you're still accountable.",
          "This is your moment. Own it."
        ];
      }

      return [
        "This is it.",
        "The moment of commitment.",
        "No turning back after this."
      ];

    default:
      return null; // Return null to use default lines
  }
}

// Helper: Get a short version of the goal or fallback to "this"/"it"
function getShortGoal(goal: string, maxLength: number = 25): string | null {
  if (!goal) return null;
  
  // If goal is short enough, use it with quotes
  if (goal.length <= maxLength) {
    return `"${goal}"`;
  }
  
  // For long goals, return null to use fallback like "this" or "it"
  return null;
}

// Get personalized label for input/choice steps
export function getPersonalizedLabel(stepId: number, defaultLabel: string, data: OnboardingData): string {
  const name = data[4] || "";
  const goal = data[6] || "";
  const importance = data[8] || 5;
  const timesTriedBefore = data[14] || 0;
  
  // Short goal or null if too long
  const shortGoal = getShortGoal(goal, 25);

  switch (stepId) {
    case 6:
      if (name) {
        return `Okay ${name}, what's the one thing you keep starting but never finish?`;
      }
      return defaultLabel;

    case 7:
      // "When do you need "learn guitar" done by?" OR "When do you need this done by?"
      if (shortGoal) {
        return `When do you need ${shortGoal} done by?`;
      } else if (goal) {
        return "When do you need this done by?";
      }
      return defaultLabel;

    case 8:
      // "How much does "learn guitar" matter?" OR "How much does this actually matter to you?"
      if (shortGoal) {
        return `On a scale of 1-10, how much does ${shortGoal} actually matter to you?`;
      }
      return defaultLabel; // Keep original if no goal or too long

    case 14:
      // "How many times have you tried "learn guitar" before?" OR "How many times have you tried this before?"
      if (shortGoal) {
        return `How many times have you tried ${shortGoal} before?`;
      } else if (goal) {
        return "How many times have you tried this before?";
      }
      return defaultLabel;

    case 23:
      // Keep this generic - victory description doesn't need the goal embedded
      if (goal) {
        return "Paint me a picture. What does victory look like?";
      }
      return defaultLabel;

    case 30:
      if (name && timesTriedBefore > 3) {
        return `${name}, after ${timesTriedBefore} attempts, how much do you believe you can actually do this?`;
      }
      return defaultLabel;

    case 35:
      // "What's one thing you'll do every day toward "learn guitar"?" OR "...toward your goal?"
      if (shortGoal) {
        return `What's one thing you'll do every single day toward ${shortGoal}?`;
      } else if (goal) {
        return "What's one thing you'll do every single day toward your goal?";
      }
      return defaultLabel;

    case 37:
      if (name) {
        return `How many strikes before I get ruthless with you, ${name}?`;
      }
      return defaultLabel;

    default:
      return defaultLabel;
  }
}

// Get personalized subtext for voice steps
export function getPersonalizedSubtext(stepId: number, defaultSubtext: string, data: OnboardingData): string {
  const name = data[4] || "";
  const goal = data[6] || "";
  const importance = data[8] || 5;
  
  // Short goal or null if too long
  const shortGoal = getShortGoal(goal, 25);

  switch (stepId) {
    case 10:
      if (importance >= 8) {
        return `You said this is a ${importance}/10. Prove it. Speak from the heart.`;
      } else if (importance <= 4) {
        return "Convince me this matters. Convince yourself.";
      }
      return defaultSubtext;

    case 24:
      if (name) {
        return `Say it out loud, ${name}. Make it real.`;
      }
      return defaultSubtext;

    case 39:
      // "Promise yourself you'll achieve "learn guitar"" OR "Promise yourself you'll do this"
      if (name && shortGoal) {
        return `Promise yourself you'll achieve ${shortGoal}. I'm recording this, ${name}.`;
      } else if (name) {
        return `Promise yourself. I'm recording this, ${name}.`;
      }
      return defaultSubtext;

    default:
      return defaultSubtext;
  }
}
