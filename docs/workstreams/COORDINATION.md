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
| Temple TR3 A5 implementation | `019f6086-028d-7560-8f3f-eddfda489694` | `E:\Proj\Game-1-temple` via `E:\Proj` / `codex/temple-run` | Active one-batch offline clay proof. Its writer alone may append the four Temple contracts and add only A5 generator/evaluator/output paths; it cannot touch production/runtime, old A3/A4 evidence, Git state, or QA. | Awaiting one fixed-format `BLOCKED` or `READY_FOR_VISUAL_REVIEW` report. A visual-review pass, not QA, is the only possible follow-up. |

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
