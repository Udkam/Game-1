# Tetris — T6 Three-Mode Rules Contract

## Status and authority

The user's 2026-07-18 rule review opens T6 only for the three gameplay identities.
Their subsequent request for a more creative separation, followed by the explicit
replacement of Race with Survival, supersedes both earlier T6 drafts:

The accepted T5 layout, typography, `雾昼矿物` palette, divided cohesive tetromino
facets, fifteen authored Puzzle endgames, 18-tick lock window, entry countdown,
responsive behavior, and accessibility remain frozen. T6 supersedes only the former
Classic level progression and the complete Race acceleration rule:

- Classic is fixed-speed chain-score survival: consecutive clearing pieces build a
  visible scoring chain and any non-clearing lock breaks it;
- Survival uses Classic's fixed gravity but raises one permanent unbreakable bedrock
  row from the floor for every five cumulative cleared lines;
- Puzzle uses the same fixed standard speed as Classic but changes the initial board
  and terminal objective to an authored board-clearing challenge.

The serialized `level` field remains pinned to `0` in Classic and Survival. Puzzle
retains its accepted invisible level-based score/event serialization only so all
thirty frozen public-command solution references keep their event digests and final
hashes; Puzzle gravity never reads it, the UI never displays it, and success still
depends only on the canonical board becoming empty. Removing this Puzzle evidence
compatibility requires a separately authorized reference migration.
Classic owns one deterministic `combo` counter. Survival and Puzzle keep it at `0`,
and non-Classic hashes remain stable by excluding that irrelevant field from their
canonical hash payload. The internal mode key remains `race` only for replay/storage
compatibility; every player-facing label is `生存`.

The 2026-07-17 T5 milestone was independently accepted at product source
`effb353c0a4d1bef26fa524ed38d3d3653f45eb8` with formal evidence
`c0832e43dc1cdd31c074066919c229d4a9fe5518`. The user's 2026-07-18 block review
reopens only the tetromino material presentation through bounded Slice K-R3; the
accepted gameplay, layout, typography, palette, copy, and responsive behavior remain
frozen.

The user's 2026-07-16 direction opens T5 and supersedes every conflicting T3/T4
product rule. The later Puzzle clarification in the same session also supersedes the
first T5 finite-queue draft:

- the T4 Mineral Shelf presentation is rejected and must be replaced, not patched;
- Race is endless accelerating play, not a 20-line target;
- Puzzle levels are all available, are not gated by displayed difficulty, and use the
  ordinary continuous falling-piece loop against harder authored clearing goals;
- a deterministic seed is allowed, but Puzzle must never become a short supplied-piece
  exercise or a single-reference-solution memorization task;
- outside games may inform only abstract mechanics such as downstacking or target
  clearing. T5 board layouts, names, copy, visual language, interaction structure,
  code, fixtures, and assets are original clean-room work;
- the reported one-piece Puzzle stall is a release blocker.

The user's 2026-07-17 visual review supersedes the first T5 frontend candidate:

- the player-facing name is the plain-text word `Tetris`;
- `青流方阵`, its custom mark, and the complete Aqua Blueprint presentation are
  rejected rather than eligible for incremental polish;
- the replacement must remain light cyan/light-blue and high contrast, but must read as
  a direct game interface rather than a marketing page or engineering console;
- plain-text naming does not authorize copying a commercial logo, multicolor wordmark,
  proprietary font, existing product layout, or other trade dress.

The user's later typography and panel review authorizes an original open-source Google
Fonts pairing and rejects broken statistic dividers. This does not authorize a logo
font or copied wordmark: `Tetris` remains editable plain text, while typography and
numeric rhythm become part of the surrounding original interface.

The user's subsequent board review rejects the remaining isolated-tile appearance.
Four-cell tetrominoes must read as cohesive dimensional forms rather than four small
plates with four complete outlines. The permitted depth is a restrained machined
mineral relief; this supersedes the earlier flat-cell edge rule but does not restore
plastic gloss, glass, glow, detached shadow, or candy bevels.

The user's 2026-07-18 clarification supersedes only the earlier instruction to make
internal seams nearly disappear. Cohesion belongs to the tetromino's connected outer
silhouette, not to an undivided flat face: all four unit cells remain clearly legible
inside that silhouette. Shared boundaries use engraved two-tone grooves over the same
material base, while a consistent top-left light direction gives each unit a shallow
raised face. A board-well gap between same-piece cells, four detached tile shadows, or
four independent outer boxes is still rejected.

The user's later 2026-07-18 refinement treats the current composition as substantially
complete and opens no page redesign. It authorizes only two controlled changes:

- shorten the shared grounded lock window from 30 to exactly 18 fixed ticks (about
  300 ms at 60 Hz), while preserving the existing movement/rotation reset semantics
  and reset cap;
