# Dashboard Redesign

## Current State
- White background
- Basic stats display
- Pillars shown but not gamified
- Streak card exists but minimal

## New Design

### Theme
- **Dark mode base** (`#0D0D0D`)
- **Gradient backgrounds** - Depth and dimension throughout
- **Full gamification** - Trust rings, levels, achievements
- **Orange accent** throughout
- **Mobile-first** layout

---

## Page Background

```css
.dashboard {
  /* Base dark with subtle orange radial from top-left */
  background: 
    radial-gradient(
      ellipse 60% 40% at 0% 0%,
      rgba(249, 115, 22, 0.08) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse 40% 60% at 100% 100%,
      rgba(249, 115, 22, 0.05) 0%,
      transparent 50%
    ),
    linear-gradient(
      180deg,
      #0D0D0D 0%,
      #080808 100%
    );
  min-height: 100vh;
}
```

---

## Key Gamification Elements

### 1. Trust Score Ring
Central visual showing overall progress (0-100).

```
         ╭───────────╮
        ╱             ╲
       │      73       │
       │   CHAMPION    │
       │    Level 5    │
        ╲             ╱
         ╰───────────╯
```

### 2. Level System
| Level | Trust | Name | Color | Description |
|-------|-------|------|-------|-------------|
| 1 | 0-20 | Drifter | Gray | "Just arrived. Lost but searching." |
| 2 | 21-35 | Initiate | Bronze | "You've begun. The path is forming." |
| 3 | 36-50 | Builder | Silver | "Brick by brick. You're building." |
| 4 | 51-65 | Warrior | Gold | "Tested by fire. Still standing." |
| 5 | 66-80 | Champion | Amber | "Transformed. Others look up to you." |
| 6 | 81-100 | Legend | Platinum | "Unstoppable. You ARE your future self." |

### 3. Narrative Arc Badge
Shows current story phase based on day count.

| Days | Arc | Feeling |
|------|-----|---------|
| 1-7 | Early Struggle | "The beginning is always hard." |
| 8-21 | Building Momentum | "You're finding your rhythm." |
| 22-45 | Tested | "Life is testing you. Stay strong." |
| 46+ | Transformed | "You've changed. This is who you are." |

---

## Layout Structure

### Mobile (Default)

```
┌──────────────────────────────────────┐
│  You+              [⚙️] [🚪]         │
├──────────────────────────────────────┤
│                                      │
│        ╭─────────────────╮           │
│       ╱                   ╲          │
│      │        73          │          │
│      │     CHAMPION       │          │
│      │      Level 5       │          │
│       ╲                   ╱          │
│        ╰─────────────────╯           │
│                                      │
│   🔥 12 Day Streak                   │
│   "Don't break the chain."           │
│                                      │
├──────────────────────────────────────┤
│  NEXT CALL IN                        │
│  ┌────────────────────────────────┐  │
│  │   05h : 23m : 47s              │  │
│  │   Tonight at 9:00 PM           │  │
│  └────────────────────────────────┘  │
│                                      │
├──────────────────────────────────────┤
│  YOUR PILLARS (4 Active)             │
│                                      │
│  ┌─────────┐  ┌─────────┐           │
│  │ 🏋️ 78%  │  │ 🧠 65%  │           │
│  │ Health  │  │ Mind    │           │
│  │ ■■■■░   │  │ ■■■░░   │           │
│  └─────────┘  └─────────┘           │
│  ┌─────────┐  ┌─────────┐           │
│  │ 💼 82%  │  │ ❤️ 55%  │           │
│  │ Career  │  │ Relat.  │           │
│  │ ■■■■░   │  │ ■■░░░   │           │
│  └─────────┘  └─────────┘           │
│                                      │
├──────────────────────────────────────┤
│  THE RECORD                          │
│                                      │
│  Total Calls    Trust Score          │
│      47             73%              │
│                                      │
│  Longest Streak  Current Arc         │
│      21 days     TESTED              │
│                                      │
└──────────────────────────────────────┘
```

### Desktop (2-3 Column)

