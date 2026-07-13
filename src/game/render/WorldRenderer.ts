import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DodecahedronGeometry,
  DoubleSide,
  DynamicDrawUsage,
  FogExp2,
  Float32BufferAttribute,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  RingGeometry,
  Scene,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  Vector2,
  WebGLRenderer,
} from 'three';
import {
  getCurrentSection,
  headingVector,
  headingYaw,
  rightVector,
  sampleCoursePosition,
  sampleRunnerPosition,
  sectionEnd,
  type CourseEvent,
  type CourseSection,
  type RunnerEvent,
  type RunnerState,
  type TurnDirection,
} from '../core';
import { createRunnerRig, updateRunnerRig, type RunnerRig } from './runnerRig';
import { PALETTE, WORLD_METRICS } from './theme';
import { turnLaneOffset } from './turnPresentation';

export interface RenderOptions {
  highContrast: boolean;
  reducedMotion: boolean;
}

export interface RenderSnapshot {
  canvas: { width: number; height: number; resolution: number };
  options: RenderOptions;
  presentationAlpha: number;
  presentedDistance: number;
  presentedLanePosition: number;
  runnerWorld: { x: number; y: number; z: number; yaw: number };
  runnerScreen: { x: number; y: number; visible: boolean };
  camera: { x: number; y: number; z: number; fov: number; yaw: number };
  lanePosition: number;
  posture: 'run' | 'jump' | 'slide';
  visibleSectionIds: string[];
  visibleObstacleCount: number;
  drawCalls: number;
  triangles: number;
  turnProgress: number | null;
  contextLossCount: number;
}

interface TurnMotion {
  direction: TurnDirection;
  fromSectionId: string;
  toSectionId: string;
  fromYaw: number;
  toYaw: number;
  baseLanePosition: number;
  progress: number;
  override: number | null;
  start: Vector3;
  controlOne: Vector3;
  controlTwo: Vector3;
  end: Vector3;
}

const MAX_SECTIONS = 8;
const MAX_RAILS = MAX_SECTIONS * 2;
const MAX_PILLARS = MAX_SECTIONS * 6;
const MAX_ROCKS = MAX_SECTIONS * 8;
const MAX_EVENTS = 96;
const MAX_SHARDS = 160;
const TURN_VISUAL_RADIUS = 1.45;

function easeInOut(progress: number): number {
  const value = MathUtils.clamp(progress, 0, 1);
  return value * value * (3 - 2 * value);
}

function shortestAngle(from: number, to: number, progress: number): number {
  let delta = (to - from + Math.PI) % (Math.PI * 2) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * progress;
}

function cubicBezier(
  start: Vector3,
  controlOne: Vector3,
  controlTwo: Vector3,
  end: Vector3,
  progress: number,
): Vector3 {
  const p = MathUtils.clamp(progress, 0, 1);
  const inverse = 1 - p;
  return new Vector3(
    inverse ** 3 * start.x + 3 * inverse ** 2 * p * controlOne.x + 3 * inverse * p ** 2 * controlTwo.x + p ** 3 * end.x,
    inverse ** 3 * start.y + 3 * inverse ** 2 * p * controlOne.y + 3 * inverse * p ** 2 * controlTwo.y + p ** 3 * end.y,
    inverse ** 3 * start.z + 3 * inverse ** 2 * p * controlOne.z + 3 * inverse * p ** 2 * controlTwo.z + p ** 3 * end.z,
  );
}

function postureOf(state: RunnerState): 'run' | 'jump' | 'slide' {
  if (state.runner.slideTicksRemaining > 0) return 'slide';
  if (!state.runner.grounded) return 'jump';
  return 'run';
}

function seededUnit(index: number, salt: number): number {
  let value = Math.imul(index + 1, 0x45d9f3b) ^ Math.imul(salt + 11, 0x27d4eb2d);
  value ^= value >>> 16;
  value = Math.imul(value, 0x45d9f3b);
  value ^= value >>> 16;
  return (value >>> 0) / 0xffffffff;
}

