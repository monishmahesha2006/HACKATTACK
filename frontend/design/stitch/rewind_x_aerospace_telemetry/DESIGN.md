---
name: REWIND X Aerospace Telemetry
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daee'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e2e8fc'
  surface-container-highest: '#dce2f6'
  on-surface: '#151b2a'
  on-surface-variant: '#434656'
  inverse-surface: '#2a3040'
  inverse-on-surface: '#edf0ff'
  outline: '#747688'
  outline-variant: '#c4c5d9'
  surface-tint: '#1349f0'
  primary: '#003fe1'
  on-primary: '#ffffff'
  primary-container: '#2f5bff'
  on-primary-container: '#efefff'
  inverse-primary: '#b9c3ff'
  secondary: '#006972'
  on-secondary: '#ffffff'
  secondary-container: '#8ef2ff'
  on-secondary-container: '#006f79'
  tertiary: '#006247'
  on-tertiary: '#ffffff'
  tertiary-container: '#007d5c'
  on-tertiary-container: '#beffe0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b9c3ff'
  on-primary-fixed: '#001356'
  on-primary-fixed-variant: '#0034bf'
  secondary-fixed: '#8ef2ff'
  secondary-fixed-dim: '#71d5e2'
  on-secondary-fixed: '#001f23'
  on-secondary-fixed-variant: '#004f56'
  tertiary-fixed: '#7ef9c9'
  tertiary-fixed-dim: '#60dcae'
  on-tertiary-fixed: '#002115'
  on-tertiary-fixed-variant: '#00513a'
  background: '#f9f9ff'
  on-background: '#151b2a'
  surface-variant: '#dce2f6'
typography:
  headline-xl:
    fontFamily: Bricolage Grotesque
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Bricolage Grotesque
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Bricolage Grotesque
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-lg:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-md:
    fontFamily: Space Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.1em
  label-sm:
    fontFamily: Space Mono
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 12px
    letterSpacing: 0.12em
  label-xs:
    fontFamily: Space Mono
    fontSize: 9px
    fontWeight: '400'
    lineHeight: 12px
    letterSpacing: 0.15em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-sm: 0.5rem
  gutter-lg: 1rem
  margin: 1rem
  margin-sm: 0.75rem
  margin-lg: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style
The design system establishes an aerospace-grade, high-reliability control room interface tailored for mission-critical autonomous AI operations. The aesthetic draws direct inspiration from high-precision scientific laboratory tooling, orbital flight instrumentation, and cryogenic engineering workstations. 

The emotional signature is cool, hyper-calm, analytical, and authoritative. It strips away commercial SaaS noise, generic saturated gradient blobs, ambient neon glows, and heavy blur filters in favor of structural clarity, sub-pixel alignment, hairline division, and high-density situational telemetry. Operators interact with a crisp, physical-digital instrument board where every square millimeter conveys verifiable system health, zero latency, and absolute predictability.

## Colors
The palette balances an ultra-pale cool-spectrum canvas with high-contrast structural typography and purposeful tactical accents. Surfaces do not rely on saturated backdrops; instead, pure surgical whites and pearl layers let precision signal states emerge instantly.

### Palette Specifications
- **Canvas Base:** `#F3F5F8` (Cool Pearl). Rendered with a systemic 16px CSS background dot grid (`#D5DBE5`, 1px dots).
- **Surface Layer 01:** `#FFFFFF` (Pure Specimen White).
- **Surface Layer 02 (Sub-panels & wells):** `#F8FAFC`.
- **Structural Borders:** `#DDE2EA` (Crisp 1px hairline).
- **Divider Secondary:** `#E8EDF4`.
- **Text & Readings:**
  - Primary Telemetry & Readouts: `#0B1220` (Deep Space Navy).
  - Secondary Metadata & Param Labels: `#5B6577` (Muted Slate).
  - Tertiary Indicators & Grid Coordinates: `#8B95A5` (Subtle Atmospheric).
