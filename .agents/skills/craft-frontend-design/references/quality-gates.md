# Quality Gates Playbook

Use this before final delivery or during design review.

## Scoring

Score each category 0-2:

- 0: missing or harmful;
- 1: present but weak or inconsistent;
- 2: strong and task-fit.

A production-ready pass should have no 0s and should explain any 1s.

## Rubric

| Category | 0 | 1 | 2 |
| --- | --- | --- | --- |
| First viewport clarity | category/action unclear | clear but generic | category, audience, action, proof/artifact clear |
| Interface fit | wrong mode | mixed mode | mode matches task and platform |
| Visual originality | template/default | some specificity | coherent visual thesis tied to domain |
| Content specificity | placeholder/generic | partly specific | real objects, states, user tasks |
| State coverage | happy path only | some states | loading/empty/error/disabled/current/pending covered as relevant |
| Motion purpose | decorative/stiff | some useful motion | motion explains causality/hierarchy/feedback and reduces |
| Responsive robustness | breaks on mobile | basic stacking | deliberate desktop/mobile strategy |
| Accessibility | missing basics | partial labels/focus | focus, labels, alt, forms, contrast, color-independent state |
| Asset fit | absent when needed or stock-like | acceptable | assets reveal product/object/state and load safely |
| Public hygiene | local/private traces | uncertain | no local paths, accounts, secrets, private artifacts |

## Pass / Fail Gates

Fail if any are true:

- placeholder copy remains;
- images that matter have no alt text;
- motion exists with no reduced-motion path, including JS loops, canvas, video, scroll timelines, or GSAP;
- primary controls lack focus visibility;
- mobile layout horizontally overflows;
- dashboard/tool starts as a marketing landing page;
- mini-program/mobile task is designed as a desktop page;
- publishable docs contain personal paths, emails, tokens, or local machine details.

## Final QA Checklist

- Build/test completed or reason not applicable.
- Browser check or screenshots at desktop and mobile widths.
- No horizontal overflow.
- No text clipping.
- Keyboard focus visible.
- Alt text and accessible names present.
- Reduced motion present when motion exists.
- Shared island, theme controller, layout provider, pet, dock, or floating-control changes report blast radius and route-wide impact.
- Homepage visual changes and shared component fixes are separable for review or commit when both are touched.
- Loading, empty, error, disabled, current/selected, pending/saving, success states covered as relevant.
- Audit script run when files are available.
- Public hygiene run when docs/release/eval files change.
