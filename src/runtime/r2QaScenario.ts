import { Step, Undo, type PublicCommand } from "../core/commands";
import { createSimulationSession, type SimulationSession } from "../core/history";
import type { SimulationState } from "../core/types";

export type R2QaCase = "push-in" | "undo-push-in" | "push-out" | "undo-push-out";

export interface R2QaScenario {
  readonly kind: "scenario";
  readonly case: R2QaCase;
  readonly progress: 0 | 0.5 | 1;
  readonly session: SimulationSession;
  /** Every command is dispatched through the runtime/EventPipeline. */
  readonly commands: readonly [PublicCommand, ...PublicCommand[]];
}

export type R2QaQuery =
  | { readonly kind: "normal" }
  | R2QaScenario
  | { readonly kind: "invalid-query"; readonly reason: string };

/** Strict dev-only composition input for the twelve later R2 evidence frames. */
export function parseR2QaQuery(search: string, isDev: boolean): R2QaQuery {
  const entries = [...new URLSearchParams(search).entries()];
  const hasR2Intent = entries.some(([key, value]) => key === "qa" && value === "r2");
  if (!hasR2Intent) return { kind: "normal" };
  if (!isDev) return { kind: "invalid-query", reason: "qa-is-dev-only" };
  const allowed = new Set(["qa", "case", "progress"]);
  if (entries.length !== 3 || entries.some(([key]) => !allowed.has(key))) {
    return { kind: "invalid-query", reason: "r2-qa-query-must-contain-one-qa-case-progress-tuple" };
  }
  const values = (key: string) => entries.filter(([entryKey]) => entryKey === key).map(([, value]) => value);
  const qa = values("qa");
  const captureCase = values("case");
  const progress = values("progress");
  if (qa.length !== 1 || captureCase.length !== 1 || progress.length !== 1 || qa[0] !== "r2" || !isR2Case(captureCase[0])) {
    return { kind: "invalid-query", reason: "unknown-r2-qa-case" };
  }
  if (!(progress[0] === "0" || progress[0] === "0.5" || progress[0] === "1")) {
    return { kind: "invalid-query", reason: "invalid-r2-qa-progress" };
  }
  const r2Case = captureCase[0];
  const undo = r2Case.startsWith("undo-");
  const pushOut = r2Case.endsWith("push-out");
  // Focused-inside setup first locally pushes the payload onto the declared
  // landing, then performs the actual addressed push-out through that port.
  const pushOutTrace: readonly PublicCommand[] = [Step("left"), Step("left")];
  const commands = pushOut ? pushOutTrace : [Step("right")];
  return {
    kind: "scenario",
    case: r2Case,
    progress: Number(progress[0]) as 0 | 0.5 | 1,
    session: createSimulationSession(createR2QaState(pushOut)),
    commands: (undo ? [...commands, Undo()] : commands) as [PublicCommand, ...PublicCommand[]],
  };
}

function isR2Case(value: string | undefined): value is R2QaCase {
  return value === "push-in" || value === "undo-push-in" || value === "push-out" || value === "undo-push-out";
}

/** Inline synthetic state only; it is never a level/schema or normal selector. */
function createR2QaState(pushOut: boolean): SimulationState {
  const root = "r2-root";
  const inside = "r2-inside";
  return {
    version: 1,
    rootWorldId: root,
    activeWorldId: pushOut ? inside : root,
    playerId: "r2-actor",
    focusPath: pushOut ? ["r2-receiver"] : [],
    ruleSet: {
      version: 1,
      cycleMode: "forbid",
      ruleEnablement: { push: "enabled", enter: "enabled", exit: "enabled" },
      interactionPriority: ["push", "enter", "exit"],
    },
    portTables: [
      {
        containerId: "r2-receiver",
        ports: [
          { id: "r2-port", outerApproach: "right", innerLanding: { x: 2, y: 2 }, innerExit: "left" },
          { id: "r2-entry", outerApproach: "down", innerLanding: { x: 1, y: 1 }, innerExit: "up" },
        ],
      },
      { containerId: "r2-payload", ports: [{ id: "r2-payload-port", outerApproach: "up", innerLanding: { x: 1, y: 1 }, innerExit: "down" }] },
    ],
    worlds: {
      [root]: { id: root, paletteId: "void-lab", size: { width: 8, height: 5 } },
      [inside]: { id: inside, paletteId: "inner-mint", size: { width: 5, height: 5 } },
      "r2-carried": { id: "r2-carried", paletteId: "inner-mint", size: { width: 3, height: 3 } },
    },
    entities: {
      "r2-actor": { id: "r2-actor" },
      "r2-receiver": { id: "r2-receiver" },
      "r2-payload": { id: "r2-payload" },
      "r2-carried-marker": { id: "r2-carried-marker" },
    },
    components: {
      positions: {
        "r2-actor": pushOut ? { worldId: inside, x: 4, y: 2 } : { worldId: root, x: 1, y: 2 },
        "r2-receiver": { worldId: root, x: 3, y: 2 },
        "r2-payload": pushOut ? { worldId: inside, x: 3, y: 2 } : { worldId: root, x: 2, y: 2 },
        "r2-carried-marker": { worldId: "r2-carried", x: 1, y: 1 },
      },
      containers: { "r2-receiver": { innerWorldId: inside }, "r2-payload": { innerWorldId: "r2-carried" } },
      solids: { "r2-actor": { blocksMovement: true }, "r2-receiver": { blocksMovement: true }, "r2-payload": { blocksMovement: true } },
      pushables: { "r2-payload": { pushable: true } },
      players: { "r2-actor": { controlled: true } },
      goals: {},
      visuals: {
        "r2-actor": { kind: "player", width: 1, height: 1 },
        "r2-receiver": { kind: "recursive-container", width: 1, height: 1 },
        "r2-payload": { kind: "recursive-container", width: 1, height: 1 },
        "r2-carried-marker": { kind: "box", width: 1, height: 1 },
      },
    },
  };
}