- **Core Signal Drivers:**
  - Primary Control Signal: `#2F5BFF` (Electric Cobalt). Used for active target acquisition, deterministic actions, and primary toggles.
  - Secondary Pulse: `#7FE3F0` (Ice Cyan). Reserved strictly for real-time telemetry heartbeats, live data streams, and ongoing micro-corrections.
- **Operational Health (Strict Semantic Mapping):**
  - Verified Nominal: `#12A47A` (Lab Emerald). Surface tint: `#E8F7F2`.
  - Margin Warning: `#E8A317` (Telemetry Amber). Surface tint: `#FDF6E7`.
  - Fatal Anomaly: `#E5484D` (Instrumentation Crimson). Surface tint: `#FDF0F0`.
  - Standby / Inactive: `#9AA4B5` (Inert Slate). Surface tint: `#F1F4F8`.

## Typography
Typographic orchestration is split cleanly across functional roles: structural headings establish operational units, high-density neutral sans powers sustained operator scan rates, and monospaced characters anchor computational data feeds.

- **Headings (Bricolage Grotesque):** Expresses industrial engineering character with tight tracking and flat baselines. Used for system modules, viewport titles, and high-level node counters.
- **Body & UI (Hanken Grotesk):** Ultra-neutral, legible, optimized for 13px and 12px telemetry tables, status descriptions, and execution logs.
- **Telemetry & Micro-Labels (Space Mono):** Used for all state hashes, memory addresses, tick labels, coordinate tags, and status abbreviations (`[OK]`, `[FAIL]`, `[EXEC]`). Monospace text must always be transformed to full uppercase with wide letter-spacing (`0.08em` to `0.15em`) to ensure zero visual ambiguity between 0, O, 1, and I.

## Layout & Spacing
The layout follows a modular instrumentation rack architecture utilizing an uninterrupted fluid grid. Density is prioritized: dead white space is replaced with structural alignment, boundary markers, and data grouping.

### Grid & Composition
- **Desktop (1440px+):** 12-column or 16-column continuous workstation rack. Gutter is locked at `12px` (`0.75rem`) to maximize signal density. Outer canvas margins are fixed at `16px` (`1rem`).
- **Data Densities:** Panels and cards utilize compact internal padding (`space-sm` for toolbars, `space-md` for standard telemetry modules).
- **Alignment Marks:** Grid intersections and panel perimeters integrate subtle 4px tick marks (`+` or `L`-brackets) styled in `#8B95A5` at 50% opacity, providing visual anchoring identical to analytical bench equipment.
- **Mobile / Auxiliary Touch Displays:** Collapses gracefully into a single-column diagnostic stack with `8px` (`0.5rem`) gutters and `12px` outer padding.

## Elevation & Depth
Depth is produced through physical panel layering, sharp contrast steps, and 1px technical outlines rather than artificial volumetric diffusion. Soft blue-tinted shadows are reserved strictly for floating control panels and elevated command palettes.

- **Base Canvas:** Flat `#F3F5F8` dot-grid texture.
- **Panel Surface (Ground):** Pure `#FFFFFF` enclosed in an unrelenting `1px solid #DDE2EA` hairline outline.
- **Recessed Well / Trace View:** `#F8FAFC` recessed with `inset 0 1px 2px rgba(15, 23, 42, 0.04)` and `1px solid #DDE2EA` perimeter.
- **Hover / Active Planes:** `box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(47, 91, 255, 0.03);`
- **Elevated Modals / Command HUDs:** Pure `#FFFFFF` surface, framed with `1px solid #2F5BFF` (or `#DDE2EA` when inactive), supported by a directional cool slate shadow: `0 8px 24px -4px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)`.
- **Prohibited:** No heavy blur filters (`backdrop-filter: blur(20px)` is banned), no iridescent color bleed, and no soft neumorphic bevels.

