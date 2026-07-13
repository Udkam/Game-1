import { describe, expect, it } from 'vitest';
import { createRunnerRig, updateRunnerRig } from './runnerRig';

const basePose = {
  speed: 12,
  laneDelta: 0,
  height: 0,
  posture: 'run' as const,
  shield: true,
  dead: false,
};

describe('runner reduced motion', () => {
  it('keeps decorative core and shield rotations static', () => {
    const rig = createRunnerRig();
    updateRunnerRig(rig, { ...basePose, elapsed: 1, reducedMotion: true });
    const first = [rig.core.rotation.x, rig.core.rotation.y, rig.shield.rotation.z];
    updateRunnerRig(rig, { ...basePose, elapsed: 9, reducedMotion: true });
    expect([rig.core.rotation.x, rig.core.rotation.y, rig.shield.rotation.z]).toEqual(first);
  });

  it('retains authored rotation while normal motion is enabled', () => {
    const rig = createRunnerRig();
    updateRunnerRig(rig, { ...basePose, elapsed: 1, reducedMotion: false });
    const first = rig.core.rotation.y;
    updateRunnerRig(rig, { ...basePose, elapsed: 2, reducedMotion: false });
    expect(rig.core.rotation.y).not.toBe(first);
  });
});