export class WorldRenderer {
  private renderer: WebGLRenderer | null = null;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(47, 16 / 9, 0.08, 520);
  private resizeObserver: ResizeObserver | null = null;
  private runner: RunnerRig | null = null;
  private elapsed = 0;
  private impact = 0;
  private pickupPulse = 0;
  private turnMotion: TurnMotion | null = null;
  private options: RenderOptions = { highContrast: false, reducedMotion: false };
  private readonly dummy = new Object3D();
  private readonly cameraLook = new Vector3();
  private readonly ocean = new Mesh(
    new PlaneGeometry(900, 900),
    new MeshBasicMaterial({ color: 0x020b10 }),
  );
  private readonly horizon = new Mesh(
    new PlaneGeometry(360, 110),
    new MeshBasicMaterial({ color: 0x0b3440, transparent: true, opacity: 0.5, side: DoubleSide, depthWrite: false }),
  );
  private readonly floorMaterial = new MeshStandardMaterial({ color: PALETTE.basalt, roughness: 0.7, metalness: 0.18 });
  private readonly railMaterial = new MeshStandardMaterial({ color: PALETTE.verdigris, roughness: 0.42, metalness: 0.58 });
  private readonly seamMaterial = new MeshStandardMaterial({ color: PALETTE.signal, emissive: PALETTE.signal, emissiveIntensity: 1.7, roughness: 0.22 });
  private readonly guideMaterial = new MeshStandardMaterial({ color: PALETTE.basaltEdge, emissive: 0x0b292e, emissiveIntensity: 0.55, roughness: 0.5, metalness: 0.32 });
  private readonly porcelainMaterial = new MeshStandardMaterial({ color: PALETTE.porcelain, roughness: 0.58, metalness: 0.06 });
  private readonly rockMaterial = new MeshStandardMaterial({ color: 0x102126, roughness: 0.88, metalness: 0.04 });
  private readonly hazardMaterial = new MeshStandardMaterial({ color: PALETTE.hazard, emissive: 0x6a150d, emissiveIntensity: 0.9, roughness: 0.54 });
  private readonly gapMaterial = new MeshStandardMaterial({ color: 0x010508, emissive: 0x180a08, emissiveIntensity: 0.8, roughness: 0.96 });
  private readonly shardMaterial = new MeshStandardMaterial({ color: PALETTE.signal, emissive: PALETTE.signal, emissiveIntensity: 2.5, roughness: 0.16, metalness: 0.18 });
  private readonly shieldMaterial = new MeshBasicMaterial({ color: PALETTE.signal, transparent: true, opacity: 0.72, wireframe: true });
  private readonly floors = this.instances(new BoxGeometry(1, 1, 1), this.floorMaterial, MAX_SECTIONS);
  private readonly rails = this.instances(new BoxGeometry(1, 1, 1), this.railMaterial, MAX_RAILS);
  private readonly seams = this.instances(new BoxGeometry(1, 1, 1), this.seamMaterial, MAX_SECTIONS * 3);
  private readonly laneGuides = this.instances(new BoxGeometry(1, 1, 1), this.guideMaterial, MAX_SECTIONS * 2);
  private readonly platforms = this.instances(new BoxGeometry(1, 1, 1), this.floorMaterial, MAX_SECTIONS + 1);
  private readonly pillars = this.instances(new CylinderGeometry(1, 1.18, 1, 7), this.porcelainMaterial, MAX_PILLARS);
  private readonly rocks = this.instances(new DodecahedronGeometry(1, 0), this.rockMaterial, MAX_ROCKS);
  private readonly beams = this.instances(new BoxGeometry(1, 1, 1), this.hazardMaterial, MAX_EVENTS);
  private readonly rings = this.instances(new TorusGeometry(1, 0.14, 7, 18), this.hazardMaterial, MAX_EVENTS);
  private readonly columns = this.instances(new CylinderGeometry(0.7, 0.86, 2.4, 7), this.hazardMaterial, MAX_EVENTS);
  private readonly gaps = this.instances(new BoxGeometry(1, 1, 1), this.gapMaterial, MAX_EVENTS);
  private readonly shards = this.instances(new IcosahedronGeometry(0.26, 0), this.shardMaterial, MAX_SHARDS);
  private readonly shields = this.instances(new IcosahedronGeometry(0.72, 1), this.shieldMaterial, 16);
  private readonly wraith = this.createWraith();
  private readonly mist = this.createMist();
  private visibleSections: CourseSection[] = [];
  private contextLossCount = 0;
  private snapshot: RenderSnapshot = {
    canvas: { width: 0, height: 0, resolution: 1 },
    options: { highContrast: false, reducedMotion: false },
    presentationAlpha: 1,
    presentedDistance: 0,
    presentedLanePosition: 0,
    runnerWorld: { x: 0, y: 0, z: 0, yaw: 0 },
    runnerScreen: { x: 0, y: 0, visible: false },
    camera: { x: 0, y: 0, z: 0, fov: 47, yaw: 0 },
    lanePosition: 0,
    posture: 'run',
    visibleSectionIds: [],
    visibleObstacleCount: 0,
    drawCalls: 0,
    triangles: 0,
    turnProgress: null,
    contextLossCount: 0,
  };

