import { describe, expect, it } from "vitest";
import { Redo, Reset, Step, Undo } from "./commands";
import { hashState } from "./hash";
import { createSimulationSession } from "./history";
import { dispatchPublicCommand } from "./reducer";
import { replayPublicCommands } from "./replay";
import type { SemanticEvent, SimulationState } from "./types";

describe("R2 recursive transfers", () => {
  it("pushes a terminal payload into a receiver, reverses it, and replays the exact public event", () => {
    const initial = transferFixture();
    const initialSession = createSimulationSession(initial);
    const beforeHash = hashState(initialSession.present);
    const pushed = dispatchPublicCommand(initialSession, Step("right"));
    expect(pushed.result).toMatchObject({
      kind: "accepted",
      command: { type: "step", direction: "right" },
      transaction: {
        rule: "push",
        stateHashBefore: beforeHash,
        activeAddressBefore: { rootWorldId: "root", containerPath: [] },
        activeAddressAfter: { rootWorldId: "root", containerPath: [] },
        events: [
          { type: "push-resolved", eventIndex: 0, direction: "forward", directionMoved: "right", moved: [] },
          {
            type: "entity-transferred",
            eventIndex: 1,
            direction: "forward",
            mode: "push-in",
            entityBefore: { entityId: "box", world: { rootWorldId: "root", containerPath: [] } },
            entityAfter: { entityId: "box", world: { rootWorldId: "root", containerPath: ["receiver"] } },
            from: { world: { rootWorldId: "root", containerPath: [] }, x: 2, y: 2 },
            to: { world: { rootWorldId: "root", containerPath: ["receiver"] }, x: 2, y: 2 },
            via: { container: { entityId: "receiver", world: { rootWorldId: "root", containerPath: [] } }, portId: "in" },
            carriedSubtree: null,
          },
          { type: "entity-moved", eventIndex: 2, direction: "forward", cause: "push", from: { x: 1, y: 2 }, to: { x: 2, y: 2 } },
        ],
      },
    });
    expect(pushed.session.present.components.positions.box).toEqual({ worldId: "inside", x: 2, y: 2 });
    const forwardHash = hashState(pushed.session.present);
    expect(beforeHash).toBe("890b95bc");
    expect(forwardHash).toBe("d59d49af");

    const undone = dispatchPublicCommand(pushed.session, Undo());
    expect(undone.result).toMatchObject({
      kind: "accepted",
      transaction: {
        rule: "undo",
        sourceTransactionId: pushed.result.kind === "accepted" ? pushed.result.transaction.id : undefined,
        events: [
          { type: "entity-moved", eventIndex: 0, direction: "reverse", cause: "push", from: { x: 2, y: 2 }, to: { x: 1, y: 2 } },
          { type: "entity-transferred", eventIndex: 1, direction: "reverse", mode: "push-out", from: { world: { containerPath: ["receiver"] }, x: 2, y: 2 }, to: { world: { containerPath: [] }, x: 2, y: 2 } },
          { type: "push-resolved", eventIndex: 2, direction: "reverse", moved: [] },
        ],
      },
    });
    expect(hashState(undone.session.present)).toBe("890b95bc");

    const redone = dispatchPublicCommand(undone.session, Redo());
    expect(redone.result).toMatchObject({
      kind: "accepted",
      transaction: { rule: "redo", sourceTransactionId: pushed.result.kind === "accepted" ? pushed.result.transaction.id : undefined },
    });
    expect(hashState(redone.session.present)).toBe("d59d49af");
  });

  it("shifts the remaining source chain far-to-near while only the terminal payload transfers", () => {
    const pushed = dispatchPublicCommand(createSimulationSession(transferFixture({ multi: true })), Step("right"));
    expect(pushed.result.kind).toBe("accepted");
    expect(pushed.session.present.components.positions.near).toEqual({ worldId: "root", x: 3, y: 2 });
    expect(pushed.session.present.components.positions.terminal).toEqual({ worldId: "inside", x: 2, y: 2 });
    expect(pushed.result.kind === "accepted" && pushed.result.transaction.events).toMatchObject([
      {
        type: "push-resolved",
        moved: [{ occurrence: { entityId: "near" }, from: { x: 2, y: 2 }, to: { x: 3, y: 2 }, cause: "push" }],
      },
      { type: "entity-transferred", entityBefore: { entityId: "terminal" } },
      { type: "entity-moved", cause: "push", from: { x: 1, y: 2 }, to: { x: 2, y: 2 } },
    ]);
  });

  it("does not transfer an inner-landing payload while a farther contiguous payload extends the chain", () => {
    const base = transferFixture();
    const initial: SimulationState = {
      ...base,
      entities: { ...base.entities, farther: { id: "farther" } },
      components: {
        ...base.components,
        positions: { ...base.components.positions, farther: { worldId: "inside", x: 1, y: 2 } },
        solids: { ...base.components.solids, farther: { blocksMovement: true } },
        pushables: { ...base.components.pushables, farther: { pushable: true } },
      },
    };
    let session = createSimulationSession(initial);
    for (const command of [Step("right"), Step("up"), Step("right"), Step("down"), Step("right"), Step("right"), Step("down")]) {
      const result = dispatchPublicCommand(session, command);
      expect(result.result.kind).toBe("accepted");
      session = result.session;
    }
    const result = dispatchPublicCommand(session, Step("left"));
    expect(result.result).toMatchObject({ kind: "accepted", transaction: { rule: "push" } });
    expect(result.result.kind === "accepted" && result.result.transaction.events.map((event) => event.type)).toEqual(["push-resolved", "entity-moved"]);
    expect(result.session.present.components.positions.box).toEqual({ worldId: "inside", x: 1, y: 2 });
    expect(result.session.present.components.positions.farther).toEqual({ worldId: "inside", x: 0, y: 2 });
  });

  it("keeps a gap local and never teleports to a remote receiver", () => {
    const pushed = dispatchPublicCommand(createSimulationSession(transferFixture({ gap: true })), Step("right"));
    expect(pushed.result.kind).toBe("accepted");
    expect(pushed.session.present.components.positions.box).toEqual({ worldId: "root", x: 3, y: 2 });
    expect(pushed.result.kind === "accepted" && pushed.result.transaction.events.map((event) => event.type)).toEqual([
      "push-resolved",
      "entity-moved",
    ]);
  });

  it("makes a classified receiver port failure terminal and leaves the session unchanged", () => {
    const initial = transferFixture({ missingIncomingPort: true });
    const session = createSimulationSession(initial);
    const before = JSON.stringify(session);
    const result = dispatchPublicCommand(session, Step("right"));
    expect(result.session).toBe(session);
    expect(result.result).toMatchObject({
      kind: "rejected",
      rejection: { code: "port-absent", rule: "push" },
      attempts: [{ kind: "not-applicable", rule: "walk" }, { kind: "not-applicable", rule: "enter" }, { kind: "blocked", rule: "push" }],
    });
    expect(JSON.stringify(session)).toBe(before);
  });

  it("pushes a payload back out through the exact focused port without changing focus", () => {
    let session = createSimulationSession(transferFixture());
    const inResult = dispatchPublicCommand(session, Step("right"));
    session = inResult.session;
    for (const command of [Step("up"), Step("right"), Step("down"), Step("right"), Step("right"), Step("down")]) {
      const result = dispatchPublicCommand(session, command);
      expect(result.result.kind).toBe("accepted");
      session = result.session;
    }
    const beforeOutHash = hashState(session.present);
    const out = dispatchPublicCommand(session, Step("left"));
    expect(out.result).toMatchObject({
      kind: "accepted",
      transaction: {
        rule: "push",
        activeAddressBefore: { rootWorldId: "root", containerPath: ["receiver"] },
        activeAddressAfter: { rootWorldId: "root", containerPath: ["receiver"] },
        events: [
          { type: "push-resolved", moved: [] },
          {
            type: "entity-transferred",
            mode: "push-out",
            entityBefore: { entityId: "box", world: { containerPath: ["receiver"] } },
            entityAfter: { entityId: "box", world: { containerPath: [] } },
            via: { portId: "in" },
          },
          { type: "entity-moved", cause: "push", from: { x: 3, y: 2 }, to: { x: 2, y: 2 } },
        ],
      },
    });
    expect(out.session.present.components.positions.box).toEqual({ worldId: "root", x: 2, y: 2 });
    expect(out.session.present.focusPath).toEqual(["receiver"]);
    expect(beforeOutHash).toBe("95a606a5");
    expect(hashState(out.session.present)).toBe("0d32569c");
    const undone = dispatchPublicCommand(out.session, Undo());
    expect(undone.result).toMatchObject({
      kind: "accepted",
      transaction: {
        rule: "undo",
        sourceTransactionId: out.result.kind === "accepted" ? out.result.transaction.id : undefined,
        events: [
          { type: "entity-moved", eventIndex: 0, direction: "reverse", cause: "push" },
          { type: "entity-transferred", eventIndex: 1, direction: "reverse", mode: "push-in", via: { portId: "in" } },
          { type: "push-resolved", eventIndex: 2, direction: "reverse", moved: [] },
        ],
      },
    });
    expect(hashState(undone.session.present)).toBe("95a606a5");
    const redone = dispatchPublicCommand(undone.session, Redo());
    expect(redone.result).toMatchObject({ kind: "accepted", transaction: { rule: "redo", sourceTransactionId: out.result.kind === "accepted" ? out.result.transaction.id : undefined } });
    expect(hashState(redone.session.present)).toBe("0d32569c");
  });

  it("carries a world-bearing terminal payload without cloning its child root", () => {
    const base = transferFixture({ worldBearing: true });
    const initial = { ...base, ruleSet: { ...base.ruleSet, interactionPriority: ["push", "enter", "exit"] as const } };
    const result = dispatchPublicCommand(createSimulationSession(initial), Step("right"));
    expect(result.result.kind).toBe("accepted");
    if (result.result.kind === "accepted") {
      expect(result.result.transaction.events).toEqual(expect.arrayContaining([
        expect.objectContaining({
          type: "entity-transferred",
          entityBefore: { entityId: "box", world: { rootWorldId: "root", containerPath: [] } },
          entityAfter: { entityId: "box", world: { rootWorldId: "root", containerPath: ["receiver"] } },
          carriedSubtree: {
            innerWorldId: "carried",
            beforeRoot: { rootWorldId: "root", containerPath: ["box"] },
            afterRoot: { rootWorldId: "root", containerPath: ["receiver", "box"] },
          },
        }),
      ]));
    }
    expect(result.session.present.components.containers.box).toEqual({ innerWorldId: "carried" });
  });

  it("rejects a forged transfer event even when its state hashes are recomputed", () => {
    const accepted = dispatchPublicCommand(createSimulationSession(transferFixture()), Step("right"));
    const record = accepted.session.history.past[0]!;
    const forgedEvents = record.transaction.events.map((event) => event.type === "entity-transferred"
      ? { ...event, via: { ...event.via, portId: "entry" } }
      : event,
    );
    const forged = {
      ...accepted.session,
      history: { ...accepted.session.history, past: [{ ...record, transaction: { ...record.transaction, events: forgedEvents as readonly SemanticEvent[] } }] },
    };
    const before = JSON.stringify(forged);
    const undo = dispatchPublicCommand(forged, Undo());
    expect(undo.session).toBe(forged);
    expect(undo.result).toMatchObject({ kind: "rejected", rejection: { code: "invalid-level-data" }, attempts: [] });
    expect(JSON.stringify(forged)).toBe(before);
  });

  it("rejects self-consistent first-record and adjacent-record transfer forgeries against the session chain", () => {
    let session = dispatchPublicCommand(createSimulationSession(transferFixture()), Step("right")).session;
    const first = session.history.past[0]!;
    const forgedFirstRecord = rewriteRecordWithUnrelatedPortGeometry(first);
    const forgedFirst = { ...session, history: { ...session.history, past: [forgedFirstRecord] } };
    const firstBefore = JSON.stringify(forgedFirst);
    const firstUndo = dispatchPublicCommand(forgedFirst, Undo());
    expect(firstUndo.session).toBe(forgedFirst);
    expect(firstUndo.result).toMatchObject({ kind: "rejected", rejection: { code: "invalid-level-data" }, attempts: [] });
    expect(JSON.stringify(forgedFirst)).toBe(firstBefore);

    session = dispatchPublicCommand(session, Step("up")).session;
    const second = session.history.past[1]!;
    const forgedSecond = rewriteRecordWithUnrelatedPortGeometry(second);
    const brokenLink = { ...session, history: { ...session.history, past: [session.history.past[0]!, forgedSecond] } };
    const linkBefore = JSON.stringify(brokenLink);
    const linkedUndo = dispatchPublicCommand(brokenLink, Undo());
    expect(linkedUndo.session).toBe(brokenLink);
    expect(linkedUndo.result).toMatchObject({ kind: "rejected", rejection: { code: "invalid-level-data" }, attempts: [] });
    expect(JSON.stringify(brokenLink)).toBe(linkBefore);
  });

  it("rejects a forged earlier non-event canonical transfer state when a later valid Reset is selected for Undo", () => {
    const pushed = dispatchPublicCommand(createSimulationSession(transferFixture()), Step("right"));
    const original = pushed.session.history.past[0]!;
    const forgedTransfer = rewriteOnlyNextStatePalette(original);
    const forgedSession = {
      ...pushed.session,
      present: forgedTransfer.nextState,
      history: { ...pushed.session.history, past: [forgedTransfer] },
    };
    const reset = dispatchPublicCommand(forgedSession, Reset());
    expect(reset.result).toMatchObject({ kind: "accepted", transaction: { rule: "reset" } });
    expect(reset.session.history.past).toHaveLength(2);
    expect(reset.session.history.past[1]?.previousState).toEqual(forgedTransfer.nextState);

    const before = JSON.stringify(reset.session);
    const undo = dispatchPublicCommand(reset.session, Undo());
    expect(undo.session).toBe(reset.session);
    expect(undo.result).toMatchObject({ kind: "rejected", rejection: { code: "invalid-level-data" }, attempts: [] });
    expect(JSON.stringify(reset.session)).toBe(before);
  });

  it("replays transfer, undo, and redo with the same addressed trace and final hash", () => {
    const initial = transferFixture();
    const commands = [Step("right"), Undo(), Redo()];
    const replay = replayPublicCommands(initial, commands);
    expect(replay.finalHash).toBe("d59d49af");
    expect(replay.results.map((result) => result.kind)).toEqual(["accepted", "accepted", "accepted"]);
    const first = replay.results[0];
    const second = replay.results[1];
    expect(first?.kind === "accepted" && first.transaction.events.map((event) => event.type)).toEqual(["push-resolved", "entity-transferred", "entity-moved"]);
    expect(first?.kind === "accepted" && first.transaction.events[1]).toMatchObject({ type: "entity-transferred", mode: "push-in" });
    expect(second?.kind === "accepted" && second.transaction.events.map((event) => event.type)).toEqual(["entity-moved", "entity-transferred", "push-resolved"]);
    expect(second?.kind === "accepted" && second.transaction.events[1]).toMatchObject({ type: "entity-transferred", mode: "push-out", direction: "reverse" });
  });
});

