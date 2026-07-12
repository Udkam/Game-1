import { describe, expect, it } from "vitest";
import { Redo, Reset, Step, Undo, type PublicCommand } from "./commands";
import { hashState } from "./hash";
import { createSimulationSession } from "./history";
import { nextPosition } from "./grid";
import { dispatchPublicCommand } from "./reducer";
import { replayPublicCommands } from "./replay";
import type { CommandResult, Direction, RuleSetR1, SemanticEvent, SimulationState, Transaction, WorldAddress } from "./types";
import { activeWorldAddress } from "./ports";
import { isWinSatisfied } from "./win";
import { createStage3BSimulationState, isPositionInsideWorld, loadSimulationState, resolveWorldAddress } from "./worldGraph";
import { opposite, validateSimulationState } from "./validation";

const MASTER_SEED = 0x51CEB00C;

describe("R2 acyclic recursive-transfer stress", () => {
  it("uses the frozen xorshift32 anchors", () => {
    expect(xorshift32(MASTER_SEED ^ 0)).toBe(2116095627);
    expect(xorshift32(MASTER_SEED ^ 1)).toBe(2116365994);
    expect(xorshift32(MASTER_SEED ^ 999)).toBe(1908512370);
  });

  it("counts R2 transfer profiles only from generated forward runtime commands", () => {
    const profiles = selectR2Profiles();
    const coverage = createR2Coverage();
    expect([...profiles.values()].map((profile) => profile.kind).sort()).toEqual(["candidate-cycle", "gap", "missing-port", "occupied-destination", "ordinary-in", "ordinary-out", "world-in", "world-out"]);
    for (const [caseIndex, profile] of profiles) {
      const caseSeed = xorshift32(MASTER_SEED ^ caseIndex);
      const commands = generateCommands(caseSeed);
      const first = commands[profile.firstStepIndex];
      expect(first).toMatchObject({ type: "step" });
      if (!first || first.type !== "step") continue;
      const prepared = createR2ProfileFixture(caseIndex, generateFixture(caseIndex, caseSeed).ruleSet, first.direction, profile, commands);
      expect(safeLoad(prepared.state).kind).toBe("accepted");
      expect(hashState(createSimulationSession(prepared.state).initialState), profile.kind).toBe(hashState(prepared.state));
      const direct = runDirectOracle(prepared.state, commands.slice(0, profile.outcomeIndex + 1));
      expect(direct.code, profile.kind).toBeUndefined();
      recordR2Coverage(coverage, caseIndex, prepared, direct.results);
      if (profile.kind === "ordinary-out" || profile.kind === "world-out" || profile.kind === "occupied-destination") {
        const localPush = direct.results[profile.firstStepIndex];
        const focused = { rootWorldId: `r2-root-${caseIndex}`, containerPath: [`r2-receiver-${caseIndex}`] };
        expect(localPush).toMatchObject({
          kind: "accepted",
          command: { type: "step", direction: first.direction },
          transaction: {
            rule: "push",
            activeAddressBefore: focused,
            activeAddressAfter: focused,
            events: [{ type: "push-resolved" }, { type: "entity-moved", cause: "push" }],
          },
        });
        if (localPush?.kind === "accepted") {
          expect(localPush.transaction.events.some((event) => event.type === "entity-transferred" || event.type === "portal-traversed" || event.type === "focus-changed")).toBe(false);
        }
        if (profile.kind === "world-out") {
          const priority = generateFixture(caseIndex, caseSeed).ruleSet.interactionPriority;
          expect(priority.indexOf("push")).toBeLessThan(priority.indexOf("enter"));
        }
      }
      const outcome = direct.results[profile.outcomeIndex];
      if (profile.kind === "ordinary-out" || profile.kind === "world-out") {
        if (outcome?.kind !== "accepted" || outcome.command.type !== "step" || outcome.command.direction !== first.direction) throw new Error(`${profile.kind}/${caseIndex}/${JSON.stringify(direct.results)}`);
        expect(outcome?.kind === "accepted" && outcome.transaction.events.some((event) => event.type === "entity-transferred" && event.mode === "push-out"), `${profile.kind}/${caseIndex}/${JSON.stringify(direct.results)}`).toBe(true);
      }
      if (profile.kind === "occupied-destination") {
        expect(outcome).toMatchObject({ kind: "rejected", rejection: { code: "port-parent-destination-occupied" }, activeAddressBefore: { containerPath: [`r2-receiver-${caseIndex}`] }, activeAddressAfter: { containerPath: [`r2-receiver-${caseIndex}`] } });
      }
      if (profile.kind === "candidate-cycle") {
        expect(outcome?.kind).toBe("rejected");
      }
    }
    expectR2TransferCoverage(coverage);
  });

  it("does not count reverse transfer history toward runtime focus coverage", () => {
    const [caseIndex, profile] = [...selectR2Profiles()].find(([, candidate]) => candidate.kind === "world-out")!;
    const caseSeed = xorshift32(MASTER_SEED ^ caseIndex);
    const commands = generateCommands(caseSeed);
    const first = commands[profile.firstStepIndex]!;
    if (first.type !== "step") throw new Error("selected world-out profile has no Step");
    const prepared = createR2ProfileFixture(caseIndex, generateFixture(caseIndex, caseSeed).ruleSet, first.direction, profile, commands);
    const direct = runDirectOracle(prepared.state, [...commands.slice(0, profile.outcomeIndex + 1), Undo()]);
    expect(direct.code).toBeUndefined();
    const coverage = createR2Coverage();
    recordR2Coverage(coverage, caseIndex, prepared, direct.results);
    expect(coverage.worldPushOut).toBe(1);
    expect(coverage.unchangedFocus).toBe(1);
  });

  it("runs 1,000 deterministic fixtures, 3,000 initial-command subcases, and reusable 64-command traces", () => {
    let subcases = 0;
    const profiles = selectR2Profiles();
    const coverage = createR2Coverage();
    if (profiles.size !== 8) {
      throw new Error(`R2 profile selection failed: ${profiles.size}/8`);
    }
    for (let caseIndex = 0; caseIndex < 1000; caseIndex += 1) {
      const caseSeed = xorshift32(MASTER_SEED ^ caseIndex);
      const commands = generateCommands(caseSeed);
      const firstStep = commands.find((command): command is Extract<PublicCommand, { readonly type: "step" }> => command.type === "step");
      if (!firstStep) {
        failStress(caseIndex, caseSeed, { caseIndex, caseSeed }, commands, [], [], "trace-has-no-step", undefined, [], 0);
      }
      let prepared: R2PreparedFixture;
      try {
        const base = generateFixture(caseIndex, caseSeed);
        const profile = profiles.get(caseIndex);
        prepared = profile && firstStep
          ? createR2ProfileFixture(caseIndex, base.ruleSet, firstStep.direction, profile, commands)
          : { state: base, profile: undefined };
      } catch {
        failStress(caseIndex, caseSeed, { caseIndex, caseSeed }, [], [], [], "generated-fixture-threw", undefined, [], 0);
      }
      const fixture = prepared!.state;
      const loaded = safeLoad(fixture);
      if (loaded.kind !== "accepted") {
        failStress(caseIndex, caseSeed, fixture, [], [], [], loaded.kind === "threw" ? "generated-fixture-load-threw" : "generated-fixture-invalid", undefined, [], 0);
      }
      let invalidMutation: InvalidMutation;
      try {
        invalidMutation = mutateInvalidFixture(fixture, caseIndex);
      } catch {
        failStress(caseIndex, caseSeed, fixture, [], [], [], "invalid-mutation-build-threw", undefined, [], 0);
      }
      const invalidLoaded = safeLoad(invalidMutation.state);
      if (invalidLoaded.kind !== "rejected" || !hasExpectedDiagnostic(invalidLoaded.diagnostics, invalidMutation.expected)) {
        failStress(caseIndex, caseSeed, invalidMutation.state, [], [], [], invalidLoaded.kind === "threw" ? `invalid-mutation-${invalidMutation.name}-load-threw` : `invalid-mutation-${invalidMutation.name}-diagnostic`, {
          name: invalidMutation.name,
          expected: invalidMutation.expected,
          diagnostics: invalidLoaded.kind === "rejected" ? invalidLoaded.diagnostics : [],
        }, [], 0);
      }
      for (const command of [Undo(), Redo(), Reset()] as const) {
        const trace = evaluateFixture(fixture, [command]);
        subcases += 1;
        const expected = command.type === "undo" ? "history-empty" : command.type === "redo" ? "future-empty" : "already-initial-state";
        if (trace.code || trace.results[0]?.kind !== "rejected" || trace.results[0].rejection.code !== expected || trace.results[0].attempts.length !== 0) {
          failStress(caseIndex, caseSeed, fixture, [command], trace.results, trace.replayTrace, trace.code ?? "initial-nonstep-shape", undefined, [command], trace.failureIndex ?? 0);
        }
      }

      if (!commands.some((command) => command.type === "step")) {
        failStress(caseIndex, caseSeed, fixture, commands, [], [], "trace-has-no-step", undefined, [], 0);
      }
      const evaluation = evaluateFixture(fixture, commands);
      if (evaluation.code) {
        const prefix = commands.slice(0, (evaluation.failureIndex ?? commands.length - 1) + 1);
        failStress(caseIndex, caseSeed, fixture, commands, evaluation.results, evaluation.replayTrace, evaluation.code, undefined, prefix, evaluation.failureIndex ?? commands.length - 1);
      }
      recordR2Coverage(coverage, caseIndex, prepared!, evaluation.results);
    }
    expect(subcases).toBe(3000);
    expectR2Coverage(coverage);
  }, 240000);

  it("minimizes the first failing prefix against the same failure class", () => {
    const commands = [Step("left"), Step("right"), Step("down")];
    const fixture = generateFixture(17, xorshift32(MASTER_SEED ^ 17));
    const evaluator = (candidate: readonly PublicCommand[]): Evaluation => injectedEvaluation(fixture, candidate, (command) => command.type === "step" && command.direction === "down");
    const first = firstFailurePrefix(commands, evaluator);
    expect(first).toEqual([Step("left"), Step("right"), Step("down")]);
    const minimized = minimizeCommands(first, "injected-command-failure", evaluator);
    expect(minimized).toEqual({ kind: "minimized", commands: [Step("down")] });
    expect(evaluator([]).code).toBeUndefined();
    if (minimized.kind === "minimized") expect(evaluator(minimized.commands).failureIndex).toBe(0);
  });

  it("keeps an empty valid trace clean and cannot minimize a real evaluator-path replay mismatch to it", () => {
    const fixture = generateFixture(18, xorshift32(MASTER_SEED ^ 18));
    expect(evaluateFixture(fixture, []).code).toBeUndefined();
    const commands = [Step("right")];
    const evaluator = (candidate: readonly PublicCommand[]): Evaluation => evaluateFixture(fixture, candidate, (state, trace) => {
      const replay = replayPublicCommands(state, trace);
      return trace.length === 0 ? replay : { ...replay, finalHash: "injected-final-hash" };
    });
    expect(evaluator([]).code).toBeUndefined();
    const minimized = minimizeCommands(commands, "replay-mismatch", evaluator);
    expect(minimized).toEqual({ kind: "minimized", commands });
  });

  it("locates and minimizes a replay-only mismatch at its first divergent command", () => {
    const commands = [Step("left"), Step("right"), Step("down")];
    const fixture = generateFixture(19, xorshift32(MASTER_SEED ^ 19));
    const evaluator = (candidate: readonly PublicCommand[]): Evaluation => injectedReplayMismatchEvaluation(fixture, candidate, (command) => command.type === "step" && command.direction === "down");
    const first = firstFailurePrefix(commands, evaluator);
    expect(first).toEqual(commands);
    const minimized = minimizeCommands(first, "replay-mismatch", evaluator);
    expect(minimized).toEqual({ kind: "minimized", commands: [Step("down")] });
    if (minimized.kind === "minimized") expect(evaluator(minimized.commands)).toMatchObject({ code: "replay-mismatch", failureIndex: 0 });
  });

  it("locates result-length, replay-throw, and final-only replay failures at their first prefixes", () => {
    const commands = [Step("left"), Step("right"), Step("down")];
    expect(firstResultLengthMismatchIndex([1, 2] as unknown as CommandResult[], [1] as unknown as CommandResult[])).toBe(1);
    expect(firstThrowingPrefixIndex(commands, (prefix) => { if (prefix.length >= 2) throw new Error("synthetic replay throw"); })).toBe(1);
    const checkpoints: readonly CommandCheckpoint[] = [
      { stateHash: "a", activeAddress: "a", isWinSatisfied: false },
      { stateHash: "b", activeAddress: "b", isWinSatisfied: false },
      { stateHash: "c", activeAddress: "c", isWinSatisfied: true },
    ];
    expect(firstFinalMismatchWithRunner(commands, checkpoints, (prefix) => ({ stateHash: prefix.length === 2 ? "wrong" : checkpoints[prefix.length - 1]?.stateHash ?? "", activeAddress: checkpoints[prefix.length - 1]?.activeAddress ?? "", isWinSatisfied: checkpoints[prefix.length - 1]?.isWinSatisfied ?? false }))).toBe(1);
  });

  it("rejects injected wrong-root and wrong-outer-cell portal traces in the independent oracle", () => {
    const initial: SimulationState = { ...createStage3BSimulationState(), components: { ...createStage3BSimulationState().components, positions: { ...createStage3BSimulationState().components.positions, "player-a": { worldId: "world-a", x: 5, y: 3 } } } };
    const before = createSimulationSession(initial);
    const entered = dispatchPublicCommand(before, Step("down"));
    expect(entered.result.kind).toBe("accepted");
    if (entered.result.kind !== "accepted") return;
    const transaction = entered.result.transaction;
    expect(validateEventTrace(transaction.events, before.present, entered.session.present, transaction, Step("down"))).toBe(true);
    const wrongRoot = transaction.events.map((event) => event.type === "portal-traversed" ? { ...event, port: { ...event.port, container: { ...event.port.container, world: { ...event.port.container.world, rootWorldId: "wrong" } } } } : event) as readonly SemanticEvent[];
    const wrongOuter = transaction.events.map((event) => event.type === "portal-traversed" ? { ...event, from: { ...event.from, y: event.from.y - 1 } } : event) as readonly SemanticEvent[];
    expect(validateEventTrace(wrongRoot, before.present, entered.session.present, transaction, Step("down"))).toBe(false);
    expect(validateEventTrace(wrongOuter, before.present, entered.session.present, transaction, Step("down"))).toBe(false);
  });

  it("rejects wrong transfer mode and a different valid port in the independent oracle", () => {
    const [caseIndex, profile] = [...selectR2Profiles()].find(([, candidate]) => candidate.kind === "ordinary-in")!;
    const caseSeed = xorshift32(MASTER_SEED ^ caseIndex);
    const commands = generateCommands(caseSeed);
    const command = commands[profile.firstStepIndex]!;
    if (command.type !== "step") throw new Error("selected ordinary-in profile has no Step");
    const initial = createR2ProfileFixture(caseIndex, generateFixture(caseIndex, caseSeed).ruleSet, command.direction, profile, commands).state;
    const before = createSimulationSession(initial);
    const accepted = dispatchPublicCommand(before, command);
    expect(accepted.result.kind).toBe("accepted");
    if (accepted.result.kind !== "accepted") return;
    const transaction = accepted.result.transaction;
    const transfer = transaction.events.find((event): event is Extract<SemanticEvent, { readonly type: "entity-transferred" }> => event.type === "entity-transferred");
    expect(transfer).toBeDefined();
    if (!transfer) return;
    const wrongMode = transaction.events.map((event) => event.type === "entity-transferred" ? { ...event, mode: "push-out" as const } : event) as readonly SemanticEvent[];
    const wrongPort = transaction.events.map((event) => event.type === "entity-transferred" ? { ...event, via: { ...event.via, portId: `r2-entry-${caseIndex}` } } : event) as readonly SemanticEvent[];
    expect(validateEventTrace(transaction.events, before.present, accepted.session.present, transaction, command)).toBe(true);
    expect(validateEventTrace(wrongMode, before.present, accepted.session.present, transaction, command)).toBe(false);
    expect(validateEventTrace(wrongPort, before.present, accepted.session.present, transaction, command)).toBe(false);
  });

  it("requires the exact exhausted-priority fallback code and reason, including zero enabled rules", () => {
    const state: SimulationState = {
      ...createStage3BSimulationState(),
      ruleSet: { version: 1, cycleMode: "forbid", ruleEnablement: { push: "disabled", enter: "disabled", exit: "disabled" }, interactionPriority: [] },
    };
    const wrongCode = { code: "invalid-level-data", reason: { kind: "validation" }, rule: "step-fallback" };
    const wrongReason = { code: "no-enabled-rule-applies", reason: { kind: "validation" }, rule: "step-fallback" };
    const attempts = (rejection: unknown) => [{ kind: "not-applicable", rule: "walk" }, { kind: "blocked", rule: "step-fallback", rejection }];
    expect(stepAttemptTraceValid(attempts(wrongCode), wrongCode, state)).toBe(false);
    expect(stepAttemptTraceValid(attempts(wrongReason), wrongReason, state)).toBe(false);
  });

  it("retains an invalid-mutation fixture, intended name, and diagnostics for deterministic re-evaluation", () => {
    const fixture = generateFixture(23, xorshift32(MASTER_SEED ^ 23));
    const mutation = mutateInvalidFixture(fixture, 23);
    const loaded = safeLoad(mutation.state);
    expect(loaded.kind).toBe("rejected");
    if (loaded.kind === "rejected") {
      const report = { fixture: mutation.state, invalidMutation: mutation.name, invalidDiagnostics: loaded.diagnostics };
      expect(report.invalidMutation).toBe(mutation.name);
      expect(hasExpectedDiagnostic(report.invalidDiagnostics, mutation.expected)).toBe(true);
      expect(safeLoad(report.fixture)).toEqual(loaded);
    }
  });

  it("allocates a disconnected deterministic parent when an ensured fixture root has no free cell", () => {
    const source = generateFixture(31, xorshift32(MASTER_SEED ^ 31));
    const removedContainers = Object.keys(source.components.containers);
    const entities = { ...source.entities };
    const positions = { ...source.components.positions };
    const solids = { ...source.components.solids };
    const pushables = { ...source.components.pushables };
    for (const id of removedContainers) {
      delete entities[id]; delete positions[id]; delete solids[id]; delete pushables[id];
    }
    const root = source.rootWorldId;
    const world = source.worlds[root]!;
    for (let y = 0; y < world.size.height; y += 1) for (let x = 0; x < world.size.width; x += 1) {
      const id = `fill-${x}-${y}`;
      entities[id] = { id };
      positions[id] = { worldId: root, x, y };
    }
    const full: SimulationState = { ...source, entities, components: { ...source.components, positions, containers: {}, solids, pushables }, portTables: [] };
    const ensured = ensureContainer(full, 31);
    const id = "mutation-container-31";
    expect(ensured.components.positions[id]?.worldId).toBe("mutation-parent-31");
    expect(loadSimulationState(ensured).kind).toBe("accepted");
  });
});

