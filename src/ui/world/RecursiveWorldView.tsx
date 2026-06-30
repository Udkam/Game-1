import { getEntitiesAt, type GameState, type GoalEntity } from "../../game";
import Cell from "./Cell";
import EntitySprite from "./EntitySprite";

interface RecursiveWorldViewProps {
  state: GameState;
  worldId: string;
  activeWorldId: string;
  action?: string;
  depth?: number;
  compact?: boolean;
}

export default function RecursiveWorldView({
  state,
  worldId,
  activeWorldId,
  action = "ready",
  depth = 0,
  compact = false,
}: RecursiveWorldViewProps) {
  const world = state.worlds[worldId];
  const cells = [];

  for (let y = 0; y < world.height; y += 1) {
    for (let x = 0; x < world.width; x += 1) {
      const entities = getEntitiesAt(state, worldId, x, y);
      const goal = entities.find((entity): entity is GoalEntity => entity.type === "goal");
      const hasWall = entities.some((entity) => entity.type === "wall");
      const isEntry = world.entry?.x === x && world.entry.y === y;
      const isExit = Boolean(world.parent) && (x === 0 || y === 0 || x === world.width - 1 || y === world.height - 1);
      const terrain = hasWall ? "wall" : goal ? "dock" : isEntry ? "entry" : isExit ? "exit" : "floor";
      const solidEntities = entities.filter((entity) => entity.type !== "goal" && entity.type !== "wall");
      cells.push(
        <Cell key={`${worldId}-${x}-${y}`} x={x} y={y} terrain={terrain} goalTarget={goal?.target}>
          {solidEntities.map((entity) => (
            <EntitySprite
              key={entity.id}
              entity={entity}
              state={state}
              activeWorldId={activeWorldId}
              action={action}
              depth={depth}
            />
          ))}
        </Cell>,
      );
    }
  }

  return (
    <section
      className={`world-view ${compact ? "compact" : ""} ${worldId === activeWorldId ? "active-world" : ""}`}
      aria-label={`${world.name} grid`}
    >
      <div className="world-title">
        <span>{world.name}</span>
        <small>{compact ? "window" : world.parent ? "contained world" : "root world"}</small>
      </div>
      <div
        className="world-grid"
        role="grid"
        style={{
          gridTemplateColumns: `repeat(${world.width}, minmax(0, 1fr))`,
        }}
        data-action={action}
      >
        {cells}
      </div>
    </section>
  );
}
