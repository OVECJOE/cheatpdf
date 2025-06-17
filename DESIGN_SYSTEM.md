# CheatPDF Design System

A comprehensive design system that combines rich dark themes (not stark black) with warm amber accents, creating an elegant and accessible user experience.

## 🎨 Overview

This design system provides:

- **Rich Dark Theme**: Uses sophisticated dark blue-gray tones instead of harsh black
- **Warm Amber Accents**: Primary brand color that provides excellent contrast and accessibility
- **Seamless Light/Dark Mode**: Automatic theme switching with smooth transitions
- **Semantic Color Tokens**: Consistent color usage across the entire application

## 🌈 Color System

### Brand Colors

```css
/* Amber Palette */
--brand-amber: oklch(0.835 0.156 85.87);        /* Bright amber for dark mode */
--brand-amber-light: oklch(0.885 0.156 85.87);  /* Light amber highlight */
--brand-amber-dark: oklch(0.735 0.156 85.87);   /* Standard amber */

/* Rich Dark Palette */
--brand-dark: oklch(0.118 0.014 252.37);        /* Main background (dark mode) */
--brand-dark-light: oklch(0.155 0.016 252.37);  /* Card background */
--brand-dark-lighter: oklch(0.22 0.018 252.37); /* Border/input background */
```

### Semantic Tokens

Always use semantic tokens instead of raw colors:

```tsx
// ✅ Good - Semantic tokens
<div className="bg-background text-foreground">
<Button className="bg-primary text-primary-foreground">

// ❌ Avoid - Raw colors
<div className="bg-gray-900 text-white">
<Button className="bg-amber-600 text-black">
```

### Usage Examples

```tsx
// Primary actions and highlights
<Button className="bg-primary hover:bg-primary/90">Primary Action</Button>

// Custom brand styling
<div className="gradient-brand">Brand Gradient</div>
<span className="text-brand-amber">Amber Text</span>

// Surface backgrounds
<Card className="surface-secondary">Card Content</Card>

// Text hierarchy
<h1 className="text-primary">Heading with accent</h1>
<p className="text-secondary">Secondary text</p>
<span className="text-tertiary">Tertiary text</span>
```

## 🌙 Theme System

### Implementation

The design system uses `next-themes` for theme management:

```tsx
import { ThemeProvider } from "next-themes";

<ThemeProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem
  disableTransitionOnChange={false}
>
  {children}
</ThemeProvider>
```

### Theme Toggle

```tsx
import { ThemeToggle } from "@/components/app/theme-toggle";

<ThemeToggle /> // Dropdown with Light/Dark/System options
```

### CSS Variables

All colors are defined as CSS custom properties that automatically adapt to the current theme:

```css
:root {
  --primary: oklch(0.735 0.156 85.87);    /* Light mode */
}

.dark {
  --primary: oklch(0.835 0.156 85.87);    /* Dark mode - brighter */
}
```

## 🎯 Component Patterns

### Button Variants

```tsx
// Primary - Main brand actions
<Button className="gradient-brand hover:opacity-90 text-brand-dark">
  Primary Action
</Button>

// Secondary - Less prominent actions
<Button variant="secondary">Secondary Action</Button>

// Outline - Subtle actions
<Button variant="outline" className="border-primary hover:bg-primary/10">
  Outline Button
</Button>
```

### Card Components

```tsx
// Standard card
<Card className="border-border bg-card shadow-lg hover:shadow-xl transition-shadow">
  Card Content
</Card>

// Feature cards with accent colors
<Card className="p-6 border-border bg-card">
  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
    <Icon className="w-6 h-6 text-primary" />
  </div>
</Card>
```

### Typography

```tsx
// Gradient text for headings
<h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
  Gradient Heading
</h1>

// Text hierarchy
<h2 className="text-foreground">Main heading</h2>
<p className="text-muted-foreground">Body text</p>
<span className="text-primary">Accent text</span>
```

## 🛠 Utility Classes

### Custom Design System Classes

```css
/* Brand Colors */
.text-brand-amber { color: var(--brand-amber); }
.bg-brand-amber { background-color: var(--brand-amber); }
.border-brand-amber { border-color: var(--brand-amber); }

/* Gradients */
.gradient-brand { 
  background: linear-gradient(135deg, var(--brand-amber), var(--brand-amber-light)); 
}
.gradient-brand-dark { 
  background: linear-gradient(135deg, var(--brand-dark), var(--brand-dark-light)); 
}

/* Surfaces */
.surface-primary { background-color: var(--surface-primary); }
.surface-secondary { background-color: var(--surface-secondary); }
.surface-tertiary { background-color: var(--surface-tertiary); }
```

## 📐 Spacing & Layout

### Spacing Scale
Based on 4px increments for consistency:

```tsx
// Padding/Margin classes
p-4   // 16px - Standard component padding
p-6   // 24px - Card padding
p-8   // 32px - Section padding
p-12  // 48px - Large section padding

// Gap classes
gap-4   // 16px - Component gaps
gap-6   // 24px - Card gaps
gap-8   // 32px - Section gaps
```

### Layout Patterns

```tsx
// Section with consistent spacing
<section className="py-12 sm:py-16 lg:py-20 px-4">
  <div className="container mx-auto">
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
```

## ♿ Accessibility

### Color Contrast
- All color combinations meet WCAG AA standards (4.5:1 minimum)
- Amber provides excellent visibility for color-blind users
- Rich dark theme reduces eye strain in low-light conditions

### Focus States
```css
/* All interactive elements have proper focus rings */
focus-visible:ring-ring/50 focus-visible:ring-[3px]
```

### Semantic HTML
Always use proper semantic elements with ARIA labels where needed.

## 📚 Design Tokens Reference

Import design tokens in TypeScript:

```tsx
import { 
  brandColors, 
  semanticTokens, 
  typography, 
  spacing,
  componentVariants 
} from "@/lib/design-system";

// Use in components
const primaryColor = semanticTokens.dark.primary;
const buttonClass = componentVariants.button.primary;
```

## 🚀 Best Practices

### Do's ✅
- Use semantic color tokens (`text-foreground`, `bg-primary`)
- Implement proper hover states with transitions
- Use consistent spacing based on 4px increments
- Test both light and dark modes
- Ensure proper contrast ratios

### Don'ts ❌
- Avoid hardcoded colors (`text-gray-900`, `bg-black`)
- Don't use stark black backgrounds
- Avoid inconsistent spacing values
- Don't forget hover/focus states
- Don't mix color systems

## 🔄 Migration Guide

### From Old Colors
```tsx
// Before
className="bg-amber-600 text-white"
className="bg-gray-900 text-gray-100"

// After  
className="bg-primary text-primary-foreground"
className="bg-secondary text-secondary-foreground"
```

### Updating Components
1. Replace hardcoded colors with semantic tokens
2. Add proper hover/focus states
3. Ensure dark mode compatibility
4. Test accessibility compliance

## 📄 File Structure

```
lib/
  design-system.ts          # Design tokens and utilities
app/
  globals.css              # CSS variables and base styles
components/
  app/
    theme-toggle.tsx       # Theme switching component
  providers/
    session-provider.tsx   # Theme provider setup
```

This design system provides a solid foundation for building consistent, accessible, and beautiful user interfaces across the CheatPDF application. 