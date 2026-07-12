import { setEntityPosition } from "./components";
import { getSolidOccupantsAt } from "./collision";
import { nextPosition } from "./grid";
import { activeWorldAddress, cellAddress } from "./ports";
import { opposite } from "./validation";
import { isPositionInsideWorld, resolveWorldAddress } from "./worldGraph";
import type {
  CellAddress,
  Direction,
  EntityId,
  EntityOccurrenceAddress,
  PortOccurrenceAddress,
  Rejection,
  SimulationState,
  WorldAddress,
} from "./types";

export interface PushShift {
  readonly entityId: EntityId;
  readonly from: { readonly worldId: string; readonly x: number; readonly y: number };
  readonly to: { readonly worldId: string; readonly x: number; readonly y: number };
}

export interface RecursiveTransfer {
  readonly mode: "push-in" | "push-out";
  readonly entityBefore: EntityOccurrenceAddress;
  readonly entityAfter: EntityOccurrenceAddress;
  readonly from: CellAddress;
  readonly to: CellAddress;
  readonly via: PortOccurrenceAddress;
  readonly carriedSubtree: {
    readonly innerWorldId: string;
    readonly beforeRoot: WorldAddress;
    readonly afterRoot: WorldAddress;
  } | null;
}

export type RecursiveTransferResolution =
  | { readonly kind: "not-applicable" }
  | { readonly kind: "blocked"; readonly rejection: Rejection }
  | {
      readonly kind: "accepted";
      readonly state: SimulationState;
      readonly actorFrom: { readonly worldId: string; readonly x: number; readonly y: number };
      readonly actorTo: { readonly worldId: string; readonly x: number; readonly y: number };
      readonly shifted: readonly PushShift[];
      readonly transfer: RecursiveTransfer;
    };

interface PayloadEntry {
  readonly entityId: EntityId;
  readonly from: { readonly worldId: string; readonly x: number; readonly y: number };
}

/**
 * Classifies only executable R2 transfer geometry. Local push remains the
 * movement resolver's fallback when no exact boundary reservation exists.
 */
export function resolveRecursiveTransfer(
  state: SimulationState,
  actorId: EntityId,
  actorPosition: { readonly worldId: string; readonly x: number; readonly y: number },
  direction: Direction,
  attemptedCell: CellAddress,
): RecursiveTransferResolution {
  const active = activeWorldAddress(state);
  if (!active || actorPosition.worldId !== state.activeWorldId) {
    return { kind: "blocked", rejection: invalidPush(attemptedCell) };
  }

  let cursor = nextPosition(actorPosition, direction);
  if (!isPositionInsideWorld(state, cursor)) {
    return { kind: "not-applicable" };
  }

  const chain: PayloadEntry[] = [];
  while (true) {
    const solids = getSolidOccupantsAt(state, cursor, actorId);
    if (solids.length === 0) {
      return { kind: "not-applicable" };
    }
    if (solids.length !== 1) {
      return { kind: "blocked", rejection: invalidPush(cellAddress(active, cursor.x, cursor.y)) };
    }

    const payload = solids[0]!;
    if (!state.components.pushables[payload.id]) {
      return { kind: "not-applicable" };
    }
    const payloadPosition = state.components.positions[payload.id];
    if (!payloadPosition) {
      return { kind: "blocked", rejection: invalidPush(cellAddress(active, cursor.x, cursor.y)) };
    }
    chain.push({ entityId: payload.id, from: payloadPosition });

    const next = nextPosition(cursor, direction);
    const nextSolids = isPositionInsideWorld(state, next) ? getSolidOccupantsAt(state, next, actorId) : [];
    const receiver = nextSolids.find((entity) => Boolean(state.components.containers[entity.id]));
    const nextIsPayload = nextSolids.length === 1 && !receiver && Boolean(state.components.pushables[nextSolids[0]!.id]);
    if (nextIsPayload) {
      cursor = next;
      continue;
    }

    // A landing payload is transferable only after proving that no farther
    // contiguous pushable payload extends the source chain.
    const pushOut = resolvePushOut(state, actorId, active, chain, actorPosition, direction, attemptedCell);
    if (pushOut.kind !== "not-applicable") {
      return pushOut;
    }
    if (receiver) {
      return resolvePushIn(state, actorId, active, chain, actorPosition, direction, receiver.id, next, attemptedCell);
    }
    return { kind: "not-applicable" };
  }
}

