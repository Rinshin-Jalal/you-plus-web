# Design Tokens

## Color System

### Base Colors (Dark Theme)

```css
:root {
  /* Backgrounds */
  --bg-primary: #0D0D0D;       /* Main background */
  --bg-secondary: #1A1A1A;     /* Cards, elevated surfaces */
  --bg-tertiary: #262626;      /* Hover states, subtle borders */
  --bg-elevated: #333333;      /* Modals, dropdowns */

  /* Text */
  --text-primary: #FAFAFA;     /* Main text */
  --text-secondary: #A3A3A3;   /* Muted text */
  --text-muted: #525252;       /* Disabled, placeholder */

  /* Borders */
  --border-default: #333333;   /* Default border */
  --border-strong: #525252;    /* Emphasized border */
  --border-accent: #F97316;    /* Accent border (orange) */
}
```

### Accent Colors (Orange/Amber)

```css
:root {
  --accent-primary: #F97316;           /* Primary actions, streaks, fire */
  --accent-secondary: #FB923C;         /* Hover states */
  --accent-tertiary: #FDBA74;          /* Lighter accent */
  --accent-glow: rgba(249,115,22,0.3); /* Glow effects */
  --accent-muted: #7C2D12;             /* Dark accent for backgrounds */
  --accent-bg: rgba(249,115,22,0.1);   /* Subtle accent background */
}
```

### Status Colors

```css
:root {
  --success: #22C55E;          /* Completed, positive */
  --success-muted: #166534;    /* Dark green background */
  --warning: #EAB308;          /* Caution, moderate */
  --warning-muted: #854D0E;    /* Dark yellow background */
  --danger: #EF4444;           /* Failed, broken streak */
  --danger-muted: #991B1B;     /* Dark red background */
  --info: #3B82F6;             /* Informational */
  --info-muted: #1E40AF;       /* Dark blue background */
}
```

### Level Colors

```css
:root {
  --level-1: #6B7280;  /* Drifter - Gray */
  --level-2: #CD7F32;  /* Initiate - Bronze */
  --level-3: #C0C0C0;  /* Builder - Silver */
  --level-4: #FFD700;  /* Warrior - Gold */
  --level-5: #F97316;  /* Champion - Amber Fire */
  --level-6: #F5F5F5;  /* Legend - Platinum */
}
```

---

## Gradients

Gradients add depth and dimension. Never flat, always alive.

### Background Gradients

```css
:root {
  /* Page backgrounds - subtle depth */
  --gradient-page: radial-gradient(
    ellipse 80% 50% at 50% -20%,
    rgba(249, 115, 22, 0.15) 0%,
    transparent 50%
  ), linear-gradient(
    180deg,
    #0D0D0D 0%,
    #0A0A0A 100%
  );

  /* Hero section - dramatic orange glow from top */
  --gradient-hero: radial-gradient(
    ellipse 100% 80% at 50% -30%,
    rgba(249, 115, 22, 0.25) 0%,
    rgba(249, 115, 22, 0.08) 40%,
    transparent 70%
  ), linear-gradient(
    180deg,
    #0D0D0D 0%,
    #080808 100%
  );

  /* Section alternating - subtle variation */
  --gradient-section-dark: linear-gradient(
    180deg,
    #0A0A0A 0%,
    #0D0D0D 50%,
    #0A0A0A 100%
  );

  /* Spotlight effect - for focus areas */
  --gradient-spotlight: radial-gradient(
    circle at 50% 0%,
    rgba(249, 115, 22, 0.12) 0%,
    transparent 50%
  );
}
```

### Card Gradients

```css
:root {
  /* Default card - subtle inner glow */
  --gradient-card: linear-gradient(
    135deg,
    rgba(26, 26, 26, 1) 0%,
    rgba(20, 20, 20, 1) 100%
  );

  /* Elevated card - more contrast */
  --gradient-card-elevated: linear-gradient(
    145deg,
    rgba(38, 38, 38, 1) 0%,
    rgba(26, 26, 26, 1) 100%
  );

  /* Accent card - orange tinted */
  --gradient-card-accent: linear-gradient(
    135deg,
    rgba(249, 115, 22, 0.15) 0%,
    rgba(249, 115, 22, 0.05) 100%
  );

  /* Glass card - frosted effect */
  --gradient-card-glass: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
}
```

