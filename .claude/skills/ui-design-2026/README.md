# UI Design 2026 Skill - Usage Guide

## Overview

This skill provides Claude Code with comprehensive UI/UX design expertise following 2026 industry standards. It covers everything from color theory and typography to layouts, components, and accessibility.

## When This Skill Activates

Claude Code will automatically use this skill when:

- Building frontend UI components
- Designing pages or layouts
- Implementing color schemes
- Setting up typography systems
- Creating responsive designs
- Working on accessibility improvements
- Implementing design systems

## How to Invoke

### Automatic Invocation
Claude Code recognizes UI/design-related tasks and automatically applies this skill.

### Manual Invocation
You can explicitly invoke the skill by mentioning design aspects:

```
"Design a modern dashboard using 2026 UI standards"
"Create a color palette for a SaaS application"
"Build a responsive card component with proper spacing"
"Implement a navigation bar with the latest trends"
```

## Key Features

### 🎨 Professional Color Palettes
- **SaaS Enterprise Trust** - Corporate, B2B applications
- **Warm Minimalism** - Lifestyle, wellness apps
- **Dark Mode Native** - Developer tools, dashboards
- **Neo-Retro & Liquid Glass** - Creative, Web3 projects

### 📐 Layout Systems
- **8pt Spacing System** - Mathematical consistency
- **12-Column Grid** - Responsive layouts
- **Bento Grid** - Modern modular layouts
- **Container Queries** - Component-level responsiveness

### 🔤 Typography
- **Major Third Scale** - Harmonious sizing (18px base)
- **Humanist Fonts** - Readable, warm typefaces
- **Variable Fonts** - Adaptive typography
- **Mobile Optimization** - Proper scaling

### ♿ Accessibility First
- **WCAG AA+** - 4.5:1 contrast minimum
- **Touch Targets** - 44x44px minimum
- **Screen Reader** - Semantic HTML
- **Color-Blind Safe** - Never color-only meaning

### 🤖 AI-Ready Design
- **Agentic UX** - Dynamic content layouts
- **Resilient Containers** - Handle variable AI text
- **Assistive Panels** - AI collaboration spaces

## Example Requests

### Color System
```
"Set up a color system for a modern wellness app"
→ Will use Warm Minimalism palette with mocha tones
```

### Component Design
```
"Create a button component with all size variants"
→ Will generate 4 sizes (XL, MD, SM, XS) with proper spacing
```

### Layout
```
"Build a dashboard using Bento Grid layout"
→ Will create modular tile system with rounded corners
```

### Responsive Design
```
"Make this component responsive from mobile to desktop"
→ Will implement Container Queries and breakpoint strategy
```

### Dark Mode
```
"Add dark mode support with proper elevation"
→ Will use lightness-based elevation, avoid pure black
```

## Integration with Other Skills

### Works seamlessly with:
- **nextjs-frontend** - Applies design tokens to React/Tailwind
- **fastapi-backend** - Coordinates on loading states, errors
- **better-auth** - Designs auth UI components

## Best Practices

### ✅ Do:
- Use semantic color tokens (not hue names)
- Follow 8pt spacing system religiously
- Test on actual devices (especially iPhone 16 Pro Max at 440px)
- Verify contrast ratios for all text
- Design for variable AI-generated content

### ❌ Don't:
- Use pure black (#000000) in dark mode
- Set font smaller than 16px on mobile inputs
- Use accent colors for non-interactive elements
- Let text width exceed 1280px
- Use color alone to convey meaning

## Quick Reference

### Essential Values
```css
Base Font: 18px desktop, 16px mobile
Grid: 12 columns, 24-32px gutters
Max Width: 1280px for content
Border Radius: 24px for cards, 12px for inputs
Touch Target: 44x44px minimum
Contrast Ratio: 4.5:1 minimum (WCAG AA)
```

### Color Token Structure
```
Surface → Content → Action → State
(backgrounds) (text/icons) (buttons) (feedback)
```

### Spacing Scale
```
8px → 16px → 24px → 32px → 48px → 64px
```

## Resources Included

- 4 complete professional color palettes
- Full typography scale with line-heights
- Responsive breakpoint table (mobile to 4K)
- Component size specifications
- Accessibility checklist
- Anti-pattern warnings
- CSS variable templates

## Troubleshooting

### "Colors look washed out"
Check if you're using pure white (#FFFFFF) for base. Use #F8FAFC instead.

### "Dark mode looks flat"
Use lightness for elevation (#121212 → #1E1E1E → #252525), not shadows.

### "Mobile layout breaks"
Verify you're testing at 440px (iPhone 16 Pro Max) and using Container Queries.

### "Text hard to read"
Ensure 4.5:1 contrast and use 18px base font size on desktop.

## Version

**Current**: v1.0.0 (2026)
**Source**: The 2026 Definitive Guide to User Interface Design

## Support

For issues or questions about this skill:
1. Check the main SKILL.md for detailed specifications
2. Refer to the included resource links
3. Ask Claude Code to "explain ui-design-2026 approach for [specific topic]"

---

**Remember**: This skill represents industry best practices for 2026. It prioritizes accessibility, performance, and user experience over purely aesthetic concerns.