function transferFixture(options: { readonly multi?: boolean; readonly gap?: boolean; readonly missingIncomingPort?: boolean; readonly worldBearing?: boolean } = {}): SimulationState {
  const payloadIds = options.multi ? ["near", "terminal"] : ["box"];
  const receiverX = options.gap ? 4 : options.multi ? 4 : 3;
  const positions: Record<string, { readonly worldId: string; readonly x: number; readonly y: number }> = {
    player: { worldId: "root", x: 1, y: 2 },
    receiver: { worldId: "root", x: receiverX, y: 2 },
  };
  if (options.multi) {
    positions.near = { worldId: "root", x: 2, y: 2 };
    positions.terminal = { worldId: "root", x: 3, y: 2 };
  } else {
    positions.box = { worldId: "root", x: 2, y: 2 };
  }
  const entities = Object.fromEntries(["player", "receiver", ...payloadIds].map((id) => [id, { id }]));
  const containers: Record<string, { readonly innerWorldId: string }> = { receiver: { innerWorldId: "inside" } };
  const portTables = [{
    containerId: "receiver",
    ports: [
      { id: options.missingIncomingPort ? "wrong" : "in", outerApproach: options.missingIncomingPort ? "up" as const : "right" as const, innerLanding: { x: 2, y: 2 }, innerExit: options.missingIncomingPort ? "down" as const : "left" as const },
      { id: "entry", outerApproach: "down" as const, innerLanding: { x: 1, y: 1 }, innerExit: "up" as const },
    ],
  }];
  if (options.worldBearing) {
    entities.box = { id: "box" };
    containers.box = { innerWorldId: "carried" };
    portTables.push({ containerId: "box", ports: [{ id: "box-port", outerApproach: "up" as const, innerLanding: { x: 1, y: 1 }, innerExit: "down" as const }] });
  }
  return {
    version: 1,
    rootWorldId: "root",
    activeWorldId: "root",
    playerId: "player",
    focusPath: [],
    ruleSet: { version: 1, cycleMode: "forbid", ruleEnablement: { push: "enabled", enter: "enabled", exit: "enabled" }, interactionPriority: ["enter", "push", "exit"] },
    portTables,
    worlds: {
      root: { id: "root", paletteId: "void-lab", size: { width: 8, height: 5 } },
      inside: { id: "inside", paletteId: "inner-mint", size: { width: 5, height: 5 } },
      ...(options.worldBearing ? { carried: { id: "carried", paletteId: "void-lab" as const, size: { width: 3, height: 3 } } } : {}),
    },
    entities,
    components: {
      positions,
      containers,
      solids: Object.fromEntries(["player", "receiver", ...payloadIds].map((id) => [id, { blocksMovement: true as const }])),
      pushables: Object.fromEntries(payloadIds.map((id) => [id, { pushable: true as const }])),
      players: { player: { controlled: true } },
      goals: {},
      visuals: {},
    },
  };
}

