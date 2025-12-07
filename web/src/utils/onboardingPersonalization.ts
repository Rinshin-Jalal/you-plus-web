// Simple personalization for onboarding AI messages
// Uses field names directly (not step IDs)

type OnboardingData = Record<string, any>;

export function getPersonalizedLines(stepId: number, data: OnboardingData): string[] | null {
  // Extract data using field names
  const name = data.name || "friend";
  const timesTried = data.times_tried || 0;
  const coreIdentity = data.core_identity;
  const primaryPillar = data.primary_pillar;
  const quitPattern = data.quit_pattern;
  const favoriteExcuse = data.favorite_excuse;
  const whoDisappointed = data.who_disappointed;

  switch (stepId) {
    // After name input - Step 6 commentary "2 years from now..."
    case 6:
      if (name && name !== "friend") {
        return [
          "2 years from now.",
          `You made it, ${name}. Who ARE you?`
        ];
      }
      return null;

    // After pillar questions - Step 30 act header for "Your Why"
    case 30:
      if (primaryPillar) {
        const pillarName = primaryPillar.includes('Health') ? 'health' :
                          primaryPillar.includes('Work') ? 'work' :
                          primaryPillar.includes('Money') ? 'money' : 'relationships';
        return [
          `${name}, your ${pillarName} is the keystone.`,
          "Fix that, and everything else follows."
        ];
      }
      return null;

    // After patterns - Step 40 act header "Lock It In"
    case 40:
      if (quitPattern === "Day 1-3 - never really start") {
        return [
          `${name}, you never really start.`,
          "That changes tonight.",
          "I'm gonna call you every day.",
          "Not to nag. To remind you who you're becoming."
        ];
      } else if (quitPattern === "Right before I actually make it") {
        return [
          "You're a near-finisher.",
          "You get close, then stop.",
          "This time, I won't let you quit.",
          "I'm gonna call you every day."
        ];
      }
      return null;

    // Commentary step 41 - before call_time
    case 41:
      if (timesTried > 10) {
        return [
          `${timesTried} times you've tried.`,
          `${timesTried} times you've stopped.`,
          "This time, you have me.",
          "I'm gonna call you every single day."
        ];
      } else if (favoriteExcuse) {
        return [
          `"${favoriteExcuse}"`,
          "That's your go-to excuse.",
          "I'll remember that.",
          "When you try it on me, I'll call you out."
        ];
      }
      return null;

    // Final commentary - Step 44
    case 44:
      if (name && name !== "friend") {
        return [
          `Got everything I need, ${name}.`,
          "Let's do this."
        ];
      }
      return null;

    default:
      return null; // Return null to use default lines
  }
}

// Get personalized label for input/choice steps
export function getPersonalizedLabel(stepId: number, defaultLabel: string, data: OnboardingData): string {
  const name = data.name || "";
  const timesTried = data.times_tried || 0;
  const primaryPillar = data.primary_pillar;

  switch (stepId) {
    // Core identity input - step 7
    case 7:
      if (name) {
        return `${name}, describe the future you in one line.`;
      }
      return defaultLabel;

    // The Why input - step 31
    case 31:
      if (name) {
        return `${name}, why do you actually want to change?`;
      }
      return defaultLabel;

    // Dark future input - step 39
    case 39:
      if (name) {
        return `${name}, if you don't change, where will you be in 5 years?`;
      }
      return defaultLabel;

    // Call time input - step 42
    case 42:
      if (name) {
        return `${name}, what time works best for your daily call?`;
      }
      return defaultLabel;

    default:
      return defaultLabel;
  }
}

// Get personalized subtext for voice steps
export function getPersonalizedSubtext(stepId: number, defaultSubtext: string, data: OnboardingData): string {
  const name = data.name || "";
  const coreIdentity = data.core_identity;
  const theWhy = data.the_why;

  switch (stepId) {
    // Future self intro recording - step 8
    case 8:
      if (name) {
        return `Speak clearly, ${name} - we'll use this to create your future self's voice.`;
      }
      return defaultSubtext;

    // Why recording - step 32
    case 32:
      if (name) {
        return `Speak from the heart, ${name}. I'll play this back when you're slipping.`;
      }
      return defaultSubtext;

    // Pledge recording - step 43
    case 43:
      if (name && coreIdentity) {
        return `Promise to become "${coreIdentity}". This is what you'll hear when you want to quit.`;
      } else if (name) {
        return `Promise yourself, ${name}. This is what you'll hear when you want to quit.`;
      }
      return defaultSubtext;

    default:
      return defaultSubtext;
  }
}
