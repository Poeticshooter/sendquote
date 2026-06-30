# SendQuote Brand Guidelines

## Overview

SendQuote is an AI-powered quoting platform for Indian businesses, helping them create GST-ready quotes in 60 seconds with AI, e-signature, buyer tracking, and CRM sync in one platform.

## Brand Voice

SendQuote speaks with confidence and clarity. Our tone is professional yet approachable, using simple language that Indian business owners can understand. We emphasize efficiency, speed, and reliability while maintaining a warm, trustworthy presence.

## Logo Usage

### Primary Logo (SendQuote Wordmark)
- **File**: `logo.svg`
- **Dimensions**: 158x36px (default), scales proportionally
- **Colors**: Teal (`#00D4AA`) background with white (`#F5F5F5`) text
- **Tagline**: "SendQuote — AI-Powered Quoting for Indian Businesses"
- **Usage**: Primary brand identifier for marketing materials, website, and general branding

### Icon Logo (Arrow Symbol)
- **File**: `logo-icon.svg`
- **Dimensions**: 36x36px (consistent height across all UI elements)
- **Colors**: Teal (`#00D4AA`) stroke on transparent background
- **Usage**: Compact representation for navigation, buttons, and tight spaces

### White Logo
- **File**: `logo-white.svg`
- **Dimensions**: Scales proportionally
- **Colors**: White (`#FFFFFF`) on dark backgrounds
- **Usage**: Dark mode implementations, inverted contexts

## Color Palette

### Primary Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|--------|
| Teal | `#00D4AA` | 0, 212, 170 | Primary brand color, buttons, links, accents |
| Dark Gray | `#0A0A0A` | 10, 10, 10 | Text, backgrounds, headers |
| White | `#F5F5F5` | 245, 245, 245 | Backgrounds, text on dark backgrounds |
| Gray 600 | `#4B5563` | 75, 85, 99 | Secondary text, placeholders |
| Gray 400 | `#9CA3AF` | 156, 163, 175 | Subtle accents, disabled states |

### Semantic Colors
| Name | Purpose |
|------|---------|
| Primary | Main brand color for CTAs, links, interactive elements |
| Secondary | Supporting color for secondary actions, hover states |
| Success | Success states, positive actions |
| Warning | Warning states, caution |
| Error | Error states, destructive actions |
| Info | Informational elements, help text |

## Typography

### Headings
- **Font**: Inter (system font stack)
- **Weight**: Bold (700)
- **Size**: Responsive, scaling with viewport width
- **Color**: `#0A0A0A` (dark gray) on light backgrounds, `#F5F5F5` (white) on dark backgrounds

### Body Text
- **Font**: Inter (system font stack)
- **Weight**: Regular (400)
- **Size**: Responsive, optimized for readability
- **Color**: `#4B5563` (gray 600) on light backgrounds, `#9CA3AF` (gray 400) on dark backgrounds

### Code/Mono Space
- **Font**: JetBrains Mono (Google Fonts)
- **Weight**: Regular (400)
- **Size**: Monospaced, for code blocks, terminal outputs, and technical content

## Component System

### Buttons
- **Primary Button**
  - Background: `#00D4AA` (teal)
  - Text: `#0A0A0A` (dark gray)
  - Border: None
  - Hover: `#00BFA9` (darker teal)
  - Active: `#00A096` (even darker teal)

- **Secondary Button**
  - Background: Transparent
  - Text: `#00D4AA` (teal)
  - Border: `#00D4AA` (teal)
  - Hover: `#00D4AA` with `#F5F5F5` (white) background

### Cards
- **Background**: `#FFFFFF` (white) on light themes, `#1A1A1A` (very dark gray) on dark themes
- **Border**: `#E5E7EB` (light gray) with `1px solid`
- **Shadow**: Subtle drop shadow for depth
- **Border Radius**: `12px` for rounded corners

### Form Elements
- **Input Background**: `#FFFFFF` (white) on light themes, `#2D2D2D` (dark gray) on dark themes
- **Input Border**: `#D1D5DB` (light gray) with `1px solid`
- **Input Text**: `#0A0A0A` (dark gray)
- **Placeholder**: `#9CA3AF` (gray 400)

## Interactive States

### Hover States
- **Buttons**: Background darkens slightly, text color may change
- **Links**: Underlines appear with appropriate color
- **Cards**: Background lightens, border color darkens
- **Navigation**: Background color changes, text color updates

### Active States
- **Buttons**: Background darkens more, text color maintains contrast
- **Interactive Elements**: Scale slightly smaller (95%)

### Focus States
- **Keyboard Navigation**: Visible outline or ring with brand color
- **Screen Reader**: Proper ARIA labels and announcements

## Accessibility Standards

### Color Contrast
- All text meets WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
- Interactive elements have sufficient color contrast
- Focus indicators are clearly visible

### Keyboard Navigation
- Tab order follows logical content flow
- Skip navigation link for quick access to main content
- Focus styles are visible and distinctive

### Screen Reader Support
- All images have descriptive `alt` text
- ARIA labels used for icon-only buttons
- Proper heading hierarchy (H1-H6)