function rewriteRecordWithUnrelatedPortGeometry<T extends { readonly previousState: SimulationState; readonly nextState: SimulationState; readonly transaction: { readonly stateHashBefore: string; readonly stateHashAfter: string } }>(record: T): T {
  const rewrite = (state: SimulationState): SimulationState => ({
    ...state,
    portTables: state.portTables.map((table) => table.containerId === "receiver"
      ? { ...table, ports: table.ports.map((port) => port.id === "entry" ? { ...port, outerApproach: "up" as const, innerExit: "down" as const } : port) }
      : table),
  });
  const previousState = rewrite(record.previousState);
  const nextState = rewrite(record.nextState);
  return {
    ...record,
    previousState,
    nextState,
    transaction: { ...record.transaction, stateHashBefore: hashState(previousState), stateHashAfter: hashState(nextState) },
  };
}

function rewriteOnlyNextStatePalette<T extends { readonly previousState: SimulationState; readonly nextState: SimulationState; readonly transaction: { readonly stateHashBefore: string; readonly stateHashAfter: string } }>(record: T): T {
  const nextState: SimulationState = {
    ...record.nextState,
    worlds: {
      ...record.nextState.worlds,
      root: { ...record.nextState.worlds.root!, paletteId: "inner-mint" },
    },
  };
  return {
    ...record,
    nextState,
    transaction: { ...record.transaction, stateHashAfter: hashState(nextState) },
  };
}
