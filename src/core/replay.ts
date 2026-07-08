import type { SimulationCommand } from "./commands";
import { hashState } from "./hash";
import { createSimulationSession } from "./history";
import { dispatchCommand } from "./reducer";
import type { SimulationState } from "./types";

export interface ReplayResult {
  readonly acceptedCount: number;
  readonly finalHash: string;
  readonly finalState: SimulationState;
}

export function replayCommands(
  initialState: SimulationState,
  commands: readonly SimulationCommand[],
): ReplayResult {
  let session = createSimulationSession(initialState);
  let acceptedCount = 0;

  for (const command of commands) {
    const result = dispatchCommand(session, command);
    if (result.accepted) {
      acceptedCount += 1;
    }
    session = result.session;
  }

  return {
    acceptedCount,
    finalHash: hashState(session.present),
    finalState: session.present,
  };
}
