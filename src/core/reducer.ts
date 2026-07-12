import { isPublicCommand, type PublicCommand, type StepCommand } from "./commands";
import { setEntityPosition } from "./components";
import { getSolidOccupantsAt } from "./collision";
import { nextPosition } from "./grid";
import { commitHistoricalTraversal, commitTransaction, type HistoryRecord, type SimulationSession } from "./history";
import { hashState } from "./hash";
import { resolveMovement } from "./movementResolver";
import type { RecursiveTransfer } from "./recursiveTransfers";
import { activeWorldAddress, cellAddress, selectEntryPort, selectExitPort } from "./ports";
import { opposite, validateInitialSimulationState, validateSimulationState, validationRejection } from "./validation";
import { isWinSatisfied } from "./win";
import { resolveWorldAddress } from "./worldGraph";
import type {
  AttemptOutcome,
  CellAddress,
  CommandBlockedEvent,
  CommandResult,
  Direction,
  EntityTransferredEvent,
  EntityMovedEvent,
  NonStepCommand,
  Rejection,
  SemanticEvent,
  SimulationState,
  Transaction,
  TransactionId,
  WorldAddress,
} from "./types";

export interface PublicDispatchEnvelope {
  readonly session: SimulationSession;
  readonly result: CommandResult;
}

export function dispatchPublicCommand(session: SimulationSession, command: PublicCommand): PublicDispatchEnvelope {
  if (!isPublicCommand(command)) {
    throw new TypeError("Invalid PublicCommand.");
  }
  if (!hasValidSessionSequence(session)) {
    return emergencyRejected(session, command);
  }
  try {
    if (command.type === "step") {
      return dispatchStep(session, command);
    }
    return dispatchNonStep(session, command);
  } catch {
    return emergencyRejected(session, command);
  }
}