### Interactive Gradients

```css
:root {
  /* Button hover - fire effect */
  --gradient-button-fire: linear-gradient(
    135deg,
    #FB923C 0%,
    #F97316 50%,
    #EA580C 100%
  );

  /* Progress bar - animated fire */
  --gradient-progress: linear-gradient(
    90deg,
    #EA580C 0%,
    #F97316 50%,
    #FB923C 100%
  );

  /* Trust ring glow */
  --gradient-ring-glow: conic-gradient(
    from 0deg,
    #F97316 0%,
    #FB923C 25%,
    #F97316 50%,
    #EA580C 75%,
    #F97316 100%
  );
}
```

### Streak/Fire Gradients

```css
:root {
  /* Streak card on fire (7+ days) */
  --gradient-fire: linear-gradient(
    135deg,
    #F97316 0%,
    #EA580C 30%,
    #DC2626 70%,
    #B91C1C 100%
  );

  /* Intense fire (30+ days) */
  --gradient-inferno: linear-gradient(
    135deg,
    #FBBF24 0%,
    #F97316 25%,
    #DC2626 60%,
    #7F1D1D 100%
  );

  /* Legendary glow (100+ days) */
  --gradient-legendary: linear-gradient(
    135deg,
    #FFFBEB 0%,
    #FEF3C7 20%,
    #FCD34D 50%,
    #F97316 100%
  );
}
```

### Level-Specific Gradients

```css
:root {
  /* Level 1 - Drifter (Gray, muted) */
  --gradient-level-1: linear-gradient(135deg, #4B5563 0%, #374151 100%);
  
  /* Level 2 - Initiate (Bronze, warming up) */
  --gradient-level-2: linear-gradient(135deg, #D97706 0%, #92400E 100%);
  
  /* Level 3 - Builder (Silver, solid) */
  --gradient-level-3: linear-gradient(135deg, #D1D5DB 0%, #9CA3AF 100%);
  
  /* Level 4 - Warrior (Gold, powerful) */
  --gradient-level-4: linear-gradient(135deg, #FDE047 0%, #EAB308 50%, #CA8A04 100%);
  
  /* Level 5 - Champion (Amber fire, intense) */
  --gradient-level-5: linear-gradient(135deg, #FB923C 0%, #F97316 50%, #EA580C 100%);
  
  /* Level 6 - Legend (Platinum/White, transcendent) */
  --gradient-level-6: linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 50%, #E5E5E5 100%);
}
```

### Overlay Gradients

```css
:root {
  /* Dark overlay for modals */
  --gradient-overlay: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0.95) 100%
  );

  /* Fade to black (bottom of sections) */
  --gradient-fade-bottom: linear-gradient(
    180deg,
    transparent 0%,
    rgba(13, 13, 13, 0.8) 70%,
    #0D0D0D 100%
  );

  /* Fade to black (top of sections) */
  --gradient-fade-top: linear-gradient(
    0deg,
    transparent 0%,
    rgba(13, 13, 13, 0.8) 70%,
    #0D0D0D 100%
  );

  /* Vignette effect */
  --gradient-vignette: radial-gradient(
    ellipse at center,
    transparent 0%,
    rgba(0, 0, 0, 0.3) 100%
  );
}
```

### Text Gradients

```css
:root {
  /* Fire text (for headlines) */
  --gradient-text-fire: linear-gradient(
    135deg,
    #FB923C 0%,
    #F97316 50%,
    #EA580C 100%
  );

  /* Gold text (achievements) */
  --gradient-text-gold: linear-gradient(
    135deg,
    #FDE047 0%,
    #EAB308 50%,
    #CA8A04 100%
  );

  /* Platinum text (legendary) */
  --gradient-text-platinum: linear-gradient(
    135deg,
    #FFFFFF 0%,
    #E5E5E5 50%,
    #A3A3A3 100%
  );
}
```

### Mesh/Noise Gradients (for texture)

