# Game-1 Workstream Coordination

This directory contains the durable collaboration record for the Game-1
redesign and implementation workstreams. Thread IDs are the authoritative
communication identifiers; titles are only display labels.

## Threads

| Responsibility | Thread ID | Deep link | Log |
| --- | --- | --- | --- |
| Coordination, integration, and final acceptance | `019f4deb-7e83-7583-8cd5-8e6f075bc331` | `codex://threads/019f4deb-7e83-7583-8cd5-8e6f075bc331` | `docs/workstreams/coordinator/THREAD_LOG.md` |
| Frontend and visual fidelity | `019f4e80-145a-7520-81e1-41a45b2bec13` | `codex://threads/019f4e80-145a-7520-81e1-41a45b2bec13` | `docs/workstreams/frontend-design/THREAD_LOG.md` |
| Recursive gameplay rules and engine depth | `019f4e82-7cb8-73c1-b4a1-d333273b359f` | `codex://threads/019f4e82-7cb8-73c1-b4a1-d333273b359f` | `docs/workstreams/gameplay-rules-engine/THREAD_LOG.md` |
| Level and puzzle design | `019f4e80-145c-7b53-b675-44b03aa4f625` | `codex://threads/019f4e80-145c-7b53-b675-44b03aa4f625` | `docs/workstreams/level-design/THREAD_LOG.md` |
| Independent approval and QA | `019f4e80-1462-7b32-8146-19ded692836c` | `codex://threads/019f4e80-1462-7b32-8146-19ded692836c` | `docs/workstreams/qa-approval/THREAD_LOG.md` |

All workstream threads use `gpt-5.6-terra` with `xhigh` reasoning and the
standard/default speed profile unless the user changes the contract.

## Log Contract

Each workstream log records:

- its thread ID and the coordinator thread ID;
- timestamp and baseline commit;
- decisions and evidence;
- files changed;
- commands, tests, and screenshots;
- commit hashes;
- dependencies, blockers, and handoff notes;
- peer log commit hashes read before cross-workstream decisions.

Worktrees do not automatically share unmerged files. A workstream therefore
reports its commit SHA and log path to the coordinator. Peers read the thread by
ID or inspect the committed log with:

```text
git show <commit>:<log-path>
```

## Authority And Integration

- Worker threads do not push, merge, or edit `docs/logs/CHANGELOG.md` without
  explicit coordinator approval.
- The QA thread remains independent and reviews worker commits by SHA.
- The coordinator accepts or rejects bounded slices, integrates accepted work,
  runs the combined verification suite, and writes the consolidated stage entry
  to `docs/logs/CHANGELOG.md`.
- No implementation slice starts merely because an audit or proposal exists.
  The coordinator must approve its scope first.
- Local `.codex/` and `.serena/` files are not part of workstream commits.
