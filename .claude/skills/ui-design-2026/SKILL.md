---
name: ui-design-2026
description: Expert UI/UX design skill for building modern, accessible, and aesthetically beautiful interfaces following 2026 standards. Covers intelligent minimalism, color systems, typography, layouts, components, and responsive design. Use when implementing any frontend UI work.
allowed-tools: Read, Write, Glob, Grep, Bash
---

# UI Design 2026 - The Definitive Skill

## Philosophy: Intelligent Minimalism

The UI design landscape of 2026 represents a mature synthesis of **aesthetics and utility**, defined by "Intelligent Minimalism." We've moved beyond stark flatness and integrated depth and tactility without clutter. The mandate is to construct resilient, adaptive design systems that function seamlessly across all devices.

### Core Principles

1. **Modular Fluidity** - Components over pages, using Container Queries
2. **Warm Minimalism** - Mental health-focused design with earthy palettes
3. **Agentic UX** - Interfaces designed for AI collaboration
4. **Accessibility First** - WCAG AA+ standards as baseline, not afterthought
5. **Performance Aware** - Speed equals trust in 2026

---

## Color Systems: Semantic Architecture

Color in 2026 is **rigorous, semantic, and deeply psychological**. Use HSL/LCH models for mathematical consistency across light and dark modes.

### The Semantic Token System

Every color must have a **role, not just a hue**:

- **Surface Tokens**: Background layers (Page, Card, Modal)
- **Content Tokens**: Elements on surfaces (Text, Icons, Borders)
- **Action Tokens**: Interactivity (Primary, Secondary, Tertiary buttons)
- **State Tokens**: Feedback (Success, Warning, Error, Info)

### Professional Color Palettes (2026 Standard)

#### Palette A: "SaaS Enterprise Trust"
**Use for**: Corporate dashboards, B2B applications, professional tools

```css
/* Surface */
--surface-base: #F8FAFC;      /* Cloud White - foundational background */
--surface-card: #FFFFFF;       /* Pure White - elevated components */

/* Text */
--text-primary: #0F172A;       /* Midnight Navy - softer than pure black */
--text-secondary: #64748B;     /* Slate Blue - metadata, subheaders */

/* Actions */
--action-primary: #4F46E5;     /* Electric Indigo - main CTAs */
--action-secondary: #E0E7FF;   /* Soft Indigo - secondary button bg */

/* States */
--state-success: #0D9488;      /* Teal - modern success state */
--state-warning: #F59E0B;      /* Amber */
--state-error: #DC2626;        /* Red */
--state-info: #3B82F6;         /* Blue */
```

**Contrast Ratios**: Primary text 15.8:1, Secondary text 5.5:1 (WCAG AAA compliant)

#### Palette B: "Warm Minimalism"
**Use for**: Lifestyle brands, wellness apps, modern consumer products

```css
/* Surface */
--surface-base: #F6EDE1;       /* Sand/Beige - warm, reduces blue light */

/* Text */
--text-primary: #2C3E2C;       /* Deep Olive - natural, high-end feel */
--text-secondary: #9A7E68;     /* Earth Brown - warm gray-brown */

/* Actions */
--action-primary: #E2725B;     /* Terracotta - inviting, not aggressive */
--action-highlight: #D4AF37;   /* Soft Gold - premium badges */

/* Trend Color */
--accent-mocha: #A47864;       /* Mocha Mousse - Pantone 2026 favorite */
```

**Design Psychology**: Reduces digital fatigue, conveys organic authenticity

#### Palette C: "Dark Mode Native"
**Use for**: Developer tools, media applications, dashboards

```css
/* Surface Elevation (lighter = closer to user) */
--surface-base: #121212;       /* Obsidian - avoids OLED smearing */
--surface-lvl1: #1E1E1E;       /* Gunmetal - cards */
--surface-lvl2: #252525;       /* Charcoal - modals */

/* Text */
--text-primary: #E2E8F0;       /* Mist - 87% white, prevents vibration */
--text-secondary: #94A3B8;     /* Steel - passes 4.5:1 on #1E1E1E */

/* Actions */
--action-primary: #818CF8;     /* Neon Violet - desaturated for dark mode */

/* Borders */
--border-subtle: #2D2D2D;      /* Low contrast, defines shape without noise */
```

