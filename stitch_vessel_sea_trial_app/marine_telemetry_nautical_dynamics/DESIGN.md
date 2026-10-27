---
name: Marine Telemetry & Nautical Dynamics
colors:
  surface: '#0e141b'
  surface-dim: '#0e141b'
  surface-bright: '#343a42'
  surface-container-lowest: '#090f16'
  surface-container-low: '#161c23'
  surface-container: '#1a2027'
  surface-container-high: '#252a32'
  surface-container-highest: '#2f353d'
  on-surface: '#dde3ed'
  on-surface-variant: '#bacac9'
  inverse-surface: '#dde3ed'
  inverse-on-surface: '#2b3139'
  outline: '#859493'
  outline-variant: '#3b4949'
  surface-tint: '#26dcdd'
  primary: '#48efef'
  on-primary: '#003737'
  primary-container: '#00d2d3'
  on-primary-container: '#005556'
  inverse-primary: '#006a6a'
  secondary: '#89ceff'
  on-secondary: '#00344d'
  secondary-container: '#00a2e6'
  on-secondary-container: '#00344e'
  tertiary: '#ffd09b'
  on-tertiary: '#472a00'
  tertiary-container: '#ffab32'
  on-tertiary-container: '#6c4300'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#56f9f9'
  primary-fixed-dim: '#26dcdd'
  on-primary-fixed: '#002020'
  on-primary-fixed-variant: '#004f50'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0e141b'
  on-background: '#dde3ed'
  surface-variant: '#2f353d'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  telemetry-display:
    fontFamily: JetBrains Mono
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.03em
  telemetry-display-mobile:
    fontFamily: JetBrains Mono
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  label-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-micro:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes a high-precision, technical maritime aesthetic engineered for naval architects, marine surveyors, and bridge officers conducting critical vessel inclining experiments and hydrodynamics diagnostics. The visual language merges modern tactical instrument consoles with clean industrial glass cockpits. 

Key attributes:
- **Tone:** Uncompromising precision, mission-critical clarity, rugged sophistication, and analytical calm under high-stakes operations.
- **Visual Style:** Industrial Technical Dark. Emphasizes dark bridge-compliant backgrounds to preserve night vision, crisp luminescence for live telemetry, micro-borders for modular instrument mounting, and unambiguous visual hierarchies.
- **Emotional Response:** Inspires complete confidence in calculation fidelity, situational stability, and structural telemetry readout accuracy.

## Colors

The palette is engineered for low-light bridge environments and harsh field deck conditions, prioritizing optical contrast, anti-glare usability, and instantaneous state recognition.

### Color Tokens & Usage
- **Deep Bridge Backdrops (`#0B1118`, `#131C26`, `#1A2634`):** Establish the visual bedrock. Base surface begins at `#0B1118` to minimize eye fatigue, rising through `#131C26` for functional instrument panels, up to `#1A2634` for active cards and popovers.
- **Marine Cyan & Hydrodynamic Teal (`#00D2D3`, `#0EA5E9`):** Primary data telemetry, live pendulum readouts, verified calibration states, and high-frequency vector lines. Conveys operational stability and active real-time data streaming.
- **Alert & Deviation States (`#F59E0B`, `#EF4444`):** Reserved exclusively for out-of-tolerance heel/trim angles, metacentric height (GM) discrepancies, sensor drift, and safety-threshold violations. 
- **Subtle Surface Glows:** Applied via 10–15% opacity radial and linear gradient overlays using the primary cyan to signify sensor connectivity and calibration equilibrium.

## Typography

Typography enforces a strict hierarchy separating contextual narrative from scientific measurement.

- **Headlines (Space Grotesk):** Provides structured geometric authority for deck views, report generations, and instrument category titles.
- **Body Content (Inter):** High-legibility neutral workhorse for tabular metadata, operational procedures, surveyor logs, and equipment serials.
- **Telemetry & Angular Measurements (JetBrains Mono):** Monospaced numeric rendering ensures numerical stability without layout shifting during live sensor sweeps (degrees, trim meters, roll rates, ballast metrics). Monospaced styling is compulsory for all degrees (°), decimal coordinates, and calibration readouts.

## Layout & Spacing

The layout utilizes a responsive modular fluid-grid architecture modeled after marine bridge consoles:

