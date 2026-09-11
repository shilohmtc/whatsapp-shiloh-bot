# Shiloh UX Foundations

Status: **V2 foundation / presentation-only**

Governing issues: #862, #865

This document defines the shared UX foundation for Shiloh Workspace. It does not own booking, scheduling, roster, staff identity, permissions, authentication, retained data or provider behavior.

## 1. Product contract

Phone and Desktop/Web Chrome are distinct UX modes with shared semantics.

- Phone remains touch-first and scan-first. Interactive targets should preserve the standing 44px minimum.
- Desktop remains information-density and simultaneous-visibility oriented.
- Shared concepts should use the same icon vocabulary, terminology, semantic colour meaning and hierarchy on both surfaces.
- Shared semantics do **not** require identical controls. A practitioner selector may be direct chips on Desktop and a compact touch picker on Phone.

## 2. Canonical presentation primitives

### Tokens

`src/presentation/shilohUxTokens.js` owns reusable presentation-only values for:

- Phone/Desktop boundary tokens;
- touch-target sizing;
- spacing;
- radii;
- shadows;
- neutral and semantic colours;
- an unassigned staff-accent palette.

The staff-accent palette is deliberately not mapped to staff IDs or names in this layer. Any future staff-to-accent assignment must derive from canonical staff identity and remain a presentation concern, never a second roster authority.

Appointment state colours and staff identity colours are separate concepts. Colour must not be the only carrier of meaning; text/icon/state affordances must remain available where the distinction matters.

### Icons

`src/presentation/shilohIcon.js` is the canonical Shiloh wrapper around the existing `lucide` dependency.

The wrapper provides a bounded semantic vocabulary instead of allowing each feature to choose arbitrary SVG paths, sizes and accessibility behavior. It server-renders SVG so current Express/CommonJS presentation code can use the same primitive without a framework migration.

The initial vocabulary intentionally stays small: Calendar, person/people, search, previous/next, time, confirm, alert, message, add and more-actions.

### Shared UI primitives

`src/presentation/shilohUiPrimitives.js` owns the first reusable production controls:

- Button;
- IconButton;
- Chip;
- Badge/status;
- shared primitive CSS built from the canonical UX tokens.

These primitives deliberately support a 44px touch density and a denser Desktop mode. Icon buttons require an accessible label, selected chips expose semantic state with `aria-pressed`, and status badges keep visible text instead of relying on colour alone.

## 3. Authoritative inventory — initial findings

Current presentation code is server-rendered JavaScript/CommonJS with substantial feature-level HTML/CSS composition under `src/presentation` and related routes.

Existing strengths to preserve:

- authenticated Calendar/Workspace browser proofs;
- explicit Phone and Desktop behavior contracts;
- Phone 44px touch-target expectations;
- canonical server-side roster/date/permission filtering before presentation;
- existing `lucide` package dependency.

Consolidation opportunities:

- feature modules currently contain repeated styling decisions;
- `calendarServiceFamilyVisuals.js` contains hand-authored SVG paths and feature-local accent colours;
- icon selection/accessibility/size should converge on the shared Lucide primitive where Lucide has an appropriate icon;
- service-family visuals may retain custom artwork where it communicates a domain-specific concept better than a generic icon, but its colour roles should eventually consume shared tokens;
- common controls should migrate to shared primitives before broad screen redesign.

## 4. Storybook workshop

**Decision: ADOPTED for development/test UX work.**

Shiloh uses Storybook 10 with the HTML + Vite adapter. The application itself remains Node 24 / CommonJS; isolated Storybook configuration uses `.mjs`. No React, Vue, Next or second frontend runtime is required.

The retained Storybook dependency surface is intentionally small:

- `storybook`;
- `@storybook/html-vite`;
- `@storybook/addon-a11y`.

The official initializer was used as a feasibility spike, then reduced under Clean Change. Chromatic, Vitest and Playwright were not added as Storybook dependencies in V2 because Shiloh already has separate authenticated browser-proof infrastructure and there is no current need for a second testing platform.

### Commands

- `npm run storybook` — local visual workshop on port 6006.
- `npm run build-storybook` — deterministic static catalogue build used by CI.

### Story rule

Stories must import and render the same production exports from `src/presentation` that live Shiloh surfaces use. Do not create a parallel Storybook-only implementation of a component. A thin adapter is acceptable only when needed to connect Storybook controls to a production renderer without duplicating component markup or authority.

The initial catalogue under `stories/` covers design tokens, the canonical Lucide vocabulary, responsive contracts, buttons, icon buttons, chips and status badges. `.github/workflows/storybook.yml` keeps focused foundation tests and the catalogue build green on pull requests and `main`.

Storybook is development/test tooling only. It is not served as production runtime authority, and `storybook-static/` is generated output excluded from Git history.

## 5. Migration order

1. UX tokens and Lucide wrapper — complete.
2. Shared Button / IconButton / Chip / Badge primitives — complete foundation; live migration intentionally separate.
3. Storybook catalogue consuming those exact production primitives — complete foundation.
4. Calendar as the first reference migration, preserving existing date/roster/Phone/Desktop semantics.
5. Workspace surfaces: Clients, Staff, Services, Messages and Dashboard.
6. Visual regression expansion around stable stories plus existing authenticated full-route browser proofs.
7. Delete/consolidate superseded feature-local icon/styling helpers only when replacement proof is complete.

## 6. Clean Change disposition

- **Reuse:** existing `lucide`, server-rendered presentation architecture, Phone/Desktop contracts and browser proof infrastructure.
- **Smallest change:** shared primitives and visual workshop before screen-by-screen redesign.
- **Permanent:** tokens, icon wrapper, shared primitives, focused tests, minimal Storybook config/catalogue/build gate and this concise contract.
- **Temporary:** initializer workflow and bootstrap smoke story were removed after proving installation/build behavior.
- **Duplicate authority:** none; this layer owns presentation only and stories consume production exports.
- **One-year judgment:** the retained foundation is expected to reduce repeated UX work while remaining small enough to maintain deliberately.
- **Retirement:** later migrations should remove redundant feature-local icon/colour/control definitions where the shared layer fully replaces them.
