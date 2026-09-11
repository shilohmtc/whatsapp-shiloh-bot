# Shiloh UX Foundations

Status: **V1 foundation / presentation-only**

Governing issue: #862

This document defines the smallest shared UX foundation for Shiloh Workspace. It does not own booking, scheduling, roster, staff identity, permissions, authentication, retained data or provider behavior.

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
- common controls (button, icon button, chip, badge/status, staff marker, appointment-card treatment) should become reusable presentation primitives before broad screen redesign.

## 4. Storybook decision

**Decision: FIT, with a bounded implementation gate.**

Storybook 10 supports an explicit HTML project type and requires Node 20+. Shiloh is Node 24 and does not need React/Vue/Next to use Storybook.

Storybook should be adopted only under these conditions:

1. stories render the same production primitives exported from `src/presentation`;
2. no parallel "Storybook-only" implementation of Shiloh components is created;
3. Storybook remains development/test tooling and does not become runtime authority;
4. installation/build dependencies remain isolated from production behavior;
5. CI cost and maintenance remain proportionate to recurring UX value.

The V1 foundations unit does not introduce a framework migration. A follow-up Storybook setup unit should run the official initializer for an HTML project in an environment able to update and verify the npm lockfile, then add only a minimal first catalogue for tokens, icons and the first shared primitives.

## 5. Migration order

1. UX tokens and Lucide wrapper — foundation.
2. Shared Button / IconButton / Chip / Badge / StaffMarker primitives.
3. Storybook catalogue consuming those exact production primitives.
4. Calendar as the first reference migration, preserving existing date/roster/Phone/Desktop semantics.
5. Workspace surfaces: Clients, Staff, Services, Messages and Dashboard.
6. Visual regression expansion around stable stories plus existing authenticated full-route browser proofs.
7. Delete/consolidate superseded feature-local icon/styling helpers only when replacement proof is complete.

## 6. Clean Change disposition

- **Reuse:** existing `lucide`, server-rendered presentation architecture, Phone/Desktop contracts and browser proof infrastructure.
- **Smallest change:** shared primitives before screen-by-screen redesign.
- **Permanent:** tokens, icon wrapper, focused tests and this concise contract.
- **Temporary:** exploratory Storybook setup remains non-release until lockfile/build/CI proof passes.
- **Duplicate authority:** none; this layer owns presentation only.
- **One-year judgment:** shared tokens/icons are expected to reduce repeated UX work and are intentionally maintainable.
- **Retirement:** later migrations should remove redundant feature-local icon/colour definitions where the shared layer fully replaces them.