function dispatchStep(session: SimulationSession, command: StepCommand): PublicDispatchEnvelope {
  try {
    const preflight = preflightStep(session.present);
    if (preflight.kind === "rejected") {
      return rejectedStep(session, command, preflight.rejection, [blocked("step-fallback", preflight.rejection)]);
    }
    const validation = validateSimulationState(session.present);
    const levelRejection = validationRejection(validation);
    if (levelRejection) {
      const rejection = withRule(levelRejection, "step-fallback");
      return rejectedStep(session, command, rejection, [notApplicable("walk"), blocked("step-fallback", rejection)]);
    }
    const target = nextPosition(preflight.position, command.direction);
    if (isInsideAndEmpty(session.present, target, preflight.actorId)) {
      const nextState = setEntityPosition(session.present, preflight.actorId, target);
      return acceptedStep(session, command, "walk", nextState, [], (transactionId) => {
        const address = preflight.address;
        return appendWinChanged(session.present, nextState, transactionId, [
          entityMoved(transactionId, 0, { world: address, entityId: preflight.actorId }, cellAddress(address, preflight.position.x, preflight.position.y), cellAddress(address, target.x, target.y), "walk"),
        ]);
      });
    }
    const attempts: AttemptOutcome[] = [notApplicable("walk")];
    for (const rule of session.present.ruleSet.interactionPriority) {
      if (rule === "push") {
        const resolution = resolveMovement(
          session.present,
          preflight.actorId,
          preflight.position,
          command.direction,
          cellAddress(preflight.address, target.x, target.y),
        );
        if (resolution.kind === "not-applicable") {
          attempts.push(notApplicable("push"));
          continue;
        }
        if (resolution.kind === "blocked") {
          attempts.push(blocked("push", resolution.rejection));
          return rejectedStep(session, command, resolution.rejection, attempts);
        }
        return acceptedStep(session, command, "push", resolution.state, attempts, (transactionId) => {
          const actor = { world: preflight.address, entityId: preflight.actorId };
          const pushed = resolution.pushed.map((entry) => entityMoved(
            transactionId,
            0,
            { world: preflight.address, entityId: entry.entityId },
            cellAddress(preflight.address, entry.from.x, entry.from.y),
            cellAddress(preflight.address, entry.to.x, entry.to.y),
            "push",
          ));
          const events: SemanticEvent[] = [
            { type: "push-resolved", transactionId, eventIndex: 0, direction: "forward", actor, directionMoved: command.direction, moved: pushed },
          ];
          if (resolution.transfer) {
            events.push(entityTransferred(transactionId, events.length, resolution.transfer));
          }
          events.push(entityMoved(
            transactionId,
            events.length,
            actor,
            cellAddress(preflight.address, resolution.actorFrom.x, resolution.actorFrom.y),
            cellAddress(preflight.address, resolution.actorTo.x, resolution.actorTo.y),
            "push",
          ));
          return appendWinChanged(session.present, resolution.state, transactionId, events);
        });
      }
      if (rule === "enter") {
        const selection = selectEntryPort(session.present, preflight.actorId, preflight.position, command.direction);
        if (selection.kind === "not-applicable") {
          attempts.push(notApplicable("enter"));
          continue;
        }
        if (selection.kind === "blocked") {
          attempts.push(blocked("enter", selection.rejection));
          return rejectedStep(session, command, selection.rejection, attempts);
        }
        const container = session.present.components.containers[selection.containerId];
        if (!container) {
          const rejection: Rejection = { code: "invalid-level-data", reason: { kind: "validation" }, rule: "enter" };
          attempts.push(blocked("enter", rejection));
          return rejectedStep(session, command, rejection, attempts);
        }
        const nextState = setEntityPosition(
          { ...session.present, activeWorldId: container.innerWorldId, focusPath: [...session.present.focusPath, selection.containerId] },
          preflight.actorId,
          { worldId: container.innerWorldId, x: selection.to.x, y: selection.to.y },
        );
        return acceptedStep(session, command, "enter", nextState, attempts, (transactionId) => appendWinChanged(session.present, nextState, transactionId, [
          {
            type: "portal-traversed",
            transactionId,
            eventIndex: 0,
            direction: "forward",
            mode: "enter",
            actorBefore: selection.actorBefore,
            actorAfter: selection.actorAfter,
            port: selection.portAddress,
            from: selection.from,
            to: selection.to,
          },
          {
            type: "focus-changed",
            transactionId,
            eventIndex: 1,
            direction: "forward",
            before: preflight.address,
            after: selection.nextWorldAddress,
            via: selection.portAddress,
          },
        ]));
      }
      const selection = selectExitPort(session.present, preflight.actorId, preflight.position, command.direction);
      if (selection.kind === "not-applicable") {
        attempts.push(notApplicable("exit"));
        continue;
      }
      if (selection.kind === "blocked") {
        attempts.push(blocked("exit", selection.rejection));
        return rejectedStep(session, command, selection.rejection, attempts);
      }
      const parentWorldId = resolveParentWorld(session.present, selection.nextWorldAddress);
      if (!parentWorldId) {
        const rejection: Rejection = { code: "invalid-level-data", reason: { kind: "validation" }, rule: "exit" };
        attempts.push(blocked("exit", rejection));
        return rejectedStep(session, command, rejection, attempts);
      }
      const normalizedState = setEntityPosition(
        { ...session.present, activeWorldId: parentWorldId, focusPath: session.present.focusPath.slice(0, -1) },
        preflight.actorId,
        { worldId: parentWorldId, x: selection.to.x, y: selection.to.y },
      );
      return acceptedStep(session, command, "exit", normalizedState, attempts, (transactionId) => appendWinChanged(session.present, normalizedState, transactionId, [
        {
          type: "portal-traversed",
          transactionId,
          eventIndex: 0,
          direction: "forward",
          mode: "exit",
          actorBefore: selection.actorBefore,
          actorAfter: selection.actorAfter,
          port: selection.portAddress,
          from: selection.from,
          to: selection.to,
        },
        {
          type: "focus-changed",
          transactionId,
          eventIndex: 1,
          direction: "forward",
          before: preflight.address,
          after: selection.nextWorldAddress,
          via: selection.portAddress,
        },
      ]));
    }
    const rejection: Rejection = { code: "no-enabled-rule-applies", reason: { kind: "step-fallback" }, rule: "step-fallback" };
    attempts.push(blocked("step-fallback", rejection));
    return rejectedStep(session, command, rejection, attempts);
  } catch {
    const rejection: Rejection = { code: "invalid-level-data", reason: { kind: "validation" }, rule: "step-fallback" };
    return rejectedStep(session, command, rejection, [notApplicable("walk"), blocked("step-fallback", rejection)]);
  }
}

function dispatchNonStep(session: SimulationSession, command: NonStepCommand): PublicDispatchEnvelope {
  try {
    const invalid = validationRejection(validateSimulationState(session.present));
    if (invalid) {
      return rejectedNonStep(session, command, invalid);
    }
    if (command.type === "undo") {
      const record = session.history.past.at(-1);
      if (!record) return rejectedNonStep(session, command, { code: "history-empty", reason: { kind: "history" } });
      if (!validHistoricalRecord(session, record, "undo")) return rejectedNonStep(session, command, { code: "invalid-level-data", reason: { kind: "validation" } });
      const nextState = record.previousState;
      const candidateRejection = validationRejection(validateSimulationState(nextState));
      if (candidateRejection) return rejectedNonStep(session, command, candidateRejection);
      return acceptedHistorical(session, command, "undo", nextState, record, reverseEvents(record.transaction.events));
    }
    if (command.type === "redo") {
      const record = session.history.future[0];
      if (!record) return rejectedNonStep(session, command, { code: "future-empty", reason: { kind: "history" } });
      if (!validHistoricalRecord(session, record, "redo")) return rejectedNonStep(session, command, { code: "invalid-level-data", reason: { kind: "validation" } });
      const nextState = record.nextState;
      const candidateRejection = validationRejection(validateSimulationState(nextState));
      if (candidateRejection) return rejectedNonStep(session, command, candidateRejection);
      return acceptedHistorical(session, command, "redo", nextState, record, record.transaction.events);
    }
    if (hashState(session.present) === hashState(session.initialState)) {
      return rejectedNonStep(session, command, { code: "already-initial-state", reason: { kind: "reset" } });
    }
    const nextState = session.initialState;
    const candidateRejection = validationRejection(validateInitialSimulationState(nextState));
    if (candidateRejection) return rejectedNonStep(session, command, candidateRejection);
    return acceptedPublic(session, command, "reset", nextState, (transactionId) => appendWinChanged(session.present, nextState, transactionId, [
      { type: "reset", transactionId, eventIndex: 0, direction: "forward" },
    ]));
  } catch {
    return rejectedNonStep(session, command, { code: "invalid-level-data", reason: { kind: "validation" } });
  }
}

