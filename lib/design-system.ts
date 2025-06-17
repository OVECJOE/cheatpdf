/**
 * CheatPDF Design System
 * 
 * A comprehensive design system that combines rich dark themes (not stark black) 
 * with warm amber accents. This system provides semantic color tokens that work
 * across both light and dark modes.
 */

// Brand Colors - Core palette
export const brandColors = {
  amber: {
    50: 'oklch(0.955 0.01 85.87)',      // Amber-50 (light mode muted)
    500: 'oklch(0.735 0.156 85.87)',    // Primary amber
    600: 'oklch(0.635 0.156 85.87)',    // Darker amber
    700: 'oklch(0.555 0.156 85.87)',    // Deep amber
    800: 'oklch(0.455 0.156 85.87)',    // Very deep amber
    bright: 'oklch(0.835 0.156 85.87)', // Bright amber (dark mode)
    light: 'oklch(0.885 0.156 85.87)',  // Light amber (dark mode)
  },
  dark: {
    100: 'oklch(0.945 0.015 85.87)',    // Foreground text (dark mode)
    200: 'oklch(0.735 0.025 85.87)',    // Muted text (dark mode)  
    300: 'oklch(0.635 0.025 85.87)',    // Tertiary text (dark mode)
    700: 'oklch(0.22 0.018 252.37)',    // Border/input (dark mode)
    800: 'oklch(0.155 0.016 252.37)',   // Card background (dark mode)
    900: 'oklch(0.118 0.014 252.37)',   // Main background (dark mode)
    950: 'oklch(0.035 0.014 252.37)',   // Deep dark
  }
} as const;

// Semantic Color Tokens
export const semanticTokens = {
  light: {
    background: brandColors.amber[50],
    foreground: 'oklch(0.205 0.027 17.38)',
    primary: brandColors.amber[500],
    secondary: 'oklch(0.27 0.022 252.37)',
    muted: brandColors.amber[50],
    border: 'oklch(0.89 0.02 85.87)',
  },
  dark: {
    background: brandColors.dark[900],
    foreground: brandColors.dark[100],
    primary: brandColors.amber.bright,
    secondary: brandColors.dark[700],
    muted: brandColors.dark[800],
    border: brandColors.dark[700],
  }
} as const;

// Typography Scale
export const typography = {
  fontSizes: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px  
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  }
} as const;

// Spacing Scale
export const spacing = {
  0: '0',
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
} as const;

// Border Radius
export const borderRadius = {
  none: '0',
  sm: 'calc(var(--radius) - 4px)',
  md: 'calc(var(--radius) - 2px)',
  lg: 'var(--radius)',           // 0.625rem (10px)
  xl: 'calc(var(--radius) + 4px)',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

// Shadow Levels
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
} as const;

// Animation Durations
export const animation = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
} as const;

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Component Variants
export const componentVariants = {
  button: {
    primary: 'gradient-brand hover:opacity-90 text-brand-dark font-semibold',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border-primary hover:bg-primary/10 text-primary',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  },
  card: {
    default: 'border-border bg-card shadow-lg hover:shadow-xl transition-shadow',
    elevated: 'border-border bg-card shadow-xl hover:shadow-2xl transition-shadow',
  },
  text: {
    primary: 'text-foreground',
    secondary: 'text-muted-foreground', 
    accent: 'text-primary',
    gradient: 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent',
  }
} as const;

// Usage Guidelines
export const designGuidelines = {
  colors: {
    usage: {
      amber: 'Use for primary actions, highlights, and brand elements',
      dark: 'Rich dark tones for backgrounds and secondary text, never stark black',
      semantic: 'Always prefer semantic tokens over raw colors for consistency',
    },
    accessibility: {
      contrast: 'Ensure minimum 4.5:1 contrast ratio for text',
      colorBlind: 'Amber provides good visibility for color-blind users',
    }
  },
  spacing: {
    usage: {
      consistent: 'Use 4px base unit for all spacing (4, 8, 12, 16, 20, 24...)',
      components: 'Prefer spacing-4 (16px) for component padding',
      sections: 'Use spacing-12 (48px) or larger for section gaps',
    }
  },
  typography: {
    hierarchy: {
      h1: 'text-4xl md:text-6xl font-bold',
      h2: 'text-3xl md:text-4xl font-bold', 
      h3: 'text-xl md:text-2xl font-semibold',
      body: 'text-base leading-relaxed',
      caption: 'text-sm text-muted-foreground',
    }
  }
} as const;

// Utility Functions
export const utils = {
  // Generate CSS custom properties from design tokens
  generateCSSVars: (theme: 'light' | 'dark') => {
    const tokens = semanticTokens[theme];
    return Object.entries(tokens).reduce((acc, [key, value]) => {
      acc[`--${key}`] = value;
      return acc;
    }, {} as Record<string, string>);
  },
  
  // Get color with opacity
  withOpacity: (color: string, opacity: number) => {
    return `${color} / ${opacity}`;
  },
  
  // Responsive value helper
  responsive: (mobile: string, desktop: string) => {
    return `${mobile} md:${desktop}`;
  }
} as const;

export type BrandColor = keyof typeof brandColors;
export type SemanticToken = keyof typeof semanticTokens.light;
export type FontSize = keyof typeof typography.fontSizes;
export type Spacing = keyof typeof spacing; 