- brighten the coordinated page, surface, state, and piece palette into the exact
  `雾昼矿物` tokens below. Technology must come from the existing measured grid,
  semantic dividers, typographic rhythm, focus states, and restrained phase motion,
  not from a dark theme, neon, decorative telemetry, or new interface machinery.

The subsequent start-flow refinement adds one functional layer without reopening the
page design. After a player activates Classic or Survival `开始`, or activates `开始` for a
selected Puzzle level, the game shell appears with a centered `3`, `2`, `1` countdown.
Each number occupies exactly one second. The runtime remains in its deterministic
`ready` state throughout the countdown: gravity, elapsed ticks, audio events, keyboard
commands, and touch commands cannot start or mutate the run early. Immediately after
`1`, the overlay is removed, input is enabled, the public runtime start path is called
once, and board focus is restored. Pause/resume, restart, and replay do not create a
second entry countdown. Reduced-motion removes digit transform/opacity animation but
does not shorten or skip the three-second preparation window.

The user's later 2026-07-17 review also rejects the complete second frontend
presentation at `c9135f3252abfa3bd6d7e94c5eb2e11fc3c72a18`. It is not a visual baseline
that can be accepted through local polish. The new authority is light neo-tech
minimal: technology is expressed through exact proportions, fine edge light, clear
state changes, and one restrained motion signature rather than decorative machinery.
The accepted lifecycle, accessibility, rule binding, and detached
`structuredClone` QA snapshot fix in `c9135f3` remain behavioral requirements and
must not regress. Independent review also found 8–11 px mobile statistics and legacy
`路线` copy; both must disappear in the replacement rather than be patched in the
rejected presentation.

The user's later 2026-07-17 direction extends the accepted neo-tech foundation before
release:

- the player-facing `马拉松` name becomes `经典`; the internal deterministic mode key
  remains `marathon` only for compatibility and is never player-facing;
- the seven pieces use an original multi-hue mapping rather than seven near-equal
  cyan/blue fills or the standard commercial piece-color mapping;
- Puzzle contains exactly fifteen all-enabled original levels for this milestone;
- every authored starting board is visibly multi-colored while its color assignment
  stays independent from gameplay randomization and never changes collision geometry;
- the nine new levels strengthen the existing topology and multi-route proof instead
  of duplicating or recoloring the first six.

The user's subsequent review of frontend candidate
`248ca89551ce1293abe88e651c9953e132c816be` rejects its visual finish while preserving
its behavior and responsive information architecture. The page must feel more premium,
and the current muted, double-outlined rounded minos are specifically rejected as ugly.
The latest authority is therefore:

- every piece color is bright, saturated, and clearly separated from the other six;
- the rendering language is a precision luminous slab, not a candy, ceramic, mineral,
  jelly, or plastic tile;
- higher perceived quality comes from hierarchy, controlled translucent depth, one
  spectral cyan-to-blue rail, and reduced component repetition, not dark neon, a
  marketing hero, decorative English telemetry, or copied trade dress;
- all accepted rules, fifteen-level bindings, selectors, accessibility, responsive
  geometry, and lifecycle proofs from `248ca89` remain mandatory.

The user's final color clarification explicitly removes the earlier cyan/green-only
page limitation. The premium page theme is `spectral glass light`: a cool near-white
base with disciplined cyan, cobalt, violet, and small coral state accents. It is not a
dark neon theme and not an unstructured rainbow.

- Base page: cool ice `#F5F7FF`; primary ink `#081426`; muted text `#52627A`;
  cool hairline `#B9CBE4`; translucent surfaces remain near-white.
- State accents: cyan `#00BFC8`, cobalt `#4767F5`, violet `#8A5CF6`, and coral
  `#FF5B7C`. Classic uses cyan-to-cobalt, Race uses cobalt-to-violet, and Puzzle uses
  violet with coral only as a small selection signal.
- The single signature rail is `linear-gradient(90deg, #00BFC8, #4767F5, #8A5CF6)`.
  CTA and focus treatments may use adjacent stops from this rail; they do not mix all
  four accents on every component.
- The background may use at most three broad, very-low-opacity cyan, violet, and coral
  light fields. It still has no repeating page grid, scanline, noise texture, or
  decorative technical coordinates.
- Gameplay piece colors remain the separate bright luminous-spectrum mapping below;
  UI state color never remaps a tetromino material.

The user's latest 2026-07-17 review rejects the resulting local Slice I checkpoint
`e552b3c86e59b801f6d69045a94211e3f1c97e34`. It remains an unpushed historical
checkpoint and is not eligible for QA, evidence, changelog integration, or push. The
following authority supersedes every conflicting bright-spectral, glass, salted-color,
and verbose-copy rule below:

- the complete page and piece palette becomes one natural, mutually compatible deep
  `暮海矿物` spectrum; darker color must create tension through controlled value and
  proportion, not neon glow, black-on-rainbow contrast, or unrelated accent colors;
