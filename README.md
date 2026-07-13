# TIDE//RELAY

An original clean-room third-person endless runner built with React, TypeScript,
Vite, and Three.js. Carry a star-map core across a storm-flooded observatory,
read the meridian, dodge instruments, collect signal shards, and keep ahead of
the black tide.

The project recreates the control grammar and escalating tension of a classic
mobile endless runner without copying commercial branding, characters, art,
music, interface, or source.

The scoped vertical slice is complete on `codex/temple-run`.

## Run locally

```powershell
npm.cmd ci
npm.cmd run dev
```

Verification commands:

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd run qa:browser -- http://127.0.0.1:5173/
```

## Controls

- Left/right arrows or `A`/`D`: change lane; inside a turn window they commit the matching turn.
- Space, up arrow, or `W`: jump.
- Down arrow or `S`: slide.
- Escape or `P`: pause/resume.
- Mobile: one directional swipe emits one matching action.

The opening route teaches lane changes, jumping, sliding, and turning before the deterministic generator takes over. A shield absorbs one collision; shards increase score and flow.

## Evidence

The acceptance contract and exact browser results are in
`docs/qa/TEMPLE_ACCEPTANCE.md` and `docs/qa/temple-browser-evidence.json`.
Final screenshots are under `docs/screenshots/temple/final/`.