  constructor() {
    this.scene.background = new Color(PALETTE.sky);
    this.scene.fog = new FogExp2(PALETTE.sky, 0.0145);
    this.camera.position.set(0, 4.8, 7.4);
    this.scene.add(new HemisphereLight(0xaadcd8, 0x081116, 1.7));
    this.scene.add(new AmbientLight(0x93bcb8, 0.5));
    const key = new DirectionalLight(0xffdfb2, 2.1);
    key.position.set(-8, 15, 6);
    this.scene.add(key);
    const rim = new DirectionalLight(PALETTE.signal, 1.35);
    rim.position.set(7, 6, -12);
    this.scene.add(rim);
    this.ocean.rotation.x = -Math.PI / 2;
    this.ocean.position.y = -4.4;
    this.horizon.position.set(0, 22, -100);
    this.scene.add(this.ocean, this.horizon);
    this.scene.add(
      this.floors,
      this.rails,
      this.seams,
      this.laneGuides,
      this.platforms,
      this.pillars,
      this.rocks,
      this.beams,
      this.rings,
      this.columns,
      this.gaps,
      this.shards,
      this.shields,
      this.wraith,
      this.mist,
    );
  }

  async init(host: HTMLElement): Promise<void> {
    const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth <= 900 ? 1.75 : 2));
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    renderer.domElement.dataset.testid = 'runner-canvas';
    renderer.domElement.setAttribute('aria-label', 'TIDE RELAY third-person endless runner world');
    renderer.domElement.setAttribute('role', 'application');
    renderer.domElement.tabIndex = 0;
    renderer.domElement.addEventListener('webglcontextlost', this.onContextLost);
    host.appendChild(renderer.domElement);
    this.renderer = renderer;
    this.runner = createRunnerRig();
    this.scene.add(this.runner.root);
    this.resizeObserver = new ResizeObserver(() => this.resize(host));
    this.resizeObserver.observe(host);
    this.resize(host);
  }

  get canvas(): HTMLCanvasElement | null {
    return this.renderer?.domElement ?? null;
  }

  setOptions(options: Partial<RenderOptions>): void {
    this.options = { ...this.options, ...options };
    this.scene.fog = new FogExp2(this.options.highContrast ? 0x09212a : PALETTE.sky, this.options.highContrast ? 0.011 : 0.0145);
    this.hazardMaterial.emissiveIntensity = this.options.highContrast ? 1.65 : 0.9;
    this.seamMaterial.emissiveIntensity = this.options.highContrast ? 2.5 : 1.7;
    if (this.options.reducedMotion) {
      this.impact = 0;
      this.pickupPulse = 0;
    }
  }

  render(previous: RunnerState, state: RunnerState, alpha: number, events: readonly RunnerEvent[], deltaMs: number): void {
    const renderer = this.renderer;
    const rig = this.runner;
    if (!renderer || !rig) return;
    this.elapsed += Math.min(0.05, Math.max(0, deltaMs / 1000));
    this.consumeEvents(state, events);
    this.syncTurnMotion(state);
    this.impact = Math.max(0, this.impact - deltaMs / 210);
    this.pickupPulse = Math.max(0, this.pickupPulse - deltaMs / 180);

    const previousSample = sampleRunnerPosition(previous);
    const currentSample = sampleRunnerPosition(state);
    const mix = MathUtils.clamp(alpha, 0, 1);
    const presentedDistance = MathUtils.lerp(previous.distance, state.distance, mix);
    const presentedLanePosition = MathUtils.lerp(
      previous.runner.lanePosition,
      state.runner.lanePosition,
      mix,
    );
    let position = new Vector3(
      MathUtils.lerp(previousSample.x, currentSample.x, mix),
      MathUtils.lerp(previousSample.y, currentSample.y, mix),
      MathUtils.lerp(previousSample.z, currentSample.z, mix),
    );
    let yaw = currentSample.yaw;
    if (this.turnMotion) {
      const motion = this.turnMotion;
      const rawProgress = motion.override ?? motion.progress;
      if (rawProgress >= 1 && motion.override === null) {
        this.turnMotion = null;
      } else {
        const progress = easeInOut(rawProgress);
        const curvePosition = cubicBezier(
          motion.start,
          motion.controlOne,
          motion.controlTwo,
          motion.end,
          progress,
        );
        curvePosition.y = position.y;
        yaw = shortestAngle(motion.fromYaw, motion.toYaw, progress);
        const laneOffset = turnLaneOffset(yaw, motion.baseLanePosition, presentedLanePosition);
        curvePosition.x += laneOffset.x;
        curvePosition.z += laneOffset.z;
        position = curvePosition;
      }
    }
    rig.root.position.copy(position);
    rig.root.rotation.y = yaw;
    const laneDelta = state.runner.targetLane - state.runner.lanePosition;
    updateRunnerRig(rig, {
      elapsed: this.elapsed,
      speed: state.speed,
      laneDelta,
      height: position.y,
      posture: postureOf(state),
      shield: state.runner.shieldCharges > 0,
      reducedMotion: this.options.reducedMotion,
      dead: state.status === 'game-over',
    });
    rig.core.scale.setScalar(1 + this.pickupPulse * 0.55);

    this.updateCourse(state);
    this.updateWraith(state, position, yaw);
    this.updateCamera(state, position, yaw, deltaMs);
    this.ocean.position.x = position.x;
    this.ocean.position.z = position.z;
    const horizonForward = new Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    this.horizon.position.set(
      position.x + horizonForward.x * 115,
      22,
      position.z + horizonForward.z * 115,
    );
    this.horizon.rotation.y = yaw;
    renderer.render(this.scene, this.camera);
    this.updateSnapshot(
      state,
      position,
      yaw,
      mix,
      presentedDistance,
      presentedLanePosition,
    );
    if (this.turnMotion?.progress === 1 && this.turnMotion.override === null) this.turnMotion = null;
  }

  setTurnProgress(progress: number): void {
    if (!this.turnMotion) return;
    this.turnMotion.override = MathUtils.clamp(progress, 0, 1);
  }

  clearTurnProgressOverride(): void {
    if (this.turnMotion) this.turnMotion.override = null;
  }

  getSnapshot(): RenderSnapshot {
    return structuredClone(this.snapshot);
  }

  benchmark(state: RunnerState, iterations = 120): { meanMs: number; p95Ms: number; maxMs: number } {
    const samples: number[] = [];
    for (let index = 0; index < Math.max(1, iterations); index += 1) {
      const start = performance.now();
      this.updateCourse(state);
      samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    return {
      meanMs: samples.reduce((sum, value) => sum + value, 0) / samples.length,
      p95Ms: samples[Math.min(samples.length - 1, Math.floor(samples.length * 0.95))] ?? 0,
      maxMs: samples.at(-1) ?? 0,
    };
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    const renderer = this.renderer;
    this.renderer = null;
    if (renderer) {
      renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    }
    const geometries = new Set<BufferGeometry>();
    const materials = new Set<MeshStandardMaterial | MeshBasicMaterial | PointsMaterial>();
    this.scene.traverse((object) => {
      if (object instanceof Mesh || object instanceof InstancedMesh || object instanceof Points) {
        geometries.add(object.geometry);
        const values = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of values) materials.add(material as MeshStandardMaterial | MeshBasicMaterial | PointsMaterial);
      }
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
  }

  private instances(geometry: BufferGeometry, material: MeshStandardMaterial | MeshBasicMaterial, capacity: number): InstancedMesh {
    const mesh = new InstancedMesh(geometry, material, capacity);
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.count = 0;
    mesh.frustumCulled = false;
    return mesh;
  }

  private resize(host: HTMLElement): void {
    const renderer = this.renderer;
    if (!renderer) return;
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, width <= 900 ? 1.75 : 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private consumeEvents(state: RunnerState, events: readonly RunnerEvent[]): void {
    for (const event of events) {
      if (event.type === 'turned') {
        const from = state.course.sections.find((section) => section.id === event.fromSectionId);
        const to = state.course.sections.find((section) => section.id === event.toSectionId);
        if (from && to) {
          if (
            this.turnMotion?.fromSectionId !== from.id ||
            this.turnMotion.toSectionId !== to.id
          ) {
            this.turnMotion = this.createTurnMotion(
              from,
              to,
              event.direction,
              state.runner.lanePosition,
              0.5,
            );
          }
        }
      } else if (event.type === 'collision' || event.type === 'run-failed') {
        this.impact = this.options.reducedMotion ? 0 : 1;
      } else if (event.type === 'pickup-collected') {
        this.pickupPulse = this.options.reducedMotion ? 0 : 1;
      }
    }
  }

  private createTurnMotion(
    from: CourseSection,
    to: CourseSection,
    direction: TurnDirection,
    lanePosition: number,
    progress: number,
  ): TurnMotion {
    const pivot = sectionEnd(from);
    const incoming = headingVector(from.heading);
    const outgoing = headingVector(to.heading);
    const incomingRight = rightVector(from.heading);
    const outgoingRight = rightVector(to.heading);
    const laneOffset = lanePosition * WORLD_METRICS.laneWidth;
    const start = new Vector3(
      pivot.x - incoming.x * TURN_VISUAL_RADIUS + incomingRight.x * laneOffset,
      0,
      pivot.z - incoming.z * TURN_VISUAL_RADIUS + incomingRight.z * laneOffset,
    );
    const end = new Vector3(
      pivot.x + outgoing.x * TURN_VISUAL_RADIUS + outgoingRight.x * laneOffset,
      0,
      pivot.z + outgoing.z * TURN_VISUAL_RADIUS + outgoingRight.z * laneOffset,
    );
    const tangentLength = TURN_VISUAL_RADIUS * 0.72;
    const controlOne = start.clone().add(new Vector3(incoming.x * tangentLength, 0, incoming.z * tangentLength));
    const controlTwo = end.clone().add(new Vector3(-outgoing.x * tangentLength, 0, -outgoing.z * tangentLength));
    return {
      direction,
      fromSectionId: from.id,
      toSectionId: to.id,
      fromYaw: headingYaw(from.heading),
      toYaw: headingYaw(to.heading),
      baseLanePosition: lanePosition,
      progress: MathUtils.clamp(progress, 0, 1),
      override: null,
      start,
      controlOne,
      controlTwo,
      end,
    };
  }

  private syncTurnMotion(state: RunnerState): void {
    const current = getCurrentSection(state);
    if (!this.turnMotion && state.queuedTurn && current.length - state.sectionDistance <= TURN_VISUAL_RADIUS) {
      const next = state.course.sections.find((section) => section.index === current.index + 1);
      if (next) {
        const progress = 0.5 * MathUtils.clamp(
          (state.sectionDistance - (current.length - TURN_VISUAL_RADIUS)) / TURN_VISUAL_RADIUS,
          0,
          1,
        );
        this.turnMotion = this.createTurnMotion(
          current,
          next,
          state.queuedTurn,
          state.runner.lanePosition,
          progress,
        );
      }
    }
    const motion = this.turnMotion;
    if (!motion || motion.override !== null) return;
    const from = state.course.sections.find((section) => section.id === motion.fromSectionId);
    const to = state.course.sections.find((section) => section.id === motion.toSectionId);
    if (!from || !to) {
      this.turnMotion = null;
      return;
    }
    if (state.sectionIndex === from.index) {
      motion.progress = 0.5 * MathUtils.clamp(
        (state.sectionDistance - (from.length - TURN_VISUAL_RADIUS)) / TURN_VISUAL_RADIUS,
        0,
        1,
      );
    } else if (state.sectionIndex === to.index) {
      motion.progress = 0.5 + 0.5 * MathUtils.clamp(state.sectionDistance / TURN_VISUAL_RADIUS, 0, 1);
    } else if (state.sectionIndex > to.index) {
      motion.progress = 1;
    }
  }

  private updateCourse(state: RunnerState): void {
    const resolved = new Set([...state.resolvedEventIds, ...state.consumedEventIds]);
    this.visibleSections = state.course.sections
      .filter((section) => section.index >= state.sectionIndex - 1 && section.index <= state.sectionIndex + 5)
      .slice(0, MAX_SECTIONS);
    let floorCount = 0;
    let railCount = 0;
    let seamCount = 0;
    let laneGuideCount = 0;
    let platformCount = 0;
    let pillarCount = 0;
    let rockCount = 0;
    let beamCount = 0;
    let ringCount = 0;
    let columnCount = 0;
    let gapCount = 0;
    let shardCount = 0;
    let shieldCount = 0;

    const firstVisible = this.visibleSections[0];
    if (firstVisible) {
      this.setInstance(
        this.platforms,
        platformCount++,
        firstVisible.origin.x,
        -WORLD_METRICS.roadHeight / 2,
        firstVisible.origin.z,
        0,
        WORLD_METRICS.roadWidth,
        WORLD_METRICS.roadHeight,
        WORLD_METRICS.roadWidth,
      );
    }

    for (const section of this.visibleSections) {
      const yaw = headingYaw(section.heading);
      const center = sampleCoursePosition(section, section.length / 2);
      const straightLength = Math.max(1, section.length - WORLD_METRICS.roadWidth);
      this.setInstance(this.floors, floorCount++, center.x, -WORLD_METRICS.roadHeight / 2, center.z, yaw, WORLD_METRICS.roadWidth, WORLD_METRICS.roadHeight, straightLength);
      const right = rightVector(section.heading);
      for (const side of [-1, 1] as const) {
        const offset = side * (WORLD_METRICS.roadWidth / 2 - WORLD_METRICS.railInset);
        this.setInstance(this.rails, railCount++, center.x + right.x * offset, 0.13, center.z + right.z * offset, yaw, 0.25, 0.28, straightLength + 0.12);
      }
      this.setInstance(this.seams, seamCount++, center.x, 0.025, center.z, yaw, 0.1, 0.035, straightLength);
      for (const guideLane of [-0.5, 0.5]) {
        const guide = sampleCoursePosition(section, section.length / 2, guideLane);
        this.setInstance(this.laneGuides, laneGuideCount++, guide.x, 0.012, guide.z, yaw, 0.028, 0.02, straightLength);
      }
      const end = sampleCoursePosition(section, section.length);
      this.setInstance(this.platforms, platformCount++, end.x, -WORLD_METRICS.roadHeight / 2, end.z, 0, WORLD_METRICS.roadWidth, WORLD_METRICS.roadHeight, WORLD_METRICS.roadWidth);
      const next = state.course.sections.find((candidate) => candidate.index === section.index + 1);
      if (next) {
        const incomingSeam = sampleCoursePosition(section, section.length - WORLD_METRICS.roadWidth / 4);
        const outgoingSeam = sampleCoursePosition(next, WORLD_METRICS.roadWidth / 4);
        this.setInstance(this.seams, seamCount++, incomingSeam.x, 0.026, incomingSeam.z, yaw, 0.1, 0.036, WORLD_METRICS.roadWidth / 2);
        this.setInstance(this.seams, seamCount++, outgoingSeam.x, 0.026, outgoingSeam.z, headingYaw(next.heading), 0.1, 0.036, WORLD_METRICS.roadWidth / 2);
      }

      for (let marker = 0; marker < 3; marker += 1) {
        const along = 12 + marker * Math.max(16, (section.length - 24) / 2);
        const sample = sampleCoursePosition(section, Math.min(section.length - 6, along));
        for (const side of [-1, 1] as const) {
          const variance = seededUnit(section.index, marker * 2 + (side > 0 ? 1 : 0));
          const edge = 5.8 + variance * 4.2;
          this.setInstance(this.pillars, pillarCount++, sample.x + right.x * edge * side, 1.35 + variance * 0.65, sample.z + right.z * edge * side, yaw, 0.36 + variance * 0.22, 2.8 + variance * 2.2, 0.36 + variance * 0.22);
          const rockOffset = edge + 1.3 + variance * 2;
          this.setInstance(this.rocks, rockCount++, sample.x + right.x * rockOffset * side, -0.25, sample.z + right.z * rockOffset * side, variance * Math.PI, 0.75 + variance, 0.55 + variance * 0.8, 0.8 + variance * 1.2);
        }
      }

      for (const event of section.events) {
        if (resolved.has(event.id)) continue;
        const sample = sampleCoursePosition(section, event.at, event.lane === 'all' ? 0 : event.lane);
        if (event.kind === 'beam') {
          const width = event.lane === 'all' ? WORLD_METRICS.roadWidth - 0.5 : 1.65;
          this.setInstance(this.beams, beamCount++, sample.x, 0.38, sample.z, yaw, width, 0.56, 0.42);
        } else if (event.kind === 'ring') {
          const widthScale = event.lane === 'all' ? WORLD_METRICS.roadWidth / 2.15 : 1;
          this.setInstance(this.rings, ringCount++, sample.x, event.lane === 'all' ? 1.08 : 0.9, sample.z, yaw, widthScale, event.lane === 'all' ? 0.88 : 0.66, 1);
        } else if (event.kind === 'column') {
          this.setInstance(this.columns, columnCount++, sample.x, 1.2, sample.z, yaw, 0.88, 1, 0.88);
        } else if (event.kind === 'gap') {
          const width = event.lane === 'all' ? WORLD_METRICS.roadWidth - 0.5 : WORLD_METRICS.laneWidth * 0.9;
          this.setInstance(this.gaps, gapCount++, sample.x, 0.03, sample.z, yaw, width, 0.075, Math.max(1.6, event.length));
        } else if (event.kind === 'shard') {
          const bob = this.options.reducedMotion ? 0 : Math.sin(this.elapsed * 3.2 + event.at) * 0.13;
          const rotation = this.options.reducedMotion ? event.at * 0.17 : this.elapsed * 1.6 + event.at;
          this.setInstance(this.shards, shardCount++, sample.x, 1.05 + bob, sample.z, rotation, 1, 1.4, 1);
        } else if (event.kind === 'shield') {
          const rotation = this.options.reducedMotion ? event.at * 0.11 : this.elapsed * 0.8;
          this.setInstance(this.shields, shieldCount++, sample.x, 1.05, sample.z, rotation, 1, 1, 1);
        }
      }
    }
    this.finishInstances(this.floors, floorCount);
    this.finishInstances(this.rails, railCount);
    this.finishInstances(this.seams, seamCount);
    this.finishInstances(this.laneGuides, laneGuideCount);
    this.finishInstances(this.platforms, platformCount);
    this.finishInstances(this.pillars, pillarCount);
    this.finishInstances(this.rocks, rockCount);
    this.finishInstances(this.beams, beamCount);
    this.finishInstances(this.rings, ringCount);
    this.finishInstances(this.columns, columnCount);
    this.finishInstances(this.gaps, gapCount);
    this.finishInstances(this.shards, shardCount);
    this.finishInstances(this.shields, shieldCount);
  }

  private setInstance(mesh: InstancedMesh, index: number, x: number, y: number, z: number, yaw: number, sx: number, sy: number, sz: number): void {
    if (index >= mesh.instanceMatrix.count) return;
    this.dummy.position.set(x, y, z);
    this.dummy.rotation.set(0, yaw, 0);
    this.dummy.scale.set(sx, sy, sz);
    this.dummy.updateMatrix();
    mesh.setMatrixAt(index, this.dummy.matrix);
  }

  private finishInstances(mesh: InstancedMesh, count: number): void {
    mesh.count = Math.min(count, mesh.instanceMatrix.count);
    mesh.instanceMatrix.needsUpdate = true;
  }

  private updateCamera(state: RunnerState, position: Vector3, yaw: number, deltaMs: number): void {
    const forward = new Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const portraitFactor = this.camera.aspect < 0.7 ? 1.2 : 1;
    const targetPosition = position.clone().addScaledVector(forward, -7.2 * portraitFactor);
    targetPosition.y = 4.35 + (portraitFactor - 1) * 1.15 + position.y * 0.18 - (state.runner.slideTicksRemaining > 0 ? 0.1 : 0);
    targetPosition.addScaledVector(right, -state.runner.lanePosition * 0.08);
    if (this.impact > 0 && !this.options.reducedMotion) {
      targetPosition.addScaledVector(right, Math.sin(this.elapsed * 95) * this.impact * 0.12);
      targetPosition.y += Math.cos(this.elapsed * 82) * this.impact * 0.07;
    }
    const damping = 1 - Math.exp(-Math.max(0.001, deltaMs / 1000) * (this.turnMotion ? 7.5 : 10));
    if (
      this.camera.position.lengthSq() < 0.001 ||
      this.camera.position.distanceToSquared(targetPosition) > 12 * 12
    ) this.camera.position.copy(targetPosition);
    else this.camera.position.lerp(targetPosition, damping);
    const lookAhead = (10 + state.speed * 0.34) * (this.camera.aspect < 0.7 ? 0.72 : 1);
    this.cameraLook.copy(position).addScaledVector(forward, lookAhead).add(new Vector3(0, 1.15 + position.y * 0.12, 0));
    this.camera.lookAt(this.cameraLook);
    const targetFov = this.options.reducedMotion ? 47 : 47 + ((state.speed - 9) / 10) * 6;
    this.camera.fov = MathUtils.lerp(this.camera.fov, MathUtils.clamp(targetFov, 47, 53), damping * 0.7);
    this.camera.updateProjectionMatrix();
  }

  private createWraith(): Object3D {
    const group = new Object3D();
    const material = new MeshStandardMaterial({ color: PALETTE.blackTide, emissive: 0x071820, emissiveIntensity: 1.1, transparent: true, opacity: 0.9, roughness: 0.86 });
    for (let index = 0; index < 5; index += 1) {
      const mesh = new Mesh(new IcosahedronGeometry(0.7 + index * 0.12, 1), material);
      mesh.position.set((index - 2) * 0.48, 0.65 + (index % 2) * 0.34, index * 0.3);
      group.add(mesh);
    }
    const eyeMaterial = new MeshBasicMaterial({ color: PALETTE.hazard, blending: AdditiveBlending });
    for (const x of [-0.18, 0.18]) {
      const eye = new Mesh(new IcosahedronGeometry(0.065, 0), eyeMaterial);
      eye.position.set(x, 0.96, -0.69);
      group.add(eye);
    }
    return group;
  }

  private createMist(): Points {
    const count = 120;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (seededUnit(index, 1) - 0.5) * 22;
      positions[index * 3 + 1] = seededUnit(index, 2) * 7 - 1;
      positions[index * 3 + 2] = (seededUnit(index, 3) - 0.5) * 42;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const material = new PointsMaterial({ color: PALETTE.signal, size: 0.055, transparent: true, opacity: 0.28, depthWrite: false, blending: AdditiveBlending });
    return new Points(geometry, material);
  }

  private updateWraith(state: RunnerState, position: Vector3, yaw: number): void {
    const forward = new Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const distance = state.runner.shieldCharges > 0 ? 6.2 : 4.5;
    this.wraith.position.copy(position).addScaledVector(forward, -distance);
    this.wraith.position.y = 0.12 + (this.options.reducedMotion ? 0 : Math.sin(this.elapsed * 3.4) * 0.12);
    this.wraith.rotation.y = yaw;
    this.wraith.visible = state.status !== 'ready';
    this.mist.position.copy(position).addScaledVector(forward, -7);
    this.mist.visible = !this.options.reducedMotion;
  }

  private updateSnapshot(
    state: RunnerState,
    position: Vector3,
    yaw: number,
    presentationAlpha: number,
    presentedDistance: number,
    presentedLanePosition: number,
  ): void {
    const renderer = this.renderer;
    if (!renderer) return;
    const screen = position.clone().add(new Vector3(0, 1, 0)).project(this.camera);
    const size = renderer.getSize(new Vector2());
    const width = size.x;
    const height = size.y;
    this.snapshot = {
      canvas: { width, height, resolution: renderer.getPixelRatio() },
      options: { ...this.options },
      presentationAlpha,
      presentedDistance,
      presentedLanePosition,
      runnerWorld: { x: position.x, y: position.y, z: position.z, yaw },
      runnerScreen: { x: (screen.x * 0.5 + 0.5) * width, y: (-screen.y * 0.5 + 0.5) * height, visible: screen.z >= -1 && screen.z <= 1 },
      camera: { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z, fov: this.camera.fov, yaw },
      lanePosition: state.runner.lanePosition,
      posture: postureOf(state),
      visibleSectionIds: this.visibleSections.map((section) => section.id),
      visibleObstacleCount: this.beams.count + this.rings.count + this.columns.count + this.gaps.count,
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      turnProgress: this.turnMotion ? this.turnMotion.override ?? this.turnMotion.progress : null,
      contextLossCount: this.contextLossCount,
    };
  }

  private readonly onContextLost = (event: Event): void => {
    event.preventDefault();
    this.contextLossCount += 1;
  };
}
