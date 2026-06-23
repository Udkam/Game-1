# UI Redesign Spec

RUN_ID: `v7-loop-20260623-195154-f683`

Status: required UI contract for the next implementation stage. Current v7 screens are rejected as skinning and must not be patched in place.

## UI North Star

The interface must feel like a quantum experiment system the player operates. It cannot read as a web dashboard with game cards.

Forbidden carry-over:

- Giant `DRIFTBOX` title as the dominant first-viewport structure.
- Ordinary stacked buttons.
- Level card grid as the primary chapter map.
- Board container that looks like old Sokoban tiles recolored.
- Yellow hint bar or generic webpage alert.
- Pip/little-person avatar lineage.

## Home: Quantum Experiment Console

Required structure:

- Central interactive device: `worldline observer`, a circular quantum core with branching lines.
- Main command: `恢复实验`.
- Peripheral commands: `世界线星图`, `研究笔记`, `实验数据`, `系统校准`.
- Progress display: telemetry arcs around the observer, not a progress card list.
- Recent level: shown as the active experiment channel.
- Background: low-motion particles, waveform traces, split worldline lines, scanner sweep, and chamber silhouettes.

Implementation direction:

- Use inline SVG or CSS vector for the central observer.
- Place navigation controls around the observer with radial/anchored layout.
- Keep the screen usable on mobile by stacking the radial controls into a bottom instrument dock.
- Use real buttons for accessibility, but visually style them as instrument tabs, not generic CTA cards.

QA evidence:

- Screenshot must prove the first viewport is not a title plus cards.
- `audit:ui` should fail if `.chapter-card-grid` or old home card structures become the primary map.

## Chapter Map: Worldline Star Graph

Required structure:

- Main branches for chapters.
- Level nodes connected by visible paths.
- Node states: locked, available, completed, par, current recommendation, chain affected.
- Boss nodes: special containment-ring shape.
- Chapter labels are branch labels, not card headers.
- Map can scroll or pan; it must not flatten into equal cards.

Implementation direction:

- Prefer SVG paths plus HTML/SVG buttons for nodes.
- Use coordinates per chapter branch.
- Use path illumination based on progress.
- Use reduced-motion fallback for node pulse.

QA evidence:

- Screenshot must show paths between nodes.
- DOM audit should require `svg.worldline-map`, `.worldline-edge`, `.worldline-node`, and `.boss-node`.

## Chamber View: Experiment Panel

Required structure:

- Board and HUD share one lab panel.
- The grid is visually reframed as field nodes connected by rails and boundaries.
- Walls become containment fields or solid lab barriers.
- Boxes become energy cores.
- Targets become stabilizer rings.
- Portals are paired link gates with arrows.
- Rule sockets, branch lanes, echo queue, swap preview, and layer path appear as instruments around the chamber.

Implementation direction:

- Keep logical cells but render them as non-square-only field components: rails, rounded/cut-corner node plates, region overlays, and chamber seams.
- Use CSS/SVG for overlays rather than image assets.
- Animate feedback with short pulses: blocked, teleport, split, swap, sync conflict, echo tick, win collapse.
- Hints become `观测日志` entries with optional signal noise styling.

QA evidence:

- Screenshot must not look like a plain tile board.
- UI audit should require mechanism-specific instruments when corresponding mechanics exist.

## Character Redesign

The avatar must be non-human and self-authored.

Candidates are tracked in `07-art-direction.md`:

- A. 量子无人机.
- B. 数据光标核心.
- C. 星舰维修机器人.

Final implementation target for the 20-level slice: 量子无人机, unless art QA rejects it during sprite-state review.

Required states:

- `idle`
- `move`
- `push`
- `pull`
- `sync`
- `teleport`
- `split`
- `blocked`
- `victory`

Required state-sheet screenshot:

- `character-state-sheet.png`
- Shows states at 32px, 48px, and 64px.
- Saved under `docs/v7-loop/v7-loop-20260623-195154-f683/screenshots/`.

## Transition Language

Home to map:

- Worldline observer expands into branch graph.

Map to chamber:

- Selected node scans, then folds into chamber frame.

Chamber win:

- Stabilizer rings converge, waveforms flatten, branch lines collapse cleanly.

Error / blocked:

- Local red/amber pulse and short reason text. Avoid modal interruption.

Reduced motion:

- Replace transforms with opacity/color transitions.

## Typography And Assets

Default font plan:

- Use CSS stack: `"Space Grotesk"`, `"Oxanium"`, `"IBM Plex Mono"`, `"Noto Sans SC"`, `"Microsoft YaHei"`, `system-ui`, `sans-serif`.
- Do not load remote fonts at runtime.
- If self-hosting fonts, download from official Google Fonts repository or API, record OFL license and source in `07-art-direction.md`, and verify Chinese fallback.

Asset plan:

- Custom inline SVG/CSS/vector only for the slice.
- No unlicensed image, model, icon, audio, or font binaries.

## Screenshot Set For Redesign Slice

The redesign `smoke:visual` must capture:

1. New home console.
2. Worldline star graph.
3. Level 1.
4. Portal/link level.
5. Sync level.
6. Time echo level.
7. Spatial swap level.
8. Recursive chamber level.
9. Misdirection/worldline level.
10. Character state sheet.
11. Victory collapse.
12. Mobile home.
13. Mobile chamber.

The current 15-image screenshot list from rejected v7 is obsolete for product acceptance and must be replaced when the new slice is implemented.
