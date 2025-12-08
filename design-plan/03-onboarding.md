# Onboarding Redesign

## Current State
- White background
- Minimal brutalist style
- 7-Act structure (good, keep it)
- Scan lines overlay (keep it)

## New Design

### Theme
- **Dark mode base** (`#0D0D0D`)
- **Orange accent** for progress, buttons, focus states
- **Scan lines** overlay (keep, adjust opacity for dark mode)
- **Subtle gamification hints** - building toward dashboard reveal

---

## Layout Structure

```
┌──────────────────────────────────────────────────┐
│  [Progress Bar]                    [Act 2/7] Exit│
├──────────────────────────────────────────────────┤
│                                                  │
│                                                  │
│              [ MAIN CONTENT ]                    │
│                                                  │
│                                                  │
│                                                  │
│              [ ACTION / INPUT ]                  │
│                                                  │
│              [ CONTINUE BUTTON ]                 │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Header Bar

**Current:** Black on white, minimal
**New:**
- Background: `bg-secondary` (slightly elevated)
- Progress bar: Orange fill on dark track
- Step counter: Muted text
- Exit button: Ghost style, muted

```css
/* Progress bar */
.progress-track {
  background: var(--bg-tertiary);
  height: 4px;
}

.progress-fill {
  background: var(--accent-primary);
  box-shadow: 0 0 8px var(--accent-glow);
}
```

---

## Step Types Redesign

### 1. Act Headers

**Purpose:** Dramatic pause between acts

```
┌──────────────────────────────────────────────────┐
│                                                  │
│                    ACT 2                         │
│                ─────────────                     │
│              FUTURE YOU                          │
│           Who do you want to be?                 │
│                                                  │
│                  [TAP TO BEGIN]                  │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Specs:**
- Full screen dark background
- Act number: Large, orange
- Title: Bold display font, white
- Subtitle: Muted gray
- Scan lines more prominent here
- Tap anywhere to continue

---

### 2. Commentary Steps

**Purpose:** Future self speaking

```
┌──────────────────────────────────────────────────┐
│                                                  │
│                                                  │
│              "Yo. It's me."                      │
│                                                  │
│              "You. From the future."             │
│                                                  │
│                     ▼                            │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Specs:**
- Typewriter effect for text reveal
- Text: White, large
- Quotes feel personal, conversational
- Down arrow or tap to continue
- Consider subtle voice wave animation

---

### 3. Input Steps

**Purpose:** User enters text (name, goals, etc.)

```
┌──────────────────────────────────────────────────┐
│                                                  │
│           What's your name?                      │
│                                                  │
│       ┌──────────────────────────┐               │
│       │ Your name                │               │
│       └──────────────────────────┘               │
│                                                  │
│              [ CONFIRM ]                         │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Specs:**
- Label: Large, white, centered
- Input field:
  - Background: `bg-secondary`
  - Border-bottom: `3px solid accent-primary`
  - Focus: Glow effect
  - Text: Large, white
- Button: Primary orange

---

### 4. Choice Steps (Single Select)

**Purpose:** Pick one option

```
┌──────────────────────────────────────────────────┐
│                                                  │
│     When do you usually give up?                 │
│                                                  │
│     ┌────────────────────────────────┐           │
│     │ Day 1-3 - never really start   │           │
│     └────────────────────────────────┘           │
│     ┌────────────────────────────────┐           │
│     │ First week - excitement fades  │           │
│     └────────────────────────────────┘           │
│     ┌────────────────────────────────┐           │
│     │ First month - life gets busy   │  ← hover │
│     └────────────────────────────────┘           │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Specs:**
- Options as cards
- Default: `bg-secondary`, subtle border
- Hover: Orange border, slight lift
- Selected: Orange background, white text
- Auto-advance on selection (after brief delay)

---

### 5. Multi-Select Steps

**Purpose:** Pick multiple options

```
┌──────────────────────────────────────────────────┐
│                                                  │
│     Who have you let down by quitting?           │
│                                                  │
│     ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│     │ Myself ✓ │ │ Family ✓ │ │ Partner  │      │
│     └──────────┘ └──────────┘ └──────────┘      │
│     ┌──────────┐ ┌──────────┐                    │
│     │ Friends  │ │ Everyone │                    │
│     └──────────┘ └──────────┘                    │
│                                                  │
│              [ CONTINUE ]                        │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Specs:**
- Grid layout (2-3 columns on mobile)
- Unselected: Dark border
- Selected: Orange fill, checkmark
- Require at least 1 selection
- Manual continue button

---

### 6. Slider Steps

**Purpose:** Rate something on a scale