function xorshift32(value: number): number {
  let next = value >>> 0;
  next ^= next << 13;
  next ^= next >>> 17;
  next ^= next << 5;
  return next >>> 0;
}

function generateFixture(caseIndex: number, seed: number): SimulationState {
  const random = randomSource(seed);
  const worldCount = 1 + (random.next() % 3);
  const worlds: Record<string, SimulationState["worlds"][string]> = {};
  for (let index = 0; index < worldCount; index += 1) {
    const id = `w-${caseIndex}-${index}`;
    worlds[id] = { id, paletteId: index === 0 ? "void-lab" : "inner-mint", size: { width: 3 + (random.next() % 4), height: 3 + (random.next() % 4) } };
  }
  const rootWorldId = `w-${caseIndex}-0`;
  const entities: Record<string, SimulationState["entities"][string]> = { [`actor-${caseIndex}`]: { id: `actor-${caseIndex}` } };
  const positions: Record<string, SimulationState["components"]["positions"][string]> = { [`actor-${caseIndex}`]: { worldId: rootWorldId, x: 0, y: 0 } };
  const solids: Record<string, SimulationState["components"]["solids"][string]> = { [`actor-${caseIndex}`]: { blocksMovement: true } };
  const pushables: Record<string, SimulationState["components"]["pushables"][string]> = {};
  const containers: Record<string, SimulationState["components"]["containers"][string]> = {};
  const used = new Map<string, Set<string>>();
  reserve(rootWorldId, 0, 0);
  const takeCell = (worldId: string) => {
    const world = worlds[worldId]!;
    const cells = used.get(worldId) ?? new Set<string>();
    for (let y = 0; y < world.size.height; y += 1) for (let x = 0; x < world.size.width; x += 1) {
      if (!cells.has(`${x},${y}`)) {
        reserve(worldId, x, y);
        return { x, y };
      }
    }
    return { x: 0, y: 0 };
  };
  function reserve(worldId: string, x: number, y: number) {
    const cells = used.get(worldId) ?? new Set<string>();
    cells.add(`${x},${y}`);
    used.set(worldId, cells);
  }

  const ordinaryCount = random.next() % 5;
  for (let index = 0; index < ordinaryCount; index += 1) {
    const id = `box-${caseIndex}-${index}`;
    const cell = takeCell(rootWorldId);
    entities[id] = { id };
    positions[id] = { worldId: rootWorldId, ...cell };
    solids[id] = { blocksMovement: true };
    pushables[id] = { pushable: true };
  }
  const containerIds: { readonly id: string; readonly target: string }[] = [];
  for (let sourceIndex = 0; sourceIndex < worldCount - 1; sourceIndex += 1) {
    const source = `w-${caseIndex}-${sourceIndex}`;
    const target = `w-${caseIndex}-${sourceIndex + 1}`;
    const count = random.next() % 3;
    for (let ordinal = 0; ordinal < count; ordinal += 1) {
      const id = `container-${caseIndex}-${sourceIndex}-${ordinal}`;
      const cell = takeCell(source);
      entities[id] = { id };
      positions[id] = { worldId: source, ...cell };
      containers[id] = { innerWorldId: target };
      solids[id] = { blocksMovement: true };
      if ((random.next() & 1) === 0) pushables[id] = { pushable: true };
      containerIds.push({ id, target });
    }
  }
  const portTables = containerIds.map(({ id, target }) => {
    const count = 1 + (random.next() % 2);
    const directions = shuffle(["up", "right", "down", "left"] as Direction[], random).slice(0, count);
    return {
      containerId: id,
      ports: directions.map((outerApproach, ordinal) => {
        const landing = takeCell(target);
        return { id: `port-${id}-${ordinal}`, outerApproach, innerLanding: landing, innerExit: opposite(outerApproach) };
      }),
    };
  });
  const enabled = (["push", "enter", "exit"] as const).filter((_, index) => (caseIndex & (1 << index)) !== 0);
  return {
    version: 1,
    rootWorldId,
    activeWorldId: rootWorldId,
    playerId: `actor-${caseIndex}`,
    focusPath: [],
    ruleSet: {
      version: 1,
      cycleMode: "forbid",
      ruleEnablement: {
        push: enabled.includes("push") ? "enabled" : "disabled",
        enter: enabled.includes("enter") ? "enabled" : "disabled",
        exit: enabled.includes("exit") ? "enabled" : "disabled",
      },
      interactionPriority: shuffle([...enabled], random),
    },
    portTables,
    worlds,
    entities,
    components: { positions, containers, solids, pushables, players: { [`actor-${caseIndex}`]: { controlled: true } }, goals: {}, visuals: {} },
  };
}

