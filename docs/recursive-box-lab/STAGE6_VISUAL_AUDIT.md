# Stage 6 Visual Gameplay Audit

Audit time: 2026-06-30 18:21:48 +08:00

Skill source: `.agents/skills/craft-frontend-design`, copied from `https://github.com/Udkam/codex-design-skill` commit `a798952effd67ebea39b9732c848e5de89d8263f`.

## Interface Classification

Primary mode: game / interactive toy UI.

The current implementation fails the mode test. It is technically playable, but the first viewport reads as a light operational panel around a grid rather than a game stage with immediate toy-like spatial feedback.

## Ten Specific Problems In The Current Screenshot

1. The board is oversized and mostly empty. The 6x5 grid uses large blank cells with little texture, so the stage looks like a spreadsheet rather than a physical puzzle board.
2. The background graph-paper pattern competes with the actual board grid. It makes the entire page feel like a wireframe rather than a crafted game scene.
3. Entities are identified by letters (`P`, `B`, `IN`) instead of silhouette, material, or function. The player and boxes are not readable without labels.
4. The player is only a yellow circle. There is no orientation, no probe/robot identity, and no motion affordance.
5. The normal crate and enterable crate share too much visual language. A container that holds a world should look like a windowed object, not a regular tile with a tiny inset.
6. Inner-world previews are too small to sell recursion. They read as UI decoration rather than spaces the player can enter.
7. Goal cells are weak dashed rings. They do not feel like docks, sockets, beacons, or powered receivers.
8. The right rail looks like a form panel. Buttons use conventional rectangular form styling and weak hover feedback, so interaction feels administrative.
9. The level list is a button stack. It has no authored progression, mechanism labels, lock/current/completed hierarchy, or gallery value.
10. Debug and status styling shares the same visual weight as gameplay. It feels like a developer panel rather than optional instrumentation.

## AI-Template Patterns

- Generic app-shell composition: large heading, board card, side card, list card.
- Repeated bordered panels with the same radius/shadow treatment.
- Safe pastel palette with no strong contrast or game material direction.
- Icon-plus-text buttons arranged like a CRUD tool.
- Help/About pages built as generic text cards instead of game-native overlays.
- Level selection presented as a standard list instead of a curated experiment map.

## Missing Game Feel

- No board thickness or material response.
- No clear separation between walkable floor, walls, dock targets, crates, and recursive containers.
- No sprite identity for the player.
- No directional facing state.
- No push anticipation, impact, eject, fold, or solved-state feedback strong enough to read visually.
- No sense that entering a box changes spatial scale.
- Progress and completion are reported as text rather than integrated into the level map.

## Stiff Or Weak Motion

- Movement feedback is largely a generic settle animation on entities after render.
- Push and player movement use the same visual response.
- Entering a world does not perform a visible fold/zoom transition.
- Push-out does not look like eject/unfold.
- Undo has no reverse trace.
- Solving a level shows a banner but does not energize the dock or board.

## Information Hierarchy Errors

- The first viewport prioritizes empty board area and side panels over the recursive mechanic.
- Level title and app title consume top-level space without adding game state.
- Debug/status/level selection compete with the playfield.
- Breadcrumb is visually small and does not explain parent-child spatial context.
- Help/About are separate views, which pulls players away from the game instead of supporting the current puzzle.

## Required Rewrite Targets

| Area | Problem | Files to modify |
| --- | --- | --- |
| App shell | Too much dashboard chrome; weak game stage | `src/ui/GameShell.tsx`, `src/App.tsx`, `src/styles.css` |
| Tokens | Palette and components feel generic | `src/styles/tokens.css`, `src/styles.css` |
| Board | Flat pale grid, no board object | `src/ui/world/RecursiveWorldView.tsx`, `src/ui/world/Cell.tsx`, `src/styles.css` |
| Sprites | Lettered placeholders | `src/ui/world/EntitySprite.tsx`, new sprite helpers if needed |
| Recursion | Tiny unreadable previews | `src/ui/world/RecursiveWorldView.tsx`, `src/ui/world/EntitySprite.tsx` |
| Motion | No fold/eject/push feel | `src/App.tsx`, `src/game/engine.ts`, `src/styles.css` |
| Level select | Button list, no curation | `src/ui/pages/LevelLibrary.tsx`, `src/ui/controls/LevelSelect.tsx` |
| Help/About | Generic text pages | `src/ui/help/HelpOverlay.tsx`, `src/ui/pages/HelpPage.tsx`, `src/ui/pages/AboutPage.tsx` |
| Level content | Quantity over progression | `src/levels/tutorial.ts`, `src/levels/tutorial.test.ts` |
| Acceptance | No committed screenshot evidence | `scripts/capture-stage6-screenshots.mjs`, `docs/screenshots/*` |

## Heuristic Script Results

- `py -m py_compile .agents\skills\craft-frontend-design\scripts\audit_frontend_design.py`: passed.
- `py .agents\skills\craft-frontend-design\scripts\audit_frontend_design.py .`: reported errors and warnings in the copied skill reference docs because those docs intentionally contain anti-pattern examples such as placeholder copy. These findings are not app UI findings, but the command result is preserved because the scan covered the whole repo.
- `py .agents\skills\craft-frontend-design\scripts\audit_frontend_design.py src`: 0 errors, 0 warnings, 1 info note that no visual assets were detected. The app-specific heuristic pass is therefore not sufficient; the human critique above is the authority for Stage 6C.

## Acceptance Bar For Stage 6C-E

- The first screen must read as an original game stage.
- The player, crate, recursive container, wall, and goal must be distinguishable without letters.
- Entering or exiting a box must create visible spatial change.
- Debug must be visually secondary and collapsed by default.
- Level selection must feel like a curated lab notebook or experiment grid.
- Screenshots must be committed as review evidence.