**Critical Rules**:
- Never use pure black (#000000)
- Desaturate bright colors by 20-30%
- Use lightness for elevation, not shadows

#### Palette D: "Neo-Retro & Liquid Glass"
**Use for**: Creative portfolios, Web3, futuristic apps

```css
/* Background */
--bg-deep: #0B1120;            /* Deep Mesh - pairs with gradient orbs */

/* Glass Effect */
--glass-surface: rgba(255, 255, 255, 0.1);  /* 10% opacity white */
--glass-border: rgba(255, 255, 255, 0.2);   /* 20% opacity border */
backdrop-filter: blur(20px);   /* The signature liquid glass look */

/* Gradients */
--gradient-cyber: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%);
--gradient-sunset: linear-gradient(135deg, #F59E0B 0%, #DC2626 100%);
--gradient-ocean: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%);
```

**Implementation**: Use for sticky navbars, modal overlays with functional blur

### The 60-30-10 Rule (2026 Edition)

Apply to every interface:

- **60% Neutral** (Surface) - #F8FAFC or #F6EDE1, NOT pure white
- **30% Secondary** (Structure) - Navigation, sidebars, cards
- **10% Accent** (Action) - If user sees this color, it MUST be clickable

**Anti-Pattern**: Using accent colors for non-interactive decoration is a UX failure in 2026.

### Accessibility Standards (Non-Negotiable)

```
WCAG AA Requirements:
- Normal text: 4.5:1 contrast minimum
- Large text (18px+): 3:1 contrast minimum
- WCAG AAA (recommended): 7:1 contrast

Color-Blind Safe:
- Never use color ALONE to convey meaning
- Always pair with icons, labels, or patterns
- Test with tools: Stark, Contrast, Color Oracle
```

**2026 Standard**: Over 80% of websites fail basic contrast. Make accessibility a competitive advantage.

---

## Typography: The Major Third Scale

### Base Font Size: 18px Desktop (2026 Standard)

High-resolution displays render text smaller. **18px** improves readability and reduces eye strain.

### The Complete Type Scale

```css
/* Display / Hero */
--font-hero: 56px;
--line-hero: 1.1 (64px);
--letter-hero: -1.5%;
/* Usage: Large marketing headers */

/* H1 - Page Title */
--font-h1: 44px;
--line-h1: 1.2 (56px);
--letter-h1: -1.0%;

/* H2 - Section */
--font-h2: 36px;
--line-h2: 1.25 (48px);
--letter-h2: -0.5%;

/* H3 - Card Title */
--font-h3: 28px;
--line-h3: 1.3 (36px);
--letter-h3: 0%;

/* H4 - Sub-section */
--font-h4: 22px;
--line-h4: 1.4 (32px);
--letter-h4: 0%;

/* Body Large */
--font-body-lg: 20px;
--line-body-lg: 1.5 (32px);
/* Usage: Lead paragraphs, intro text */

/* Body Base (STANDARD) */
--font-body: 18px;
--line-body: 1.6 (28px or 32px);
/* Usage: Primary reading text */

/* Body Small */
--font-body-sm: 16px;
--line-body-sm: 1.5 (24px);
/* Usage: Secondary text, lists */

/* Caption/Label */
--font-caption: 14px;
--line-caption: 1.4 (20px);
--letter-caption: +1.0%;
/* Usage: Form labels, timestamps */

/* Tiny (Minimum) */
--font-tiny: 12px;
--line-tiny: 1.4 (16px);
--letter-tiny: +2.0%;
/* Usage: Legal text, footnotes */
```

### Mobile Adjustments

**Critical**: For mobile, shift scale down one step:
- Desktop H3 (28px) → Mobile H2
- Mobile Body Base: **16px minimum** (prevents iOS auto-zoom on inputs)
- Headings reduce significantly (H1: 56px → 32px)

### Font Selection Criteria

```
Humanist Sans-Serif (2026 Preferred):
✓ Calligraphic roots
✓ Open counters (spaces inside letters)
✓ Tall x-heights
✓ Examples: Inter, Inter Tight, SF Pro, Atkinson Hyperlegible

Avoid:
✗ Cold geometric sans-serifs (Futura, Avenir)
✗ Condensed fonts for body text
```

### Variable Typography (Advanced)

```css
/* 2026 Trend: Variable fonts that adapt in real-time */
font-variation-settings: 'wght' 450, 'wdth' 100;

/* Responsive weight */
@media (min-width: 768px) {
  h1 { font-variation-settings: 'wght' 700; }
}
```

---

## Layout Architecture: The Grid Physics

### The 8pt Spacing System

**Every margin, padding, and height is a multiple of 8.**

```
The Scale:
4px  (0.5x) - Very tight grouping only
8px  (1x)   - Minimum touch target spacing
16px (2x)   - Standard component padding
24px (3x)   - Card padding, element gaps
32px (4x)   - Section spacing
48px (6x)   - Large section dividers
64px (8x)   - Hero spacing
96px (12x)  - Mega sections
```

**Exception**: Line-heights use 4pt baseline grid for perfect text alignment.

### The 1440px Desktop Standard

**Primary design target**: 1440px logical width (MacBook Pro, high-end laptops)

```
1440px Grid Specification:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Canvas:    1440px
Content Max:     1140-1280px
Columns:         12
Gutter:          24-32px
Side Margins:    80px auto (centers content)
```

**Why constraint?** Content wider than 1280px becomes difficult to scan. Keep lines 60-75 characters.

### The 12-Column Grid Anatomy

```
100% (12 cols) → Hero sections, full-width tables
50%  (6 cols)  → Two-column layouts (Text + Image)
33%  (4 cols)  → Feature cards, pricing tiers (Rule of Three)
25%  (3 cols)  → Dense data grids, gallery thumbnails

Sidebar Layout:
256px fixed sidebar (~3 cols) + remaining space for content
```

**2026 Asymmetry Trend**: 5/7 split (5 cols text, 7 cols visual) feels more dynamic than 6/6.

### Container Queries (Replaces Media Queries)

```css
/* 2026 Standard: Components respond to container width, not viewport */
.card {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    /* Switch from vertical to horizontal layout */
    flex-direction: row;
  }
}
```

**Why it matters**: A dashboard widget might be 400px on desktop (3-column grid) but 360px on mobile. Component adapts to space available, not browser window.

### Bento Grid Layout (Layout of the Decade)

The **defining layout trend of 2026** - modular rectangular tiles of varying sizes.

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px; /* or 24px for airy feel */
}