function acceptedStep(
  session: SimulationSession,
  command: StepCommand,
  rule: "walk" | "push" | "enter" | "exit",
  nextState: SimulationState,
  earlierAttempts: readonly AttemptOutcome[],
  events: (transactionId: TransactionId) => readonly SemanticEvent[],
): PublicDispatchEnvelope {
  const candidateRejection = validationRejection(validateSimulationState(nextState));
  if (candidateRejection) {
    const rejection = withRule(candidateRejection, rule);
    return rejectedStep(session, command, rejection, [...earlierAttempts, blocked(rule, rejection)]);
  }
  const envelope = acceptedPublic(session, command, rule, nextState, events);
  if (envelope.result.kind === "accepted" && envelope.result.command.type === "step") {
    const result = envelope.result as Extract<CommandResult, { readonly kind: "accepted"; readonly command: StepCommand }>;
    return {
      session: envelope.session,
      result: {
        ...result,
        attempts: [...earlierAttempts, { kind: "accepted", rule, transaction: result.transaction }] as unknown as [AttemptOutcome, ...AttemptOutcome[]],
      },
    };
  }
  return envelope;
}

function acceptedHistorical(
  session: SimulationSession,
  command: NonStepCommand,
  rule: "undo" | "redo",
  nextState: SimulationState,
  record: HistoryRecord,
  sourceEvents: readonly SemanticEvent[],
): PublicDispatchEnvelope {
  const transaction = createTransaction(session, command, rule, nextState, (id) => replayEvents(sourceEvents, id, rule === "undo" ? "reverse" : "forward"), record.transaction.id);
  const nextSession = commitHistoricalTraversal(session, nextState, transaction, record, rule);
  return { session: nextSession, result: { kind: "accepted", command, transaction, attempts: [] } };
}

function acceptedPublic(
  session: SimulationSession,
  command: PublicCommand,
  rule: "walk" | "push" | "enter" | "exit" | "reset",
  nextState: SimulationState,
  events: (transactionId: TransactionId) => readonly SemanticEvent[],
): PublicDispatchEnvelope {
  const transaction = createTransaction(session, command, rule, nextState, events);
  const nextSession = commitTransaction(session, nextState, transaction);
  return {
    session: nextSession,
    result: command.type === "step"
      ? { kind: "accepted", command, transaction, attempts: [{ kind: "accepted", rule: rule as "walk" | "push" | "enter" | "exit", transaction }] }
      : { kind: "accepted", command, transaction, attempts: [] },
  };
}

function createTransaction(
  session: SimulationSession,
  command: PublicCommand,
  rule: "walk" | "push" | "enter" | "exit" | "undo" | "redo" | "reset",
  nextState: SimulationState,
  makeEvents: (transactionId: TransactionId) => readonly SemanticEvent[],
  sourceTransactionId?: TransactionId,
): Transaction {
  const stateHashBefore = hashState(session.present);
  const transactionId: TransactionId = { initialStateHash: hashState(session.initialState), sequence: session.publicTransactionSequence + 1 };
  return {
    id: transactionId,
    command,
    rule,
    ...(sourceTransactionId ? { sourceTransactionId } : {}),
    stateHashBefore,
    stateHashAfter: hashState(nextState),
    activeAddressBefore: resultAddress(session.present),
    activeAddressAfter: resultAddress(nextState),
    events: makeEvents(transactionId),
  };
}

function rejectedStep(
  session: SimulationSession,
  command: StepCommand,
  rejection: Rejection,
  attempts: readonly AttemptOutcome[],
): PublicDispatchEnvelope {
  const address = resultAddress(session.present);
  const blockedEvent = commandBlocked(rejection);
  return {
    session,
    result: {
      kind: "rejected",
      command,
      rejection,
      stateHashBefore: hashState(session.present),
      stateHashAfter: hashState(session.present),
      activeAddressBefore: address,
      activeAddressAfter: address,
      attempts: attempts as [AttemptOutcome, ...AttemptOutcome[]],
      events: [blockedEvent],
    },
  };
}

