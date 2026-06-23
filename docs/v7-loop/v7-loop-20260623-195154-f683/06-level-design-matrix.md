# Level Design Matrix

This file tracks the final 70-level target, the Stage 5 vertical slice, and the Stage 6 full-catalog buildout.

## Final 70-Level Structure

| Chapter | Target count | Focus |
|---|---:|---|
| 第 1 章：启动序列 | 8 | movement, push, targets, undo, core UI |
| 第 2 章：量子门 | 8 | portals, direction mapping, crate/energy portal rules |
| 第 3 章：同步体 | 8 | multi-actor sync, mirror, delay, different actor properties |
| 第 4 章：时间残影 | 8 | delayed echoes, history windows, simultaneous pads |
| 第 5 章：空间置换 | 8 | cell/room/object swaps and route reconstruction |
| 第 6 章：递归舱 | 8 | lightweight room-in-block recursion |
| 第 7 章：连锁实验 | 8 | chapter state and fair linked consequences |
| 第 8 章：误导协议 | 8 | fair misdirection and reversible traps |
| 第 9 章：终局收束 | 6 | boss puzzles combining multiple mechanisms |

## Stage 5 Verified Vertical Slice

| ID | Title | Chapter | Mechanics | Space | Difficulty | Solver status | Par | Validation |
|---|---|---|---|---|---:|---|---:|---|
| v7-001 | 点火格 | 第 1 章：启动序列 | core-push | open | 1 | verified-replay | 2 | manual-replay |
| v7-002 | 双轨供能 | 第 1 章：启动序列 | core-push | dual-room | 1 | verified-replay | 8 | manual-replay |
| v7-003 | 反向电池 | 第 1 章：启动序列 | core-push | partitioned | 2 | verified-replay | 12 | manual-replay |
| v7-004 | 十字校准 | 第 1 章：启动序列 | core-push, misdirection | symmetric | 3 | optimal | 23 | astar |
| v7-005 | 核心偏置 | 第 1 章：启动序列 | core-push, misdirection | non-rectangular | 3 | optimal | 21 | astar |
| v7-006 | 单向折跃 | 第 2 章：量子门 | quantum-portal | portal-linked | 2 | verified-replay | 4 | manual-replay |
| v7-007 | 双舱门 | 第 2 章：量子门 | quantum-portal, core-push | multi-room | 3 | optimal | 14 | astar |
| v7-008 | 深层折返 | 第 2 章：量子门 | quantum-portal, gate-circuit, misdirection | portal-linked | 4 | optimal | 29 | astar |
| v7-009 | 同步启动 | 第 3 章：同步体 | sync-actors | dual-room | 1 | verified-replay | 2 | joint-state-replay |
| v7-010 | 镜像探针 | 第 3 章：同步体 | sync-actors, mirror-field | symmetric | 2 | verified-replay | 2 | joint-state-replay |
| v7-011 | 双舱握手 | 第 3 章：同步体 | sync-actors, mirror-field, misdirection | dual-room | 3 | verified-replay | 4 | joint-state-replay |
| v7-012 | 残影门闩 | 第 4 章：时间残影 | time-shadow, gate-circuit | partitioned | 2 | verified-replay | 6 | history-window-replay |
| v7-013 | 延迟电桥 | 第 4 章：时间残影 | time-shadow, gate-circuit, core-push | partitioned | 3 | verified-replay | 7 | history-window-replay |
| v7-014 | 回声转角 | 第 4 章：时间残影 | time-shadow, gate-circuit, misdirection | non-rectangular | 3 | verified-replay | 8 | history-window-replay |
| v7-015 | 三拍锁 | 第 4 章：时间残影 | time-shadow, gate-circuit, misdirection | narrow | 4 | verified-replay | 8 | history-window-replay |

Stage 5 status: 15/70 levels implemented and verified. Historical vertical-slice record only.

## Stage 6 Full Catalog Status

Stage 6 status: 70/70 levels are currently exposed by `src/engine/v7Levels.ts` and pass `npm run verify`.

| Chapter | Current count | Status |
|---|---:|---|
| 第 1 章：启动序列 | 8 | count complete |
| 第 2 章：量子门 | 8 | count complete |
| 第 3 章：同步体 | 8 | count complete |
| 第 4 章：时间残影 | 8 | count complete |
| 第 5 章：空间置换 | 8 | count complete, rule-depth review pending |
| 第 6 章：递归舱 | 8 | count complete, rule-depth review pending |
| 第 7 章：连锁实验 | 8 | count complete, rule-depth review pending |
| 第 8 章：误导协议 | 8 | count complete |
| 第 9 章：终局收束 | 6 | count complete, boss-depth review pending |

The authoritative per-level metadata lives in `src/engine/v7Levels.ts`. Advanced chapters 5-7 use verified replay candidates with v7 metadata, but concrete spatial-swap, recursive-room, and chain-state rule hooks still require a later QA/design pass before final product acceptance.

## Required Per-Level Record

```ts
{
  id: string,
  title: string,
  chapter: string,
  mechanics: string[],
  coreIdea: string,
  trick: string,
  fairness: string,
  difficulty: 1 | 2 | 3 | 4 | 5,
  solverStatus: "optimal" | "verified-replay" | "manual-reviewed",
  par: number | null,
  solution: unknown[]
}
```

Any level missing this record does not count toward the 70-level target.