.bento-item {
  border-radius: 24px; /* Heavy radius is KEY */
  padding: 24px;
}

/* Tile sizes */
.tile-1x1 { grid-column: span 1; grid-row: span 1; }
.tile-2x1 { grid-column: span 2; grid-row: span 1; }
.tile-2x2 { grid-column: span 2; grid-row: span 2; } /* Hero feature */
```

**Visual Hierarchy by Size**: Most important feature gets 2x2, secondary metrics get 1x1.

**Responsive Magic**: On mobile, complex 2D grid reflows into single column automatically.

---

## Responsive Breakpoints: Master Table

| Device Class | Breakpoint | Typical Device | Grid Cols | Gutter | Margin |
|-------------|------------|----------------|-----------|--------|--------|
| **Mobile Small** | 0-374px | Android Base (360x800) | 4 | 16px | 16px |
| **Mobile Standard** | 375-479px | iPhone 15/16 (393x852) | 4 | 16px | 16px |
| **Mobile Large** | 480-767px | iPhone 16 Pro Max (440x956) | 4 | 16px | 24px |
| **Tablet Portrait** | 768-1023px | iPad Mini/Air (834x1194) | 8 | 24px | 32px |
| **Tablet Landscape** | 1024-1279px | iPad Pro (1024x768) | 12 | 24px | 48px |
| **Laptop Small** | 1280-1439px | MacBook Air (1280x800) | 12 | 32px | 64px |
| **Desktop Standard** | 1440-1919px | 1440x900 (Design Target) | 12 | 32px | Auto |
| **Large / TV** | 1920px+ | Full HD (1920x1080) | 12 | 40px | Auto |

### Critical Insight: iPhone 16 Pro Max (440px)

The new **440px logical width** (up from 428px) creates a "phablet" class where you can fit **two small columns** (like Pinterest grid) rather than a single stack.

**Action**: Test all designs at 440px to ensure they don't look awkwardly stretched.

### Screen-Specific Strategies

#### 1440px Laptop (The Workhorse)
```
The Fold: Top 800px is vital (after browser chrome)
Layout: 12-column grid, 5/7 asymmetric split preferred
Content: Max 1280px width, centered with auto-margins
```

#### Mobile (393-440px)
```
The Thumb Zone: Top corners unreachable on large phones
Navigation: Bottom-heavy (use bottom sheets, not center modals)
Font Sizing: Maintain 16px body minimum, H1 reduces to 32px
Touch Targets: Minimum 44x44px (Apple HIG, WCAG AAA)
```

#### Ultra-Wide (1920px+)
```
Centering: NEVER let text stretch across 1920px
Text Channel: Max 700-800px width for readability
Extra Space: Use for sticky TOC, social shares, decorative frames
```

---

## Component Specifications

### Buttons: Shape and Size

**2026 Trend**: Pill Shape (fully rounded) for primary, rectangular (8-12px radius) for secondary.

```css
/* Button Size Chart */
.btn-xl {
  height: 56px;
  padding: 0 32px;
  font-size: 18px;
  border-radius: 28px; /* Pill = height/2 */
}

