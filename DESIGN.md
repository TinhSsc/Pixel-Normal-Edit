---
name: Pixel Normal Edit
description: Trình chỉnh sửa Pixel Art trực tuyến mạnh mẽ và chuyên dụng
colors:
  neon-blue: "#5b5bf0"
  emerald-green: "#28a745"
  matte-black: "#191920"
  surface: "#2a2a33"
  light-gray: "#e4e4ed"
  border-gray: "#3e3e4a"
typography:
  body:
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: "400"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "10px"
  lg: "15px"
components:
  button-primary:
    backgroundColor: "{colors.neon-blue}"
    textColor: "#f0f0f8"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  button-default:
    backgroundColor: "{colors.border-gray}"
    textColor: "#f0f0f8"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: Pixel Normal Edit

## 1. Overview

**Creative North Star: "The Digital Workbench (Bàn Làm Việc Kỹ Thuật Số)"**

This design system is built to feel like a high-performance digital workbench. The UI prioritizes function, maximizing the workspace (the canvas) without unnecessary distractions or decorations. By adopting a dark mode aesthetic, it creates a focused, professional environment where the artwork remains the absolute center of attention. We explicitly reject toy-like, flashy interfaces and modern SaaS fluff—there are no overly rounded cards, heavy drop shadows, or large swaths of empty white space.

**Key Characteristics:**
- Uncompromising focus on the canvas.
- High-contrast, legible iconography.
- Dense but readable layout structure.
- Instant, snappy interactions.

## 2. Colors

The palette is anchored in a stealthy Matte Black, accented with sharp, luminous technical colors to indicate tools and actions.

### Primary
- **Neon Blue** (#5b5bf0): Used for primary calls to action, selected states, and active tool indicators. It cuts clearly through the dark interface.

### Secondary
- **Emerald Green** (#28a745): Used for success states, secondary actions (like Export/Download), and positive confirmations.

### Neutral
- **Matte Black** (#191920): The canvas backdrop and absolute background.
- **Surface** (#2a2a33): Elevated panels, toolbars, and modal backgrounds.
- **Light Gray** (#e4e4ed): Primary text and iconography color.
- **Border Gray** (#3e3e4a): Inactive buttons, separators, and subtle borders.

**The Functional Color Rule.** Accent colors are reserved strictly for interactive feedback and primary actions. They are never used decoratively.

## 3. Typography

**Body Font:** Plus Jakarta Sans (with system-ui fallback)

**Character:** Clean, legible, and slightly rounded, offsetting the dense technicality of the dark interface with a touch of modern friendliness.

### Hierarchy
- **Body** (400, 14px): Used for most UI elements, button labels, and tooltips.
- **Title** (600, 20px): Used sparingly for panel headers or the main application title.
- **Label** (400, 12px-13px): Used for secondary information, inputs, and minor UI text.

**The Density Rule.** Typography serves utility. Text sizes remain small to preserve space for the canvas, relying on brightness and contrast for legibility.

## 4. Elevation

The interface is entirely flat. Depth is conveyed strictly through background lightness (Matte Black to Surface) and subtle borders, rather than relying on shadow layering. 

**The Flat-By-Default Rule.** Surfaces are flat at rest. Popups and toolbars use borders and slight background shifts rather than drop shadows to distinguish themselves.

## 5. Components

Components are designed to be slightly soft and user-friendly (6px-8px radii) to balance the intense functionality of the tool.

### Buttons
- **Shape:** Softly rounded (6px).
- **Primary:** Neon Blue background, white text. Hover transitions to a deeper, more intense blue (#0e0eff).
- **Default:** Border Gray background. Hover transitions to a slightly lighter gray (#4a4a58).
- **Padding:** Compact (8px 12px) to save space.

### Panels & Toolbars
- **Corner Style:** Rounded (8px).
- **Background:** Surface (#2a2a33).
- **Spacing:** Elements inside panels are spaced tightly (10px to 15px) to maintain a dense workbench feel.

## 6. Do's and Don'ts

### Do:
- **Do** prioritize workspace density. Keep the canvas as the hero.
- **Do** use flat color backgrounds and 1px borders to separate overlapping panels.
- **Do** ensure text has a high contrast ratio against the Matte Black and Surface backgrounds.

### Don't:
- **Don't** use flashy or "toy-like" decorative elements.
- **Don't** apply heavy drop shadows or ghost-card UI patterns to panels.
- **Don't** use overly large fonts or excessive whitespace typical of SaaS marketing pages.
- **Don't** use over-rounded corners (e.g., pill-shaped cards or 16px+ radius). Keep it at 6-8px.
