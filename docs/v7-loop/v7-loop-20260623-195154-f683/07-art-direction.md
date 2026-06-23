# Art Direction

RUN_ID: `v7-loop-20260623-195154-f683`

Status: reset for v7-rebuild-redesign. The current v7 dark-grid/neon skin is rejected as insufficient product art direction.

## Direction

Primary direction: quantum laboratory / worldline experiment console.

Supporting accents:

- Deep-space navigation only for the chapter/worldline map.
- Data-space cursor feedback only for interaction states.
- No public 3D/2.5D direction in the accepted route.

## Palette

- Base: lab graphite, black glass, low-saturation blue-gray, and near-black void.
- Primary energy: cyan-white quantum core.
- Branch energy: cyan for branch A, magenta for branch B, amber for warnings, red for hard blockers.
- Stabilized state: green-blue, used sparingly.
- Rule/parameter state: violet only as a secondary accent, not the main palette.

Avoid:

- One-note purple/blue gradients.
- Plain dark grid background as the main identity.
- Beige/wood/paper/old Sokoban material cues.

## Visual Language

- Home is a quantum experiment console with a central observer, telemetry arcs, split worldline traces, and instrument tabs.
- Chapter map is a worldline/star graph with nodes, branch paths, boss containment rings, and chain-instability overlays.
- Chamber view is an experiment panel: field nodes, rails, containment barriers, energy cores, stabilizer rings, portals, rule sockets, branch lanes, echo queue, swap preview, and recursion layer path.
- Hints become observation logs or signal notes.
- Victory is worldline collapse and lab stabilization, not a generic modal.

## Assets And License

- Runtime visuals for the redesign slice must use custom CSS, DOM, canvas only if necessary, and inline SVG authored in this repository.
- No external images, models, audio, icon packs, or remote font loading are approved for the slice.
- Current font stack target: `"Space Grotesk"`, `"Oxanium"`, `"IBM Plex Mono"`, `"Noto Sans SC"`, `"Microsoft YaHei"`, `system-ui`, `sans-serif`.
- Google Fonts may be self-hosted later only after downloading from an official source and recording the exact font, source URL, and OFL license in this file.
- Until font binaries are committed, no third-party font binary license is claimed.

## Character Candidate A: 量子无人机

Core silhouette:

- Circular bright core.
- Two compact side thrusters.
- Rotating outer ring or broken halo.
- Direction shown by a notch/visor and thrust particles.

State language:

- `idle`: slow halo drift, stable cyan core.
- `move`: thrusters elongate in the opposite direction.
- `push`: front ring compresses, core leans into contact.
- `pull`: tether beam extends backward, halo stretches toward the object.
- `sync`: thin link line and paired side pulses.
- `teleport`: ring expands into a portal-like ellipse, core becomes a streak.
- `split`: shell duplicates into cyan/magenta branch afterimages.
- `blocked`: amber/red shield flash on the contact edge.
- `victory`: halo closes into a stable white-cyan ring.

Fit:

- Best fit for the quantum laboratory direction.
- Readable at 32px, 48px, and 64px if the shape stays simple.
- Strong physical push/pull feedback without becoming human.

Risk:

- If overdecorated, it becomes visual noise at 32px.

Decision:

- Preferred implementation target for the 20-level slice.

## Character Candidate B: 数据光标核心

Core silhouette:

- Angular pointer/diamond core.
- Thin tail trail.
- Direction arrow integrated into the body.

State language:

- `idle`: blinking cursor point.
- `move`: tail segments follow path.
- `push`: cursor broadens into a wedge.
- `pull`: reverse trail hooks onto object.
- `sync`: duplicated cursor trails in parallel.
- `teleport`: pointer becomes a scanline.
- `split`: cursor forks into two pointers.
- `blocked`: pointer tip glitches.
- `victory`: cursor resolves into a stable node.

Fit:

- Strong for cyber/data-space UI.
- Very readable in small sizes.

Risk:

- Weaker physicality for pushing energy cores.
- Could make Driftbox feel abstract-data rather than lab-experiment.

Decision:

- Keep as fallback if the quantum drone feels too character-like.

## Character Candidate C: 星舰维修机器人

Core silhouette:

- Small non-human maintenance pod.
- Compact body, two tool arms, no legs.
- Single sensor slit.

State language:

- `idle`: hovering maintenance lights.
- `move`: rear microthruster.
- `push`: tool arms brace forward.
- `pull`: tractor clamp extends.
- `sync`: synchronized service-link beam.
- `teleport`: pod disassembles into scan segments.
- `split`: duplicate service pods appear in branch colors.
- `blocked`: tool arm sparks.
- `victory`: pod projects a stabilizer seal.

Fit:

- More personality and mechanical clarity.

Risk:

- Highest risk of becoming a "little character" again.
- More detail can fail at 32px.

Decision:

- Not first implementation target.

## Implemented Character Requirement

The current v7 role is rejected. The next implementation must build a new SVG/CSS character state component and a visual state sheet.

Required state sheet:

- 9 states: `idle`, `move`, `push`, `pull`, `sync`, `teleport`, `split`, `blocked`, `victory`.
- 3 sizes: 32px, 48px, 64px.
- Screenshot path: `docs/v7-loop/v7-loop-20260623-195154-f683/screenshots/character-state-sheet.png`.

## Iconography

Mechanism icons must share line weight and geometry:

- Recursive chamber: nested square/capsule with entry arrow.
- Worldline split: branching dual-color fork.
- Time echo: delayed ghost ticks.
- Spatial swap: crossed region diamonds with preview line.
- Multi-drone sync: linked nodes with mode glyph.
- Rule block: parameter chip entering a socket.
- Portal/link: paired rings with direction arrow.
- Blocked/error: contact shield and reason glyph.

## QA Art Standard

The redesign fails if screenshots still read as:

- dark grid plus neon frame only;
- card dashboard;
- old Sokoban square board;
- cute small-person avatar;
- generic sci-fi buttons without system-specific meaning.