```
┌────────────────────────────────────────────────────────────────┐
│  You+   "I'm the type of person who..."         [⚙️] [🚪]     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Welcome back,                                                │
│   ALEX                                                         │
│                                                                │
│   ┌─────────────────────────────────────┐  ┌─────────────────┐│
│   │  NEXT CALL IN                       │  │                 ││
│   │                                     │  │       73        ││
│   │    05h : 23m : 47s                  │  │    CHAMPION     ││
│   │    Tonight at 9:00 PM               │  │     Level 5     ││
│   │                                     │  │                 ││
│   └─────────────────────────────────────┘  │   🔥 12 days    ││
│                                            │   "On fire!"    ││
│   THE RECORD                               └─────────────────┘│
│   ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│   │ 47       │ │ 73%      │ │ 21       │                      │
│   │ Calls    │ │ Trust    │ │ Best     │                      │
│   └──────────┘ └──────────┘ └──────────┘                      │
│                                                                │
│   YOUR PILLARS (4 Active)                                      │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│   │ 🏋️ 78%   │ │ 🧠 65%   │ │ 💼 82%   │ │ ❤️ 55%   │         │
│   │ Health   │ │ Mind     │ │ Career   │ │ Relat.   │         │
│   │ Primary  │ │ 5 days   │ │ 8 days   │ │ 3 days   │         │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Header Bar

```
┌──────────────────────────────────────────────────┐
│  You+   "I'm the type of person who..."  ⚙️  🚪 │
└──────────────────────────────────────────────────┘
```

**Specs:**
- Sticky at top
- Background: `bg-secondary`
- Border-bottom: Orange
- Logo: Bold
- Identity quote: Muted, truncated on mobile
- Settings: Ghost button
- Logout: Red tint

---

### 2. Trust Score Hero

The centerpiece of the dashboard.

```
        ╭───────────────────╮
       ╱    ┌─────────┐      ╲
      │     │   73    │       │
      │     │ CHAMPION│       │
      │     │ Level 5 │       │
       ╲    └─────────┘      ╱
        ╰───────────────────╯
