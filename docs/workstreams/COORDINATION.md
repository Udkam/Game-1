# Active Workstream Coordination

Coordinator thread: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
Protocol version: `2`
Last coordinator review: `2026-07-14`

This register exists because a Codex task can complete without its UI callback becoming
visible in the coordinator task. The durable hand-off is therefore:

```text
worker THREAD_LOG.md REPORT + committed SHA (when applicable)
        -> coordinator read_thread + repository/log inspection
        -> acknowledgement below
        -> next bounded instruction or QA routing
```

No line below authorizes code by itself. `AGENTS.md`, `CURRENT_TASK.md`, the exact
workstream scope, and independent QA still govern implementation and release.

## Required report shape

Every active writer and QA task appends a UTF-8 report to its own `THREAD_LOG.md` before
announcing a milestone. It must use this exact field order:

```text
REPORT <workstream> <sequence> <state>
THREAD <Codex thread ID>
TIME <Asia/Shanghai ISO timestamp>
BASE <SHA or N/A>
PARENT <SHA or N/A>
HEAD <SHA or working-tree>
CANDIDATE <SHA or none>
WRITE_SCOPE <exact writable paths>
DIRTY <exact changed or dirty paths, or clean>
GATES <only commands actually run + results>
EVIDENCE <final artifacts/hashes or diagnostic evidence>
BLOCKER <none or concrete blocker>
NEXT <one bounded next action>
```

Allowed states: `STARTED`, `DOCS_UPDATED`, `GATE_RESULT`, `CANDIDATE_READY`,
`READY_FOR_QA`, `QA_ACCEPTED`, `BLOCKED`, `INTEGRATED`, and `STOPPED`.

The coordinator creates an acknowledgement only after checking the report against the
thread, Git SHA/path range, and any claimed evidence. Missing fields, uncommitted
claims, or scope drift stay `BLOCKED`; silence is never acknowledgement.

## Current register

| Workstream | Thread | Repository / branch | Current boundary | Coordinator acknowledgement |
|---|---|---|---|---|
| Tetris T3 | historical implementation + QA | `E:\Proj\Game-1` / `codex/tetris` | T3 campaign and Mineral Shelf V1 are integrated and pushed in `4c85828`; no product slice is open. | `ACK-TETRIS-T3-001`: reviewed final accepted chain `6fb1728 -> fdd1ffb -> 4c85828`, including final live browser check. |
| Temple TR3 A3 | `019f601a-4900-78e3-8acd-01d3b1a7ce30` | `E:\Proj\Game-1-temple` / `codex/temple-run` | Offline clay proof stopped without a candidate. Existing TR3 dirty files are preserved; no runtime integration, GLB/KTX delivery, browser evidence, commit, push, or QA. | `ACK-TEMPLE-A3-BLOCKED-002` at `2026-07-14T18:55:26+08:00`: coordinator read the corrected terminal log and verified `52ae9ae`, 16 modules, 3 canyon bands, 3,308 triangles, and the fail-closed portrait/closeup pursuer and actor-road-band failures. No A4 is open. |
| Temple A3 visual review | `019f6043-95af-73f0-a29f-18b312e8170e` | `E:\Proj\Game-1-temple` via `E:\Proj` / read-only | Independent review of the failed A3 clay evidence. It may write only its separate review log; it cannot alter A3 or production. | `ACK-TEMPLE-REVIEW-BLOCKED-002` at `2026-07-14T19:01:56+08:00`: verified A3 counts and narrowed A4 to camera framing, pursuer placement/silhouette, and arch/support readability. |
| Temple TR3 A4 | `019f6049-a53a-7001-9620-686ea9bad061` | `E:\Proj\Game-1-temple` / `codex/temple-run` | Closed without a candidate. The one offline clay batch and combined verifier/manual gate are consumed. Existing Temple dirt, A3 evidence, and the unexpected A3 Python cache artifact remain preserved; no retry, cleanup, integration, QA, commit, or push is open. | `ACK-TEMPLE-A4-BLOCKED-003`: see the terminal acknowledgement below; all strict verifier failures remain blocking. |
| Temple TR3 A5 visual review | `019f607b-f5f5-7e31-9d2b-8c8a1578a9c8` | `E:\Proj\Game-1-temple` via `E:\Proj` / read-only except its own workstream docs | Complete planning review; no rendering or production edits occurred. | `ACK-TEMPLE-A5-VISUAL-001`: verified its corrected protocol report and the root-cause contract. Its raster/depth/editability/first-glance gates are binding for A5. |
| Temple TR3 A5 technical review | `019f607c-2f12-7242-b396-9643d50e9ac3` | `E:\Proj\Game-1-temple` via `E:\Proj` / read-only except its own workstream docs | Complete planning review; no rendering or production edits occurred. | `ACK-TEMPLE-A5-TECH-001`: verified its corrected protocol report and recovery plan. Geometry recovery is necessary; camera-only repair is prohibited. |
| Temple TR3 A5 implementation | `019f6086-028d-7560-8f3f-eddfda489694` | `E:\Proj\Game-1-temple` via `E:\Proj` / `codex/temple-run` | Closed without a candidate. The sole offline Blender batch emitted image passes but failed before metadata; the fail-closed evaluator and manual visual gate both blocked the proof. A5 evidence and inherited Temple dirt are preserved unchanged. | `ACK-TEMPLE-A5-BLOCKED-004`: corrected terminal report, artifact hashes, missing metadata, and preservation snapshot were independently verified. No retry, metadata reconstruction, export, integration, QA, commit, or push is open. |
| Temple TR3 A6 preflight | `019f607c-2f12-7242-b396-9643d50e9ac3` | `E:\Proj\Game-1-temple` via `E:\Proj` / `codex/temple-run` | Accepted documentation-only recovery preflight. It establishes source compatibility and structural composition gates, but creates no product/runtime/render authority. | `ACK-TEMPLE-A6-PREFLIGHT-005`: terminal report, exact permitted scope, and preservation against the A5 snapshot were verified. A separate read-only review is required before any later implementation scope. |
| Temple TR3 A6 independent review | `019f607b-f5f5-7e31-9d2b-8c8a1578a9c8` | `E:\Proj\Game-1-temple` via `E:\Proj` / read-only except its own A6-review docs | Active review of the A6 preflight for fail-closed metadata, composition, and clean-room boundaries. It cannot change A6, assets, source, or authorize Blender. | Awaiting a fixed-format `PLAN_COMPLETE` or `BLOCKED` report; no implementation begins before coordinator review. |

