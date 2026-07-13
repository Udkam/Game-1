import {
  BoxGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
} from 'three';
import { PALETTE } from './theme';

export interface RunnerRig {
  root: Group;
  body: Group;
  leftArm: Group;
  rightArm: Group;
  leftLeg: Group;
  rightLeg: Group;
  coatLeft: Mesh;
  coatRight: Mesh;
  core: Mesh;
  shield: Mesh;
  shadow: Mesh;
}

function limb(material: MeshStandardMaterial, length: number, radius: number): Group {
  const pivot = new Group();
  const mesh = new Mesh(new CapsuleGeometry(radius, length - radius * 2, 3, 7), material);
  mesh.position.y = -length * 0.48;
  pivot.add(mesh);
  return pivot;
}

export function createRunnerRig(): RunnerRig {
  const porcelain = new MeshStandardMaterial({ color: PALETTE.porcelain, roughness: 0.42, metalness: 0.08 });
  const dark = new MeshStandardMaterial({ color: 0x0c1c22, roughness: 0.64, metalness: 0.14 });
  const verdigris = new MeshStandardMaterial({ color: PALETTE.verdigris, roughness: 0.48, metalness: 0.48 });
  const signal = new MeshStandardMaterial({ color: PALETTE.signal, emissive: PALETTE.signal, emissiveIntensity: 2.2, roughness: 0.24 });

  const root = new Group();
  root.name = 'courier';
  const body = new Group();
  root.add(body);

  const torso = new Mesh(new BoxGeometry(0.58, 0.78, 0.34), dark);
  torso.position.y = 1.22;
  torso.rotation.x = -0.08;
  body.add(torso);

  const chest = new Mesh(new BoxGeometry(0.38, 0.5, 0.06), verdigris);
  chest.position.set(0, 1.26, -0.2);
  body.add(chest);

  const head = new Mesh(new IcosahedronGeometry(0.23, 1), porcelain);
  head.position.y = 1.83;
  body.add(head);

  const hood = new Mesh(new IcosahedronGeometry(0.29, 1), dark);
  hood.position.set(0, 1.84, 0.08);
  hood.scale.set(1, 1.05, 0.76);
  body.add(hood);
  body.remove(head);
  body.add(head);

  const leftArm = limb(porcelain, 0.72, 0.09);
  const rightArm = limb(porcelain, 0.72, 0.09);
  leftArm.position.set(-0.38, 1.5, 0);
  rightArm.position.set(0.38, 1.5, 0);
  body.add(leftArm, rightArm);

  const leftLeg = limb(dark, 0.9, 0.12);
  const rightLeg = limb(dark, 0.9, 0.12);
  leftLeg.position.set(-0.17, 0.92, 0);
  rightLeg.position.set(0.17, 0.92, 0);
  body.add(leftLeg, rightLeg);

  const coatMaterial = new MeshStandardMaterial({ color: PALETTE.verdigris, roughness: 0.62, metalness: 0.1, side: DoubleSide });
  const coatGeometry = new PlaneGeometry(0.34, 0.85, 1, 2);
  const coatLeft = new Mesh(coatGeometry, coatMaterial);
  const coatRight = new Mesh(coatGeometry, coatMaterial);
  coatLeft.position.set(-0.18, 0.88, 0.22);
  coatRight.position.set(0.18, 0.88, 0.22);
  coatLeft.rotation.x = 0.2;
  coatRight.rotation.x = 0.2;
  body.add(coatLeft, coatRight);

  const core = new Mesh(new IcosahedronGeometry(0.14, 1), signal);
  core.position.set(0, 1.3, 0.31);
  body.add(core);

  const shieldMaterial = new MeshStandardMaterial({
    color: PALETTE.signal,
    emissive: PALETTE.signal,
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.52,
    side: DoubleSide,
  });
  const shield = new Mesh(new RingGeometry(0.84, 0.9, 32), shieldMaterial);
  shield.position.y = 0.95;
  shield.rotation.x = Math.PI / 2;
  shield.visible = false;
  root.add(shield);

  const shadowMaterial = new MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.36, depthWrite: false });
  const shadow = new Mesh(new CylinderGeometry(0.54, 0.76, 0.012, 24), shadowMaterial);
  shadow.scale.z = 0.55;
  shadow.position.y = 0.015;
  root.add(shadow);

  return { root, body, leftArm, rightArm, leftLeg, rightLeg, coatLeft, coatRight, core, shield, shadow };
}

export interface RunnerPose {
  elapsed: number;
  speed: number;
  laneDelta: number;
  height: number;
  posture: 'run' | 'jump' | 'slide';
  shield: boolean;
  reducedMotion: boolean;
  dead: boolean;
}

export function updateRunnerRig(rig: RunnerRig, pose: RunnerPose): void {
  const pace = pose.reducedMotion ? 0 : Math.min(18, pose.speed);
  const cycle = pose.elapsed * (5.8 + pace * 0.12);
  const swing = Math.sin(cycle) * (pose.posture === 'run' && !pose.dead ? 0.72 : 0.08);
  rig.leftLeg.rotation.x = swing;
  rig.rightLeg.rotation.x = -swing;
  rig.leftArm.rotation.x = -swing * 0.82 - 0.18;
  rig.rightArm.rotation.x = swing * 0.82 - 0.18;
  rig.body.position.y = pose.posture === 'run' && !pose.reducedMotion ? Math.abs(Math.sin(cycle)) * 0.045 : 0;
  rig.body.rotation.z = pose.dead ? 0.68 : Math.max(-0.16, Math.min(0.16, -pose.laneDelta * 0.16));
  rig.body.rotation.x = pose.posture === 'slide' ? -0.74 : pose.dead ? -0.32 : 0;
  rig.body.position.y += pose.posture === 'slide' ? -0.37 : 0;
  rig.body.position.z = pose.posture === 'slide' ? -0.28 : 0;
  if (pose.posture === 'slide' && !pose.dead) {
    rig.leftArm.rotation.x = -1.05;
    rig.rightArm.rotation.x = -0.78;
    rig.leftLeg.rotation.x = 0.95;
    rig.rightLeg.rotation.x = -0.42;
  } else if (pose.posture === 'jump' && !pose.dead) {
    rig.leftArm.rotation.x = -0.72;
    rig.rightArm.rotation.x = -0.58;
    rig.leftLeg.rotation.x = 0.34;
    rig.rightLeg.rotation.x = -0.18;
  } else if (pose.dead) {
    rig.leftArm.rotation.x = 1.08;
    rig.rightArm.rotation.x = -0.76;
    rig.leftLeg.rotation.x = 0.55;
    rig.rightLeg.rotation.x = -0.28;
  }
  const coatWave = pose.reducedMotion ? 0.18 : 0.28 + Math.sin(cycle * 0.5) * 0.12;
  rig.coatLeft.rotation.x = coatWave;
  rig.coatRight.rotation.x = coatWave * 1.08;
  rig.core.rotation.x = pose.reducedMotion ? 0.18 : pose.elapsed * 1.2;
  rig.core.rotation.y = pose.reducedMotion ? 0.28 : pose.elapsed * 1.8;
  rig.shield.visible = pose.shield;
  rig.shield.rotation.z = pose.reducedMotion ? 0.15 : pose.elapsed * 1.35;
  rig.shadow.visible = pose.height < 4;
  rig.shadow.position.y = 0.015 - pose.height;
  const shadowScale = Math.max(0.46, 1 - pose.height * 0.14);
  rig.shadow.scale.set(shadowScale, 1, shadowScale * 0.58);
}