function rejectedNonStep(session: SimulationSession, command: NonStepCommand, rejection: Rejection): PublicDispatchEnvelope {
  const address = resultAddress(session.present);
  return {
    session,
    result: {
      kind: "rejected",
      command,
      rejection,
      stateHashBefore: hashState(session.present),
      stateHashAfter: hashState(session.present),
      activeAddressBefore: address,
      activeAddressAfter: address,
      attempts: [],
      events: [commandBlocked(rejection)],
    },
  };
}

function preflightStep(state: SimulationState):
  | { readonly kind: "accepted"; readonly actorId: string; readonly position: { readonly worldId: string; readonly x: number; readonly y: number }; readonly address: WorldAddress }
  | { readonly kind: "rejected"; readonly rejection: Rejection } {
  if (!state.entities[state.playerId] || !state.components.players[state.playerId]) {
    return { kind: "rejected", rejection: { code: "actor-not-active", reason: { kind: "actor" }, rule: "step-fallback" } };
  }
  const address = activeWorldAddress(state);
  if (!address) {
    return { kind: "rejected", rejection: { code: "focus-invalid", reason: { kind: "focus" }, rule: "step-fallback" } };
  }
  const position = state.components.positions[state.playerId];
  if (!position || position.worldId !== state.activeWorldId) {
    return { kind: "rejected", rejection: { code: "actor-not-active", reason: { kind: "actor" }, rule: "step-fallback" } };
  }
  return { kind: "accepted", actorId: state.playerId, position, address };
}

function isInsideAndEmpty(state: SimulationState, position: { readonly worldId: string; readonly x: number; readonly y: number }, actorId: string): boolean {
  const world = state.worlds[position.worldId];
  return Boolean(world && position.x >= 0 && position.y >= 0 && position.x < world.size.width && position.y < world.size.height && getSolidOccupantsAt(state, position, actorId).length === 0);
}

function resultAddress(state: SimulationState): WorldAddress {
  return activeWorldAddress(state) ?? { rootWorldId: state.rootWorldId, containerPath: [...state.focusPath] };
}

function emergencyRejected(session: SimulationSession, command: PublicCommand): PublicDispatchEnvelope {
  const rejection: Rejection = { code: "invalid-level-data", reason: { kind: "validation" }, ...(command.type === "step" ? { rule: "step-fallback" as const } : {}) };
  try {
    return command.type === "step"
      ? rejectedStep(session, command, rejection, [notApplicable("walk"), blocked("step-fallback", rejection)])
      : rejectedNonStep(session, command, rejection);
  } catch {
    const rawSession = session as unknown as { readonly present?: unknown };
    const state = (rawSession.present ?? {}) as Record<string, unknown>;
    const stateHash = safeHash(state);
    const address: WorldAddress = {
      rootWorldId: typeof state.rootWorldId === "string" ? state.rootWorldId : "",
      containerPath: [],
    };
    return command.type === "step"
      ? {
          session,
          result: {
            kind: "rejected",
            command,
            rejection,
            stateHashBefore: stateHash,
            stateHashAfter: stateHash,
            activeAddressBefore: address,
            activeAddressAfter: address,
            attempts: [notApplicable("walk"), blocked("step-fallback", rejection)],
            events: [commandBlocked(rejection)],
          },
        }
      : {
          session,
          result: {
            kind: "rejected",
            command,
            rejection,
            stateHashBefore: stateHash,
            stateHashAfter: stateHash,
            activeAddressBefore: address,
            activeAddressAfter: address,
            attempts: [],
            events: [commandBlocked(rejection)],
          },
        };
  }
}

function safeHash(value: unknown): string {
  try {
    return hashState(value as SimulationState);
  } catch {
    return "00000000";
  }
}

function resolveParentWorld(state: SimulationState, address: WorldAddress): string | undefined {
  let worldId = state.rootWorldId;
  for (const containerId of address.containerPath) {
    const position = state.components.positions[containerId];
    const container = state.components.containers[containerId];
    if (!position || !container || position.worldId !== worldId) return undefined;
    worldId = container.innerWorldId;
  }
  return worldId;
}

function notApplicable(rule: "walk" | "push" | "enter" | "exit"): AttemptOutcome {
  return { kind: "not-applicable", rule };
}

function blocked(rule: "walk" | "push" | "enter" | "exit" | "step-fallback", rejection: Rejection): AttemptOutcome {
  return { kind: "blocked", rule, rejection };
}

function withRule(rejection: Rejection, rule: "walk" | "push" | "enter" | "exit" | "step-fallback"): Rejection {
  return { ...rejection, rule } as Rejection;
}

function commandBlocked(rejection: Rejection): CommandBlockedEvent {
  return { type: "command-blocked", transactionId: null, eventIndex: 0, direction: "forward", rejection };
}

function entityMoved(
  transactionId: TransactionId,
  eventIndex: number,
  occurrence: EntityMovedEvent["occurrence"],
  from: CellAddress,
  to: CellAddress,
  cause: "walk" | "push",
): EntityMovedEvent {
  return { type: "entity-moved", transactionId, eventIndex, direction: "forward", occurrence, from, to, cause };
}

