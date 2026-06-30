import { getEntitiesAt, type GameState } from "../../game";
import Cell from "./Cell";
import EntitySprite from "./EntitySprite";

interface RecursiveWorldViewProps {
  state: GameState;
  worldId: string;
  activeWorldId: string;
  depth?: number;
  compact?: boolean;
}

export default function RecursiveWorldView({
  state,
  worldId,
  activeWorldId,
  depth = 0,
  compact = false,
}: RecursiveWorldViewProps) {
  const world = state.worlds[worldId];
  const cells = [];

  for (let y = 0; y < world.height; y += 1) {
    for (let x = 0; x < world.width; x += 1) {
      const entities = getEntitiesAt(state, worldId, x, y);
      const hasGoal = entities.some((entity) => entity.type === "goal");
      const solidEntities = entities.filter((entity) => entity.type !== "goal");
      cells.push(
        <Cell key={`${worldId}-${x}-${y}`} x={x} y={y} hasGoal={hasGoal}>
          {solidEntities.map((entity) => (
            <EntitySprite
              key={entity.id}
              entity={entity}
              state={state}
              activeWorldId={activeWorldId}
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
      <div className="world-title">{world.name}</div>
      <div
        className="world-grid"
        role="grid"
        style={{
          gridTemplateColumns: `repeat(${world.width}, minmax(0, 1fr))`,
        }}
      >
        {cells}
      </div>
    </section>
  );
}
