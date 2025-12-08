# Component Library Changes

## Overview

All components need to be updated from white/black theme to dark/orange theme while maintaining the brutalist DNA.

---

## Core Components

### 1. Button (`Button.tsx`)

**Current:** Black on white, or white on black
**New:** Orange accent with brutal shadows

#### Variants

```tsx
// Primary - Main CTA
<Button variant="primary">Start Now</Button>
// Orange bg, dark text, orange shadow

// Secondary - Less emphasis
<Button variant="secondary">Learn More</Button>
// Dark bg, orange border, orange text

// Ghost - Minimal
<Button variant="ghost">Cancel</Button>
// Transparent, orange text on hover

// Danger - Destructive
<Button variant="danger">Delete</Button>
// Red accent
```

#### Specs

```css
/* Primary */
.btn-primary {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border: 3px solid var(--accent-primary);
  box-shadow: 4px 4px 0px 0px var(--accent-secondary);
  font-family: var(--font-mono);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 24px;
}

.btn-primary:hover {
  box-shadow: none;
  transform: translate(4px, 4px);
}

.btn-primary:disabled {
  background: var(--bg-tertiary);
  border-color: var(--bg-tertiary);
  color: var(--text-muted);
  box-shadow: none;
}

/* Secondary */
.btn-secondary {
  background: var(--bg-secondary);
  color: var(--accent-primary);
  border: 3px solid var(--accent-primary);
  box-shadow: 4px 4px 0px 0px rgba(249,115,22,0.3);
}

.btn-secondary:hover {
  background: var(--accent-primary);
  color: var(--bg-primary);
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: none;
}

.btn-ghost:hover {
  color: var(--accent-primary);
}
```

---

### 2. Card (`Card.tsx`)

**Current:** White bg, black border
**New:** Dark bg, orange border, orange shadow

#### Variants

```tsx
// Default
<Card>Content</Card>

// Elevated - More prominent
<Card variant="elevated">Content</Card>

// Accent - Orange themed
<Card variant="accent">Content</Card>

// Status cards
<Card variant="success">Content</Card>
<Card variant="warning">Content</Card>
<Card variant="danger">Content</Card>
```

#### Specs

```css
/* Default */
.card {
  background: var(--bg-secondary);
  border: 2px solid var(--border-accent);
  box-shadow: var(--shadow-brutal-md);
  padding: 20px;
}

.card:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-brutal-lg);
}

/* Elevated */
.card-elevated {
  background: var(--bg-tertiary);
  box-shadow: var(--shadow-brutal-lg);
}

/* Accent */
.card-accent {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border-color: var(--accent-secondary);
}
```

---

### 3. Input / MegaInput

**Current:** White bg, black border-bottom
**New:** Dark bg, orange border-bottom, glow on focus

```css
.input {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: none;
  border-bottom: 3px solid var(--border-default);
  padding: 16px;
  font-family: var(--font-mono);
  font-size: 1.5rem;
}

.input:focus {
  border-bottom-color: var(--accent-primary);
  box-shadow: 0 4px 12px var(--accent-glow);
  outline: none;
}

.input::placeholder {
  color: var(--text-muted);
}

/* Mega variant (onboarding) */
.input-mega {
  font-size: 2.5rem;
  text-align: center;
  border-bottom-width: 4px;
}
```

---

### 4. GrainOverlay (Scan Lines)

**Current:** Works on white
**New:** Adjust for dark mode

```tsx
// Keep scan lines, adjust blend mode for dark
export const GrainOverlay = () => (
  <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'linear-gradient(rgba(255,255,255,0) 50%, rgba(255,255,255,0.02) 50%)',
        backgroundSize: '100% 4px',
        mixBlendMode: 'overlay',
        opacity: 0.3
      }}
    />
  </div>
);
```

---

### 5. Progress Bar

**Current:** Black fill on gray track
**New:** Orange fill with glow

```css
.progress-track {
  background: var(--bg-tertiary);
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  height: 100%;
  border-radius: 3px;
  box-shadow: 0 0 10px var(--accent-glow);
  transition: width 0.5s ease-out;
}
```

---

### 6. Choice/Option Cards

**Current:** Black border, black fill on select
**New:** Orange border, orange fill on select

```css
.choice-card {
  background: var(--bg-secondary);
  border: 2px solid var(--border-default);
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.choice-card:hover {
  border-color: var(--accent-primary);
  transform: translateY(-2px);
}

.choice-card.selected {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--bg-primary);
  box-shadow: var(--shadow-brutal-sm);
}
```

---

### 7. Voice Visualizer

**Current:** Black bars
**New:** Orange bars with glow

```css
.voice-bar {
  background: var(--accent-primary);
  width: 3px;
  border-radius: 2px;
  box-shadow: 0 0 6px var(--accent-glow);
  animation: voice-pulse 0.5s ease-in-out infinite alternate;
}

@keyframes voice-pulse {
  from { opacity: 0.6; }
  to { opacity: 1; }
}
```

