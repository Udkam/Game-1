# Platform Adapters Playbook

Use this to adapt the design system to specific frontend surfaces.

## Web

Check:

- semantic HTML;
- responsive layout;
- keyboard path;
- visible focus;
- reduced motion;
- media loading;
- SEO/content structure when public pages matter.

Use browser inspection for overflow, text clipping, and asset rendering.

For personal sites and portfolios, preserve the existing identity system before changing the hero pattern. Project, game, repo, console, or pet entry points should remain discoverable, but the surface should not default into a generic product-marketing layout.

## Mobile H5

Prioritize:

- short task paths;
- thumb reach;
- sticky action only when helpful;
- compact navigation;
- reduced image weight;
- touch feedback;
- viewport-safe layout.

Avoid:

- desktop sidebars;
- hover-only interactions;
- tiny controls;
- long scroll storytelling for transactional tasks.

## WeChat Mini Program Style

Prioritize:

- familiar list/detail flows;
- shallow navigation;
- concise Chinese-facing copy when applicable;
- loading and unavailable states;
- 44px or larger touch targets;
- platform-like controls.

Avoid:

- PC landing layouts;
- heavy scroll animation;
- hidden primary action;
- dense decoration behind Chinese text.

## Dashboard / Operational Console

Prioritize:

- scan speed;
- abnormal state visibility;
- stable layout;
- compact repeated controls;
- table/list/map/timeline patterns;
- filters and time windows.

Avoid:

- marketing hero sections;
- decorative charts;
- overly expressive typography;
- status conveyed by color only.

## Game / Interactive Toy UI

Prioritize:

- readable game state;
- input controls;
- score/progress/lives;
- restart/pause/settings;
- feedback timing;
- canvas or playfield framing.

Avoid:

- UI elements covering gameplay;
- ambiguous controls;
- animation that hides hit feedback;
- fixed desktop-only play area.

For pets, toys, route docks, and floating controls, verify mobile placement, viewport-safe offsets, 44px or larger tap targets, and overlap with bottom navigation or content.

## Responsive Checklist

- Use media/container queries, `clamp()`, `minmax()`, or framework breakpoints.
- Avoid uncontrolled `100vw` layouts that cause horizontal scrolling.
- Avoid fixed widths that exceed common mobile viewports.
- Test long labels and dynamic content.
- Keep layout stable during loading and hover/focus changes.