## Shapes
Geometry is disciplined, utilitarian, and structural. Roundedness is restrained strictly to Soft (`roundedness: 1`), standardizing at 8px (`0.5rem`) for cards, modules, and diagnostic panels, and 6px-8px (`0.375rem`-`0.5rem`) for inputs and controls.

- **Containers & Rack Units:** Outer corners use `8px`. No nested interior radius may exceed `6px`.
- **Telemetry Chips & Badges:** `4px` or `2px` corners; never pill-shaped.
- **Dividers & Structural Rules:** Exactly 1px thick. Never feathered or dashed unless explicitly indicating open circuit breaks.
- **Targeting Crosshairs:** Pure sharp vector lines (0px radius) intersecting at module axes.

## Components

### 1. Action Triggers & Buttons
- **Primary Control (Active Trigger):** Background `#2F5BFF`, foreground `#FFFFFF`, border `1px solid #1E44D6`, radius `6px`. Typographic styling uses `label-md` or `body-md` (Medium). On hover: `#1E44D6`. Zero glow, instant state switch (duration 100ms linear).
- **Secondary / Panel Action:** Background `#FFFFFF`, foreground `#0B1220`, border `1px solid #DDE2EA`, radius `6px`. Hover: `#F8FAFC` with border `#5B6577`.
- **Destructive Override:** Background `#FDF0F0`, foreground `#E5484D`, border `1px solid rgba(229, 72, 77, 0.3)`.

### 2. Telemetry Status Chips
- Structured as compact rectangular tags with a left-aligned 6px status pip.
- **Verified State:** Border `1px solid rgba(18, 164, 122, 0.3)`, background `#E8F7F2`, text `#12A47A` using `label-xs`.
- **Fault State:** Border `1px solid rgba(229, 72, 77, 0.3)`, background `#FDF0F0`, text `#E5484D` using `label-xs`.
- **Live Agent Heartbeat:** Border `1px solid rgba(127, 227, 240, 0.6)`, background `#FFFFFF`, text `#0B1220`, pip colored `#7FE3F0` with a binary cadence tick (1s blink interval).

### 3. Data Tables & Event Traces
- **Header:** Background `#F8FAFC`, bottom border `1px solid #DDE2EA`, text `label-xs` uppercase `#5B6577`. Height locked to 32px.
- **Rows:** Height locked to 36px. Alternating row fills are omitted; rows are separated by `#E8EDF4` hairlines. Hover state highlights row in `#F3F5F8`.
- **Numeric & ID Cells:** Set in `Space Mono` (`body-sm`), right-aligned for all float/integer values.

### 4. Input Fields & Parameter Controls
- Background `#FFFFFF`, border `1px solid #DDE2EA`, border-radius `6px`, text `#0B1220` (`body-md`).
- Focus state: `1px solid #2F5BFF` with an immediate non-blurred offset ring: `outline: 1px solid #2F5BFF; outline-offset: 1px;`.
- Monospace prefix or parameter labels (e.g., `FREQ:`, `IP:`) docked on the left in `#8B95A5`.

### 5. Checkboxes & Binary Selectors
- **Checkbox:** Crisp 16x16px square, radius `3px`, border `1px solid #DDE2EA`. Checked: `#2F5BFF` background with pure white 1.5px checkmark vector.
- **Toggle Switch:** Rectangular enclosure (32x18px), radius `3px`, background `#DDE2EA`. Active: background `#2F5BFF`. Switch indicator: 12x12px square block with 2px radius.

### 6. Telemetry Cards & Machine Panels
- Background `#FFFFFF`, border `1px solid #DDE2EA`, radius `8px`.
- Every card features a structured header bar: 36px height, bottom hairline `#DDE2EA`, hosting an icon, module identifier (`label-md`), status pip, and right-aligned action icon.
- Bottom corner visual framing includes terminal corner ticks (`4px` L-brackets) to reinforce industrial avionics console identity.