# Motion And Interaction Playbook

Use this for animation, transitions, GSAP, scroll effects, gestures, hover/tap states, and reduced motion.

## Motion Purpose

Only animate to explain:

- causality: action caused a state change;
- hierarchy: what matters next;
- spatial relation: where an element came from or went;
- continuity: route/layout changed;
- feedback: accepted, rejected, pending, complete.

If motion is only decoration, remove it or make it much quieter.

## Timing Tokens

- Tap/press feedback: 80-140ms.
- Hover/focus decoration: 120-180ms.
- Small component state: 160-240ms.
- Layout transition: 240-420ms.
- Page transition: 240-500ms only when it does not block task speed.

Avoid durations above 700ms for routine UI. Long narrative animation needs a product reason and an accessible skip/reduced path.

## Easing

- Use ease-out for entering or responding.
- Use ease-in for leaving.
- Use ease-in-out for layout continuity.
- Use spring only when the product tone supports it and it does not harm precision.

Avoid animating everything with the same default.

## Implementation Rules

- Prefer CSS transitions for simple hover/focus/active states.
- Avoid `transition-all`; target `opacity`, `transform`, `background-color`, `border-color`, or `box-shadow`.
- Avoid animating layout properties when transform/opacity works.
- Avoid multiple unrelated `animate-in` entrances on initial load.
- Do not make all elements fly in at once.
- Keep hover states from changing layout size.

## GSAP / React

Use GSAP when timelines, ScrollTrigger, SVG/canvas, precise sequencing, or complex route/workspace animation are justified.

When using GSAP:

- consult GSAP AI Skills or official GSAP docs for current patterns;
- register plugins explicitly;
- scope animations to the component/page;
- clean up timelines and ScrollTriggers on unmount;
- avoid scroll-jacking by default;
- verify mobile pinned sections;
- add reduced-motion behavior.

For React, prefer `@gsap/react` and `useGSAP` when available. Do not introduce GSAP for simple button hover or card reveal effects.

## Reduced Motion

Use one of:

- CSS `@media (prefers-reduced-motion: reduce)`;
- `useReducedMotion`;
- `matchMedia("(prefers-reduced-motion: reduce)")`;
- an app-level motion preference.

Reduced motion should remove parallax, scroll chasing, transform-heavy movement, blur loops, and repeated background motion. Preserve instant state changes and simple opacity if useful.

CSS reduced-motion rules are only the first layer. JS loops, `requestAnimationFrame`, canvas renderers, background video, ScrollTrigger, GSAP timelines, and long write-on animations must pause, cancel, or render a static state when reduced motion is active.

## Interaction State Checklist

Define:

- hover;
- focus-visible;
- active/pressed;
- selected/current;
- loading/pending;
- disabled;
- error and recovery;
- empty next action;
- success/completion.

Touch interfaces need pressed/selected feedback because hover does not exist.
