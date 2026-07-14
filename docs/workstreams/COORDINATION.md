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
| Temple TR3 A4 | `019f6049-a53a-7001-9620-686ea9bad061` | `E:\Proj\Game-1-temple` / `codex/temple-run` | One offline clay correction batch only. It may add A4-named generator/evaluator/output paths and append the four authorized Temple documents; it must preserve A3, road/canyon/material data, runtime, and Git state. | `ACK-TEMPLE-A4-START-001`: scope sent; next acknowledgement waits for `DOCS_UPDATED` or terminal report. |

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