function generateCommands(seed: number): readonly PublicCommand[] {
  const random = randomSource(seed ^ 0xA11CE);
  const directions: readonly Direction[] = ["up", "right", "down", "left"];
  return Array.from({ length: 64 }, () => {
    const pick = random.next() % 100;
    if (pick < 64) return Step(directions[Math.floor(pick / 16)]!);
    if (pick < 76) return Undo();
    if (pick < 88) return Redo();
    return Reset();
  });
}

type R2Profile =
  | "ordinary-in"
  | "world-in"
  | "ordinary-out"
  | "world-out"
  | "occupied-destination"
  | "missing-port"
  | "candidate-cycle"
  | "gap";

interface R2ProfilePlan {
  readonly kind: R2Profile;
  readonly firstStepIndex: number;
  /** The generated command whose runtime result is eligible for counting. */
  readonly outcomeIndex: number;
}

interface R2PreparedFixture {
  readonly state: SimulationState;
  readonly profile: R2ProfilePlan | undefined;
}

interface R2Coverage {
  ordinaryPushIn: number;
  worldPushIn: number;
  ordinaryPushOut: number;
  worldPushOut: number;
  occupiedDestination: number;
  missingPort: number;
  candidateCycle: number;
  gapLocalPush: number;
  unchangedFocus: number;
  readonly masks: number[];
}

function selectR2Profiles(): ReadonlyMap<number, R2ProfilePlan> {
  const selected = new Map<number, R2ProfilePlan>();
  const choose = (kind: R2Profile, build: (commands: readonly PublicCommand[], firstStepIndex: number) => R2ProfilePlan | undefined) => {
    for (let caseIndex = 0; caseIndex < 1000; caseIndex += 1) {
      if (selected.has(caseIndex)) continue;
      const seed = xorshift32(MASTER_SEED ^ caseIndex);
      const commands = generateCommands(seed);
      const firstStepIndex = commands.findIndex((command) => command.type === "step");
      const first = commands[firstStepIndex];
      const ruleSet = generateFixture(caseIndex, seed).ruleSet;
      const needsPushFirst = kind === "world-in" || kind === "world-out" || kind === "candidate-cycle";
      if (!first || first.type !== "step" || ruleSet.ruleEnablement.push !== "enabled" ||
        (needsPushFirst && ruleSet.ruleEnablement.enter !== "enabled") ||
        (needsPushFirst && ruleSet.interactionPriority.indexOf("push") > ruleSet.interactionPriority.indexOf("enter"))) continue;
      const plan = build(commands, firstStepIndex);
      if (plan) {
        selected.set(caseIndex, plan);
        return;
      }
    }
  };
  choose("ordinary-out", (commands, first) => focusedPushOutPlan("ordinary-out", commands, first));
  choose("world-out", (commands, first) => focusedPushOutPlan("world-out", commands, first));
  choose("occupied-destination", (commands, first) => focusedPushOutPlan("occupied-destination", commands, first));
  for (const kind of ["ordinary-in", "world-in", "missing-port", "candidate-cycle", "gap"] as const) {
    choose(kind, (_, first) => ({ kind, firstStepIndex: first, outcomeIndex: first }));
  }
  return selected;
}

function focusedPushOutPlan(
  kind: Extract<R2Profile, "ordinary-out" | "world-out" | "occupied-destination">,
  commands: readonly PublicCommand[],
  firstStepIndex: number,
): R2ProfilePlan | undefined {
  const first = commands[firstStepIndex];
  const next = commands[firstStepIndex + 1];
  return first?.type === "step" && next?.type === "step" && next.direction === first.direction
    ? { kind, firstStepIndex, outcomeIndex: firstStepIndex + 1 }
    : undefined;
}

function createR2ProfileFixture(
  caseIndex: number,
  ruleSet: RuleSetR1,
  direction: Direction,
  profile: R2ProfilePlan,
  commands: readonly PublicCommand[],
): R2PreparedFixture {
  if (profile.kind === "ordinary-out" || profile.kind === "world-out" || profile.kind === "occupied-destination") {
    return createFocusedPushOutFixture(caseIndex, ruleSet, direction, profile);
  }
  const root = `r2-root-${caseIndex}`;
  const inside = `r2-inside-${caseIndex}`;
  const carried = `r2-carried-${caseIndex}`;
  const actorId = `r2-actor-${caseIndex}`;
  const receiverId = `r2-receiver-${caseIndex}`;
  const payloadId = `r2-payload-${caseIndex}`;
  const actor = { worldId: root, x: 15, y: 15 };
  const payload = nextPosition(actor, direction);
  const receiver = profile.kind === "gap"
    ? nextPosition(nextPosition(payload, direction), direction)
    : nextPosition(payload, direction);
  const worldBearing = profile.kind === "world-in" || profile.kind === "candidate-cycle";
  const incoming = profile.kind === "missing-port" ? opposite(direction) : direction;
  const entryDirection = clockwise(direction);
  const incomingLanding = { x: 2, y: 2 };
  const entryLanding = { x: 1, y: 1 };
  const entities: Record<string, SimulationState["entities"][string]> = {
    [actorId]: { id: actorId },
    [receiverId]: { id: receiverId },
    [payloadId]: { id: payloadId },
  };
  const positions: Record<string, SimulationState["components"]["positions"][string]> = {
    [actorId]: actor,
    [receiverId]: receiver,
    [payloadId]: payload,
  };
  const containers: Record<string, { readonly innerWorldId: string }> = { [receiverId]: { innerWorldId: inside } };
  const portTables: Array<SimulationState["portTables"][number]> = [{
    containerId: receiverId,
    ports: [
      { id: `r2-entry-${caseIndex}`, outerApproach: entryDirection, innerLanding: entryLanding, innerExit: opposite(entryDirection) },
      { id: `r2-in-${caseIndex}`, outerApproach: incoming, innerLanding: incomingLanding, innerExit: opposite(incoming) },
    ],
  }];
  const worlds: Record<string, SimulationState["worlds"][string]> = {
    [root]: { id: root, paletteId: "void-lab", size: { width: 31, height: 31 } },
    [inside]: { id: inside, paletteId: "inner-mint", size: { width: 5, height: 5 } },
  };
  if (worldBearing) {
    worlds[carried] = { id: carried, paletteId: "void-lab", size: { width: 3, height: 3 } };
    containers[payloadId] = { innerWorldId: carried };
    portTables.push({ containerId: payloadId, ports: [{ id: `r2-payload-port-${caseIndex}`, outerApproach: opposite(direction), innerLanding: { x: 1, y: 1 }, innerExit: direction }] });
  }
  if (profile.kind === "candidate-cycle") {
    const linkId = `r2-cycle-link-${caseIndex}`;
    entities[linkId] = { id: linkId };
    positions[linkId] = { worldId: carried, x: 0, y: 0 };
    containers[linkId] = { innerWorldId: inside };
    portTables.push({ containerId: linkId, ports: [{ id: `r2-cycle-port-${caseIndex}`, outerApproach: "up", innerLanding: { x: 0, y: 0 }, innerExit: "down" }] });
  }
  const payloadIds = [payloadId];
  const state: SimulationState = {
    version: 1,
    rootWorldId: root,
    activeWorldId: root,
    playerId: actorId,
    focusPath: [],
    ruleSet,
    portTables: [...portTables].sort((left, right) => left.containerId < right.containerId ? -1 : left.containerId > right.containerId ? 1 : 0),
    worlds,
    entities,
    components: {
      positions,
      containers,
      solids: {
        [actorId]: { blocksMovement: true },
        [receiverId]: { blocksMovement: true },
        ...Object.fromEntries(payloadIds.map((id) => [id, { blocksMovement: true }])),
        ...(profile.kind === "candidate-cycle" ? { [`r2-cycle-link-${caseIndex}`]: { blocksMovement: true } } : {}),
      },
      pushables: Object.fromEntries(payloadIds.map((id) => [id, { pushable: true }])),
      players: { [actorId]: { controlled: true } },
      goals: {},
      visuals: {},
    },
  };
  return { state, profile };
}