- minos become matte anodized plates with restrained tonal variation. The bright
  plastic/candy fills, blurred active aura, glass blur, colored ambient light fields,
  gradient CTA fills, and luminous locked-cell treatment are rejected;
- every Puzzle starting board is an authored endgame generated from a frozen legal
  tetromino stacking history. Per-cell salted recoloring and randomly excavated masks
  are forbidden; every initial cell inherits the type and material of the exact source
  tetromino that formed it;
- all fifteen masks, state hashes, and thirty solution references are regenerated.
  Existing IDs, order, and gameplay seven-bag seeds stay stable, but the earlier mask
  and route compatibility promise is explicitly superseded;
- visible copy is reduced to names, controls, score/statistics, and the immediate
  objective. Repeated explanations of ordinary falling-block play are removed while
  full ARIA labels remain available to assistive technology.

The deterministic architecture integrated at
`4c8582854088695ebac90467842dc2bc0cef3a20` remains the rule baseline. The rejected
T4 candidate `dd7e31ea3547c18a797b2308f04161310d1412ce` remains in history but is not
an accepted visual baseline. Its uncommitted follow-up is preserved on local branch
`codex/tetris-t4-rejected-preservation` at
`1362c664629b2a83f0659f836259b84c21750fee`.

T3/T4 screenshots, manifests, reference files, and workstream logs are historical
evidence only. T5 uses new paths and does not rewrite those artifacts.

## Product and architecture invariants

- This is a clean-room deterministic falling-block game for desktop and mobile.
- Delivery remains a browser HTML webpage built by Vite. T5 does not add a native-app
  wrapper, PWA install surface, or packaged application target.
- React owns screen composition and lifecycle. PixiJS owns the board, pieces, preview,
  effects, and frame rendering.
- Gameplay uses one Pixi canvas and no DOM cell grid.
- Core state stays serializable and independent from React, PixiJS, DOM, audio,
  storage, browser timing, and viewport geometry.
- Every DEV/browser diagnostic snapshot must be detached from canonical runtime state.
  Mutating any object returned by a QA collector must not change the live run; no
  collector may expose a writable state reference or state-replacement path.
- There is no Hold mechanic.
- Grounded pieces lock after exactly 18 fixed ticks unless an already-supported legal
  move or rotation resets the timer within the unchanged reset cap. The same shortened
  window applies to Classic, Survival, and Puzzle and remains deterministic.
- Initial entry into a run has exactly one `3`, `2`, `1` countdown. While it is visible,
  the canonical state remains `ready`, every gameplay input is gated, and the runtime
  starts exactly once only after the final second.
- Keyboard and touch expose left, right, clockwise rotation, soft drop, hard drop,
  pause/resume, restart, and an explicit route back to the mode home.
- Restart, mode exit, and unmount must not multiply listeners, tickers, audio nodes, or
  canvases.

## T6 mode rules

### Classic (`marathon` internal key)

- The only player-facing mode name is `经典`; `马拉松` is removed from visible copy
  and accessibility labels.
- Classic is open-ended fixed-speed chain-score survival.
- Gravity is exactly 48 fixed ticks per automatic cell for the complete run. Clearing
  lines and placing pieces never accelerate it.
- Line clears award the fixed base table `40 / 100 / 300 / 1200` for one through four
  simultaneous lines. The first clearing piece starts chain `1`; every immediately
  consecutive clearing piece increases it by one and adds `50 × (chain - 1)` bonus
  points. A locked piece that clears no line resets the chain to `0`. There is no level
  multiplier and no chain bonus in Survival or Puzzle.
- Player-facing statistics are score, cleared lines, and current chain (`连消`).
  `等级` is not displayed or described.
- The run ends only on top-out or explicit player exit.

### Survival (`race` internal key)

Survival is fixed-speed pressure endurance. It shares Classic's 48-tick gravity but
replaces Classic's chain scoring with a board-changing floor hazard.

- The only player-facing name is `生存`; `竞速` and speed-tier copy are removed.
- There is no line target, speed curve, or successful terminal state.
- Seven-bag generation, movement, clearing, base line score, and ordinary top-out
  match normal play. Survival does not use Classic's chain counter or chain bonus.
- For every five cumulative cleared lines, exactly one solid bedrock row rises from
  the bottom. The threshold is cumulative: crossing multiple five-line boundaries in
  one resolution raises the corresponding number of rows.
- A rise occurs after the triggering normal lines have been removed and scored. Each
  rise shifts the entire remaining canonical board upward by one row and appends one
  full bedrock row at the bottom.
- Bedrock is a distinct canonical board-cell material. It blocks movement and locking,
  is visible as one coherent mineral stratum with internal units, and is never returned
  by full-row detection or removed by line clearing.
- If a rise would discard any occupied cell from the canonical top row, the run ends
  immediately as game over before spawning the next piece.
