import { setEntityPosition } from "./components";
import { resolvePushChain } from "./collision";
import { nextPosition } from "./grid";
import { resolveRecursiveTransfer, type RecursiveTransfer } from "./recursiveTransfers";
import type { CellAddress, Direction, EntityId, GridPosition, Rejection, SimulationState } from "./types";

export type MovementResolution =
  | { readonly kind: "not-applicable" }
  | { readonly kind: "blocked"; readonly rejection: Rejection }
  | {
      readonly kind: "accepted";
      readonly state: SimulationState;
      readonly actorFrom: GridPosition;
      readonly actorTo: GridPosition;
      readonly pushed: readonly { readonly entityId: EntityId; readonly from: GridPosition; readonly to: GridPosition }[];
      readonly transfer?: RecursiveTransfer;
    };

export function resolveMovement(
  state: SimulationState,
  actorId: EntityId,
  actorPosition: GridPosition,
  direction: Direction,
  attemptedCell: CellAddress,
): MovementResolution {
  const transfer = resolveRecursiveTransfer(state, actorId, actorPosition, direction, attemptedCell);
  if (transfer.kind === "blocked") {
    return transfer;
  }
  if (transfer.kind === "accepted") {
    return {
      kind: "accepted",
      state: transfer.state,
      actorFrom: transfer.actorFrom,
      actorTo: transfer.actorTo,
      pushed: transfer.shifted,
      transfer: transfer.transfer,
    };
  }
  const target = nextPosition(actorPosition, direction);
  const chain = resolvePushChain(state, target, direction, actorId);
  if (chain.kind === "not-applicable") {
    return { kind: "not-applicable" };
  }
  if (chain.kind === "blocked") {
    const rejection: Rejection = chain.code === "target-out-of-bounds"
      ? { code: chain.code, reason: { kind: "target" }, rule: "push", attemptedCell }
      : chain.code === "target-solid-not-pushable"
        ? { code: chain.code, reason: { kind: "target" }, rule: "push", attemptedCell }
        : { code: chain.code, reason: { kind: "push" }, rule: "push", attemptedCell };
    return { kind: "blocked", rejection };
  }
  let nextState = state;
  for (const entry of [...chain.chain].reverse()) {
    nextState = setEntityPosition(nextState, entry.entity.id, entry.to);
  }
  nextState = setEntityPosition(nextState, actorId, target);
  return {
    kind: "accepted",
    state: nextState,
    actorFrom: actorPosition,
    actorTo: target,
    pushed: chain.chain.map((entry) => ({ entityId: entry.entity.id, from: entry.from, to: entry.to })),
  };
}