---

### 8. Counter/Stepper

**Current:** Black buttons
**New:** Orange bordered buttons

```css
.stepper-btn {
  width: 48px;
  height: 48px;
  background: var(--bg-secondary);
  border: 2px solid var(--accent-primary);
  color: var(--accent-primary);
  font-size: 1.5rem;
  font-weight: bold;
}

.stepper-btn:hover {
  background: var(--accent-primary);
  color: var(--bg-primary);
}

.stepper-value {
  font-size: 4rem;
  font-weight: bold;
  color: var(--text-primary);
  font-family: var(--font-display);
}
```

---

### 9. Slider

**Current:** Black thumb, gray track
**New:** Orange thumb with glow, dark track

```css
.slider-track {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.slider-fill {
  background: linear-gradient(90deg, var(--accent-muted), var(--accent-primary));
  border-radius: 4px;
}

.slider-thumb {
  width: 24px;
  height: 24px;
  background: var(--accent-primary);
  border: 3px solid var(--text-primary);
  border-radius: 50%;
  box-shadow: 0 0 12px var(--accent-glow);
  cursor: grab;
}

.slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.1);
}
```

---

## New Components Needed

### 1. TrustRing

Circular progress indicator for trust score.

```tsx
interface TrustRingProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLevel?: boolean;
  animated?: boolean;
}

<TrustRing score={73} size="lg" showLevel />
```

---

### 2. LevelBadge

Shows current level with color.

```tsx
interface LevelBadgeProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  showName?: boolean;
}

<LevelBadge level={5} showName />
// Renders: "CHAMPION" with amber color
```

---

### 3. StreakDisplay

Fire streak with animation.

```tsx
interface StreakDisplayProps {
  days: number;
  isOnFire?: boolean; // >= 7 days
}

<StreakDisplay days={12} isOnFire />
```

---

### 4. PillarCard (Enhanced)

Individual pillar with trust mini-ring.

```tsx
interface PillarCardProps {
  pillar: Pillar;
  isPrimary?: boolean;
}

<PillarCard 
  pillar={{ id: 'health', icon: '🏋️', trust: 78, streak: 5 }}
  isPrimary
/>
```

---

### 5. NarrativeArcBadge

Shows current story phase.

```tsx
interface NarrativeArcBadgeProps {
  dayCount: number;
}

<NarrativeArcBadge dayCount={28} />
// Renders: "TESTED" badge
```

---

### 6. CountdownTimer

Real-time countdown to next call.

```tsx
interface CountdownTimerProps {
  targetTime: Date;
}

<CountdownTimer targetTime={nextCallTime} />
```

---

## Utility Classes

Add to `globals.css`:

```css
/* Text utilities */
.text-accent { color: var(--accent-primary); }
.text-muted { color: var(--text-muted); }

/* Background utilities */
.bg-primary { background: var(--bg-primary); }
.bg-secondary { background: var(--bg-secondary); }
.bg-accent { background: var(--accent-primary); }

/* Border utilities */
.border-accent { border-color: var(--accent-primary); }
.border-brutal { border-width: 3px; }

/* Shadow utilities */
.shadow-brutal { box-shadow: var(--shadow-brutal-md); }
.shadow-brutal-lg { box-shadow: var(--shadow-brutal-lg); }

/* Glow utilities */
.glow-accent { box-shadow: 0 0 20px var(--accent-glow); }

/* Animation utilities */
.animate-level-up { animation: level-up 0.6s ease-out; }
.animate-fire { animation: fire-flicker 1s ease-in-out infinite; }
.animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
```

---

## Migration Checklist

- [ ] Update `globals.css` with new tokens
- [ ] Update `Button.tsx`
- [ ] Update `Card.tsx`
- [ ] Update `MegaInput.tsx`
- [ ] Update `GrainOverlay.tsx`
- [ ] Update `BrutalChoice.tsx`
- [ ] Update `VoiceVisualizer.tsx`
- [ ] Update `Counter.tsx`
- [ ] Update `MinimalSlider.tsx`
- [ ] Update `ActHeader.tsx`
- [ ] Update `CommentarySection.tsx`
- [ ] Create `TrustRing.tsx`
- [ ] Create `LevelBadge.tsx`
- [ ] Create `StreakDisplay.tsx`
- [ ] Create `NarrativeArcBadge.tsx`
- [ ] Update `Dashboard.tsx`
- [ ] Update `HeroTimer.tsx`
- [ ] Update `PillarGrid.tsx`
- [ ] Update `StatsGrid.tsx`
- [ ] Update `AssessmentCard.tsx`
- [ ] Update landing page
- [ ] Update onboarding flow