```
┌──────────────────────────────────────────────────┐
│                                                  │
│     How desperate are you to change?             │
│                                                  │
│              ├────────●────────┤                 │
│              1                 10                │
│                                                  │
│                     7                            │
│                                                  │
│              [ CONFIRM ]                         │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Specs:**
- Track: Dark gray
- Fill: Orange gradient
- Thumb: Orange circle with glow
- Value display: Large number below

---

### 7. Stepper Steps

**Purpose:** Pick a number (times tried, etc.)

```
┌──────────────────────────────────────────────────┐
│                                                  │
│     How many times have you tried to change?     │
│                                                  │
│              [ - ]    12    [ + ]                │
│                                                  │
│              [ NEXT ]                            │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Specs:**
- Large number display
- +/- buttons with orange borders
- Haptic feedback on increment

---

### 8. Voice Recording Steps

**Purpose:** Record voice commitment

```
┌──────────────────────────────────────────────────┐
│                                                  │
│           Now say it out loud.                   │
│     "Speak clearly - we'll use this to          │
│      create your future self's voice."           │
│                                                  │
│              ┌─────────────┐                     │
│              │             │                     │
│              │    ● REC    │  ← Pulsing         │
│              │   0:15      │     recording      │
│              │   ▂▃▅▇▅▃▂   │                     │
│              └─────────────┘                     │
│                                                  │
│           Min 15 seconds │ Tap to stop          │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Specs:**
- Recording button: Large circle
  - Idle: Orange border
  - Recording: Red fill, pulsing
- Timer display
- Voice visualization: Orange bars
- Minimum duration indicator

---

### 9. Pillar Selection

**Purpose:** Choose life areas to focus on

```
┌──────────────────────────────────────────────────┐
│                                                  │
│     Pick what YOU want to change.                │
│     (Choose 2-5 pillars)                         │
│                                                  │
│     ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│     │ 🏋️  │ │ 🧠   │ │ 💼   │ │ ❤️   │        │
│     │Health│ │Mind  │ │Career│ │Relat.│        │
│     └──────┘ └──────┘ └──────┘ └──────┘        │
│     ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│     │ 💰   │ │ 🎯   │ │ 🎨   │ │ ➕   │        │
│     │Money │ │Focus │ │Create│ │Custom│        │
│     └──────┘ └──────┘ └──────┘ └──────┘        │
│                                                  │
│              [ CONTINUE ] (3 selected)           │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Specs:**
- Grid of pillar cards (4 columns desktop, 2 mobile)
- Each card:
  - Icon (emoji or custom)
  - Label
  - Unselected: Dark, subtle
  - Selected: Orange border, slight scale up
- Counter shows selection count
- Validate 2-5 pillars

---

### 10. Time Selection

**Purpose:** Set call time

```
┌──────────────────────────────────────────────────┐
│                                                  │
│     What time works best?                        │
│     "When are you most real with yourself?"      │
│                                                  │
│              ┌────────────────┐                  │
│              │     21:00      │                  │
│              └────────────────┘                  │
│                                                  │
│              [ SET ]                             │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Specs:**
- Native time picker styled dark
- Large display
- Defaults to 9 PM

---

### 11. Commitment Card

**Purpose:** Summary before final step

```
┌──────────────────────────────────────────────────┐
│                                                  │
│           YOUR COMMITMENT                        │
│                                                  │
│     ┌────────────────────────────────┐           │
│     │                                │           │
│     │  Name: Alex                    │           │
│     │  Identity: "I'm the type of    │           │
│     │   person who shows up daily"   │           │
│     │                                │           │
│     │  Pillars:                      │           │
│     │   🏋️ Health • 🧠 Mind • 💼 Work│           │
│     │                                │           │
│     │  Call Time: 9:00 PM            │           │
│     │                                │           │
│     └────────────────────────────────┘           │
│                                                  │
│              [ I ACCEPT ]                        │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Specs:**
- Card: Orange border, dark background
- Summary of key data points
- "I Accept" button is final commitment
- Consider adding signature/oath feeling

---

### 12. Final Loader

**Purpose:** Building anticipation

```
┌──────────────────────────────────────────────────┐
│                                                  │
│        Creating your future self...              │
│                                                  │
│        ████████████░░░░░░░░░░░░ 60%             │
│                                                  │
│        "Your brain forms new neural             │
│         pathways in just 21 days..."            │
│                                                  │
│                 ● ● ●                            │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Specs:**
- Progress bar: Orange fill with glow
- Rotating fun facts
- Subtle loading animation
- Auto-redirect after ~5 seconds

---

## Gamification Hints

Throughout onboarding, subtly hint at the game:

1. **Progress feels like leveling** - Progress bar gains momentum
2. **Act transitions feel like chapters** - Dramatic pauses
3. **Voice recordings feel powerful** - "This will be YOUR weapon"
4. **Pillar selection feels like character creation** - Building your avatar

---

## Transitions

- Between steps: Fade out → Fade in (500ms)
- Act headers: Dramatic pause with sound
- Audio cue on each step (binaural burst - already exists)

---

## Mobile Optimizations

- Full-width inputs
- Bottom-anchored buttons
- Larger touch targets
- Simplified voice visualization
- Stack pillar grid 2-wide
