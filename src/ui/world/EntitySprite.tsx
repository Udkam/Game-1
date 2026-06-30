import type { Entity, GameState } from "../../game";
import RecursiveWorldView from "./RecursiveWorldView";

interface EntitySpriteProps {
  entity: Entity;
  state: GameState;
  activeWorldId: string;
  action: string;
  depth: number;
}

function facingFromAction(action: string) {
  const dir = action.split(":")[1] ?? "down";
  return ["up", "down", "left", "right"].includes(dir) ? dir : "down";
}

export default function EntitySprite({ entity, state, activeWorldId, action, depth }: EntitySpriteProps) {
  if (entity.type === "goal") {
    return null;
  }

  const isOpenBox = entity.type === "box" && entity.open && entity.innerWorldId;
  const hasInnerWorld = entity.type === "box" && Boolean(entity.innerWorldId);
  const boxKind = entity.type === "box"
    ? isOpenBox
      ? "enterable"
      : hasInnerWorld
        ? "container"
        : entity.pushable === false
          ? "locked"
          : "normal"
    : "";

  return (
    <div
      className={`entity entity-${entity.type} ${boxKind ? `box-${boxKind}` : ""} facing-${facingFromAction(action)}`}
      aria-label={entity.name ?? entity.type}
    >
      {entity.type === "player" ? (
        <span className="sprite-probe" aria-hidden="true">
          <i className="probe-shadow" />
          <i className="probe-body" />
          <i className="probe-lens" />
          <i className="probe-nose" />
        </span>
      ) : null}
      {entity.type === "box" ? (
        <span className="sprite-crate" aria-hidden="true">
          <i className="crate-top" />
          <i className="crate-face" />
          <i className="crate-window" />
          <i className="crate-ribs" />
        </span>
      ) : null}
      {isOpenBox && depth < 2 ? (
        <div className="inner-world-preview" aria-label={`${entity.name ?? entity.id} inner world preview`}>
          <RecursiveWorldView
            state={state}
            worldId={entity.innerWorldId as string}
            activeWorldId={activeWorldId}
            action={action}
            depth={depth + 1}
            compact
          />
        </div>
      ) : null}
    </div>
  );
}