function createFocusedPushOutFixture(
  caseIndex: number,
  ruleSet: RuleSetR1,
  direction: Direction,
  profile: R2ProfilePlan,
): R2PreparedFixture {
  const root = `r2-root-${caseIndex}`;
  const inside = `r2-inside-${caseIndex}`;
  const carried = `r2-carried-${caseIndex}`;
  const actorId = `r2-actor-${caseIndex}`;
  const containerId = `r2-receiver-${caseIndex}`;
  const payloadId = `r2-payload-${caseIndex}`;
  const blockerId = `r2-parent-blocker-${caseIndex}`;
  const anchor = { worldId: root, x: 3, y: 3 };
  const landing = { worldId: inside, x: 3, y: 3 };
  const payload = nextPosition(landing, opposite(direction));
  const actor = nextPosition(payload, opposite(direction));
  const worldBearing = profile.kind === "world-out";
  const entities: Record<string, SimulationState["entities"][string]> = {
    [actorId]: { id: actorId },
    [containerId]: { id: containerId },
    [payloadId]: { id: payloadId },
    ...(profile.kind === "occupied-destination" ? { [blockerId]: { id: blockerId } } : {}),
  };
  const positions: Record<string, SimulationState["components"]["positions"][string]> = {
    [actorId]: actor,
    [containerId]: anchor,
    [payloadId]: payload,
    ...(profile.kind === "occupied-destination" ? { [blockerId]: nextPosition(anchor, direction) } : {}),
  };
  const containers: Record<string, { readonly innerWorldId: string }> = {
    [containerId]: { innerWorldId: inside },
    ...(worldBearing ? { [payloadId]: { innerWorldId: carried } } : {}),
  };
  const portTables: Array<SimulationState["portTables"][number]> = [
    {
      containerId,
      ports: [{ id: `r2-focused-out-${caseIndex}`, outerApproach: opposite(direction), innerLanding: { x: landing.x, y: landing.y }, innerExit: direction }],
    },
    ...(worldBearing ? [{ containerId: payloadId, ports: [{ id: `r2-carried-port-${caseIndex}`, outerApproach: opposite(direction), innerLanding: { x: 1, y: 1 }, innerExit: direction }] }] : []),
  ];
  const state: SimulationState = {
    version: 1,
    rootWorldId: root,
    activeWorldId: inside,
    playerId: actorId,
    focusPath: [containerId],
    ruleSet,
    portTables: [...portTables].sort((left, right) => left.containerId < right.containerId ? -1 : left.containerId > right.containerId ? 1 : 0),
    worlds: {
      [root]: { id: root, paletteId: "void-lab", size: { width: 7, height: 7 } },
      [inside]: { id: inside, paletteId: "inner-mint", size: { width: 7, height: 7 } },
      ...(worldBearing ? { [carried]: { id: carried, paletteId: "void-lab", size: { width: 3, height: 3 } } } : {}),
    },
    entities,
    components: {
      positions,
      containers,
      solids: {
        [actorId]: { blocksMovement: true },
        [containerId]: { blocksMovement: true },
        [payloadId]: { blocksMovement: true },
        ...(profile.kind === "occupied-destination" ? { [blockerId]: { blocksMovement: true } } : {}),
      },
      pushables: { [payloadId]: { pushable: true } },
      players: { [actorId]: { controlled: true } },
      goals: {},
      visuals: {},
    },
  };
  return { state, profile };
}

function createR2Coverage(): R2Coverage {
  return { ordinaryPushIn: 0, worldPushIn: 0, ordinaryPushOut: 0, worldPushOut: 0, occupiedDestination: 0, missingPort: 0, candidateCycle: 0, gapLocalPush: 0, unchangedFocus: 0, masks: Array.from({ length: 8 }, () => 0) };
}

function recordR2Coverage(coverage: R2Coverage, caseIndex: number, prepared: R2PreparedFixture, results: readonly CommandResult[]): void {
  coverage.masks[caseIndex & 7] = (coverage.masks[caseIndex & 7] ?? 0) + 1;
  const profile = prepared.profile;
  if (profile) {
    const outcome = results[profile.outcomeIndex];
    const setupAccepted = results.slice(profile.firstStepIndex, profile.outcomeIndex).every((result) => result?.kind === "accepted");
    const transferred = (result: CommandResult | undefined, mode: "push-in" | "push-out", carried: boolean) => result?.kind === "accepted" && result.command.type === "step" && result.transaction.events.some((event) => event.type === "entity-transferred" && event.mode === mode && Boolean(event.carriedSubtree) === carried);
    if (profile.kind === "ordinary-in" && transferred(outcome, "push-in", false)) coverage.ordinaryPushIn += 1;
    if (profile.kind === "world-in" && transferred(outcome, "push-in", true)) coverage.worldPushIn += 1;
    // The profile's later generated Step is the only push-out counter source:
    // Undo/reverse history events and load-time mutations never qualify.
    if (profile.kind === "ordinary-out" && setupAccepted && transferred(outcome, "push-out", false)) coverage.ordinaryPushOut += 1;
    if (profile.kind === "world-out" && setupAccepted && transferred(outcome, "push-out", true)) coverage.worldPushOut += 1;
    if (profile.kind === "occupied-destination" && setupAccepted && outcome?.kind === "rejected" && outcome.command.type === "step" && outcome.rejection.code === "port-parent-destination-occupied") coverage.occupiedDestination += 1;
    if (profile.kind === "missing-port" && outcome?.kind === "rejected" && outcome.command.type === "step" && outcome.rejection.code === "port-absent") coverage.missingPort += 1;
    if (profile.kind === "candidate-cycle" && outcome?.kind === "rejected" && outcome.command.type === "step" && outcome.rejection.code === "cycle-forbidden") coverage.candidateCycle += 1;
    if (profile.kind === "gap" && outcome?.kind === "accepted" && outcome.transaction.rule === "push" && !outcome.transaction.events.some((event) => event.type === "entity-transferred")) coverage.gapLocalPush += 1;
  }
  for (const result of results) {
    if (result.kind === "accepted" && result.command.type === "step") {
      const transferred = result.transaction.events.find((event): event is Extract<SemanticEvent, { readonly type: "entity-transferred" }> => event.type === "entity-transferred");
      if (transferred) {
      if (sameAddress(result.transaction.activeAddressBefore, result.transaction.activeAddressAfter)) coverage.unchangedFocus += 1;
      }
    }
  }
}

function expectR2Coverage(coverage: R2Coverage): void {
  expectR2TransferCoverage(coverage);
  expect(coverage.masks.every((count) => count > 0)).toBe(true);
}

function expectR2TransferCoverage(coverage: R2Coverage): void {
  expect(coverage.ordinaryPushIn).toBeGreaterThan(0);
  expect(coverage.worldPushIn).toBeGreaterThan(0);
  expect(coverage.ordinaryPushOut).toBeGreaterThan(0);
  expect(coverage.worldPushOut).toBeGreaterThan(0);
  expect(coverage.occupiedDestination).toBeGreaterThan(0);
  expect(coverage.missingPort).toBeGreaterThan(0);
  expect(coverage.candidateCycle).toBeGreaterThan(0);
  expect(coverage.gapLocalPush).toBeGreaterThan(0);
  expect(coverage.unchangedFocus).toBeGreaterThan(0);
}

function clockwise(direction: Direction): Direction {
  return direction === "up" ? "right" : direction === "right" ? "down" : direction === "down" ? "left" : "up";
}

function directionVector(direction: Direction): readonly [number, number] {
  return direction === "up" ? [0, -1] : direction === "right" ? [1, 0] : direction === "down" ? [0, 1] : [-1, 0];
}

function add(left: readonly [number, number], right: readonly [number, number]): readonly [number, number] { return [left[0] + right[0], left[1] + right[1]]; }
function subtract(left: readonly [number, number], right: readonly [number, number]): readonly [number, number] { return [left[0] - right[0], left[1] - right[1]]; }
function scale(value: readonly [number, number], multiplier: number): readonly [number, number] { return [value[0] * multiplier, value[1] * multiplier]; }
function sameVector(left: readonly [number, number], right: readonly [number, number]): boolean { return left[0] === right[0] && left[1] === right[1]; }
function vectorKey(value: readonly [number, number]): string { return `${value[0]},${value[1]}`; }

interface ExpectedDiagnostic { readonly code: "invalid-level-data" | "cycle-forbidden"; readonly message: string; readonly witness?: readonly string[]; }
interface InvalidMutation { readonly name: string; readonly state: SimulationState; readonly expected: ExpectedDiagnostic; }