## Terminal acknowledgement: Temple TR3 A4

ACK-TEMPLE-A4-BLOCKED-003 — 2026-07-14T19:12:58+08:00

The coordinator verified the terminal thread and Temple TR3 log against base
52ae9ae. All five A4 artifact hashes, 16 modules, 3 canyon bands, 6 semantic
roots, and 3,344 triangles match the report. Source parity passed; the
combined verifier did not: portrait separation was 11.98px (minimum 12px),
road-band overlap was -0.02130 (must be positive), portrait and desktop arch
height were .06472/.11601 (minimum .12), and desktop aperture width was
.06503W (minimum .07W).

A4 is closed without a candidate. Its one Blender batch and one
verifier/manual-review allowance are consumed. No value may be rounded or
visually waived. Existing Temple worktree changes, the A3 evidence, and the
unexpected A3 Python cache file remain preserved. No retry, cleanup,
integration, QA, commit, or push is authorized by this acknowledgement.

## Terminal acknowledgement: Temple TR3 A5

ACK-TEMPLE-A5-BLOCKED-004 — 2026-07-14T20:36:00+08:00

The coordinator verified the corrected A5 terminal report, its exact path
boundary, the terminal thread state, and the declared proof artifacts against
base `52ae9ae`. The tree contains thirteen image passes; the four beauty-image
and verifier hashes match the report. `a5-clay-metadata.json` is absent: the
single Blender 4.5.5 process emitted its image passes, then ended on
`KeyError: materialValues`; the single evaluator correctly fail-closed on that
missing metadata. The log records the one permitted manual inspection, and the
coordinator independently confirmed its visual result.

The inherited-dirty snapshot lists 111 paths. Its four permitted appended
contract files were excluded from preservation comparison; all remaining 107
non-contract paths were rehashed with zero missing or mismatched files. The
visual gate is independently blocked: the route reads as disconnected,
featureless slabs, the pursuer is not legible as behind the courier on the same
route, and the distant arch is undersized. The scene is a clay blockout, not a
shipping-quality canyon composition.

A5 is closed without a candidate. Its Blender and evaluator allowances are
consumed. Do not rerun either, reconstruct metadata from PNGs, export, integrate
runtime code, stage, commit, push, or route the proof to QA. Only a separately
authorized A6 no-render preflight and composition-reconstruction contract may
resume Temple work; it must pass before another render batch is authorized.

## Terminal acknowledgement: Temple TR3 A6 preflight

ACK-TEMPLE-A6-PREFLIGHT-005 — 2026-07-14T20:54:02+08:00

The coordinator read the completed external task and both required terminal
reports. The A6 work stayed within its append-only Temple contract/log paths
and three new preflight documents. Rehashing the A5 inherited snapshot again
found all 107 non-contract paths intact; `git diff --check` is clean. No
Blender, renderer, browser capture, asset generation, product source, test,
build, Git mutation, or QA action was performed.

The contract correctly treats A4 as the only clay-material authority, forbids
the absent `A3.materialValues` lookup, and requires an atomic, typed pure-data
preflight before any future render process. Its composition specification also
turns the A5 visual defects into measurable pre-render gates: a central chase
line, physical road cross-sections, canyon occlusion hierarchy, route-frame
pursuer proof, readable supported arch, and local editable Tide Scar without
semantic overlap. This accepts the A6 documentation as planning input only.

It does not authorize Blender, a preflight implementation, asset export,
runtime integration, QA, commit, or push in the Temple repository. The next
possible action is one separately scoped read-only review of A6, followed only
by an explicit coordinator decision about implementation.

## Coordinator polling rule

For every active external task, the coordinator checks its thread after its initial
documents phase, after a requested diagnostic/gate, and before any QA/integration
decision. If the task is still running, it is allowed to finish its one bounded action;
the coordinator does not create duplicate writers or rely on pinned/UI placement.

If an external task submits a malformed report, the coordinator requests a log-only
correction before accepting the state. The actual Codex thread identity read by the
coordinator prevails over copied text in a report.

## Collision rule

If two tasks claim any same writable file, the later task immediately reports
`BLOCKED` with both thread IDs and performs no merge, rebase, overwrite, or cleanup.
The coordinator resolves scope in this register before any task resumes.
