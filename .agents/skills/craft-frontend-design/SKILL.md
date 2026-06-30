---
name: craft-frontend-design
description: Create, refine, or review frontend visual and interaction implementation for websites, product sites, web apps, dashboards, operational consoles, editors, workspaces, portfolios, ecommerce/content sites, mobile H5, WeChat mini-program-style flows, game UI, and interactive toy UI. Use when Codex needs to reduce AI-template patterns, define a visual system, tune motion, improve responsive behavior, cover UI states, accessibility, or run frontend design QA. Do not use for logos, posters, brand strategy, pure Figma-only work, backend-only work, or unauthorized copying of other sites.
---

# Craft Frontend Design

Use this skill to deliver public-quality frontend UI work with a clear design thesis, platform-fit interaction, purposeful motion, realistic states, responsive behavior, accessibility, and verification.

## Trigger Scope

Use for frontend implementation, refactoring, or review involving:

- marketing / landing pages;
- product websites;
- web apps / SaaS;
- dashboards / operational consoles;
- editors / workspaces;
- portfolios / personal sites;
- ecommerce / content sites;
- mobile H5;
- WeChat mini-program-style flows;
- game / interactive toy UI.

Do not use for logo design, poster design, standalone brand strategy, pure Figma-only work, backend-only changes, unrelated copywriting, or copying a competitor's site without authorization.

## Required Output Standard

Every use of this skill must produce or report:

- design thesis: the specific visual and interaction idea, not a generic style label;
- interface classification: which operating mode applies and why;
- visual system: typography, color semantics, layout rhythm, spacing, component morphology, assets, icons, and light/dark stance;
- interaction/motion system: feedback states, duration/easing/token choices, gesture/hover/tap behavior, and reduced-motion behavior for CSS plus JS/canvas/video loops;
- state coverage: loading, empty, error, disabled, selected/current, pending/saving, and success where relevant;
- responsive strategy: desktop/mobile behavior, breakpoints, density changes, and touch targets;
- accessibility notes: focus, keyboard path, names/labels, alt text, contrast, forms, and color-independent state;
- verification result: build/test/browser/audit checks run, plus remaining risks.

## Reference Routing

- Read `references/interface-taxonomy.md` to choose the correct operating mode and acceptance criteria.
- Read `references/visual-systems.md` before defining typography, color, layout, component shape, assets, icons, or dark/light support.
- Read `references/content-and-microcopy.md` before writing or replacing UI copy.
- Read `references/platform-adapters.md` for mobile H5, WeChat mini-program-style flows, dashboards, game UI, and platform-specific constraints.
- Read `references/motion-and-interaction.md` for transitions, scroll effects, GSAP, gestures, hover/tap feedback, and reduced motion.
- Read `references/inspiration-sampling.md` before using award sites, prompt galleries, component libraries, GSAP resources, or animation galleries as references.
- Read `references/quality-gates.md` before final QA or when the user asks for a design review.
- Read `references/research-principles.md` when a design tradeoff needs research-grounded reasoning.

## Operating Modes

First classify the interface:

- Marketing / landing: sell one offer; show category, proof, primary CTA, and next-section hint.
- Product website: explain a product with concrete artifacts, trust, comparison, and conversion paths.
- Web app / SaaS: open on the usable workflow, not a marketing hero.
- Dashboard / operational console: optimize scan, compare, exception handling, and repeated use.
- Editor / workspace: prioritize canvas/work surface, toolbars, panels, history, selection, and save states.
- Portfolio / personal site: express identity while preserving navigation, project proof, readable case studies, and existing personal/pet/toy/console affordances.
- Ecommerce / content site: prioritize inspection, filtering, reading, purchase/subscription, and trust.
- Mobile H5: short task flow, thumb reach, compact navigation, low bandwidth, and touch feedback.
- WeChat mini program: lightweight platform-fit flows, familiar controls, concise Chinese-facing copy when applicable.
- Game / interactive toy UI: readable game state, controls, score/progress, feedback, and responsive canvas/surface framing.

## Design System Decision Pass

Before coding or reviewing, decide:

- typography: font role, scale, line height, language support, fallback;
- color semantics: neutral, accent, action, status, data, and contrast roles;
- layout rhythm: grid, density, section cadence, alignment, and viewport behavior;
- spacing scale: compact, default, and spacious use cases;
- component morphology: radius, border, shadow, surfaces, controls, and cards;
- asset strategy: product screenshots, photos, generated imagery, icons, diagrams, or no imagery;
- icon style: library, stroke/fill, labels/tooltips, and when icons are inappropriate;
- motion grammar: duration, easing, sequencing, trigger, and purpose;
- dark/light support: required, optional, or intentionally single-theme;
- responsive breakpoints: where content stacks, compresses, pins, tabs, or scrolls.

## Anti-AI Pattern Removal

Remove or justify:

- purple/blue gradient SaaS hero defaults;
- floating orb/blob/bokeh decoration;
- generic three-card feature grids;
- meaningless glassmorphism;
- Lorem ipsum or placeholder brand names;
- vague "AI-powered", "next-generation", "seamless", "transform your workflow" copy;
- every element flying in at once;
- broad `transition-all` everywhere;
- only building the first viewport without states;
- dashboard or operational tools designed like marketing pages;
- mini-program or mobile H5 flows designed like desktop landing pages.
- personal sites converted into generic SaaS heroes that remove identity, project proof, or interactive affordances.

## Implementation Workflow

1. Inspect the repo and existing design system before inventing new primitives.
2. Classify the interface and load only the relevant references.
3. Complete the design system decision pass.
4. Sample references responsibly when useful. Record source, extracted mechanism, forbidden-to-copy items, transferable principle, and implementation effect.
5. Implement the full expected experience: first viewport or workspace, primary flow, repeated items, realistic states, responsive behavior, focus/hover/tap feedback, and media/assets where useful.
6. Tune motion for causality, hierarchy, continuity, or feedback. Add reduced-motion behavior for CSS and JS-driven motion.
7. Run the audit script when files are available:

```bash
python .agents/skills/craft-frontend-design/scripts/audit_frontend_design.py <project-path>
```

8. Iterate until high-signal findings are fixed or explicitly not applicable.

## Final QA

Before final delivery, check and report:

- build/test result;
- desktop and mobile browser inspection or screenshots where feasible;
- horizontal overflow;
- text clipping and button label fit;
- keyboard focus and focus-visible states;
- image alt text and icon accessible names;
- reduced motion;
- shared component, island, layout provider, pet, dock, or floating-control blast radius when those files changed;
- loading, empty, error, disabled, selected/current, pending/saving, success states as relevant;
- public hygiene if changing docs, release files, evals, or publishable repository files.

When reporting, state the design thesis, key implementation choices, verification commands/results, and remaining limitations.