function mutateInvalidFixture(fixture: SimulationState, caseIndex: number): InvalidMutation {
  const prepared = ensureContainer(fixture, caseIndex);
  const firstId = Object.keys(prepared.components.containers).sort()[0]!;
  const first = prepared.components.containers[firstId]!;
  const table = prepared.portTables.find((entry) => entry.containerId === firstId)!;
  const firstPort = table.ports[0]!;
  const replaceTable = (ports: typeof table.ports): SimulationState => ({ ...prepared, portTables: prepared.portTables.map((entry) => entry.containerId === firstId ? { ...entry, ports } : entry) });
  switch (caseIndex % 12) {
    case 0:
      return { name: "unknown-inner-world", state: { ...prepared, components: { ...prepared.components, containers: { ...prepared.components.containers, [firstId]: { innerWorldId: "missing" } } } }, expected: { code: "invalid-level-data", message: `container ${firstId} has an invalid world reference` } };
    case 1:
      return { name: "invalid-parent-location", state: { ...prepared, components: { ...prepared.components, positions: { ...prepared.components.positions, [firstId]: { ...prepared.components.positions[firstId]!, x: -1 } } } }, expected: { code: "invalid-level-data", message: `position for ${firstId} is out of bounds` } };
    case 2: return { name: "duplicate-port-direction", state: replaceTable([...table.ports, { ...firstPort, id: `${firstPort.id}-copy` }]), expected: { code: "invalid-level-data", message: `port ${firstId}/${firstPort.id}-copy duplicates an outer approach` } };
    case 3: return { name: "duplicate-inner-landing", state: replaceTable([...table.ports, { ...firstPort, id: `${firstPort.id}-landing`, outerApproach: opposite(firstPort.outerApproach), innerExit: firstPort.outerApproach }]), expected: { code: "invalid-level-data", message: `port ${firstId}/${firstPort.id}-landing landing is duplicated` } };
    case 4: {
      const id = `occupied-${caseIndex}`;
      return { name: "occupied-inner-landing", state: {
        ...prepared,
        entities: { ...prepared.entities, [id]: { id } },
        components: { ...prepared.components, positions: { ...prepared.components.positions, [id]: { worldId: first.innerWorldId, ...firstPort.innerLanding } }, solids: { ...prepared.components.solids, [id]: { blocksMovement: true } } },
      }, expected: { code: "invalid-level-data", message: `port ${firstId}/${firstPort.id} landing is occupied` } };
    }
    case 5:
      return { name: "unknown-priority", state: { ...prepared, ruleSet: { ...prepared.ruleSet, interactionPriority: ["unknown"] as never } }, expected: { code: "invalid-level-data", message: "interaction priority contains unknown rule unknown" } };
    case 6:
      return { name: "duplicate-priority", state: { ...prepared, ruleSet: { ...prepared.ruleSet, interactionPriority: ["push", "push"] as never } }, expected: { code: "invalid-level-data", message: "interaction priority must contain every and only enabled rules" } };
    case 7:
      return { name: "omitted-enabled-priority", state: { ...prepared, ruleSet: { ...prepared.ruleSet, ruleEnablement: { push: "enabled", enter: "enabled", exit: "enabled" }, interactionPriority: ["push", "enter"] } }, expected: { code: "invalid-level-data", message: "interaction priority must contain every and only enabled rules" } };
    case 8:
      return { name: "listed-disabled-priority", state: { ...prepared, ruleSet: { ...prepared.ruleSet, ruleEnablement: { push: "disabled", enter: "enabled", exit: "disabled" }, interactionPriority: ["enter", "push"] } }, expected: { code: "invalid-level-data", message: "interaction priority must contain every and only enabled rules" } };
    case 9:
      return { name: "self-edge", state: { ...prepared, components: { ...prepared.components, containers: { ...prepared.components.containers, [firstId]: { innerWorldId: prepared.components.positions[firstId]!.worldId } } } }, expected: { code: "cycle-forbidden", message: "containment graph contains a cycle", witness: [firstId] } };
    case 10: return { name: "two-world-cycle", state: twoWorldCycle(prepared, firstId, caseIndex), expected: { code: "cycle-forbidden", message: "containment graph contains a cycle", witness: [`cycle-left-${caseIndex}`, `cycle-right-${caseIndex}`] } };
    default:
      return { name: "legacy-cycle-enable", state: { ...prepared, components: { ...prepared.components, containers: { ...prepared.components.containers, [firstId]: { ...first, allowsRecursiveCycle: true } as never } } }, expected: { code: "cycle-forbidden", message: `container ${firstId} requests a forbidden cycle mode` } };
  }
}

function ensureContainer(fixture: SimulationState, caseIndex: number): SimulationState {
  if (Object.keys(fixture.components.containers).length > 0) return fixture;
  const root = fixture.rootWorldId;
  const child = `mutation-${caseIndex}`;
  const id = `mutation-container-${caseIndex}`;
  const rootCell = freeCell(fixture, root);
  const parent = rootCell ? root : `mutation-parent-${caseIndex}`;
  const cell = rootCell ?? { x: 0, y: 0 };
  return {
    ...fixture,
    worlds: { ...fixture.worlds, ...(rootCell ? {} : { [parent]: { id: parent, paletteId: "inner-mint" as const, size: { width: 3, height: 3 } } }), [child]: { id: child, paletteId: "inner-mint", size: { width: 3, height: 3 } } },
    entities: { ...fixture.entities, [id]: { id } },
    components: {
      ...fixture.components,
      positions: { ...fixture.components.positions, [id]: { worldId: parent, ...cell } },
      containers: { ...fixture.components.containers, [id]: { innerWorldId: child } },
      solids: { ...fixture.components.solids, [id]: { blocksMovement: true } },
    },
    portTables: [...fixture.portTables, { containerId: id, ports: [{ id: `mutation-port-${caseIndex}`, outerApproach: "right", innerLanding: { x: 1, y: 1 }, innerExit: "left" }] }],
  };
}

function twoWorldCycle(state: SimulationState, _firstId: string, caseIndex: number): SimulationState {
  const base = ensureContainer(state, caseIndex);
  const leftWorld = `cycle-world-left-${caseIndex}`;
  const rightWorld = `cycle-world-right-${caseIndex}`;
  const left = `cycle-left-${caseIndex}`;
  const right = `cycle-right-${caseIndex}`;
  return {
    ...base,
    worlds: {
      ...base.worlds,
      [leftWorld]: { id: leftWorld, paletteId: "inner-mint", size: { width: 3, height: 3 } },
      [rightWorld]: { id: rightWorld, paletteId: "inner-mint", size: { width: 3, height: 3 } },
    },
    entities: { ...base.entities, [left]: { id: left }, [right]: { id: right } },
    components: {
      ...base.components,
      positions: { ...base.components.positions, [left]: { worldId: leftWorld, x: 1, y: 1 }, [right]: { worldId: rightWorld, x: 1, y: 1 } },
      containers: { ...base.components.containers, [left]: { innerWorldId: rightWorld }, [right]: { innerWorldId: leftWorld } },
      solids: { ...base.components.solids, [left]: { blocksMovement: true }, [right]: { blocksMovement: true } },
    },
    portTables: [...base.portTables, { containerId: left, ports: [] }, { containerId: right, ports: [] }],
  };
}

interface Evaluation {
  readonly code?: string;
  readonly failureIndex?: number;
  readonly results: readonly CommandResult[];
  readonly replayTrace: readonly CommandResult[];
  readonly finalHash: string;
  readonly finalWin: boolean;
  readonly checkpoints: readonly CommandCheckpoint[];
}

interface CommandCheckpoint {
  readonly stateHash: string;
  readonly activeAddress: string;
  readonly isWinSatisfied: boolean;
}

function evaluateFixture(
  initialState: SimulationState,
  commands: readonly PublicCommand[],
  replayRunner: (initial: SimulationState, commands: readonly PublicCommand[]) => ReturnType<typeof replayPublicCommands> = replayPublicCommands,
): Evaluation {
  let direct: Evaluation;
  try {
    direct = runDirectOracle(initialState, commands);
  } catch {
    return { code: "direct-oracle-threw", failureIndex: 0, results: [], replayTrace: [], finalHash: "", finalWin: false, checkpoints: [] };
  }
  if (direct.code) return direct;
  try {
    const replay = replayRunner(initialState, commands);
    const replayWin = isWinSatisfied(replay.finalState);
    const compared = Math.min(replay.results.length, direct.results.length);
    for (let index = 0; index < compared; index += 1) {
      if (JSON.stringify(replay.results[index]) !== JSON.stringify(direct.results[index])) return { ...direct, code: "replay-mismatch", failureIndex: index, replayTrace: replay.results };
    }
    const lengthMismatch = firstResultLengthMismatchIndex(direct.results, replay.results);
    if (lengthMismatch !== undefined) return { ...direct, code: "replay-mismatch", failureIndex: lengthMismatch, replayTrace: replay.results };
    const expectedFinalAddress = direct.checkpoints.at(-1)?.activeAddress ?? activeAddressKey(initialState);
    if (replay.finalHash !== direct.finalHash || replayWin !== direct.finalWin || activeAddressKey(replay.finalState) !== expectedFinalAddress) return { ...direct, code: "replay-mismatch", failureIndex: firstFinalMismatchIndex(initialState, commands, direct.checkpoints), replayTrace: replay.results };
    return { ...direct, replayTrace: replay.results };
  } catch {
    return { ...direct, code: "replay-threw", failureIndex: firstReplayThrowIndex(initialState, commands), replayTrace: [] };
  }
}