function resolvePushIn(
  state: SimulationState,
  actorId: EntityId,
  active: WorldAddress,
  chain: readonly PayloadEntry[],
  actorPosition: { readonly worldId: string; readonly x: number; readonly y: number },
  direction: Direction,
  receiverId: EntityId,
  receiverCell: { readonly worldId: string; readonly x: number; readonly y: number },
  attemptedCell: CellAddress,
): RecursiveTransferResolution {
  const receiver = state.components.containers[receiverId];
  const table = state.portTables.find((entry) => entry.containerId === receiverId);
  const receiverOccurrence: EntityOccurrenceAddress = { world: active, entityId: receiverId };
  if (!receiver || !table) {
    return { kind: "blocked", rejection: portRejection("port-absent", attemptedCell) };
  }
  const matches = table.ports.filter((port) => port.outerApproach === direction);
  if (matches.length !== 1) {
    return { kind: "blocked", rejection: portRejection(matches.length === 0 ? "port-absent" : "port-ambiguous", attemptedCell) };
  }
  const port = matches[0]!;
  const via: PortOccurrenceAddress = { container: receiverOccurrence, portId: port.id };
  const childAddress: WorldAddress = { rootWorldId: state.rootWorldId, containerPath: [...active.containerPath, receiverId] };
  const landing = { worldId: receiver.innerWorldId, x: port.innerLanding.x, y: port.innerLanding.y };
  if (!isPositionInsideWorld(state, landing)) {
    return { kind: "blocked", rejection: portRejection("port-landing-out-of-bounds", attemptedCell, via) };
  }
  if (getSolidOccupantsAt(state, landing).length > 0) {
    return { kind: "blocked", rejection: portRejection("port-landing-occupied", attemptedCell, via) };
  }
  const terminal = chain.at(-1);
  const nearest = chain[0];
  if (!terminal || !nearest || receiverCell.worldId !== state.activeWorldId) {
    return { kind: "blocked", rejection: invalidPush(attemptedCell) };
  }
  const entityBefore: EntityOccurrenceAddress = { world: active, entityId: terminal.entityId };
  const entityAfter: EntityOccurrenceAddress = { world: childAddress, entityId: terminal.entityId };
  const nextState = applyTransferPositions(
    state,
    actorId,
    actorPosition,
    direction,
    chain,
    { entityId: terminal.entityId, to: landing },
  );
  if (!hasUnchangedFocus(nextState, active)) {
    return { kind: "blocked", rejection: invalidPush(attemptedCell) };
  }
  return {
    kind: "accepted",
    state: nextState,
    actorFrom: actorPosition,
    actorTo: nearest.from,
    shifted: shiftedEntries(chain, direction),
    transfer: {
      mode: "push-in",
      entityBefore,
      entityAfter,
      from: cellAddress(active, terminal.from.x, terminal.from.y),
      to: cellAddress(childAddress, landing.x, landing.y),
      via,
      carriedSubtree: carriedSubtree(state, terminal.entityId, entityBefore.world, entityAfter.world),
    },
  };
}