```css
:root {
  /* Subtle noise overlay */
  --gradient-noise: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");

  /* Mesh gradient - organic feel */
  --gradient-mesh: 
    radial-gradient(at 40% 20%, rgba(249, 115, 22, 0.15) 0px, transparent 50%),
    radial-gradient(at 80% 0%, rgba(234, 88, 12, 0.1) 0px, transparent 50%),
    radial-gradient(at 0% 50%, rgba(251, 146, 60, 0.08) 0px, transparent 50%),
    radial-gradient(at 80% 50%, rgba(220, 38, 38, 0.05) 0px, transparent 50%),
    radial-gradient(at 0% 100%, rgba(249, 115, 22, 0.1) 0px, transparent 50%);
}
```

---

## Typography

### Font Stack

```css
:root {
  --font-display: 'Space Grotesk', system-ui, sans-serif;  /* Headlines, bold text */
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;     /* Labels, data */
  --font-body: 'Inter', system-ui, sans-serif;             /* Body text */
}
```

### Font Sizes (Mobile-First)

```css
:root {
  --text-xs: 0.625rem;    /* 10px - Labels */
  --text-sm: 0.75rem;     /* 12px - Small text */
  --text-base: 0.875rem;  /* 14px - Body */
  --text-lg: 1rem;        /* 16px - Large body */
  --text-xl: 1.25rem;     /* 20px - Subheadings */
  --text-2xl: 1.5rem;     /* 24px - Headings */
  --text-3xl: 2rem;       /* 32px - Page titles */
  --text-4xl: 2.5rem;     /* 40px - Hero */
  --text-5xl: 3rem;       /* 48px - Large hero */
}
```

---

## Spacing

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

---

## Brutalist Effects

### Shadows (Orange Accent)

```css
:root {
  --shadow-brutal-sm: 3px 3px 0px 0px var(--accent-primary);
  --shadow-brutal-md: 6px 6px 0px 0px var(--accent-primary);
  --shadow-brutal-lg: 8px 8px 0px 0px var(--accent-primary);
  
  /* Muted shadows for secondary elements */
  --shadow-brutal-muted: 4px 4px 0px 0px rgba(249,115,22,0.3);
  
  /* Dark shadows for layering */
  --shadow-brutal-dark: 6px 6px 0px 0px rgba(0,0,0,0.5);
}
```

### Borders

```css
:root {
  --border-width-thin: 1px;
  --border-width-default: 2px;
  --border-width-thick: 3px;
  --border-width-brutal: 4px;
}
```

---

## Animations

### Transitions

```css
:root {
  --transition-fast: 150ms ease-out;
  --transition-default: 200ms ease-out;
  --transition-slow: 300ms ease-out;
  --transition-dramatic: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Keyframes (for dramatic effects)

```css
@keyframes level-up {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); filter: brightness(1.5); }
  100% { transform: scale(1); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.4); }
  50% { box-shadow: 0 0 20px 10px rgba(249,115,22,0.2); }
}

@keyframes fire-flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

@keyframes streak-celebrate {
  0% { transform: translateY(0); }
  25% { transform: translateY(-10px); }
  50% { transform: translateY(0); }
  75% { transform: translateY(-5px); }
  100% { transform: translateY(0); }
}
```

---

## Scan Lines (Keep Current)

```css
.scan-lines {
  background: linear-gradient(
    rgba(0,0,0,0) 50%,
    rgba(0,0,0,0.03) 50%
  );
  background-size: 100% 4px;
  pointer-events: none;
  mix-blend-mode: overlay;
  opacity: 0.5;
}
```

---

## Component Tokens

### Cards

```css
.card {
  background: var(--bg-secondary);
  border: var(--border-width-default) solid var(--border-accent);
  box-shadow: var(--shadow-brutal-md);
}

.card:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-brutal-lg);
}
```

### Buttons

```css
.btn-primary {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border: var(--border-width-thick) solid var(--accent-primary);
  box-shadow: var(--shadow-brutal-sm);
}

.btn-primary:hover {
  box-shadow: none;
  transform: translate(3px, 3px);
}
```

### Progress Ring

```css
.progress-ring {
  stroke: var(--accent-primary);
  stroke-linecap: round;
  filter: drop-shadow(0 0 8px var(--accent-glow));
}
```

---

## Tailwind Integration

These tokens will be added to `globals.css` and made available via Tailwind's theme extension or CSS variables that can be used with `bg-[var(--bg-primary)]` syntax.