function runDirectOracle(initialState: SimulationState, commands: readonly PublicCommand[]): Evaluation {
  let session = createSimulationSession(initialState);
  const initialHash = hashState(initialState);
  const results: CommandResult[] = [];
  const checkpoints: CommandCheckpoint[] = [];
  const immutableSnapshots = new Map<SimulationState, string>([[session.initialState, hashState(session.initialState)]]);
  for (const [index, command] of commands.entries()) {
    try {
    const beforeHash = hashState(session.present);
    const past = session.history.past.length;
    const future = session.history.future.length;
    const sequence = session.publicTransactionSequence;
    const beforeState = session.present;
    const selectedRecord = command.type === "undo" ? session.history.past.at(-1) : command.type === "redo" ? session.history.future[0] : undefined;
    let envelope;
    try {
      envelope = dispatchPublicCommand(session, command);
    } catch {
      return failed("dispatch-threw", index, results, session);
    }
    results.push(envelope.result);
    checkpoints.push({ stateHash: hashState(envelope.session.present), activeAddress: activeAddressKey(envelope.session.present), isWinSatisfied: isWinSatisfied(envelope.session.present) });
    if (JSON.stringify(envelope.result.command) !== JSON.stringify(command)) return failed("result-command-mismatch", index, results, envelope.session);
    if (validateSimulationState(envelope.session.present).kind !== "valid") return failed("post-state-invalid", index, results, envelope.session);
    if (hashState(envelope.session.initialState) !== initialHash) return failed("initial-state-mutated", index, results, envelope.session);
    for (const record of [...envelope.session.history.past, ...envelope.session.history.future]) {
      if (!immutableSnapshots.has(record.previousState)) immutableSnapshots.set(record.previousState, hashState(record.previousState));
      if (!immutableSnapshots.has(record.nextState)) immutableSnapshots.set(record.nextState, hashState(record.nextState));
    }
    if ([...immutableSnapshots].some(([state, savedHash]) => hashState(state) !== savedHash)) return failed("immutable-snapshot-hash", index, results, envelope.session);
    if (!historyLinksValid(envelope.session)) return failed("history-record-linkage", index, results, envelope.session);
    if (envelope.result.kind === "rejected") {
      if (envelope.result.stateHashBefore !== beforeHash || envelope.result.stateHashAfter !== beforeHash || addressKey(envelope.result.activeAddressBefore) !== activeAddressKey(beforeState) || addressKey(envelope.result.activeAddressAfter) !== activeAddressKey(beforeState) || hashState(envelope.session.present) !== beforeHash || envelope.session.history.past.length !== past || envelope.session.history.future.length !== future || envelope.session.publicTransactionSequence !== sequence || activeAddressKey(envelope.session.present) !== activeAddressKey(beforeState)) return failed("rejected-mutated", index, results, envelope.session);
      if (envelope.result.command.type === "step") {
        const terminal = envelope.result.attempts.at(-1);
        if (envelope.result.attempts.length === 0 || terminal?.kind !== "blocked" || JSON.stringify(terminal.rejection) !== JSON.stringify(envelope.result.rejection) || envelope.result.events.length !== 1 || envelope.result.events[0]?.type !== "command-blocked" || envelope.result.events[0].eventIndex !== 0 || envelope.result.events[0].direction !== "forward" || envelope.result.events[0].transactionId !== null || JSON.stringify(envelope.result.events[0].rejection) !== JSON.stringify(envelope.result.rejection)) return failed("step-rejection-shape", index, results, envelope.session);
        if (!stepAttemptTraceValid(envelope.result.attempts, envelope.result.rejection, beforeState)) return failed("step-priority-trace", index, results, envelope.session);
      } else {
        const expected = command.type === "undo" ? (past === 0 ? "history-empty" : undefined) : command.type === "redo" ? (future === 0 ? "future-empty" : undefined) : beforeHash === hashState(session.initialState) ? "already-initial-state" : undefined;
        if (!expected) return failed("nonstep-unexpected-rejection", index, results, envelope.session);
        if (envelope.result.attempts.length !== 0 || envelope.result.events.length !== 1 || envelope.result.events[0]?.type !== "command-blocked" || envelope.result.events[0].eventIndex !== 0 || envelope.result.events[0].direction !== "forward" || envelope.result.events[0].transactionId !== null || envelope.result.rejection.code !== expected || JSON.stringify(envelope.result.events[0].rejection) !== JSON.stringify(envelope.result.rejection)) return failed("nonstep-rejection-shape", index, results, envelope.session);
      }
    } else {
      const transaction = envelope.result.transaction;
      if (JSON.stringify(transaction.command) !== JSON.stringify(command) || transaction.id.initialStateHash !== initialHash || transaction.id.sequence !== sequence + 1 || transaction.stateHashBefore !== beforeHash || transaction.stateHashAfter !== hashState(envelope.session.present) || addressKey(transaction.activeAddressBefore) !== activeAddressKey(beforeState) || addressKey(transaction.activeAddressAfter) !== activeAddressKey(envelope.session.present)) return failed("accepted-transaction-shape", index, results, envelope.session);
      const finalAttempt = envelope.result.attempts.at(-1);
      if (command.type === "step" && (finalAttempt?.kind !== "accepted" || JSON.stringify(finalAttempt.transaction) !== JSON.stringify(transaction) || !stepAttemptTraceValid(envelope.result.attempts, undefined, beforeState))) return failed("accepted-step-attempt", index, results, envelope.session);
      if (command.type !== "step" && envelope.result.attempts.length !== 0) return failed("accepted-nonstep-attempts", index, results, envelope.session);
      if ((command.type === "undo" || command.type === "redo") ? !selectedRecord || JSON.stringify(transaction.sourceTransactionId) !== JSON.stringify(selectedRecord.transaction.id) : transaction.sourceTransactionId !== undefined) return failed("history-source-transaction", index, results, envelope.session);
      if (!acceptedRuleAndEventContract(command, transaction, envelope.result.attempts, selectedRecord?.transaction.events, beforeState, envelope.session.present)) return failed("accepted-rule-or-event-contract", index, results, envelope.session);
      if (!validateEventTrace(transaction.events, beforeState, envelope.session.present, transaction, command)) return failed("event-address-or-metadata", index, results, envelope.session);
      if (!validateWinTransition(transaction.events, beforeState, envelope.session.present)) return failed("win-transition-shape", index, results, envelope.session);
    }
    session = envelope.session;
    } catch {
      return failed("direct-oracle-threw", index, results, session);
    }
  }
  if (hashState(initialState) !== initialHash || [...immutableSnapshots].some(([state, savedHash]) => hashState(state) !== savedHash) || !historyLinksValid(session)) return failed("immutable-history-hash", Math.max(0, commands.length - 1), results, session);
  return { results, replayTrace: [], finalHash: hashState(session.present), finalWin: isWinSatisfied(session.present), checkpoints };
}

function failStress(
  caseIndex: number,
  caseSeed: number,
  fixture: unknown,
  commands: readonly PublicCommand[],
  directTrace: readonly CommandResult[],
  replayTrace: readonly CommandResult[],
  oracleCode: string,
  invalidMutation: { readonly name: string; readonly expected?: ExpectedDiagnostic; readonly diagnostics: unknown } | undefined,
  failingPrefix: readonly PublicCommand[],
  failureIndex: number,
): never {
  const minimization = minimizeCommands(failingPrefix, oracleCode, (candidate) => evaluateFixture(fixture as SimulationState, candidate));
  throw new Error(JSON.stringify({
    suite: "r1-core-safety-stress",
    masterSeed: "0x51CEB00C",
    caseIndex,
    caseSeed,
    fixture,
    ...(invalidMutation ? { invalidMutation: invalidMutation.name, invalidDiagnostics: invalidMutation.diagnostics } : {}),
    originalCommands: commands,
    failingPrefixLength: failingPrefix.length,
    ...(minimization.kind === "minimized" ? { minimizedCommands: minimization.commands, oracleCode } : { minimizedCommands: [], oracleCode: "minimizer-failure", originalOracleCode: oracleCode, minimizerFailure: minimization.reason }),
    directTrace,
    replayTrace,
  }));
}

function firstFailurePrefix(commands: readonly PublicCommand[], evaluator: (commands: readonly PublicCommand[]) => Evaluation): readonly PublicCommand[] {
  const evaluation = totalEvaluation(evaluator, commands);
  return evaluation.code ? commands.slice(0, (evaluation.failureIndex ?? commands.length - 1) + 1) : [];
}

type Minimization = { readonly kind: "minimized"; readonly commands: readonly PublicCommand[] } | { readonly kind: "failure"; readonly reason: string };

function minimizeCommands(commands: readonly PublicCommand[], oracleCode: string, evaluator: (commands: readonly PublicCommand[]) => Evaluation): Minimization {
  if (totalEvaluation(evaluator, commands).code !== oracleCode) return { kind: "failure", reason: "prefix-does-not-reproduce-oracle-code" };
  let candidate = [...commands];
  for (let index = 0; index < candidate.length;) {
    const trial = [...candidate.slice(0, index), ...candidate.slice(index + 1)];
    if (totalEvaluation(evaluator, trial).code === oracleCode) {
      candidate = trial;
      index = 0;
    } else {
      index += 1;
    }
  }
  if (totalEvaluation(evaluator, candidate).code !== oracleCode) return { kind: "failure", reason: "minimized-trace-does-not-reproduce-oracle-code" };
  if (candidate.some((_, index) => totalEvaluation(evaluator, [...candidate.slice(0, index), ...candidate.slice(index + 1)]).code === oracleCode)) return { kind: "failure", reason: "trace-is-not-one-minimal" };
  return { kind: "minimized", commands: candidate };
}

function totalEvaluation(evaluator: (commands: readonly PublicCommand[]) => Evaluation, commands: readonly PublicCommand[]): Evaluation {
  try {
    return evaluator(commands);
  } catch {
    return { code: "evaluator-threw", failureIndex: 0, results: [], replayTrace: [], finalHash: "", finalWin: false, checkpoints: [] };
  }
}

function firstResultLengthMismatchIndex(direct: readonly CommandResult[], replay: readonly CommandResult[]): number | undefined {
  return direct.length === replay.length ? undefined : Math.min(direct.length, replay.length);
}

function firstReplayThrowIndex(initialState: SimulationState, commands: readonly PublicCommand[]): number {
  return firstThrowingPrefixIndex(commands, (prefix) => { replayPublicCommands(initialState, prefix); });
}

function firstThrowingPrefixIndex(commands: readonly PublicCommand[], runner: (prefix: readonly PublicCommand[]) => unknown): number {
  for (let index = 0; index < commands.length; index += 1) {
    try {
      runner(commands.slice(0, index + 1));
    } catch {
      return index;
    }
  }
  return 0;
}

function firstFinalMismatchIndex(initialState: SimulationState, commands: readonly PublicCommand[], checkpoints: readonly CommandCheckpoint[]): number {
  return firstFinalMismatchWithRunner(commands, checkpoints, (prefix) => {
    const replay = replayPublicCommands(initialState, prefix);
    return { stateHash: replay.finalHash, activeAddress: activeAddressKey(replay.finalState), isWinSatisfied: isWinSatisfied(replay.finalState) };
  });
}

