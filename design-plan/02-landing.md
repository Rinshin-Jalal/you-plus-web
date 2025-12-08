# Landing Page Redesign

## Current State
- White background, black text
- Minimalist brutalist style
- Strong copy but visuals don't match the intensity

## New Design

### Theme
- **Dark mode base** (`#0D0D0D`)
- **Orange accent** for CTAs, borders, shadows
- **Gradients everywhere** - depth, dimension, never flat
- **Scan lines** overlay on hero and key sections
- **Brutalist elements** with orange shadows instead of black

---

## Page-Level Background

The entire page uses a layered gradient approach:

```css
body {
  background: var(--gradient-page);
  /* radial orange glow from top + dark base */
}
```

Each section adds its own gradient layer for visual interest and depth.

---

## Section-by-Section Breakdown

### 1. Navigation (Sticky)

```
┌──────────────────────────────────────────────────┐
│  You+                                    [Login] │
│  ─────────────────────────────────────────────── │
└──────────────────────────────────────────────────┘
```

**Specs:**
- Background: `bg-primary` with slight transparency
- Border-bottom: `2px solid accent-primary`
- Logo: Bold, can add subtle fire/glow effect
- Login button: Ghost style with orange border on hover

---

### 2. Hero Section

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  [FOR PEOPLE WHO ARE DONE WITH THEIR OWN BS]    │
│                                                  │
│  I get a call every night                        │
│  from my future self.                            │
│                                                  │
│  It's the only thing that's kept me consistent.  │
│                                                  │
│  [START YOUR FIRST CALL →]   ● 2,847 this week  │
│                                                  │
│           ┌─────────────────┐                    │
│           │  INCOMING CALL  │  ← Phone mockup   │
│           │  "Did you do    │     with orange   │
│           │   what you      │     accents       │
│           │   said?"        │                    │
│           └─────────────────┘                    │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Background:**
```css
.hero {
  background: var(--gradient-hero);
  /* Dramatic orange glow from top, fades to dark */
  position: relative;
}

.hero::before {
  /* Additional mesh gradient for organic feel */
  content: '';
  position: absolute;
  inset: 0;
  background: var(--gradient-mesh);
  opacity: 0.5;
}
```

**Specs:**
- Background: `gradient-hero` (radial orange glow from top)
- Additional mesh gradient layer for organic depth
- Badge: Orange border, uppercase tracking
- Headline: White text, bold display font
- CTA Button: 
  - Background: `gradient-button-fire` (animated fire gradient)
  - Text: Dark (for contrast)
  - Shadow: `6px 6px 0px` orange (lighter shade)
  - Hover: Shadow disappears, translate, gradient intensifies
- Phone mockup:
  - Background: `gradient-card-elevated`
  - Orange border (`2px solid accent-primary`)
  - Orange shadow with glow effect
  - Voice visualization bars in orange gradient

---

### 3. The Problem Section

```
┌──────────────────────────────────────────────────┐
│  You know the cycle.                             │
│                                                  │
│  ├─ Sunday night motivation                      │
│  │  "This week is going to be different..."     │
│  │                                               │
│  ├─ Monday reality                               │
│  │  Snoozed. Skipped. Scrolled until 2am.       │
│  │                                               │
│  └─ The guilt spiral                             │
│     You're not lazy. You just lie to yourself.  │
│                                                  │
│  ✕ Productivity apps - abandoned                 │
│  ✕ Habit trackers - broke streak, deleted       │
│  ✕ Accountability partners - got busy           │
│  ✕ Journaling - blank pages                      │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Background:**
```css
.problem-section {
  background: var(--gradient-section-dark);
  /* Subtle variation from hero for visual separation */
  position: relative;
}

.problem-section::before {
  /* Subtle red/danger tint to emphasize pain */
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 60% 40% at 30% 50%,
    rgba(239, 68, 68, 0.08) 0%,
    transparent 60%
  );
}
```

**Specs:**
- Background: `gradient-section-dark` with subtle red radial tint
- Left border on cycle items: `danger` color (red)
- X marks: `danger` color with subtle glow
- Text hierarchy: Bold labels, muted descriptions
- Cards: `gradient-card` background
- Consider adding subtle animation on scroll (fade in)

---

### 4. The Insight Section ("What you can't lie to")

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  What you can lie to:           What you can't: │
│                                                  │
│  ✕ Apps & notifications         ┌─────────────┐ │
│  ✕ Checkboxes & streaks         │ 🎤          │ │
│  ✕ The voice in your head       │ YOUR OWN    │ │
│                                  │ VOICE       │ │
│                                  └─────────────┘ │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Background:**
```css
.insight-section {
  background: var(--gradient-spotlight);
  /* Spotlight on the featured card */
}
```

**Specs:**
- Split layout on desktop
- Background: Spotlight gradient focused on right side
- Left side: Muted, strikethrough, gray
- Right side: Featured card
  - Background: `gradient-button-fire` (full fire gradient)
  - Text: Dark for contrast
  - Large microphone icon
  - Strong shadow with glow
  - Subtle pulse animation on idle

---

### 5. How It Works (3 Steps)

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  How it actually works                           │
│                                                  │
│  ┌──────┐  ┌──────┐  ┌──────────┐               │
│  │  1   │  │  2   │  │    3     │               │
│  │ DAY  │  │NIGHT │  │ TOMORROW │               │
│  │      │  │      │  │          │               │
│  │ The  │  │ The  │  │ Set new  │               │
│  │weight│  │audit │  │ goals    │               │
│  └──────┘  └──────┘  └──────────┘               │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Background:**
```css
.steps-section {
  background: linear-gradient(
    180deg,
    #0A0A0A 0%,
    #0D0D0D 100%
  );
  position: relative;
}