- Player-facing statistics are score, cleared lines, and current bedrock height.
- The run ends only on bedrock overflow, ordinary top-out, or explicit exit.
- Survival leaderboard rows, if retained, are endurance results rather than
  completion-time results.
- All copy and tests referring to “20 行”, “速度档”, Race acceleration, or Race
  completion are removed or migrated.

### Puzzle library

Puzzle is a library of authored board-clearing challenges, not an unlock ladder and
not a finite input-sequence exercise. It changes the starting board and win condition;
movement, rotation, fixed 48-tick gravity, locking, base scoring, line resolution, and
piece generation otherwise follow Classic play.

- All fifteen T5 levels are selectable from first launch. No level row is disabled or
  hidden behind prior completion.
- Numeric difficulty is removed from production definitions and UI. It does not
  control ordering or availability. Completion persistence is informational only.
- The goal remains canonical board empty after ordinary line resolution, including
  the hidden buffer.
- Every level has an empty hidden buffer, a non-empty original 20 × 10 visible board,
  and a stable level seed. That seed drives the shared deterministic seven-bag
  randomizer; the bag replenishes for as long as play continues.
- There is no authored finite queue, piece budget, remaining-piece counter, or
  `failed-budget` outcome. An unsolved run continues until canonical success, top-out,
  restart, or explicit exit.
- Puzzle uses Classic fixed gravity, grounded lock delay, entry delay, soft drop,
  hard drop, and SRS rotation, but not Classic's chain counter or chain bonus. Its
  invisible legacy score/event serialization remains frozen solely for reference
  compatibility. A no-clear lock and a clear both continue through the ordinary
  deterministic spawn path.
- The initial stack occupies 8–12 visible rows and is produced by 16–22 frozen setup
  pieces. It contains all seven piece types, at least seven distinct non-empty row
  shapes, four row-density classes, covered cavities in at least five columns, and at
  least eight buried holes. Repeated floor templates, three or more consecutive rows
  exposing one straight well, and an immediately obvious opening are forbidden.
- Production validation samples the first 84 generated pieces from each level seed and
  proves twelve consecutive complete seven-bags. This is a validation horizon, not a
  gameplay limit.
- Each of the fifteen levels has at least two frozen successful public-command replays for
  the same level seed. Both must clear the canonical board without state injection,
  and their semantic placement streams must differ at five or more locked-piece
  indices by final occupied cell set, landing column, and/or effective rotation. At
  least two intermediate canonical board hashes must diverge before success; a
  different command digest alone is not route diversity.
- Each accepted route uses 30–42 locked pieces, all seven piece types, at least seven
  landing columns, at least eight effective rotations, at least five non-clearing setup
  locks, and at least four separated line-resolution phases. Paired routes differ at
  five or more semantic placement indices, diverge no later than the fifth lock, and
  produce different canonical board hashes at two or more shared indices. These
  metrics establish nontrivial play; neither replay is presented as a unique or
  optimal answer.
- Authoring/verifier search stops a route after 70 locks as a bounded safety guard. The
  guard is not a production queue, gameplay limit, or player failure condition.
- The engine checks canonical-board-empty success after ordinary line resolution and
  otherwise applies normal top-out rules. Malformed initial definitions fail validation
  rather than creating a special player-facing Puzzle failure.
- References initialize through `createInitialState(level.seed, "puzzle", level.id)`
  and use public `dispatch` only. No verifier, runtime QA hook, or browser setup may
  construct, replace, or mutate canonical state.
- Every definition owns a separate `setup.seed` and an explicit ordered
  `setup.placements` list of `{ type, rotation, x }`. The declared type must equal the
  next piece drawn from that setup seed. Landing `y` is never authored or injected; it
  is derived by legal gravity and hard drop from the empty canonical board.
- Product meaning: each level is a frozen mid-game snapshot from a difficult seeded
  normal-play trace. The seed supplies the legal bag order and the signed placement
  history supplies the play already performed; neither a seed alone nor a fabricated
  occupancy mask is treated as the authored endgame.
- Setup replay uses ordinary rotation, horizontal movement, and hard drop. It must
  produce no line clear, top-out, hidden-buffer occupancy, overlap, or invalid spawn.
  Every source owner therefore remains exactly four cells whose normalized geometry
  equals the canonical rotation of its declared tetromino. Two source pieces of the
  same type may not share an orthogonal edge in the final setup, so every visible
  same-color connected component is one recognizable legal tetromino.
- `boardRows` is derived byte-for-byte from the frozen setup history. It is not a
  second handwritten authority. `BOARD_COLOR_SALT`, per-cell color draws, runtime mask
  generation, and production random excavation are removed. The separate gameplay
  seed still starts the ordinary continuously replenishing seven-bag and is never
  consumed by setup construction.
- Tests and the reference builder replay every setup from
  `createInitialState(level.setup.seed, "marathon")` through public `dispatch` only,
  then require the resulting board to match the production Puzzle board exactly. The
  pure production board constructor may reuse canonical shapes and collision helpers
  but must not import the engine or create a dependency cycle.
