export type WorldId = string;
export type EntityId = string;

export type Direction = "up" | "down" | "left" | "right";

export type GoalTarget = "box" | "player" | "any";

export interface Vec2 {
  x: number;
  y: number;
}

export interface Position extends Vec2 {
  worldId: WorldId;
}

export interface WorldParent {
  worldId: WorldId;
  boxId: EntityId;
}

export interface World {
  id: WorldId;
  name: string;
  width: number;
  height: number;
  parent?: WorldParent;
  entry?: Vec2;
}

interface EntityBase {
  id: EntityId;
  name?: string;
  position: Position;
}

export interface PlayerEntity extends EntityBase {
  type: "player";
}

export interface BoxEntity extends EntityBase {
  type: "box";
  pushable?: boolean;
  open?: boolean;
  innerWorldId?: WorldId;
}

export interface WallEntity extends EntityBase {
  type: "wall";
}

export interface GoalEntity extends EntityBase {
  type: "goal";
  target: GoalTarget;
  required?: boolean;
}

export type Entity = PlayerEntity | BoxEntity | WallEntity | GoalEntity;

export type EntityMap = Record<EntityId, Entity>;
export type WorldMap = Record<WorldId, World>;

export interface GameCoreState {
  levelId: string;
  title: string;
  worlds: WorldMap;
  entities: EntityMap;
  playerId: EntityId;
  activeWorldId: WorldId;
  moves: number;
  won: boolean;
  lastAction?: string;
}

export interface GameState extends GameCoreState {
  initial: GameCoreState;
  history: GameCoreState[];
}

export interface LevelDefinition {
  id: string;
  title: string;
  description?: string;
  worlds: World[];
  entities: Entity[];
  playerId: EntityId;
  activeWorldId?: WorldId;
}

export interface MoveResult {
  changed: boolean;
  reason?: string;
}