.btn-md {
  height: 48px;
  padding: 0 24px;
  font-size: 16px;
  border-radius: 24px;
}

.btn-sm {
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
  border-radius: 20px;
}

.btn-xs {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  border-radius: 16px;
}
```

**Touch Target Law**: Even if button is 32px visually, hit area must be 44x44px minimum. Add invisible padding:

```css
.btn-xs {
  padding: 6px 12px; /* Adds vertical padding to reach 44px */
}
```

### Navigation Bars

```css
/* Desktop Navbar */
.navbar-desktop {
  height: 72px; /* or 80px for standard, 64px is "dense" */

  /* 2026 Trend: Floating navbar */
  width: 1280px;
  max-width: calc(100% - 48px);
  margin: 24px auto 0; /* Floats 24px from top */
  border-radius: 16px;
  backdrop-filter: blur(12px); /* Liquid glass effect */
  background: rgba(255, 255, 255, 0.7);
}

/* Mobile Navbar */
.navbar-mobile {
  height: 56-64px;
  /* Account for notch/Dynamic Island: 44-54px */
  padding-top: env(safe-area-inset-top);
}
```

### Cards and Containers

```css
.card-large {
  border-radius: 24px; /* 2026 standard for large cards */
  padding: 24px; /* Desktop, reduce to 16px on mobile */
  background: var(--surface-card);

  /* Soft colored shadow (not gray) */
  box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.1);
}

.card-medium {
  border-radius: 16px;
  padding: 16px;
}

/* Concentric Corner Smoothing */
.card img {
  border-radius: 20px; /* Slightly less than card's 24px */
}
```

**Shadow Psychology**: Use colored shadows (#0F172A at 5-10% opacity) instead of pure black to prevent "dirty" look.

### Iconography: Solid vs Outline

```
Outline Icons (1.5-2px stroke):
✓ Passive states
✓ Navigation bars, menus
✓ Less visual noise

Solid/Filled Icons:
✓ Active/selected states (tab fills on click)
✓ High-priority actions (Compose, Add)
✓ Provides clear feedback
```

**Implementation**:
```jsx
// React example
<Icon
  name="home"
  variant={isActive ? "solid" : "outline"}
  size={20}
/>
```

---

## Visual Effects & Aesthetics

### Glassmorphism (Liquid Glass)

**2026 Standard**: Functional blur on sticky navbars and modals, not entire backgrounds.

```css
.glass-navbar {
  background: rgba(255, 255, 255, 0.7); /* 70% opacity */
  backdrop-filter: blur(12px); /* 12-20px range */
  border: 1px solid rgba(255, 255, 255, 0.2); /* Subtle edge */
}