- The fifteen existing IDs, order, names, and gameplay seeds remain stable so the UI
  and informational completion records remain compatible. The old occupancy masks,
  setup colors, route streams, state hashes, reference SHA, and browser evidence are
  invalidated and regenerated under this authority.
- Topology validation normalizes every occupied piece character to one occupancy bit
  before counting distinct rows, densities, holes, or cavities. Color variation may
  never masquerade as geometric difficulty.
- All fifteen normalized masks are unique and every pair differs in at least 20 of the
  200 visible cells. The signed-in histories are authored and visually reviewed as
  distinct endgame motifs; the authoring/search helper may screen candidates and find
  solutions, but production never generates a board at runtime. A copied mask,
  recolored duplicate, random hole field, or one-obvious-answer opener is rejected.

## T5 `雾昼矿物` precise-light visual direction

The accepted visual target is the existing precise interface re-toned into one bright,
cool mineral daylight spectrum. The page and panels become light; the board well stays
deep so piece geometry remains dominant. This replaces the dark-shell dependency
without changing composition or returning to Aqua Blueprint, rounded ceramic, bright
spectral glass, or plastic luminous slabs. The only player-facing brand is `Tetris`
set as ordinary text in the product type system.

- Technology comes from measured spacing, crisp structural planes, semantic divider
  logic, restrained mineral state colors, functional feedback, and disciplined
  composition. It does not come
  from CAD, dashboards, decorative telemetry, generic neon futurism, or unrelated
  rainbow accents.
- Remove the custom brand glyph, `青流方阵`, `AQUA ROUTE`, coordinates, route lines,
  blueprint grids and ticks, diagonal bands, clipped corners, decorative numbering,
  all-caps engineering labels, oversized slogans, and the rejected stepped mode bands.
- Also forbid scanlines, repeating grids, decorative particles, toy/glass candy or
  plastic blocks, marketing heroes, settings-row layouts, floating-card piles,
  backdrop blur, colored ambient blobs, and technical English used only as decoration.
- Do not imitate an official Tetris logo, multicolor wordmark, commercial font,
  existing product composition, commercial level screen, or other trade dress.
- Per the user's earlier direction, `index.html` remains unchanged as the required
  Vite entry document; it already provides the browser HTML shell and `Tetris` title.
- The only ornamental motion signature is a 2 px teal-to-blue-to-violet `phase seam`: about
  72 px while idle, extending once on selection or focus over 220 ms. It never loops,
  and reduced motion switches state immediately.

### Palette

| Role | Token |
| --- | --- |
| Page | `#DCE7F2` |
| Main / raised / selected surface | `#F7FAFD` / `#EAF1F7` / `#DCE8F2` |
| Board well | `#0B1726` |
| Primary / secondary text | `#14243A` / `#52677F` |
| Line / structural edge | `#B5C5D5` / `#879DB3` |
| Classic / Survival / Puzzle / selection | `#357F78` / `#526EB0` / `#80639D` / `#A75E71` |
| Action / hover / focus / action ink | `#315F96` / `#3D70A8` / `#245E9C` / `#F7FAFD` |
| Success / failure | `#3F7F5D` / `#A64E61` |

The only page gradient is the signature
`linear-gradient(90deg, #357F78, #526EB0, #80639D)` phase seam. Buttons use solid
colors. Primary text on the main surface measures 14.93:1, secondary text 5.56:1,
and action ink on `#315F96` measures 6.25:1. The `#B5C5D5` divider is only a
non-essential separator; selection, focus, and error states always add a stronger or
non-color cue.

### Typography, surfaces, and piece language

- Load the open-source Google Fonts pairing `Space Grotesk` + `Noto Sans SC` from CSS,
  not `index.html`. The frozen CSS v2 request is
  `https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap`.
  `Space Grotesk` owns Latin text, the plain `Tetris` title, `Next`, and tabular-style
  numerals; `Noto Sans SC` owns Chinese glyphs. Both fall back through Segoe UI /
  Microsoft YaHei UI / PingFang SC / system sans so a blocked font request remains
  readable, does not create blank text, and preserves the responsive geometry.
- The page uses solid light cool structural planes around one deep board well. It has
  no colored ambient field,
  `backdrop-filter`, repeating grid, measurement mark, grain, diagonal stripe, route
  diagram, gradient CTA, or glow shadow.
- Only the main page/game container may use the restrained `0 18px 44px
  rgba(31, 59, 86, .14)` depth. Internal regions rely on one-pixel structural edges,
  spacing, and tone rather than repeated shadows.
- Primary surfaces use 12–18 px radii. Buttons, action sheets, the board, and cells
  have no clipped corners; nested large pill/card stacks are forbidden.