- **Mobile (< 768px):** 4-column layout with 16px margins and gutters. Single-stack inclinometer dials and telemetry clusters. Primary controls reside within thumb-range anchored bottom action zones.
- **Tablet (768px - 1024px):** 8-column layout with 24px margins. Bi-pane split screens: left-hand digital inclinometer pendulum, right-hand weight-shift trajectory logs.
- **Desktop / Bridge Terminals (> 1024px):** 12-column layout with 40px outer margins and 24px gutters. Multi-gauge telemetry arrays, hydrodynamic curve graphs, and real-time sensor sync matrices.

Elements strictly respect the 4px base rhythm. Dense data groups snap cleanly into aligned technical grid units.

## Elevation & Depth

Visual hierarchy does not rely on heavy drop shadows, which degrade contrast in high-ambient glare and night-bridge modes. Instead, depth is structured through calibrated tonal stratification and low-contrast luminous outlines:

1. **Base Ocean Bed (`#0B1118`):** Deep canvas background with an optional technical micro-grid pattern (1px dots at 24px intervals, 4% opacity).
2. **Surface Instrument Panels (`#131C26`):** Bounded by 1px crisp borders (`#1E2D3D` or `rgba(255, 255, 255, 0.08)`).
3. **Elevated Floating Modules & Cards (`#1A2634`):** Feature subtle inset top-highlights (`1px solid rgba(255, 255, 255, 0.12)`) and edge micro-luminance.
4. **Active Instrument Dial Rings & Critical Gauges:** Enhanced by directional cyan/teal glows (`0 0 16px rgba(0, 210, 211, 0.18)`), visually decoupling active telemetry from dormant components.

## Shapes

The design system standardizes on a roundedness level of `2`. Large technical cards, modal consoles, and instrument pods utilize generous `rounded-2xl` (1rem to 1.5rem) radii to soften heavy hardware shells, creating a refined tactical surface.

- **Primary Cards & Telemetry Pods:** 1rem (`rounded-lg`) on mobile, scaling to 1.5rem (`rounded-2xl`) on larger telemetry monitors.
- **Small Controls, Chips, and Input Fields:** 0.5rem (`rounded-md`).
- **Tactile Floating Action Buttons (FABs) & Pivot Dials:** Strictly circular (`rounded-full`) for tactile feedback and alignment with angular inclinometer mechanics.

## Components

### Buttons & Action Controls
- **Primary Buttons:** High-contrast cyan background (`#00D2D3`) with deep slate typography (`#0B1118`), bold weight. Subtle inner glow on hover.
- **Secondary / Technical Buttons:** Translucent slate (`rgba(26, 38, 52, 0.8)`) with 1px border (`rgba(0, 210, 211, 0.3)`), cyan text.
- **Tactile Circular FABs:** 56px circular floating buttons positioned for field thumb accessibility. Encased in a double-ring bezel: deep slate inner body, glowing accent boundary icon. Used for instant angle zeroing, pendulum dampening triggers, and weight shift recording.

### Nautical Inclinometer & Gauge Arrays
- **Pendulum Dial:** Dark concave circular well (`#0B1118`) etched with fine degree increments. Monospaced live readout pinned at the center. Radial cyan reticle sweeps with physical dampening motion.
- **Trim & Heel Bubble Tubes:** Modern digital interpretations of spirit levels with illuminated floating indicators and critical warning boundaries highlighted in amber/red.

### Cards & Telemetry Containers
- **Technical Cards:** Dark surface (`#131C26`), 1px structural outline (`#1E2D3D`), corner radius `rounded-2xl`. Header contains monospaced sensor ID tags and live millisecond update pulses.

### Inputs, Chips & Selectors
- **Input Fields:** Dark recessed surface (`#0B1118`) with crisp light borders that transition to glowing cyan focus borders (`rgba(0, 210, 211, 0.6)`). All numeric inputs default to `JetBrains Mono`.
- **Status Chips:** Compact pill containers with glowing status pips: cyan for stable/calibrated, amber for roll-excursion warnings, red for sensor loss.

### Selection Controls
- **Checkboxes & Radios:** Sharp, industrial 0.25rem rounded check-boxes and concentric-circle radio dials with distinct cyan active nodes and high-contrast tick marks.