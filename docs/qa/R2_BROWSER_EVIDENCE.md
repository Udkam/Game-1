# R2I browser evidence

## Candidate and scope

- Source implementation: `4c102b04a775d9ad2583f6edc03eb39dd1501387`
- Evidence commit: `pending-evidence-commit-self-reference-not-embedded`
- Parent source chain: `13980b18ee7cc61b11b78be08f09e03b185f0812 -> 4c102b04a775d9ad2583f6edc03eb39dd1501387`
- Scope: deterministic R2 recursive-transfer presentation evidence only. It is not a QA acceptance, release decision, completion claim, V2 material/composition acceptance, V3 retained/performance acceptance, or V4 responsive/accessibility acceptance.

## Environment and verification

- OS: Windows 11 `10.0.26100`; Python `3.12.0`.
- Browser: system Chrome `150.0.7871.115` at `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`.
- Capture server: one owned Vite server at `127.0.0.1:5175`, stopped after capture.
- Every capture used a fresh Chrome context and page, `1440x900` CSS viewport, DPR `1`, renderer resolution `1`, `1440x900` backing canvas, and a `1440x900` PNG.

| Gate | Result |
| --- | --- |
| `npm.cmd ci --no-audit --no-fund` | Pass; 11 s |
| `npm.cmd run typecheck` | Pass |
| Whole Vitest suite | Pass; 40/40 suites, 120/120 tests; one JSON-reporter run |
| `npm.cmd run build` | Pass; existing Vite chunk-size advisory only |
| Browser hard gates | Pass for all 12 frames and all six continuity comparisons |

The terminal wrapper detached from the single Vitest run, but its persisted JSON report at `C:/Users/Alex Chen/AppData/Local/Temp/game1-r2i-evidence-vitest-9397e4b4fdc74114b5b13fadb647a92a.json` recorded success with no failed suite or test; exited workers and the report were checked before proceeding. No replacement exhaustive run was launched.

## Capture protocol

The dev-only R2 QA surface ran real public-command traces with a stopped ticker, normalized controller progress, and an explicit Pixi render before each readiness publication. All frames reported `status: "ready"`, `tickerRunning: false`, matching explicit/current render revisions, one canvas, zero gameplay DOM descendants, zero console/page/request/WebGL problem events, accepted result/transaction data, and `transferEventPortReady: true`.

| Case | Real command trace | Hash transition |
| --- | --- | --- |
| push-in | `Step(right)` | `4997d7ad -> 2672d1d4` |
| undo-push-in | `Step(right), Undo` | `2672d1d4 -> 4997d7ad` |
| push-out | `Step(left), Step(left)` | `1b504553 -> 3753222e` |
| undo-push-out | `Step(left), Step(left), Undo` | `3753222e -> 1b504553` |

The browser object has no extra mutable lock field. At progress below 1 it reported the same pre-completion transaction presentation; the controller FIFO/input-lock behavior is covered by the single whole-suite run.

## Frame and raster gates

At `0`, only the source endpoint rendered; at `1`, only the destination endpoint rendered. Both endpoint frames had zero transfer carriers and zero aggregate impacts. At every `0.5` frame, both endpoint payload primitives were non-renderable, exactly one filled carrier and one aggregate impact rendered, and the carrier count equaled the renderable transfer diagnostics count. The aggregate impact aperture structurally equaled the exact core event-port container; no inferred entity-only or delimiter identity was used.

The structured diagnostics retained complete source, destination, event-port, aperture-container, and carried-root addresses. They also recorded root/screen/clipped geometry. Every frame had unique world/occurrence addresses, with diagnostics counts matching the visible records and no stale duplicates.

All four midpoint frames passed the clipped/raster gate for a real parent shell/rim, active child rim and floor, exact aperture rim, actor, payload carrier, and carried world. Samples were taken from ancestor-mask-plus-viewport-clipped regions on the authored canvas, rather than accepting generic bounds or a nonblank image as evidence.

## Continuity

All comparisons used a `<= 0.5 CSS px` tolerance for camera, world, aperture, actor, carrier payload, and carried-world geometry. Every comparison had the same metric keys and passed.

| Pair | Maximum CSS-pixel delta |
| --- | ---: |
| push-in `100` = undo-push-in `00` | `5.33e-15` |
| push-in `50` = undo-push-in `50` | `7.11e-15` |
| push-in `00` = undo-push-in `100` | `3.55e-15` |
| push-out `100` = undo-push-out `00` | `1.14e-13` |
| push-out `50` = undo-push-out `50` | `1.42e-14` |
| push-out `00` = undo-push-out `100` | `5.68e-14` |

## Screenshot hashes

| Screenshot | SHA-256 |
| --- | --- |
| `push-in-00.png` | `ac95a7cb2ef2feba76cc0ff9775418e59a048f07c1ff804bb53c86f661aee794` |
| `push-in-50.png` | `614f525fe7520185e23bd5d49d22e134f0825ea3e95a83b7522cea3b3e9ea42f` |
| `push-in-100.png` | `56ec8b92d597f4bffbc50a646e66845e7488b34a8a05c5e55a661a6846150fe6` |
| `undo-push-in-00.png` | `6679276c356fc5cb17dafa24fe868ae46e143cfac5590b8894100c5e0c98ac57` |
| `undo-push-in-50.png` | `07e0a962e08ee1bf6b1ff997e212d5a80d3aeeddf1bd95741c0808994a396b5b` |
| `undo-push-in-100.png` | `6b08a90d0c766b2b21ea3f63a57a99bb12af943fdc759d27603056b2fd01881f` |
| `push-out-00.png` | `206fc2d74af9e3c5fcf522c97637718f9657ca8c3ee21720cdbbd8bb4684a105` |
| `push-out-50.png` | `4c805de28906e27a1d48aa1ac87797738d1a56a262cec34912ba084c6c435880` |
| `push-out-100.png` | `ed35c57e4aadbe6506224c04713749414144a18e51eaf60ed1df29b0751d7c45` |
| `undo-push-out-00.png` | `f9db88b5758d0cb715389b624e9b1a6599f78028e3ed8a81fe5a8c8e9e5b096e` |
| `undo-push-out-50.png` | `8bc0775124ffc1ce59088bbf8b0e2e3b5b5fe1bd4a662039f1de193e0feebf96` |
| `undo-push-out-100.png` | `f1ad09c9504e5af6606e5ae0c41e7c40f2f9b3ae2775828a8985b3949c1b255f` |

The machine-readable counterpart, `docs/qa/r2-browser-evidence.json`, records the command/result/transaction/hashes, structured addresses, transfer geometry, clipped/raster metrics, per-frame hard-gate results, continuity data, and the same hashes. No official assets or content were used.

## Deferred work

This evidence does not cover or claim V2 composition/material redesign, V3 retained scene graph/performance, V4 DPR cap/mobile/reduced motion/pointer/touch/accessibility/general capture automation, level/content work, serialization, or release readiness.
