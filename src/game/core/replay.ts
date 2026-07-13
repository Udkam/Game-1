import { dispatch } from "./engine";
import { hashState } from "./hash";
import type { ReplayFrame, ReplayResult, RunnerCommand } from "./types";
import { createInitialState } from "./engine";

export function replay(seed: number, commands: readonly RunnerCommand[]): ReplayResult {
  let state = createInitialState(seed);
  const frames: ReplayFrame[] = [];
  for (let index = 0; index < commands.length; index += 1) {
    const command = commands[index];
    const result = dispatch(state, command);
    state = result.state;
    frames.push({
      index,
      command,
      accepted: result.accepted,
      hash: hashState(state),
    });
  }
  return { state, hash: hashState(state), frames };
}