function entityTransferred(
  transactionId: TransactionId,
  eventIndex: number,
  transfer: RecursiveTransfer,
): EntityTransferredEvent {
  return {
    type: "entity-transferred",
    transactionId,
    eventIndex,
    direction: "forward",
    mode: transfer.mode,
    entityBefore: transfer.entityBefore,
    entityAfter: transfer.entityAfter,
    from: transfer.from,
    to: transfer.to,
    via: transfer.via,
    carriedSubtree: transfer.carriedSubtree,
  };
}

function appendWinChanged(
  before: SimulationState,
  after: SimulationState,
  transactionId: TransactionId,
  events: readonly SemanticEvent[],
): readonly SemanticEvent[] {
  if (isWinSatisfied(before) === isWinSatisfied(after)) return events;
  return [...events, { type: "win-changed", transactionId, eventIndex: events.length, direction: "forward", solved: isWinSatisfied(after) }];
}

function reverseEvents(events: readonly SemanticEvent[]): readonly SemanticEvent[] {
  return [...events].reverse();
}

function replayEvents(events: readonly SemanticEvent[], transactionId: TransactionId, direction: "forward" | "reverse"): readonly SemanticEvent[] {
  return events.map((event, eventIndex) => {
    if (event.type === "entity-moved") {
      return direction === "forward"
        ? { ...event, transactionId, eventIndex, direction }
        : { ...event, transactionId, eventIndex, direction, from: event.to, to: event.from };
    }
    if (event.type === "push-resolved") {
      return direction === "forward"
        ? { ...event, transactionId, eventIndex, direction, moved: event.moved.map((moved) => ({ ...moved, transactionId, eventIndex, direction })) }
        : {
            ...event,
            transactionId,
            eventIndex,
            direction,
            directionMoved: opposite(event.directionMoved),
            moved: event.moved.map((moved) => ({ ...moved, transactionId, eventIndex, direction, from: moved.to, to: moved.from })),
          };
    }
    if (event.type === "entity-transferred") {
      return direction === "forward"
        ? { ...event, transactionId, eventIndex, direction }
        : {
            ...event,
            transactionId,
            eventIndex,
            direction,
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
    if (event.type === "portal-traversed") {
      return direction === "forward"
        ? { ...event, transactionId, eventIndex, direction }
        : { ...event, transactionId, eventIndex, direction, mode: event.mode === "enter" ? "exit" : "enter", actorBefore: event.actorAfter, actorAfter: event.actorBefore, from: event.to, to: event.from };
    }
    if (event.type === "focus-changed") {
      return direction === "forward"
        ? { ...event, transactionId, eventIndex, direction }
        : { ...event, transactionId, eventIndex, direction, before: event.after, after: event.before };
    }
    if (event.type === "win-changed") {
      return { ...event, transactionId, eventIndex, direction, solved: direction === "forward" ? event.solved : !event.solved };
    }
    return { ...event, transactionId, eventIndex, direction };
  });
}

function validHistoricalRecord(session: SimulationSession, candidate: unknown, traversal: "undo" | "redo"): candidate is HistoryRecord {
  if (!historyChainAuthenticates(session)) return false;
  if (!historicalRecordStructureValid(session, candidate)) return false;
  const record = candidate as HistoryRecord;
  if (traversal === "undo" ? hashState(session.present) !== record.transaction.stateHashAfter : hashState(session.present) !== record.transaction.stateHashBefore) return false;
  return reproducesSourceRecord(session, record.previousState, record.transaction);
}

function historicalRecordStructureValid(session: SimulationSession, candidate: unknown): candidate is HistoryRecord {
  if (!object(candidate)) return false;
  const record = candidate as { readonly transaction?: unknown; readonly previousState?: unknown; readonly nextState?: unknown };
  if (validateSimulationState(record.previousState).kind !== "valid" || validateSimulationState(record.nextState).kind !== "valid" || !object(record.transaction)) return false;
  const previousState = record.previousState as SimulationState;
  const nextState = record.nextState as SimulationState;
  const transaction = record.transaction as Record<string, unknown>;
  if (!object(transaction.id) || typeof transaction.stateHashBefore !== "string" || typeof transaction.stateHashAfter !== "string" || typeof transaction.rule !== "string" || !isPublicCommand(transaction.command)) return false;
  const id = transaction.id as Record<string, unknown>;
  if (typeof id.initialStateHash !== "string" || !Number.isInteger(id.sequence) || (id.sequence as number) <= 0 || (id.sequence as number) > session.publicTransactionSequence || id.initialStateHash !== hashState(session.initialState)) return false;
  if (transaction.stateHashBefore !== hashState(previousState) || transaction.stateHashAfter !== hashState(nextState)) return false;
  if (!isSourceTransaction(transaction.command, transaction.rule) || transaction.sourceTransactionId !== undefined) return false;
  if (!sameAddress(transaction.activeAddressBefore, resultAddress(previousState)) || !sameAddress(transaction.activeAddressAfter, resultAddress(nextState))) return false;
  if (!Array.isArray(transaction.events) || !transaction.events.every((event, index) => isStoredSemanticEvent(event, transaction.id, index))) return false;
  const typedTransaction = transaction as unknown as Transaction;
  return storedEventsMatch(previousState, nextState, typedTransaction);
}

function historyChainAuthenticates(session: SimulationSession): boolean {
  try {
    const records = [...session.history.past, ...session.history.future];
    let expected = session.initialState;
    for (const record of records) {
      if (!historicalRecordStructureValid(session, record) ||
        !sameCanonicalState(record.previousState, expected) ||
        !reproducesSourceRecord(session, record.previousState, record.transaction)) return false;
      expected = record.nextState;
    }
    const presentExpected = session.history.past.at(-1)?.nextState ?? session.initialState;
    return sameCanonicalState(session.present, presentExpected);
  } catch {
    return false;
  }
}

function sameCanonicalState(left: SimulationState, right: SimulationState): boolean {
  return hashState(left) === hashState(right) && JSON.stringify(left) === JSON.stringify(right);
}

function isSourceTransaction(command: PublicCommand, rule: string): boolean {
  if (command.type === "step") return rule === "walk" || rule === "push" || rule === "enter" || rule === "exit";
  return command.type === "reset" && rule === "reset";
}

function hasValidSessionSequence(session: SimulationSession): boolean {
  const sequence = (session as { readonly publicTransactionSequence?: unknown }).publicTransactionSequence;
  return typeof sequence === "number" && Number.isFinite(sequence) && Number.isInteger(sequence) && sequence >= 0;
}

function isStoredSemanticEvent(value: unknown, transactionId: unknown, index: number): boolean {
  if (!object(value) || !sameTransactionId(value.transactionId, transactionId) || value.eventIndex !== index || value.direction !== "forward") return false;
  if (value.type === "entity-moved") return occurrenceShape(value.occurrence) && cellShape(value.from) && cellShape(value.to) && (value.cause === "walk" || value.cause === "push");
  if (value.type === "push-resolved") return occurrenceShape(value.actor) && isDirection(value.directionMoved) && Array.isArray(value.moved) && value.moved.every((moved) => object(moved) && sameTransactionId(moved.transactionId, transactionId) && moved.eventIndex === index && moved.direction === "forward" && occurrenceShape(moved.occurrence) && cellShape(moved.from) && cellShape(moved.to) && (moved.cause === "walk" || moved.cause === "push"));
  if (value.type === "entity-transferred") return (value.mode === "push-in" || value.mode === "push-out") && occurrenceShape(value.entityBefore) && occurrenceShape(value.entityAfter) && cellShape(value.from) && cellShape(value.to) && portShape(value.via) && (value.carriedSubtree === null || carriedSubtreeShape(value.carriedSubtree));
  if (value.type === "portal-traversed") return (value.mode === "enter" || value.mode === "exit") && occurrenceShape(value.actorBefore) && occurrenceShape(value.actorAfter) && portShape(value.port) && cellShape(value.from) && cellShape(value.to);
  if (value.type === "focus-changed") return addressShape(value.before) && addressShape(value.after) && (value.via === undefined || portShape(value.via));
  if (value.type === "win-changed") return typeof value.solved === "boolean";
  return value.type === "reset";
}

function object(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function isDirection(value: unknown): value is Direction { return value === "up" || value === "down" || value === "left" || value === "right"; }
function sameTransactionId(left: unknown, right: unknown): boolean { return object(left) && object(right) && typeof left.initialStateHash === "string" && left.initialStateHash === right.initialStateHash && Number.isInteger(left.sequence) && left.sequence === right.sequence; }
function sameAddress(value: unknown, expected: WorldAddress): boolean { return addressShape(value) && value.rootWorldId === expected.rootWorldId && value.containerPath.length === expected.containerPath.length && value.containerPath.every((entry, index) => entry === expected.containerPath[index]); }
function addressShape(value: unknown): value is WorldAddress { return object(value) && typeof value.rootWorldId === "string" && Array.isArray(value.containerPath) && value.containerPath.every((entry) => typeof entry === "string"); }
function occurrenceShape(value: unknown): boolean { return object(value) && typeof value.entityId === "string" && addressShape(value.world); }
function cellShape(value: unknown): boolean { return object(value) && addressShape(value.world) && Number.isInteger(value.x) && Number.isInteger(value.y); }
function portShape(value: unknown): boolean { return object(value) && typeof value.portId === "string" && occurrenceShape(value.container); }
function carriedSubtreeShape(value: unknown): boolean { return object(value) && typeof value.innerWorldId === "string" && addressShape(value.beforeRoot) && addressShape(value.afterRoot); }

function storedEventsMatch(previous: SimulationState, next: SimulationState, transaction: Transaction): boolean {
  const baseEvents = transaction.events.filter((event) => event.type !== "win-changed");
  const winEvents = transaction.events.filter((event) => event.type === "win-changed");
  const winChanged = isWinSatisfied(previous) !== isWinSatisfied(next);
  if (winChanged !== (winEvents.length === 1) || (winEvents[0] && winEvents[0].solved !== isWinSatisfied(next))) return false;
  if (winEvents.length > 0 && transaction.events.at(-1)?.type !== "win-changed") return false;
  if (transaction.rule === "walk") return transaction.command.type === "step" && baseEvents.length === 1 && baseEvents[0]?.type === "entity-moved" && baseEvents[0].cause === "walk" && movedMatchesStates(baseEvents[0], previous, next);
  if (transaction.rule === "push") {
    const [aggregate, second, third] = baseEvents;
    if (transaction.command.type !== "step" || aggregate?.type !== "push-resolved" || aggregate.directionMoved !== transaction.command.direction) return false;
    if (second?.type === "entity-transferred") {
      return third?.type === "entity-moved" && third.cause === "push" && baseEvents.length === 3 &&
        sameOccurrence(aggregate.actor, third.occurrence) && movedMatchesStates(third, previous, next) &&
        aggregate.moved.every((moved) => moved.cause === "push" && movedMatchesStates(moved, previous, next) && moved.occurrence.entityId !== second.entityBefore.entityId) &&
        transferMatchesStates(second, aggregate, previous, next);
    }
    return second?.type === "entity-moved" && second.cause === "push" && baseEvents.length === 2 &&
      sameOccurrence(aggregate.actor, second.occurrence) && movedMatchesStates(second, previous, next) &&
      aggregate.moved.length > 0 && aggregate.moved.every((moved) => movedMatchesStates(moved, previous, next));
  }
  if (transaction.rule === "enter" || transaction.rule === "exit") {
    const [portal, focus] = baseEvents;
    return transaction.command.type === "step" && baseEvents.length === 2 && portal?.type === "portal-traversed" && focus?.type === "focus-changed" && portal.mode === transaction.rule && portalMatchesStates(portal, previous, next) && focus.before.rootWorldId === resultAddress(previous).rootWorldId && sameAddress(focus.before, resultAddress(previous)) && sameAddress(focus.after, resultAddress(next)) && (focus.via === undefined || samePort(focus.via, portal.port));
  }
  if (transaction.rule === "reset") return transaction.command.type === "reset" && baseEvents.length === 1 && baseEvents[0]?.type === "reset" && hashState(previous) !== hashState(next);
  return false;
}

function reproducesSourceRecord(session: SimulationSession, previous: SimulationState, transaction: Transaction): boolean {
  const replaySession: SimulationSession = {
    initialState: session.initialState,
    present: previous,
    history: { past: [], future: [] },
    publicTransactionSequence: transaction.id.sequence - 1,
  };
  try {
    const replay = dispatchPublicCommand(replaySession, transaction.command);
    return replay.result.kind === "accepted" && JSON.stringify(replay.result.transaction) === JSON.stringify(transaction);
  } catch {
    return false;
  }
}

function movedMatchesStates(event: EntityMovedEvent, previous: SimulationState, next: SimulationState): boolean {
  return occurrenceAtCell(previous, event.occurrence, event.from) && occurrenceAtCell(next, event.occurrence, event.to);
}

function portalMatchesStates(event: Extract<SemanticEvent, { readonly type: "portal-traversed" }>, previous: SimulationState, next: SimulationState): boolean {
  if (!occurrenceAtCell(previous, event.actorBefore, event.from) || !occurrenceAtCell(next, event.actorAfter, event.to)) return false;
  const port = resolvedPort(previous, event.port);
  if (!port || !resolvedPort(next, event.port)) return false;
  const beforeWorld = resolveWorldAddress(previous, event.actorBefore.world.containerPath);
  const afterWorld = resolveWorldAddress(next, event.actorAfter.world.containerPath);
  const parentCell = nextPosition(port.anchor, opposite(port.outerApproach));
  return event.mode === "enter"
    ? beforeWorld === port.parentWorldId && afterWorld === port.innerWorldId && sameCell(event.from, event.port.container.world, parentCell.x, parentCell.y) && sameCell(event.to, event.actorAfter.world, port.innerLanding.x, port.innerLanding.y)
    : beforeWorld === port.innerWorldId && afterWorld === port.parentWorldId && sameCell(event.from, event.actorBefore.world, port.innerLanding.x, port.innerLanding.y) && sameCell(event.to, event.port.container.world, parentCell.x, parentCell.y);
}

function transferMatchesStates(
  event: EntityTransferredEvent,
  aggregate: Extract<SemanticEvent, { readonly type: "push-resolved" }>,
  previous: SimulationState,
  next: SimulationState,
): boolean {
  if (event.entityBefore.entityId !== event.entityAfter.entityId || !sameAddress(event.from.world, event.entityBefore.world) || !sameAddress(event.to.world, event.entityAfter.world)) return false;
  if (!occurrenceAtCell(previous, event.entityBefore, event.from) || !occurrenceAtCell(next, event.entityAfter, event.to)) return false;
  const beforePort = resolvedPort(previous, event.via);
  const afterPort = resolvedPort(next, event.via);
  if (!beforePort || !afterPort || beforePort.innerWorldId !== afterPort.innerWorldId || beforePort.outerApproach !== afterPort.outerApproach || beforePort.innerExit !== afterPort.innerExit) return false;
  const entityId = event.entityBefore.entityId;
  const beforeContainer = previous.components.containers[entityId];
  const afterContainer = next.components.containers[entityId];
  if (Boolean(beforeContainer) !== Boolean(afterContainer)) return false;
  if (!beforeContainer) {
    if (event.carriedSubtree !== null) return false;
  } else {
    if (!afterContainer || !event.carriedSubtree || beforeContainer.innerWorldId !== afterContainer.innerWorldId || event.carriedSubtree.innerWorldId !== beforeContainer.innerWorldId) return false;
    const beforeRoot: WorldAddress = { rootWorldId: event.entityBefore.world.rootWorldId, containerPath: [...event.entityBefore.world.containerPath, entityId] };
    const afterRoot: WorldAddress = { rootWorldId: event.entityAfter.world.rootWorldId, containerPath: [...event.entityAfter.world.containerPath, entityId] };
    if (!sameAddress(event.carriedSubtree.beforeRoot, beforeRoot) || !sameAddress(event.carriedSubtree.afterRoot, afterRoot)) return false;
  }
  if (event.mode === "push-in") {
    const expectedChild: WorldAddress = { rootWorldId: event.via.container.world.rootWorldId, containerPath: [...event.via.container.world.containerPath, event.via.container.entityId] };
    return aggregate.directionMoved === beforePort.outerApproach &&
      sameAddress(event.entityBefore.world, event.via.container.world) &&
      sameAddress(event.entityAfter.world, expectedChild) &&
      sameCell(event.to, expectedChild, beforePort.innerLanding.x, beforePort.innerLanding.y);
  }
  const expectedParentCell = nextPosition(beforePort.anchor, opposite(beforePort.outerApproach));
  return aggregate.directionMoved === beforePort.innerExit &&
    sameAddress(event.entityBefore.world, { rootWorldId: event.via.container.world.rootWorldId, containerPath: [...event.via.container.world.containerPath, event.via.container.entityId] }) &&
    sameAddress(event.entityAfter.world, event.via.container.world) &&
    sameCell(event.from, event.entityBefore.world, beforePort.innerLanding.x, beforePort.innerLanding.y) &&
    sameCell(event.to, event.via.container.world, expectedParentCell.x, expectedParentCell.y);
}

function occurrenceAtCell(state: SimulationState, occurrence: { readonly world: WorldAddress; readonly entityId: string }, cell: CellAddress): boolean {
  const worldId = resolveWorldAddress(state, occurrence.world.containerPath);
  const position = state.components.positions[occurrence.entityId];
  return occurrence.world.rootWorldId === state.rootWorldId && sameAddress(occurrence.world, cell.world) && worldId !== undefined && position?.worldId === worldId && position.x === cell.x && position.y === cell.y;
}

function resolvedPort(state: SimulationState, address: { readonly container: { readonly world: WorldAddress; readonly entityId: string }; readonly portId: string }): { readonly parentWorldId: string; readonly innerWorldId: string; readonly innerLanding: { readonly x: number; readonly y: number }; readonly outerApproach: Direction; readonly innerExit: Direction; readonly anchor: { readonly worldId: string; readonly x: number; readonly y: number } } | undefined {
  const parentWorldId = resolveWorldAddress(state, address.container.world.containerPath);
  const position = state.components.positions[address.container.entityId];
  const container = state.components.containers[address.container.entityId];
  const port = state.portTables.find((table) => table.containerId === address.container.entityId)?.ports.find((entry) => entry.id === address.portId);
  if (!parentWorldId || !position || !container || !state.worlds[container.innerWorldId] || !port || address.container.world.rootWorldId !== state.rootWorldId || position.worldId !== parentWorldId) return undefined;
  return { parentWorldId, innerWorldId: container.innerWorldId, innerLanding: port.innerLanding, outerApproach: port.outerApproach, innerExit: port.innerExit, anchor: position };
}

function sameOccurrence(left: { readonly world: WorldAddress; readonly entityId: string }, right: { readonly world: WorldAddress; readonly entityId: string }): boolean { return left.entityId === right.entityId && sameAddress(left.world, right.world); }
function samePort(left: { readonly container: { readonly world: WorldAddress; readonly entityId: string }; readonly portId: string }, right: { readonly container: { readonly world: WorldAddress; readonly entityId: string }; readonly portId: string }): boolean { return left.portId === right.portId && sameOccurrence(left.container, right.container); }
function sameCell(cell: CellAddress, world: WorldAddress, x: number, y: number): boolean { return sameAddress(cell.world, world) && cell.x === x && cell.y === y; }