function resolvePushOut(
  state: SimulationState,
  actorId: EntityId,
  active: WorldAddress,
  chain: readonly PayloadEntry[],
  actorPosition: { readonly worldId: string; readonly x: number; readonly y: number },
  direction: Direction,
  attemptedCell: CellAddress,
): RecursiveTransferResolution {
  if (state.focusPath.length === 0) {
    return { kind: "not-applicable" };
  }
  const terminal = chain.at(-1);
  const nearest = chain[0];
  const containerId = state.focusPath.at(-1);
  if (!terminal || !nearest || !containerId) {
    return { kind: "not-applicable" };
  }
  const parentPath = state.focusPath.slice(0, -1);
  const parentWorldId = resolveWorldAddress(state, parentPath);
  const parentAddress: WorldAddress = { rootWorldId: state.rootWorldId, containerPath: parentPath };
  const container = state.components.containers[containerId];
  const containerPosition = state.components.positions[containerId];
  const table = state.portTables.find((entry) => entry.containerId === containerId);
  if (!parentWorldId || !container || !containerPosition || !table || terminal.from.worldId !== container.innerWorldId) {
    return { kind: "blocked", rejection: invalidPush(attemptedCell) };
  }

  const matches = table.ports.filter((port) =>
    port.innerLanding.x === terminal.from.x && port.innerLanding.y === terminal.from.y && port.innerExit === direction,
  );
  if (matches.length === 0) {
    return { kind: "not-applicable" };
  }
  if (matches.length !== 1) {
    return { kind: "blocked", rejection: portRejection("port-ambiguous", attemptedCell) };
  }
  const port = matches[0]!;
  const via: PortOccurrenceAddress = { container: { world: parentAddress, entityId: containerId }, portId: port.id };
  const destination = nextPosition(containerPosition, opposite(port.outerApproach));
  const destinationCell = cellAddress(parentAddress, destination.x, destination.y);
  if (!isPositionInsideWorld(state, destination)) {
    return { kind: "blocked", rejection: portRejection("port-parent-destination-out-of-bounds", destinationCell, via) };
  }
  if (getSolidOccupantsAt(state, destination).length > 0) {
    return { kind: "blocked", rejection: portRejection("port-parent-destination-occupied", destinationCell, via) };
  }

  const entityBefore: EntityOccurrenceAddress = { world: active, entityId: terminal.entityId };
  const entityAfter: EntityOccurrenceAddress = { world: parentAddress, entityId: terminal.entityId };
  const nextState = applyTransferPositions(
    state,
    actorId,
    actorPosition,
    direction,
    chain,
    { entityId: terminal.entityId, to: destination },
  );
  if (!hasUnchangedFocus(nextState, active)) {
    return { kind: "blocked", rejection: invalidPush(attemptedCell) };
  }
  return {
    kind: "accepted",
    state: nextState,
    actorFrom: actorPosition,
    actorTo: nearest.from,
    shifted: shiftedEntries(chain, direction),
    transfer: {
      mode: "push-out",
      entityBefore,
      entityAfter,
      from: cellAddress(active, terminal.from.x, terminal.from.y),
      to: destinationCell,
      via,
      carriedSubtree: carriedSubtree(state, terminal.entityId, entityBefore.world, entityAfter.world),
    },
  };
}

function applyTransferPositions(
  state: SimulationState,
  actorId: EntityId,
  actorPosition: { readonly worldId: string; readonly x: number; readonly y: number },
  direction: Direction,
  chain: readonly PayloadEntry[],
  terminalMove: { readonly entityId: EntityId; readonly to: { readonly worldId: string; readonly x: number; readonly y: number } },
): SimulationState {
  let next = setEntityPosition(state, terminalMove.entityId, terminalMove.to);
  for (const entry of [...chain.slice(0, -1)].reverse()) {
    next = setEntityPosition(next, entry.entityId, nextPosition(entry.from, direction));
  }
  return setEntityPosition(next, actorId, nextPosition(actorPosition, direction));
}

function shiftedEntries(chain: readonly PayloadEntry[], direction: Direction): readonly PushShift[] {
  return [...chain.slice(0, -1)].reverse().map((entry) => ({
    entityId: entry.entityId,
    from: entry.from,
    to: nextPosition(entry.from, direction),
  }));
}

function carriedSubtree(
  state: SimulationState,
  entityId: EntityId,
  beforeWorld: WorldAddress,
  afterWorld: WorldAddress,
): RecursiveTransfer["carriedSubtree"] {
  const container = state.components.containers[entityId];
  if (!container) return null;
  return {
    innerWorldId: container.innerWorldId,
    beforeRoot: { rootWorldId: beforeWorld.rootWorldId, containerPath: [...beforeWorld.containerPath, entityId] },
    afterRoot: { rootWorldId: afterWorld.rootWorldId, containerPath: [...afterWorld.containerPath, entityId] },
  };
}

function hasUnchangedFocus(state: SimulationState, expected: WorldAddress): boolean {
  const actual = activeWorldAddress(state);
  return Boolean(
    actual &&
      actual.rootWorldId === expected.rootWorldId &&
      actual.containerPath.length === expected.containerPath.length &&
      actual.containerPath.every((entry, index) => entry === expected.containerPath[index]),
  );
}

function invalidPush(attemptedCell: CellAddress): Rejection {
  return { code: "invalid-level-data", reason: { kind: "validation" }, rule: "push", attemptedCell };
}

function portRejection(
  code: Extract<Rejection["code"], "port-absent" | "port-ambiguous" | "port-landing-out-of-bounds" | "port-landing-occupied" | "port-parent-destination-out-of-bounds" | "port-parent-destination-occupied">,
  attemptedCell: CellAddress,
  port?: PortOccurrenceAddress,
): Rejection {
  return { code, reason: { kind: "port" }, rule: "push", attemptedCell, ...(port ? { port } : {}) };
}
