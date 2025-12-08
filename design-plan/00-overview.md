# You+ UI/UX Redesign Plan

## Overview

Redesigning You+ from a white minimalist theme to a dark, gamified experience that speaks to our target audience: 16-30 year old males who are "hurt, lost, stuck" - people desperate for real change.

**Core Philosophy**: Life as a game, played through your future self. You're not just tracking habits - you're leveling up your identity.

---

## Design Decisions (Locked In)

| Decision | Choice |
|----------|--------|
| Base Theme | Dark mode (`#0D0D0D` background) |
| Accent Color | Orange/Amber (`#F97316`) |
| Scan Lines | Keep current intensity, use on produced elements |
| Hard Shadows | Keep, in orange accent color |
| Thick Borders | Keep (2-4px), in orange accent color |
| Typography | Prototype/bold gaming style (explore options) |
| Animations | Dramatic for level-ups/celebrations |
| Layout Priority | Mobile-first |

---

## Pages to Redesign

1. **Landing Page** (`/`) - Hero, problem, solution, pricing
2. **Onboarding** (`/onboarding`) - 7-Act journey with gamification hints
3. **Dashboard** (`/dashboard`) - Trust score rings, levels, streaks, pillars

---

## Gamification System (Using Existing Backend Data)

### Trust Score (0-100)
Already exists in backend. Now visualized as:
- Main progress ring (circular)
- Level indicator (1-6)
- Narrative arc badge

### Level System
| Level | Trust Score | Name | Color |
|-------|-------------|------|-------|
| 1 | 0-20 | The Drifter | Gray `#6B7280` |
| 2 | 21-35 | The Initiate | Bronze `#CD7F32` |
| 3 | 36-50 | The Builder | Silver `#C0C0C0` |
| 4 | 51-65 | The Warrior | Gold `#FFD700` |
| 5 | 66-80 | The Champion | Amber `#F97316` |
| 6 | 81-100 | The Legend | Platinum `#F5F5F5` |

### Achievements (Milestone-Based)
Based on existing milestone days: 7, 14, 21, 30, 45, 60, 90, 100

---

## File Structure

```
design-plan/
  00-overview.md        # This file
  01-tokens.md          # Colors, typography, spacing
  02-landing.md         # Landing page spec
  03-onboarding.md      # Onboarding spec
  04-dashboard.md       # Dashboard spec
  05-components.md      # Component library changes
```

---

## Implementation Order

1. Global styles (`globals.css`) - tokens, dark theme
2. Landing page - new hero, sections
3. Onboarding - dark theme + hints of gamification
4. Dashboard - full gamification (trust rings, levels, etc.)
5. Components - Button, Card, etc.