.steps-section::before {
  /* Subtle orange glow behind cards */
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 60%;
  background: radial-gradient(
    ellipse at center,
    rgba(249, 115, 22, 0.08) 0%,
    transparent 70%
  );
}
```

**Specs:**
- 3-column grid (stacks on mobile)
- Cards: 
  - Background: `gradient-card` (subtle inner highlight)
  - Orange borders
  - Hover: lift + glow effect
- Step numbers: Large, in orange gradient squares
- Third card: Inverted (fire gradient bg, dark text) to emphasize action
- Staggered animation on scroll

---

### 6. Features Grid

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐            │
│  │ 🎤  │  │ 📞  │  │ 🧠  │  │ 📊  │            │
│  │VOICE│  │REAL │  │ AI  │  │WEEKLY│            │
│  │FIRST│  │CALLS│  │MEM. │  │AUDIT │            │
│  └─────┘  └─────┘  └─────┘  └─────┘            │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Specs:**
- 2x2 grid on mobile, 4-column on desktop
- Icon boxes with orange borders
- Last card: Orange background (accent)
- Simple, clean icons

---

### 7. "Is This You?" Section

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  Is this you?                                    │
│                                                  │
│  ✓ Said "I'll start Monday" too many times      │
│  ✓ Know what to do, just don't do it            │
│  ✓ Downloaded apps, abandoned them all          │
│  ✓ Lost trust in your own word                   │
│                                                  │
│              ┌─────────────────┐                 │
│              │ WEEK 3 AUDIT    │                 │
│              │ M T W T F S S   │                 │
│              │ ✓ ✓ ✓ ✓ ✓ ✕ ✓   │                 │
│              │ 83% kept        │                 │
│              │ 12 day streak   │                 │
│              └─────────────────┘                 │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Specs:**
- Checklist items: Orange checkmarks
- Audit mockup card: Shows gamification preview
  - Week grid with green/red indicators
  - Stats displayed prominently
  - Hint at the dashboard experience

---

### 8. CTA + Pricing

```
┌──────────────────────────────────────────────────┐
│                                                  │
│   THE CALL           │     ┌─────────────────┐  │
│   IS COMING.         │     │  $6.99/week     │  │
│                      │     │                 │  │
│   Tonight at 9pm,    │     │  ✓ Nightly calls│  │
│   your phone rings.  │     │  ✓ AI memory    │  │
│                      │     │  ✓ Weekly audits│  │
│   [ANSWER THE CALL]  │     │                 │  │
│                      │     │ [START TRIAL]   │  │
│                      │     └─────────────────┘  │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Background:**
```css
.cta-section {
  /* Dramatic gradient with multiple layers */
  background: 
    radial-gradient(
      ellipse 80% 60% at 20% 50%,
      rgba(249, 115, 22, 0.2) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse 60% 80% at 80% 50%,
      rgba(249, 115, 22, 0.15) 0%,
      transparent 50%
    ),
    linear-gradient(
      180deg,
      #0A0A0A 0%,
      #080808 100%
    );
}
```

**Specs:**
- Split layout: CTA left, pricing right
- Background: Multi-layer radial gradients for depth
- CTA side:
  - Large text with subtle text gradient on "THE CALL"
  - Button: Fire gradient with animated shimmer
- Pricing card:
  - Background: `gradient-card-glass` (frosted effect)
  - Orange border with glow
  - Large price with gradient text
  - Checkmarks in orange
  - CTA button matches main CTA style

---

### 9. FAQ

**Specs:**
- Simple accordion or stacked Q&A
- Question: Bold, white
- Answer: Muted gray
- Divider lines between items

---

### 10. Final CTA + Footer

```
┌──────────────────────────────────────────────────┐
│                                                  │
│        Stop lying to yourself.                   │
│        The call is coming.                       │
│                                                  │
│        [START YOUR FIRST CALL →]                │
│                                                  │
├──────────────────────────────────────────────────┤
│  You+        Contact | Terms | Privacy          │
└──────────────────────────────────────────────────┘
```

**Specs:**
- Centered, minimal
- Large CTA
- Footer: Muted links, simple layout

---

## Mobile Considerations

- Stack all columns vertically
- Reduce font sizes slightly
- Full-width buttons
- Increase touch targets (min 44px)
- Simplify phone mockup in hero

---

## Animations

1. **Hero text**: Fade in on load
2. **Problem items**: Stagger fade in on scroll
3. **Step cards**: Slide up on scroll
4. **CTA buttons**: Subtle pulse on idle
5. **Phone mockup**: Voice bars animate continuously
