import { getWorldPath, type GameState } from "../../game";

interface DebugPanelProps {
  state: GameState;
}

export default function DebugPanel({ state }: DebugPanelProps) {
  const worlds = Object.values(state.worlds);
  const entityCount = Object.keys(state.entities).length;

  return (
    <section className="debug-panel" aria-label="Debug panel">
      <h2>Debug</h2>
      <dl>
        <div>
          <dt>Current world</dt>
          <dd>{state.worlds[state.activeWorldId].name}</dd>
        </div>
        <div>
          <dt>Entities</dt>
          <dd>{entityCount}</dd>
        </div>
        <div>
          <dt>Recent action</dt>
          <dd>{state.lastAction ?? "none"}</dd>
        </div>
      </dl>
      <div className="layer-tree" aria-label="Layer tree">
        {worlds.map((world) => {
          const depth = getWorldPath(state, world.id).length - 1;
          const parentLabel = world.parent ? `via ${state.entities[world.parent.boxId]?.name ?? world.parent.boxId}` : "root";
          return (
            <div key={world.id} style={{ paddingLeft: depth * 14 }}>
              <strong>{world.name}</strong>
              <span>{parentLabel}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
