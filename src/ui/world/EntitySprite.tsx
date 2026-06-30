import type { Entity, GameState } from "../../game";
import RecursiveWorldView from "./RecursiveWorldView";

interface EntitySpriteProps {
  entity: Entity;
  state: GameState;
  activeWorldId: string;
  depth: number;
}

export default function EntitySprite({ entity, state, activeWorldId, depth }: EntitySpriteProps) {
  if (entity.type === "goal") {
    return null;
  }

  const isOpenBox = entity.type === "box" && entity.open && entity.innerWorldId;
  const label = entity.type === "player" ? "P" : entity.type === "wall" ? "" : isOpenBox ? "IN" : "B";

  return (
    <div className={`entity entity-${entity.type} ${isOpenBox ? "entity-open-box" : ""}`}>
      <span>{label}</span>
      {isOpenBox && depth < 2 ? (
        <div className="inner-world-preview" aria-label={`${entity.name ?? entity.id} inner world preview`}>
          <RecursiveWorldView
            state={state}
            worldId={entity.innerWorldId as string}
            activeWorldId={activeWorldId}
            depth={depth + 1}
            compact
          />
        </div>
      ) : null}
    </div>
  );
}
