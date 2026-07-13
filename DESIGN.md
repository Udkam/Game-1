# TIDE//RELAY Design Contract

## Intent

`TIDE//RELAY` is an original browser endless runner about carrying a star-map core across a storm-flooded astronomical observatory. Fidelity means the continuous chase rhythm, readable third-person danger, swipe grammar, acceleration, and immediate feedback of a classic mobile runner. It does not mean duplicating Temple Run trade dress or content.

## Aesthetic direction

The signature gesture is a cyan-white meridian seam running through every basalt causeway. It pulses with speed and forks before turns.

- Void navy `#06141c`: sky, ocean, and deep fog.
- Basalt `#17272b`: road and structural masses.
- Porcelain `#d8e0da`: runner highlights and broken observatory shells.
- Verdigris `#2c827c`: oxidized instruments and rails.
- Signal cyan `#87f1dd`: route seam, pickups, and positive feedback.
- Hazard coral `#ff705a`: danger edge accents only.
- Brass `#b49758`: restrained antique detail.
- HUD ink `#eaf6f0`: high-contrast interface copy.

Geometry is low-poly but authored: beveled basalt, wet bronze, porcelain cuts, distant lightning, ocean fog, and rigid celestial instruments. Bloom, fog, and particles support depth but never hide path edges or obstacle silhouettes.

## Technology and boundaries

- React 19 + TypeScript + Vite for the application shell.
- Three.js/WebGL for the world, character, camera, particles, and effects.
- Deterministic, serializable simulation under `src/game/core`.
- Fixed 60 Hz runtime with bounded catch-up and interpolated presentation.
- Procedural WebAudio with a bounded voice pool; no copied audio.
- Local storage only for settings and best score, outside canonical state.
- Vitest for rules/runtime tests and Python Playwright for browser evidence.

## Camera and composition

- Perspective camera FOV starts at 47 degrees and may ease toward 53 degrees at maximum speed.
- The runner stays near 68% of screen height with at least 2.3 seconds of readable path ahead.
- Lane shifts complete in about 180 ms with a small camera lag.
- A jump lasts about 650 ms; camera follows at most 18% of vertical travel.
- A slide lasts about 520 ms; camera lowers by no more than 6% of runner height.
- A 90-degree turn uses a 320 ms monotonic yaw transition that keeps old and new path visible at midpoint.
- Collision impact is one 70 ms directional impulse plus a short recovery, not continuous shake.
- Reduced motion disables shake, FOV breathing, speed streaks, and decorative particles.

## Gameplay presentation

- Runner: narrow courier silhouette, split coat tail, cyan core on the back, visible leg cycle, grounded contact shadow.
- Pursuer: abstract black-tide fracture and mist, never a monkey or animal imitation.
- Collectible: translucent triangular signal shard, never a round gold coin.
- Jump obstacle: fallen surveying beam with coral cut faces.
- Slide obstacle: low astronomical ring.
- Lane obstacle: broken porcelain/bronze column.
- Gap: missing basalt span with a clearly lit far lip.
- Shield: orbiting meridian lattice around the runner.

## Interface

- Ready screen: title, short premise, primary start action, best distance, controls, accessibility settings.
- Running HUD: distance left, flow multiplier center, shards and pause right; no large opaque panels over the route.
- Pause: simulation frozen, route remains visible and desaturated.
- Failure: `SIGNAL LOST`, final distance, score, shards, best, and restart.
- Desktop: keyboard controls plus optional visible action buttons.
- Mobile: full-screen gesture surface, safe-area pause button, compact HUD, and a one-time gesture legend.

## Input

- Left/right or A/D: lane shift; within a turn window, submit that turn instead.
- Up/W/Space: jump.
- Down/S: slide.
- Escape/P: pause.
- R: restart only from ready, paused, or game over.
- Mobile swipes use dominant-axis CSS-pixel displacement and velocity. A gesture can dispatch only one action.
- Buttons and gesture starts are isolated so UI presses cannot leak into runner swipes.

## Accessibility and responsive behavior

- One semantic `h1`, logical landmarks, visible keyboard focus, and restrained `aria-live` status.
- HUD text meets WCAG AA and hazards have shape/pattern cues.
- Every mobile target is at least 44 CSS px and respects safe-area insets.
- Desktop, portrait 390 x 844, and landscape 844 x 390 must show the full actionable route without horizontal overflow.
- Canvas has an accessible label; gameplay world objects are never represented as DOM lists.

## Performance budget

- Desktop scene-preparation CPU p95 below 8 ms; mobile below 12 ms.
- Normal desktop draw calls at or below 60 and visible triangles below 150k.
- Mobile DPR is capped at 1.75; expensive shadows and decorative particles scale down.
- Retain a bounded course window and reuse or dispose Three.js resources.
- WebAudio voices are capped at 16.
- Headless rAF timing is diagnostic only; a fixed-workload CPU benchmark is the automated performance gate.

## Non-goals

- Accounts, ads, purchases, online leaderboards, multiple characters, a shop, licensed music, or copied assets.
- A complete reproduction of every commercial level theme, power-up, achievement, or meta system.
- Tilt-only steering; keyboard and one-finger gestures are the primary controls.