- Every tetromino uses one joined `matte machined mineral` base: the existing
  135-degree two-stop field remains within about 8% lightness difference and
  orthogonally adjacent same-material cells bridge the board-well gap. The connected
  component therefore owns one uninterrupted outer silhouette rather than four
  detached plates. Different materials retain their narrow well-colored separation so
  dense残局 remain readable.
- Every shared unit boundary remains visibly divided by one engraved two-tone seam.
  The material-edge groove is 0.85–1.35 px at 58–76% alpha; a 0.45–0.8 px lower/right
  lip uses `innerEdge` at 22–34% alpha. Seams cover the complete shared edge exactly
  once, never open through to the board well, and never become four complete cell
  outlines.
- Spacing establishes the hierarchy: separate material components retain a board-well
  channel at least 1.6 times the perceived width of an internal engraved seam. The
  external channel is therefore read before the finer internal division. Active and
  Next pieces use their exact canonical four-cell component; authored Puzzle source
  pieces already remain separate same-material components by contract.
- Depth uses one consistent top-left light direction at two scales. The joined outer
  perimeter uses a 1–1.6 px light top/left and dark bottom/right bevel. Each unit face
  adds an inset 1–2.25 px light top/left and dark bottom/right chamfer over the joined
  base, so cells are readable as shallow raised facets within one piece. There is no
  white specular bar, thick lower lip, emboss texture, glow, blur, glass, detached
  shadow, universal black stroke, or plastic/candy gloss.
- Active and Next pieces group their exact four canonical cells. Active replaces the
  locked outer contour with one higher-contrast signal contour; it never adds a second
  perimeter. Locked-board grouping joins only orthogonally adjacent cells with the
  same material. Authored Puzzle setup guarantees those initial same-material
  components are exact source tetrominoes; later line clears may naturally split a
  contour and same-material contacts may naturally merge it without changing Core.
- Ghost uses zero fill and one complete 1 px signal outline around the whole active
  tetromino perimeter at about 45% alpha. Its shared cell boundaries remain as one
  lower-alpha guide per seam, but they do not close into four independent boxes. The
  lock response remains an 80–100 ms low-alpha face change and never draws a second
  outer border.
- Board, Next, canonical silhouettes, active cells, and locked cells use the same
  exact material mapping and cohesive component principle. Board and Next share the
  same Pixi group primitive. The silhouette keeps at most one path per piece type,
  substantially closes the old per-cell gaps, and uses only a hairline seam so the
  tetromino geometry reads before the individual grid units.
- The coordinated mineral mapping below deliberately differs from the standard
  commercial piece-color assignment. Garnet, sea-pine, ochre, storm blue, moss,
  rock violet, and lake blue share one restrained value/chroma envelope; no one piece
  becomes a fluorescent or candy accent.

| Piece | Fill start | Fill end | Edge | Inner edge |
| --- | --- | --- | --- | --- |
| I | `#C85A72` | `#B14F65` | `#713443` | `#E69AAA` |
| O | `#47AAA1` | `#3C918A` | `#245B57` | `#91D4CF` |
| T | `#C58E4A` | `#AD783D` | `#694824` | `#E8BD83` |
| S | `#647BC0` | `#576DAE` | `#354675` | `#A9B7E3` |
| Z | `#83AA57` | `#6F914A` | `#425A2B` | `#BCD79A` |
| J | `#9A65B1` | `#87579E` | `#553663` | `#CFA9DC` |
| L | `#4D91AD` | `#407D99` | `#295567` | `#95C8D9` |
- Every fill endpoint has at least 3:1 non-text contrast against the `#0B1726` board
  well; the measured range is 3.34:1–6.74:1.
  Active/locked distinction cannot depend
  on glow or color alone.
- Board and Next reuse the exact drawing primitive. Page entrance is 180 ms over at
  most 4 px; line clear is one local 120–160 ms tonal sweep. No ornamental animation
  loops, and reduced motion removes positional and sweep transitions immediately.

## Information architecture

### Mode home

- The webpage opens on a dedicated mode home with no gameplay board.
- The mode home and Puzzle library do not mount a runtime or canvas. Entering a run
  creates one runtime/canvas; returning home destroys both before showing the home.
- A compact `Tetris` header and one `选择模式` heading lead directly to `经典`, Survival,
  and Puzzle. There is no poetic or marketing hero.
- The three entrances share one continuous 1+2 mode surface: Classic occupies the
  complete first row, with Survival and Puzzle as two independent complete buttons in the
  second row. One-pixel dividers and selected-state tone establish grouping; they are
  not three floating cards or a settings list.
- Every mode entrance keeps its complete action label and rounded arrow control inside
  the shared surface at all required viewports. In particular, 844 × 390 DPR3 must
  satisfy `scrollWidth <= clientWidth` for each mode button and action cluster; the
  right edge may not be hidden by the surface's clipping boundary.
- The standalone selected-mode preview pane and its explanatory copy are removed. A
  small original four-cell signal may live inside a mode entrance, uses the same
  matte-plate language, and never becomes a logo or looping hero.