/* Dark mode glass */
.glass-dark {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

**Why it works**: Users can see context behind the layer, maintaining mental map.

### Tactile Maximalism ("Squishy UI")

Elements that feel **physically interactive**:

```css
.button-squishy {
  transition: transform 0.1s ease-out;
}

.button-squishy:active {
  transform: scale(0.95); /* Mimics rubber deformation */
}

/* Subtle 3D bevel */
.button-tactile {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1), /* Top highlight */
    0 2px 4px rgba(0, 0, 0, 0.1); /* Soft shadow */
}
```

### Organic Geometry

```css
/* Super-ellipse corners (2026 standard) */
.card-organic {
  border-radius: 24px; /* High radius = approachability */
}

/* Avoid sharp rectangles */
.button-legacy {
  border-radius: 4px; /* ✗ Feels dated in 2026 */
}
```

**Psychology**: Rounded corners convey safety and friendliness. Sharp rectangles are over.

---

## AI-Powered & Agentic Interfaces

### Design for Human-Agent Ecosystems

2026 interfaces accommodate **dynamic AI-generated content**:

```css
/* Assistive Panel (AI sidebar) */
.ai-panel {
  width: 320px;
  position: fixed;
  right: 0;
  background: var(--surface-lvl1);
  padding: 24px;
  overflow-y: auto;
}

/* Resilient containers for unpredictable AI text */
.ai-content {
  /* Fluid spacing tokens that expand/contract */
  padding: clamp(16px, 4%, 32px);
  min-height: 100px; /* Prevents collapse */
}
```

**Critical**: Design for **variable content length**. AI might return 1 sentence or 3 paragraphs - your layout must handle both gracefully.

### Purposeful Motion & Microinteractions

```css
/* Performance-aware motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Standard motion */
.button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); /* Smooth ease */
}

/* Loading skeleton */
.skeleton {
  animation: pulse 1.5s ease-in-out infinite;
  background: linear-gradient(
    90deg,
    var(--surface-lvl1) 0%,
    var(--surface-lvl2) 50%,
    var(--surface-lvl1) 100%
  );
  background-size: 200% 100%;
}

@keyframes pulse {
  0%, 100% { background-position: 0% 0%; }
  50% { background-position: 100% 0%; }
}
```

**Rule**: Motion must **enhance understanding**, not just look cool. In 2026, speed equals trust.

---

## Implementation Checklist

### Before Starting Any UI Work

```markdown
✅ Choose appropriate color palette (A/B/C/D) for project type
✅ Set up 8pt spacing system in CSS variables
✅ Configure typography scale (18px base desktop, 16px mobile)
✅ Implement 12-column grid with proper gutters
✅ Add Container Queries support for components
✅ Set up dark mode with elevation system
✅ Verify all text meets 4.5:1 contrast minimum
✅ Add keyboard navigation and focus states
✅ Test with screen reader (NVDA, VoiceOver)
✅ Ensure 44x44px minimum touch targets
✅ Add loading states for all async actions
```

### Component Hierarchy

```
1. Design System Tokens First
   ├── Colors (semantic, not named by hue)
   ├── Spacing (8pt scale)
   ├── Typography (Major Third scale)
   └── Shadows (soft, colored)

2. Base Components
   ├── Button (4 sizes, 3 variants)
   ├── Input / TextArea
   ├── Card / Container
   └── Icon system

3. Composite Components
   ├── Navigation Bar
   ├── Data Table
   ├── Form groups
   └── Modal / Dialog

4. Layout Patterns
   ├── Bento Grid
   ├── Sidebar + Main
   └── Dashboard widgets
```

### Testing Protocol

```bash
# Browser testing
✓ Chrome/Edge (Chromium)
✓ Safari (WebKit - test blur support)
✓ Firefox (Gecko)

# Device testing
✓ iPhone 16 Pro Max (440px)
✓ Standard iPhone (393px)
✓ iPad (834px, 1024px)
✓ Laptop (1440px)
✓ Desktop (1920px)

# Accessibility testing
✓ WAVE extension
✓ axe DevTools
✓ Keyboard navigation only
✓ Screen reader (VoiceOver/NVDA)
✓ Color blindness simulation (Stark)
```

---

## Anti-Patterns to Avoid

```
❌ Pure black (#000000) in dark mode → Use #121212
❌ Pure white (#FFFFFF) for base backgrounds → Use #F8FAFC
❌ Accent color for non-interactive elements → Breaks affordance
❌ Text wider than 1280px → Unreadable
❌ Font smaller than 16px on mobile inputs → Triggers iOS zoom
❌ Color alone to convey meaning → Fails accessibility
❌ Shadows in dark mode → Use lightness for elevation
❌ High saturation colors on dark backgrounds → Vibration/haloing
❌ Geometric sans-serifs for body text → Cold, hard to read
❌ Sharp 4px border-radius → Dated in 2026
```

---

## Quick Reference: CSS Variables Template

```css
:root {
  /* Color System */
  --surface-base: #F8FAFC;
  --surface-card: #FFFFFF;
  --text-primary: #0F172A;
  --text-secondary: #64748B;
  --action-primary: #4F46E5;
  --action-secondary: #E0E7FF;
  --state-success: #0D9488;
  --state-error: #DC2626;

  /* Spacing (8pt system) */
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-6: 48px;
  --space-8: 64px;

  /* Typography */
  --font-hero: 56px;
  --font-h1: 44px;
  --font-h2: 36px;
  --font-h3: 28px;
  --font-body: 18px;
  --font-small: 16px;
  --font-caption: 14px;

  /* Layout */
  --container-max: 1280px;
  --sidebar-width: 256px;
  --navbar-height: 72px;

  /* Radius */
  --radius-card: 24px;
  --radius-button: 24px;
  --radius-input: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(15, 23, 42, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(15, 23, 42, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(15, 23, 42, 0.1);
}

[data-theme="dark"] {
  --surface-base: #121212;
  --surface-card: #1E1E1E;
  --text-primary: #E2E8F0;
  --text-secondary: #94A3B8;
  --action-primary: #818CF8; /* Desaturated */
}
```

---

## Resources & Tools

### Color Tools
- [Coolors](https://coolors.co) - Palette generation
- [Contrast Checker](https://webaim.org/resources/contrastchecker/) - WCAG validation
- [Color Oracle](https://colororacle.org) - Color-blind simulation

### Typography
- [Type Scale](https://typescale.com) - Visual scale calculator
- [Google Fonts](https://fonts.google.com) - Variable fonts
- [Inter](https://rsms.me/inter/) - Recommended sans-serif

### Layout
- [CSS Grid Generator](https://cssgrid-generator.netlify.app)
- [Utopia](https://utopia.fyi) - Fluid responsive design

### Accessibility
- [WAVE](https://wave.webaim.org) - Browser extension
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Stark](https://www.getstark.co) - Contrast & color-blind tools

### Inspiration
- [Dribbble](https://dribbble.com/tags/2026) - UI trends
- [Awwwards](https://www.awwwards.com) - Award-winning designs
- [Mobbin](https://mobbin.com) - Mobile UI patterns

---

## Integration with Existing Skills

### With `nextjs-frontend` Skill
```tsx
// Use ui-design-2026 tokens in Tailwind config
export default {
  theme: {
    extend: {
      colors: {
        surface: { base: '#F8FAFC', card: '#FFFFFF' },
        action: { primary: '#4F46E5' }
      },
      spacing: {
        '18': '4.5rem', // 72px navbar height
      }
    }
  }
}
```

### With `fastapi-backend` Skill
While backend-focused, coordinate on:
- Loading states design
- Error message formatting
- API response pagination UI

---

## The 2026 Design Mandate

> "Interfaces in 2026 feel like a natural extension of the user's thought process—unobtrusive, helpful, and quietly beautiful. We design for resilience, accessibility, and cognitive ergonomics, not just visual appeal."

**Core Values**:
1. **Accessibility is competitive advantage**, not compliance
2. **Performance equals trust** - speed matters as much as aesthetics
3. **AI collaboration** - design for dynamic, unpredictable content
4. **Sustainability** - efficient code, reduced animations, lighter bundles
5. **Human-centered** - mental health, reduced fatigue, warm aesthetics

---

## Version & Updates

**Version**: 1.0.0 (2026)
**Last Updated**: January 27, 2026
**Based on**: The 2026 Definitive Guide to User Interface Design + Industry research

**Changelog**:
- Initial release incorporating 2026 trends: Intelligent Minimalism, Bento Grids, Liquid Glass
- Color palettes vetted for WCAG AA+ compliance
- Typography shifted to 18px base for readability
- Container Queries prioritized over media queries
- AI/Agentic UX patterns added
