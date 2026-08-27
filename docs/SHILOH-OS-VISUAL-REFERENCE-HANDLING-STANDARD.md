# Shiloh OS Visual Reference Handling Standard

Date: 2026-08-27

Owner: **00 — Control & Reconciliation**

Status after merge: **ACTIVE GOVERNANCE STANDARD**

## Purpose

Prevent screenshots, photographs, interface captures and other user-supplied visuals from being mistaken for requests to generate or edit images.

This standard is a durable Shiloh OS interaction rule and must not depend on conversational memory.

## Default rule

Any screenshot, photograph, interface capture or other visual supplied by JP in a Shiloh OS conversation is **reference, evidence or design context by default**.

The presence of a visual does not itself authorize or request image generation, image editing, redrawing, restyling or visual mockup creation.

When JP asks what a screenshot shows, how a visual pattern could be incorporated into Shiloh OS, whether a design choice should be adopted, or how an existing Shiloh OS surface should change, respond with analysis, architecture/design guidance, implementation guidance or a routed workstream handoff as appropriate.

## When image generation/editing is appropriate

Generate or edit an image only when JP explicitly asks to create, generate, draw, render, mock up, redesign, edit, transform or otherwise produce a visual artifact.

If JP supplies a screenshot while asking an implementation/design question, treat the screenshot as evidence for that question rather than as an implicit image-generation request.

## Shiloh OS routing

A screenshot-based request that changes a Shiloh OS product surface remains owned by the applicable workstream under normal Control Rules.

Examples:

- Calendar UX or booking surface → **10 — Calendar & Booking Assurance**
- CRM/client surface → **20 — CRM & Identity**
- WhatsApp/admin interaction surface → **30 — WhatsApp & Meta Integration**
- Runtime/deployment surface → **40 — Production & DevOps**
- Cross-stream priority, architecture or authorization → **00 — Control & Reconciliation**

00 should prefer a text/design specification or copy-ready handoff when that is sufficient. Do not create a visual artifact merely because one could be useful.

## Relationship to other governance

This standard changes presentation/tool-selection behavior only. It does not change production authorization, workstream ownership, release gates, bounded operational delegation or the governing product test.

Where a visual request genuinely requires image generation or editing, normal ChatGPT visual-tool rules still apply.