- Visible home copy is frozen to `Tetris`, one `选择模式`, the three Chinese mode
  names, and these terse factual lines: Classic `分数 · 消行 · 连消`, Survival
  `每 5 行 · 基岩上升`, and Puzzle `15 关残局 · 清空棋盘`, plus `开始` / `选关`.
  `当前选择`, `三种玩法`, `随时开始，也可随时退出。`, `键盘与触控均可操作`,
  full-sentence rule explanations, decorative numbering, and redundant brand labels
  are removed from the visible home.
- Mode selection is not a small rail beside the board.

### Puzzle library

- Every level entry is enabled and shows only its ordinal, name, and optional
  completion status.
- It does not show numeric difficulty or lock state.
- The library is one continuous surface with fifteen complete enabled entries and one
  selected-level detail/start region. Desktop and 844 × 390 use a 3 × 5 matrix plus
  the existing right-side detail. At 360/390 widths the level matrix uses two columns
  and the selected detail stays in normal flow outside the level items. Library-page
  scrolling is allowed on narrow portrait; gameplay page scrolling is not. No layout
  is a pile of floating cards, pagination, or a difficulty/unlock ladder.
- If a level silhouette is shown, it is read-only derived from the existing canonical
  initial board as one SVG with at most one bounded path per piece type. It is not a
  DOM gameplay grid and must not duplicate or modify Puzzle definitions.
- No sticky or fixed selection panel may cover a level row. Visible library copy is
  only `Tetris`, `解谜`, back, ordinals, level names/completion, one selected-board
  silhouette, `目标  清空棋盘`, and `开始`.
- Remove the repeated row-level `清空棋盘`, the library explanation paragraph,
  `当前选择`, visible `起始棋盘`, `连续七袋方块 · 不限定唯一解法`, and the separate
  `方块` / `规则` definition rows. Full accessible labels may still describe controls
  and state without duplicating that prose visually.
- Starting a level must keep the visible selection, canonical `puzzleId`, level seed,
  active piece, and Next preview aligned.

### Game screen

- Top actions provide mode-home exit, current mode, and pause.
- Desktop uses one coherent game surface: the board is the dominant element and one
  flat 200–240 px information dock contains Next, statistics, and compact keyboard
  controls. It does not return to detached side cards.
- Mobile uses a compact information band above the board and a five-action deck below.
- The five actions belong to one integrated control deck with shared edges and clear
  pressed/focus state, not five floating pills or tiles.
- The visible focus ring maps to the board frame rather than outlining the full-page
  Pixi canvas. The canvas may still cover the complete arena so it can render both the
  board and Next against DOM geometry anchors.
- Pause, exit confirmation, success, and failure use accessible light action sheets
  with buttons at least 44 × 44 CSS px.
- Survival shows score, lines, and bedrock height. Puzzle shows level name, cleared lines,
  placed pieces, the board-empty goal, and one Next item. It never shows a finite
  remaining-piece value or a suggested solution.
- Statistic borders are role-based, never inferred from generic odd/even item rules.
  On the desktop Puzzle dock, the level and objective span both columns and the
  placed/cleared pair shares the middle row. Every internal separator is continuous;
  a half-width dangling line, stray vertical segment, or empty fake quadrant is a
  rendering defect. Compact grids may rearrange the same values only when their
  complete row/column boundaries remain visually coherent. Every statistic article
  exposes an explicit semantic role, and all grid spans/dividers select those roles;
  `nth-child`, `nth-of-type`, `odd`, and `even` are forbidden for statistic geometry.
- Remove visible `本局数据`, long `.mode-rule` explanations, and explanatory pause or
  exit paragraphs. Result copy is limited to `棋盘已清空` plus `X 方块 · Y 消行`,
  `堆叠到顶`, or `生存结束` plus the necessary statistics. Mode/level name, back,
  pause, score/statistics, objective, Next, keyboard map, and the five touch labels
  remain visible.

## Responsive and accessibility contract

- All visible buttons are at least 44 × 44 CSS px; primary mobile controls target
  48 px or larger.
- Canvas focus has a visible 3 px high-contrast focus ring.
- Dialog-like sheets expose a readable title, correct role/label, intentional initial
  focus, Escape/cancel behavior, and focus restoration.
- Mode and state are never communicated by color alone.
- `prefers-reduced-motion` is honored initially and when the media query changes.
  Runtime changes use `GameRuntime.setReducedMotion` and do not rebuild or replace the
  current canonical game state.
- Required viewports: 1440 × 900, 2048 × 1152, 390 × 844 DPR3, 844 × 390 DPR3, and
  360 × 800.
- Mobile visible body copy and touch labels are at least 12 px, statistic labels at
  least 14 px, and statistic values at least 18 px.
- No horizontal overflow, clipped essential text, overlapping modules, or accidental
  gameplay page scroll.
