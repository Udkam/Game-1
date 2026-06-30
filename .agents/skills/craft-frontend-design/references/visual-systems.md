# Visual Systems Playbook

Use this before coding visual primitives or reviewing whether the interface has a coherent style.

## Decision Order

1. Product context: user, task, trust level, density, platform.
2. Layout rhythm: grid, section cadence, workspace shell, or content stream.
3. Typography: font role, scale, weight range, language support.
4. Color semantics: neutral, action, accent, status, data, surface.
5. Component morphology: radius, border, shadow, elevation, control size.
6. Asset strategy: screenshots, photos, generated images, diagrams, icons, canvas, video, or none.
7. Motion grammar: what moves, why, how fast, and how it reduces.
8. Responsive system: breakpoints, density, stacking, pinned controls.

## Typography

Choose fonts by job:

- operational/dense UI: legible sans, compact scale, clear numerals;
- editorial/portfolio: expressive display plus readable body;
- ecommerce/product: product inspection first, type supports metadata;
- Chinese-facing UI: verify Chinese font fallback and line-height, avoid decorative backgrounds behind dense Chinese text;
- game UI: readable at small sizes, strong labels for score/control state.

Checklist:

- no viewport-width font scaling;
- no negative letter spacing;
- line-height supports the language;
- headings fit containers;
- numeric/table content aligns predictably.

## Color Semantics

Define roles before choosing colors:

- neutral/background;
- surface/elevation;
- primary action;
- secondary action;
- accent/brand expression;
- status: success, warning, danger, info, disabled;
- data series if charts exist.

Avoid:

- all-purple/all-blue SaaS defaults;
- one-note beige/slate/brown palettes;
- color-only status;
- low-contrast decorative gradients behind text.

## Layout Rhythm

Pick one dominant rhythm:

- editorial bands;
- product proof sections;
- app shell;
- split-pane workspace;
- table/list density;
- mobile list/detail;
- game HUD over playfield.

Do not mix all rhythms. A landing page can be expressive; an operational console should be quiet and scannable.

## Component Morphology

Decide:

- border radius scale;
- border weight;
- shadow/elevation rules;
- card use;
- button/control height;
- icon size;
- selected/current state;
- disabled style.

Rules:

- avoid cards inside cards;
- avoid large rounded text chips where icons or standard controls are clearer;
- use icons in tool buttons when familiar;
- build tooltips for unfamiliar icon-only controls;
- preserve stable dimensions for boards, grids, counters, tiles, and toolbars.

## Asset Strategy

Use real or generated raster assets when the user needs to inspect a product, place, object, state, gameplay, or person. Do not hide exact text inside images.

Choose:

- screenshot/mock screenshot for product truth;
- photo for place/object/person truth;
- generated image for atmosphere only when it does not replace needed inspectability;
- diagram for systems/process;
- canvas/3D/game assets for interactive play;
- no asset if the interface is purely operational and assets would distract.

## Dark/Light Support

Decide explicitly:

- full dual theme;
- single light theme;
- single dark theme;
- follows existing system.

If dual theme is required, define semantic tokens first. Do not invert random colors one component at a time.