```

**Background Container:**
```css
.trust-hero {
  /* Spotlight glow behind the ring */
  background: radial-gradient(
    circle at 50% 50%,
    rgba(249, 115, 22, 0.15) 0%,
    rgba(249, 115, 22, 0.05) 30%,
    transparent 60%
  );
  padding: 40px;
}
```

**Specs:**
- SVG circular progress ring
- Ring color: Level-specific gradient (e.g., `gradient-level-5` for Champion)
- Ring glow: `filter: drop-shadow()` with level color
- Center content:
  - Large number (trust score)
  - Level name
  - "Level X" subtitle
- Animation: Ring fills on load with easing
- Level up: Dramatic animation + celebration + particles

```css
.trust-ring {
  stroke: url(#level-gradient); /* SVG gradient */
  stroke-width: 8px;
  stroke-linecap: round;
  filter: drop-shadow(0 0 15px var(--accent-glow));
}

/* Level-specific ring gradients */
#level-5-gradient {
  /* Champion - Amber fire */
  stop[offset="0%"] { stop-color: #FB923C; }
  stop[offset="50%"] { stop-color: #F97316; }
  stop[offset="100%"] { stop-color: #EA580C; }
}
```

---

### 3. Streak Card

```
┌────────────────────────────────┐
│  🔥  12 Days                   │
│  Current Streak                │
│                                │
│  "You're on fire. Don't stop." │
│                                │
│  Best: 21 days                 │
└────────────────────────────────┘
```

**Background Variants:**
```css
/* Default (0-6 days) */
.streak-card {
  background: var(--gradient-card);
  border: 2px solid var(--accent-primary);
}

/* On Fire (7-29 days) */
.streak-card.on-fire {
  background: var(--gradient-fire);
  /* Orange to red gradient */
  box-shadow: 0 0 30px rgba(249, 115, 22, 0.3);
}

/* Inferno (30-99 days) */
.streak-card.inferno {
  background: var(--gradient-inferno);
  /* Yellow to orange to deep red */
  box-shadow: 0 0 40px rgba(249, 115, 22, 0.4);
}

/* Legendary (100+ days) */
.streak-card.legendary {
  background: var(--gradient-legendary);
  /* White/gold glow */
  box-shadow: 0 0 50px rgba(253, 224, 71, 0.4);
}
```

**Specs:**
- Fire emoji with flicker animation
- Large number display
- Motivational message based on streak length
- Best streak shown below
- Gradient intensifies with streak length

**Streak Messages:**
- 0: "Complete your first call to start."
- 1-6: "Don't break the chain."
- 7-13: "You're on fire. Don't stop."
- 14-29: "Two weeks strong. Keep pushing."
- 30-99: "Legendary status approaching."
- 100+: "You ARE your future self."

---

### 4. Timer Card

```
┌────────────────────────────────────────┐
│  NEXT CALL IN                          │
│                                        │
│     05h : 23m : 47s                    │
│                                        │
│  Tonight at 9:00 PM                    │
└────────────────────────────────────────┘
```

**Specs:**
- Dark card with orange border
- Countdown timer: Large monospace font
- Real-time updates every second
- Time label below (relative: "Tonight", "Tomorrow")

---

### 5. Pillar Cards

Each pillar shows individual progress.

```
┌──────────────────┐
│  🏋️  Health      │
│  ─────────────   │
│  Trust: 78%      │
│  ■■■■░░░░░░      │
│                  │
│  🔥 5 day streak │
│  "I am someone   │
│   who shows up"  │
│                  │
│  [PRIMARY]       │
└──────────────────┘
```

**Background:**
```css
.pillar-card {
  background: var(--gradient-card);
  border: 2px solid var(--border-default);
  transition: all 0.3s ease-out;
}

.pillar-card:hover {
  border-color: var(--accent-primary);
  background: var(--gradient-card-accent);
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(249, 115, 22, 0.15);
}

.pillar-card.primary {
  border-color: var(--accent-primary);
  background: 
    linear-gradient(
      135deg,
      rgba(249, 115, 22, 0.1) 0%,
      rgba(249, 115, 22, 0.02) 100%
    );
  box-shadow: var(--shadow-brutal-md);
}
```

**Specs:**
- Card: Gradient background with subtle accent tint
- Shadow: Orange brutal shadow on primary
- Icon: Large emoji
- Trust bar with gradient fill based on level
- Streak indicator with fire if active
- Identity statement (if set)
- Primary badge for main pillar

**Trust Bar Gradient:**
```css
.trust-bar-fill {
  /* Gradient based on percentage */
  background: linear-gradient(
    90deg,
    var(--accent-muted) 0%,
    var(--accent-primary) 100%
  );
}
```

---

### 6. Stats Grid

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│     47      │ │    73%      │ │     21      │
│ Total Calls │ │ Trust Score │ │ Best Streak │
└─────────────┘ └─────────────┘ └─────────────┘
```

**Specs:**
- Grid of stat cards
- Large number
- Label below
- Subtle border

---

### 7. Narrative Arc Badge

```
┌─────────────────────────┐
│  TESTED                 │
│  Day 28                 │
│  "Life is testing you.  │
│   Stay strong."         │
└─────────────────────────┘
```

**Specs:**
- Positioned with trust ring or stats
- Shows current arc name
- Day count
- Arc-specific message

---

### 8. Assessment Card (Status)

Shows readiness for next call.

```
┌────────────────────────────────┐
│  TODAY'S STATUS                │
│                                │
│  ✓ Ready for tonight's call   │
│                                │
│  Trust Score: 73% (STRONG)     │
└────────────────────────────────┘
```

**Specs:**
- Status indicator (Ready, Pending, etc.)
- Trust level label (Weak, Moderate, Strong)

---

## Animations & Interactions

### Level Up Celebration
When trust score crosses a level threshold:

1. Screen flashes briefly
2. Trust ring pulses and glows
3. Level name animates in
4. Particle effect (optional)
5. Sound effect (optional)

```css
@keyframes level-up {
  0% { transform: scale(1); filter: brightness(1); }
  25% { transform: scale(1.1); filter: brightness(1.3); }
  50% { transform: scale(1.2); filter: brightness(1.5); }
  75% { transform: scale(1.1); filter: brightness(1.3); }
  100% { transform: scale(1); filter: brightness(1); }
}
```

### Streak Fire Animation
When streak >= 7, fire emoji flickers:

```css
@keyframes fire-flicker {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}
```

### Progress Ring Fill
On load, ring animates from 0 to current value:

```css
.trust-ring {
  stroke-dasharray: 283; /* circumference */
  stroke-dashoffset: 283; /* start at 0 */
  animation: fill-ring 1.5s ease-out forwards;
}

@keyframes fill-ring {
  to {
    stroke-dashoffset: calc(283 - (283 * var(--progress) / 100));
  }
}
```

---

## Empty States

### No Calls Yet

```
┌────────────────────────────────────────┐
│                                        │
│       🌅 Your Journey Begins           │
│                                        │
│    Complete your first call tonight    │
│    to start tracking your progress.    │
│                                        │
│         Trust Score: --                │
│         Level: Drifter (0)             │
│                                        │
└────────────────────────────────────────┘
```

### No Pillars Set

```
┌────────────────────────────────────────┐
│                                        │
│       🧭 Define Your Focus             │
│                                        │
│    Complete onboarding to set up       │
│    your pillars and get personalized   │
│    coaching.                           │
│                                        │
│         [Complete Onboarding]          │
│                                        │
└────────────────────────────────────────┘
```

---

## Overlays

### Subscription Required

```
┌────────────────────────────────────────┐
│ (Blurred dashboard behind)             │
│                                        │
│    ┌──────────────────────────────┐    │
│    │                              │    │
│    │     ⚠️ Subscription Required │    │
│    │                              │    │
│    │   Unlock your potential with │    │
│    │   You+ Pro.                  │    │
│    │                              │    │
│    │      [ Subscribe Now ]       │    │
│    │                              │    │
│    └──────────────────────────────┘    │
│                                        │
└────────────────────────────────────────┘
```

**Specs:**
- Backdrop: Blur + dark overlay
- Card: Centered, orange border
- Warning icon
- CTA button

---

## Mobile Optimizations

- Trust ring: Smaller but still prominent
- Pillar grid: 2 columns
- Stats: Horizontal scroll or 2x2 grid
- Timer: Full width
- Bottom safe area padding