### Motion Preferences
- Respects `prefers-reduced-motion` media query
- Animated elements can be disabled via user preference
- Transitions have maximum 300ms duration

## Logo Usage Guidelines

### Primary Logo (SendQuote Wordmark)
- **Minimum Size**: 36px height in UI components
- **Clear Space**: Maintain 8px margin around logo
- **Usage Context**: Header navigation, marketing materials, brand assets
- **Prohibited**: Distortion, color alteration, text removal/modification

### Icon Logo (Arrow Symbol)
- **Minimum Size**: 24px height in compact spaces
- **Clear Space**: Maintain 4px margin
- **Usage Context**: Navigation toggles, buttons, compact headers
- **Priority**: Use icon version when space is constrained

### White Logo
- **When to Use**: Dark backgrounds, inverted contexts
- **Clear Space**: Maintain 4px margin
- **Usage Context**: Dark mode interfaces, inverted brand presentations

## Visual Hierarchy

### Layout Principles
- **Information Architecture**: Clear, scannable content structure
- **Visual Weight**: Strategic use of size, color, and spacing
- **Whitespace**: Ample breathing room for content to breathe
- **Grid System**: 12-column grid for consistent alignment

### Component Priority
1. **Primary Actions**: Buttons, CTAs (prominent, with proper sizing)
2. **Navigation**: Header with logo, menu items, user actions
3. **Content**: Main information, cards, forms, sections
4. **Supporting**: Sidebars, footers, ancillary information

## Brand Voice & Tone

### Language Guidelines
- **Professional yet approachable**: Use clear, simple language
- **Indian context**: Reference local business environments and challenges
- **Empowering**: Focus on how tools enable business success
- **Efficient**: Emphasize speed, simplicity, and reliability

### Example Phrases
- "Create GST-ready quotes in 60 seconds"
- "Your AI-powered quoting solution"
- "Simplify your quoting process"
- "Grow your business with smarter quotes"

## Component Variations

### Marketing Pages
- **Hero Section**: Full logo, catchy headline, value proposition
- **Feature Cards**: Icon, title, description
- **Pricing Section**: Logo prominently displayed, clear pricing tiers
- **Footer**: Logo, navigation links, social proof

### Application Pages
- **Header**: Icon logo + site title
- **Navigation**: Compact, accessible, clear categorization
- **Sidebar**: Full logo, application title, navigation
- **Forms**: Logo in header, clear validation states

## Usage Examples

### Next.js Metadata
```typescript
export const metadata: Metadata = {
  title: "SendQuote — AI-Powered Quoting for Indian Businesses",
  description: "SendQuote helps Indian businesses create GST-ready quotes in 60 seconds. AI-powered quoting, e-signature, buyer tracking, and CRM sync in one platform.",
  openGraph: {
    title: "SendQuote — AI-Powered Quoting for Indian Businesses",
    images: ["https://sendquote.in/og-image.webp"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};
```

### React Component
```tsx
import Image from "next/image";

function BrandLogo({ size = 36, variant = "default" }) {
  const logoMap = {
    default: "/logo.svg",
    icon: "/logo-icon.svg",
    white: "/logo-white.svg",
  };

  const logoSrc = logoMap[variant];
  const altText = variant === "icon" ? "SendQuote arrow logo" : "SendQuote logo";

  return (
    <Image
      src={logoSrc}
      alt={altText}
      width={size}
      height={size}
      priority
    />
  );
}
```

### CSS Custom Properties
```css
:root {
  /* Brand Colors */
  --color-primary: #00D4AA;
  --color-primary-dark: #00A096;
  --color-primary-light: #00BFA9;
  --color-text-primary: #0A0A0A;
  --color-text-secondary: #4B5563;
  --color-text-muted: #9CA3AF;
  --color-background: #FFFFFF;
  --color-background-dark: #1A1A1A;

  /* Typography */
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  --font-size-2xl: 32px;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
}
```

## Implementation Checklist

### Marketing & Brand
- [ ] Logo files properly exported in required sizes
- [ ] Brand colors applied consistently across all components
- [ ] Typography system implemented site-wide
- [ ] Voice and tone guides maintained across all content

### UI/UX
- [ ] Component library follows design tokens
- [ ] Interactive states (hover, active, focus) implemented
- [ ] Accessibility standards met and tested
- [ ] Responsive design implemented for all breakpoints
- [ ] Dark mode support with proper color inversion

### Technical
- [ ] SEO optimized with structured data
- [ ] Performance optimized for Core Web Vitals
- [ ] Accessibility compliant (WCAG AA)
- [ ] Cross-browser tested
- [ ] Mobile-first responsive design

## Version Control

This brand guide is versioned and should be updated when:
1. Brand colors change
2. Typography system updates
3. New logo variations are created
4. Component library is expanded
5. Design tokens need adjustment
6. Accessibility requirements change

## Approval Process

1. **Design Team**: Review visual consistency and implementation
2. **Accessibility Team**: Verify WCAG compliance
3. **SEO Team**: Validate structured data and metadata
4. **Product Team**: Confirm brand alignment with product goals
5. **Marketing Team**: Review brand voice and messaging

---
*Last Updated: June 15, 2026*
*Version: 1.0*