function firstFinalMismatchWithRunner(commands: readonly PublicCommand[], checkpoints: readonly CommandCheckpoint[], runner: (prefix: readonly PublicCommand[]) => CommandCheckpoint): number {
  for (let index = 0; index < commands.length; index += 1) {
    try {
      const replay = runner(commands.slice(0, index + 1));
      const direct = checkpoints[index];
      if (!direct || replay.stateHash !== direct.stateHash || replay.activeAddress !== direct.activeAddress || replay.isWinSatisfied !== direct.isWinSatisfied) return index;
    } catch {
      return index;
    }
  }
  return Math.max(0, commands.length - 1);
}

function failed(code: string, failureIndex: number, results: readonly CommandResult[], session: ReturnType<typeof createSimulationSession>): Evaluation {
  return { code, failureIndex, results, replayTrace: [], finalHash: hashState(session.present), finalWin: isWinSatisfied(session.present), checkpoints: [] };
}

function emptyEvaluation(): Evaluation {
  return { results: [], replayTrace: [], finalHash: "", finalWin: false, checkpoints: [] };
}

function injectedReplayMismatchEvaluation(
  initialState: SimulationState,
  commands: readonly PublicCommand[],
  predicate: (command: PublicCommand) => boolean,
): Evaluation {
  const direct = runDirectOracle(initialState, commands);
  if (direct.code) return direct;
  const index = commands.findIndex(predicate);
  if (index < 0) return direct;
  const replayTrace = [...direct.results];
  replayTrace[index] = { ...replayTrace[index]!, kind: "rejected" } as CommandResult;
  return { ...direct, code: "replay-mismatch", failureIndex: index, replayTrace };
}

function safeLoad(input: unknown): ReturnType<typeof loadSimulationState> | { readonly kind: "threw" } {
  try {
    return loadSimulationState(input);
  } catch {
    return { kind: "threw" };
  }
}

function hasExpectedDiagnostic(diagnostics: readonly { readonly code: string; readonly message: string; readonly witness?: readonly string[] }[], expected: ExpectedDiagnostic): boolean {
  return diagnostics.some((diagnostic) => diagnostic.code === expected.code && diagnostic.message === expected.message && (expected.witness === undefined || JSON.stringify(diagnostic.witness) === JSON.stringify(expected.witness)));
}

function injectedEvaluation(
  initialState: SimulationState,
  commands: readonly PublicCommand[],
  predicate: (command: PublicCommand) => boolean,
): Evaluation {
  let session = createSimulationSession(initialState);
  const results: CommandResult[] = [];
  for (const [index, command] of commands.entries()) {
    const envelope = dispatchPublicCommand(session, command);
    results.push(envelope.result);
    session = envelope.session;
    if (predicate(command)) return { code: "injected-command-failure", failureIndex: index, results, replayTrace: [], finalHash: hashState(session.present), finalWin: isWinSatisfied(session.present), checkpoints: [] };
  }
  return { results, replayTrace: [], finalHash: hashState(session.present), finalWin: isWinSatisfied(session.present), checkpoints: [] };
}

function activeAddressKey(state: SimulationState): string {
  const address = activeWorldAddress(state) ?? { rootWorldId: state.rootWorldId, containerPath: state.focusPath };
  return addressKey(address);
}

function addressKey(address: WorldAddress): string {
  return JSON.stringify([address.rootWorldId, ...address.containerPath]);
}

function historyLinksValid(session: ReturnType<typeof createSimulationSession>): boolean {
  if (!Number.isFinite(session.publicTransactionSequence) || !Number.isInteger(session.publicTransactionSequence) || session.publicTransactionSequence < 0) return false;
  return [...session.history.past, ...session.history.future].every((record) => {
    const source = record.transaction.id;
    const validSourceSequence = Number.isInteger(source.sequence) && source.sequence >= 1 && source.sequence <= session.publicTransactionSequence;
    const eventIdsMatch = record.transaction.events.every((event) => sameTransaction(event.transactionId, source) && (event.type !== "push-resolved" || event.moved.every((moved) => sameTransaction(moved.transactionId, source))));
    return validSourceSequence && eventIdsMatch && hashState(record.previousState) === record.transaction.stateHashBefore && hashState(record.nextState) === record.transaction.stateHashAfter;
  });
}

function stepAttemptTraceValid(attempts: readonly unknown[], rejection: unknown | undefined, state: SimulationState): boolean {
  if (attempts.length === 0) return false;
  const terminal = attempts.at(-1);
  if (!eventRecord(terminal)) return false;
  const priority = state.ruleSet.interactionPriority;
  const preflight = eventRecord(rejection) && (rejection.code === "actor-not-active" || rejection.code === "focus-invalid");
  if (preflight) return attempts.length === 1 && terminal.kind === "blocked" && terminal.rule === "step-fallback";
  if (attempts.length === 1) return terminal.kind === "accepted" && terminal.rule === "walk";
  const first = attempts[0];
  if (!eventRecord(first) || first.kind !== "not-applicable" || first.rule !== "walk") return false;
  const interactionAttempts = attempts.slice(1, -1);
  if (!interactionAttempts.every((attempt, index) => eventRecord(attempt) && attempt.kind === "not-applicable" && attempt.rule === priority[index])) return false;
  if (terminal.kind === "accepted") return terminal.rule === priority[interactionAttempts.length];
  if (terminal.kind !== "blocked") return false;
  if (terminal.rule === "step-fallback") {
    if (!eventRecord(rejection) || !eventRecord(rejection.reason)) return false;
    if (interactionAttempts.length === priority.length) return rejection.code === "no-enabled-rule-applies" && rejection.reason.kind === "step-fallback";
    return rejection.code === "invalid-level-data" && rejection.reason.kind === "validation" && interactionAttempts.length === 0;
  }
  return terminal.rule === priority[interactionAttempts.length];
}

function acceptedRuleAndEventContract(
  command: PublicCommand,
  transaction: Transaction,
  attempts: readonly unknown[],
  sourceEvents: readonly SemanticEvent[] | undefined,
  before: SimulationState,
  after: SimulationState,
): boolean {
  const finalAttempt = attempts.at(-1);
  const expectedRule = command.type === "step" && eventRecord(finalAttempt) && finalAttempt.kind === "accepted" ? finalAttempt.rule : command.type === "step" ? undefined : command.type;
  if (transaction.rule !== expectedRule) return false;
  const expectedDirection = command.type === "undo" ? "reverse" : "forward";
  if (!transaction.events.every((event) => event.direction === expectedDirection && (event.type !== "push-resolved" || event.moved.every((moved) => moved.direction === expectedDirection)))) return false;
  if (command.type === "undo" || command.type === "redo") {
    if (!sourceEvents) return false;
    const expectedHistoryTypes = (command.type === "undo" ? [...sourceEvents].reverse() : sourceEvents).map((event) => event.type);
    return JSON.stringify(transaction.events.map((event) => event.type)) === JSON.stringify(expectedHistoryTypes);
  }
  const base = transaction.events.filter((event) => event.type !== "win-changed").map((event) => event.type);
  const expectedBase = transaction.rule === "walk" ? ["entity-moved"] : transaction.rule === "enter" || transaction.rule === "exit" ? ["portal-traversed", "focus-changed"] : transaction.rule === "reset" ? ["reset"] : [];
  if (transaction.rule === "push") {
    const validPushBase = JSON.stringify(base) === JSON.stringify(["push-resolved", "entity-moved"]) || JSON.stringify(base) === JSON.stringify(["push-resolved", "entity-transferred", "entity-moved"]);
    if (!validPushBase) return false;
  } else if (JSON.stringify(base) !== JSON.stringify(expectedBase)) return false;
  const changed = isWinSatisfied(before) !== isWinSatisfied(after);
  const expectedTypes = [...base, ...(changed ? ["win-changed"] : [])];
  if (JSON.stringify(transaction.events.map((event) => event.type)) !== JSON.stringify(expectedTypes)) return false;
  return true;
}

function validateEventTrace(events: readonly SemanticEvent[], before: SimulationState, after: SimulationState, transaction: { readonly id: { readonly initialStateHash: string; readonly sequence: number }; readonly rule: string }, command: PublicCommand): boolean {
  const aggregate = events.find((event): event is Extract<SemanticEvent, { readonly type: "push-resolved" }> => event.type === "push-resolved");
  return events.every((event, index) => {
    const expectedDirection = command.type === "undo" ? "reverse" : "forward";
    if (!sameTransaction(event.transactionId, transaction.id) || event.eventIndex !== index || event.direction !== expectedDirection) return false;
    if (event.type === "entity-moved") return occurrenceAtCell(before, event.occurrence, event.from) && occurrenceAtCell(after, event.occurrence, event.to);
    if (event.type === "push-resolved") return occurrenceResolves(before, event.actor) && event.moved.every((moved) => sameTransaction(moved.transactionId, transaction.id) && moved.eventIndex === index && moved.direction === event.direction && occurrenceAtCell(before, moved.occurrence, moved.from) && occurrenceAtCell(after, moved.occurrence, moved.to));
    if (event.type === "entity-transferred") {
      const forward = command.type === "undo" ? forwardTransferForOracle(event) : event;
      const forwardBefore = command.type === "undo" ? after : before;
      const forwardAfter = command.type === "undo" ? before : after;
      const movementDirection = command.type === "step"
        ? command.direction
        : command.type === "undo"
          ? (aggregate ? opposite(aggregate.directionMoved) : undefined)
          : aggregate?.directionMoved;
      return transferRelation(forward, forwardBefore, forwardAfter, movementDirection);
    }
    if (event.type === "portal-traversed") return occurrenceAtCell(before, event.actorBefore, event.from) && occurrenceAtCell(after, event.actorAfter, event.to) && portResolves(before, event.port) && portResolves(after, event.port) && portalRelation(event, before, after);
    if (event.type === "focus-changed") return sameAddress(event.before, activeWorldAddress(before) ?? { rootWorldId: before.rootWorldId, containerPath: before.focusPath }) && sameAddress(event.after, activeWorldAddress(after) ?? { rootWorldId: after.rootWorldId, containerPath: after.focusPath }) && (!event.via || (portResolves(before, event.via) && portResolves(after, event.via)));
    if (event.type === "reset") return (command.type === "reset" || transaction.rule === "undo" || transaction.rule === "redo") && hashState(before) !== hashState(after);
    if (event.type === "win-changed") return event.solved === isWinSatisfied(after);
    return false;
  });
}