- At 360 × 800, Puzzle statistics show the complete visible goal `清空棋盘`; it may not
  be ellipsized, clipped, or made to fit by shrinking the value below 18 px. A narrow
  override may redistribute the two statistic columns while preserving their shared
  surface and the 390 × 844 / 844 × 390 layouts.
- Generated JSON and checksum evidence uses explicit LF bytes before hashing so every
  entry in `SHA256SUMS.txt` matches the corresponding raw Git blob on Windows and
  non-Windows checkouts.

## Implementation ownership and sequence

1. Coordinator freezes this contract and exact path boundaries.
2. Puzzle Slice J replaces all fifteen boards with frozen legal zero-clear setup
   histories, regenerates thirty routes/references, and changes no frontend path.
3. If the signed references invalidate an internal browser-QA replay, Slice J-R may
   replace only that replay's frozen placement fixture and its direct test. This is a
   QA-fixture migration: it does not change Puzzle rules, runtime timing, or product
   behavior, and the fixture remains public-command-only.
4. Independent read-only Core/runtime QA verifies the exact Slice J candidate range.
5. Frontend Slice K owns the `暮海矿物` theme, matte renderer, reduced visible copy,
   and related presentation tests. It changes no Core definition or reference.
6. Coordinator runs one combined final typecheck, full suite, build, and browser pass
   after the last product change.
7. Independent read-only functional and visual QA verify the exact combined candidate
   before evidence, changelog integration, or push.

Historical T3/T4 evidence stays unchanged. New reference and browser evidence lives
only under `docs/workstreams/tetris-t5-*` and `docs/qa/evidence/tetris-t5`.

## Acceptance gates

- `npm.cmd run typecheck`;
- complete Vitest suite;
- production build;
- deterministic Survival replay proving the fifth cleared line raises one permanent
  bedrock row, later thresholds accumulate, bedrock never clears, and overflow ends
  the run;
- all fifteen Puzzle levels, two distinct successful public-command routes per level,
  restart/hash determinism, normal automatic gravity, grounded locking, continuous
  seven-bag replenishment, consecutive multi-piece play, and exact regeneration from
  legal zero-clear setup histories;
- each setup replay uses public commands from an empty canonical board, derives every
  landing row by hard drop, preserves each source owner as four canonical cells, and
  proves initial cell type/color equals source tetromino type with no random per-cell
  recoloring;
- first-84-piece seven-bag integrity for every level seed with no queue exhaustion or
  budget terminal;
- UI-driven evidence selects modes and levels through visible controls;
- plain-text `Tetris` is the only visible brand; `青流方阵`, `AQUA ROUTE`, blueprint
  coordinates, technical column labels, grids, ticks, scanlines, clipped corners,
  route decoration, stepped bands, ceramic/jelly cells, and toy visuals are absent;
- all three mode entries are visible without scroll at 1440 × 900 and 390 × 844;
- the home is one coherent 1+2 mode surface and the `phase seam` is its only
  ornamental motion;
- the mobile Puzzle selector has no overlay covering any level content;
- coordinated deep mineral matte minos, clearly divided raised unit facets, zero-fill
  whole-silhouette Ghost with internal guides, and Next share one drawing primitive;
  rejected detached tiles, bright plastic, blurred aura, double outer outline,
  toy/candy, cut-corner, ceramic, highlight-bar, thick-lip, and bracket-ghost styles
  are absent;
- the page uses the exact `雾昼矿物` solid tokens, no backdrop blur, ambient color
  blobs, gradient CTA, glow shadow, or page gradient outside the single phase seam;
- visible home/library/game copy matches the frozen minimal lists above. Repeated
  gameplay explanations and the banned strings `当前选择`, `三种玩法`,
  `随时开始，也可随时退出。`, `键盘与触控均可操作`, `本局数据`, and the long
  library/rule descriptions are absent;
- player-facing copy contains no legacy `路线`; use `解法`, `本局`, or `对局` only when
  that meaning is actually needed;
- computed mobile body, statistic, and touch-label sizes are recorded by browser
  evidence rather than inferred only from CSS declarations;
- the complete 360 × 800 Puzzle goal text `清空棋盘` is visibly present and its rendered value
  has `scrollWidth <= clientWidth` without lowering the 18 px statistic-value floor;
- at least one Puzzle scenario after three consecutive locks, with visible/canonical
  level, active piece, placed-piece count, and Next preview aligned;
- mode-home → game → mode-home → game proof with no canvas/ticker/listener leaks;
- direct regression proof that nested mutation of every DEV QA state snapshot leaves
  canonical runtime state unchanged;
- one gameplay canvas, zero gameplay DOM cells, zero console/page errors;
- keyboard, touch, pause/resume, restart, explicit exit, failure, success, and reduced
  motion verified at required viewports.

A nonblank screenshot, internal QA state injection, mock terminal state, copied level
layout, or copied frontend treatment is not acceptance evidence.