function validateWinTransition(events: readonly SemanticEvent[], before: SimulationState, after: SimulationState): boolean {
  const beforeWin = isWinSatisfied(before);
  const afterWin = isWinSatisfied(after);
  const changed = events.filter((event) => event.type === "win-changed");
  return beforeWin === afterWin
    ? changed.length === 0
    : changed.length === 1 && changed[0]?.solved === afterWin;
}

function addressResolves(state: SimulationState, address: WorldAddress): boolean {
  return resolveWorldAddress(state, address.containerPath) !== undefined && address.rootWorldId === state.rootWorldId;
}

function occurrenceResolves(state: SimulationState, occurrence: { readonly world: WorldAddress; readonly entityId: string }): boolean {
  const worldId = resolveWorldAddress(state, occurrence.world.containerPath);
  const position = state.components.positions[occurrence.entityId];
  return Boolean(worldId && occurrence.world.rootWorldId === state.rootWorldId && state.entities[occurrence.entityId] && position?.worldId === worldId);
}

function occurrenceAtCell(state: SimulationState, occurrence: { readonly world: WorldAddress; readonly entityId: string }, cell: { readonly world: WorldAddress; readonly x: number; readonly y: number }): boolean {
  const position = state.components.positions[occurrence.entityId];
  return sameAddress(occurrence.world, cell.world) && occurrenceResolves(state, occurrence) && cellResolves(state, cell) && position?.x === cell.x && position.y === cell.y;
}

function cellResolves(state: SimulationState, cell: { readonly world: WorldAddress; readonly x: number; readonly y: number }): boolean {
  const worldId = resolveWorldAddress(state, cell.world.containerPath);
  return Boolean(worldId && cell.world.rootWorldId === state.rootWorldId && isPositionInsideWorld(state, { worldId, x: cell.x, y: cell.y }));
}

function portResolves(state: SimulationState, port: { readonly container: { readonly world: WorldAddress; readonly entityId: string }; readonly portId: string }): boolean {
  return resolvedStressPort(state, port) !== undefined;
}

function resolvedStressPort(
  state: SimulationState,
  port: { readonly container: { readonly world: WorldAddress; readonly entityId: string }; readonly portId: string },
): { readonly parentWorldId: string; readonly innerWorldId: string; readonly innerLanding: { readonly x: number; readonly y: number }; readonly outerApproach: Direction; readonly innerExit: Direction; readonly anchor: { readonly worldId: string; readonly x: number; readonly y: number } } | undefined {
  const container = state.components.containers[port.container.entityId];
  const position = state.components.positions[port.container.entityId];
  const parentWorld = resolveWorldAddress(state, port.container.world.containerPath);
  const entry = state.portTables.find((table) => table.containerId === port.container.entityId)?.ports.find((candidate) => candidate.id === port.portId);
  if (!container || !position || !parentWorld || position.worldId !== parentWorld || port.container.world.rootWorldId !== state.rootWorldId || !state.worlds[container.innerWorldId] || !entry) return undefined;
  return { parentWorldId: parentWorld, innerWorldId: container.innerWorldId, innerLanding: entry.innerLanding, outerApproach: entry.outerApproach, innerExit: entry.innerExit, anchor: position };
}

function portalRelation(event: Extract<SemanticEvent, { readonly type: "portal-traversed" }>, before: SimulationState, after: SimulationState): boolean {
  const table = before.portTables.find((entry) => entry.containerId === event.port.container.entityId);
  const port = table?.ports.find((entry) => entry.id === event.port.portId);
  const container = before.components.containers[event.port.container.entityId];
  const anchor = before.components.positions[event.port.container.entityId];
  if (!table || !port || !container || !anchor || event.port.container.world.rootWorldId !== before.rootWorldId || !portResolves(before, event.port) || !portResolves(after, event.port)) return false;
  const beforeWorld = resolveWorldAddress(before, event.actorBefore.world.containerPath);
  const afterWorld = resolveWorldAddress(after, event.actorAfter.world.containerPath);
  const parentCell = nextPosition(anchor, opposite(port.outerApproach));
  if (event.mode === "enter") return beforeWorld === anchor.worldId && afterWorld === container.innerWorldId && sameCell(event.from, event.port.container.world, parentCell.x, parentCell.y) && sameCell(event.to, event.actorAfter.world, port.innerLanding.x, port.innerLanding.y);
  return beforeWorld === container.innerWorldId && afterWorld === anchor.worldId && sameCell(event.from, event.actorBefore.world, port.innerLanding.x, port.innerLanding.y) && sameCell(event.to, event.port.container.world, parentCell.x, parentCell.y);
}

function transferRelation(
  event: Extract<SemanticEvent, { readonly type: "entity-transferred" }>,
  before: SimulationState,
  after: SimulationState,
  movementDirection: Direction | undefined,
): boolean {
  if (event.entityBefore.entityId !== event.entityAfter.entityId || !sameAddress(event.from.world, event.entityBefore.world) || !sameAddress(event.to.world, event.entityAfter.world)) return false;
  if (!occurrenceAtCell(before, event.entityBefore, event.from) || !occurrenceAtCell(after, event.entityAfter, event.to)) return false;
  const beforePort = resolvedStressPort(before, event.via);
  const afterPort = resolvedStressPort(after, event.via);
  if (!beforePort || !afterPort || beforePort.innerWorldId !== afterPort.innerWorldId || beforePort.outerApproach !== afterPort.outerApproach || beforePort.innerExit !== afterPort.innerExit || movementDirection === undefined) return false;
  const id = event.entityBefore.entityId;
  const beforeContainer = before.components.containers[id];
  const afterContainer = after.components.containers[id];
  if (Boolean(beforeContainer) !== Boolean(afterContainer)) return false;
  if (!beforeContainer) {
    if (event.carriedSubtree !== null) return false;
  } else if (!afterContainer || !event.carriedSubtree || event.carriedSubtree.innerWorldId !== beforeContainer.innerWorldId || afterContainer.innerWorldId !== beforeContainer.innerWorldId ||
    !sameAddress(event.carriedSubtree.beforeRoot, { rootWorldId: event.entityBefore.world.rootWorldId, containerPath: [...event.entityBefore.world.containerPath, id] }) ||
    !sameAddress(event.carriedSubtree.afterRoot, { rootWorldId: event.entityAfter.world.rootWorldId, containerPath: [...event.entityAfter.world.containerPath, id] })) return false;

  if (event.mode === "push-in") {
    const child: WorldAddress = { rootWorldId: event.via.container.world.rootWorldId, containerPath: [...event.via.container.world.containerPath, event.via.container.entityId] };
    return movementDirection === beforePort.outerApproach &&
      sameAddress(event.entityBefore.world, event.via.container.world) &&
      sameAddress(event.entityAfter.world, child) &&
      sameCell(event.to, child, beforePort.innerLanding.x, beforePort.innerLanding.y);
  }
  const parentDestination = nextPosition(beforePort.anchor, opposite(beforePort.outerApproach));
  const child: WorldAddress = { rootWorldId: event.via.container.world.rootWorldId, containerPath: [...event.via.container.world.containerPath, event.via.container.entityId] };
  return movementDirection === beforePort.innerExit &&
    sameAddress(event.entityBefore.world, child) &&
    sameAddress(event.entityAfter.world, event.via.container.world) &&
    sameCell(event.from, child, beforePort.innerLanding.x, beforePort.innerLanding.y) &&
    sameCell(event.to, event.via.container.world, parentDestination.x, parentDestination.y);
}

function forwardTransferForOracle(event: Extract<SemanticEvent, { readonly type: "entity-transferred" }>): Extract<SemanticEvent, { readonly type: "entity-transferred" }> {
  return {
    ...event,
    mode: event.mode === "push-in" ? "push-out" : "push-in",
    entityBefore: event.entityAfter,
    entityAfter: event.entityBefore,
    from: event.to,
    to: event.from,
    carriedSubtree: event.carriedSubtree && {
      innerWorldId: event.carriedSubtree.innerWorldId,
      beforeRoot: event.carriedSubtree.afterRoot,
      afterRoot: event.carriedSubtree.beforeRoot,
    },
  };
}

function sameTransaction(left: unknown, right: { readonly initialStateHash: string; readonly sequence: number }): boolean {
  return Boolean(left && typeof left === "object" && (left as { readonly initialStateHash?: unknown }).initialStateHash === right.initialStateHash && (left as { readonly sequence?: unknown }).sequence === right.sequence);
}

function sameAddress(left: WorldAddress, right: WorldAddress): boolean { return left.rootWorldId === right.rootWorldId && left.containerPath.length === right.containerPath.length && left.containerPath.every((entry, index) => entry === right.containerPath[index]); }
function sameCell(cell: { readonly world: WorldAddress; readonly x: number; readonly y: number }, world: WorldAddress, x: number, y: number): boolean { return sameAddress(cell.world, world) && cell.x === x && cell.y === y; }
function eventRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }

function freeCell(state: SimulationState, worldId: string): { readonly x: number; readonly y: number } | undefined {
  const world = state.worlds[worldId]!;
  for (let y = 0; y < world.size.height; y += 1) for (let x = 0; x < world.size.width; x += 1) {
    if (!Object.values(state.components.positions).some((position) => position.worldId === worldId && position.x === x && position.y === y)) return { x, y };
  }
  return undefined;
}

function randomSource(seed: number) {
  let value = seed >>> 0;
  return { next: () => { value = xorshift32(value); return value; } };
}

function shuffle<T>(values: readonly T[], random: { readonly next: () => number }): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const selected = random.next() % (index + 1);
    [copy[index], copy[selected]] = [copy[selected]!, copy[index]!];
  }
  return copy;
}
