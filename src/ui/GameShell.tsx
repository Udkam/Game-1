import { ChevronRight } from "lucide-react";
import { getWorldPath, type Direction, type GameState } from "../game";
import type { TutorialLevel } from "../levels/tutorial";
import ControlPanel from "./controls/ControlPanel";
import DebugPanel from "./debug/DebugPanel";
import LevelSelect from "./controls/LevelSelect";
import RecursiveWorldView from "./world/RecursiveWorldView";

interface GameShellProps {
  state: GameState;
  level: TutorialLevel;
  levelIndex: number;
  totalLevels: number;
  levels: TutorialLevel[];
  canAdvance: boolean;
  onMove: (direction: Direction) => void;
  onUndo: () => void;
  onReset: () => void;
  onNext: () => void;
  onSelectLevel: (index: number) => void;
  onKeyboard: (event: React.KeyboardEvent) => void;
  showDebug: boolean;
  onToggleDebug: () => void;
}

export default function GameShell({
  state,
  level,
  levelIndex,
  totalLevels,
  levels,
  canAdvance,
  onMove,
  onUndo,
  onReset,
  onNext,
  onSelectLevel,
  onKeyboard,
  showDebug,
  onToggleDebug,
}: GameShellProps) {
  const path = getWorldPath(state, state.activeWorldId);

  return (
    <main className="game-shell" tabIndex={0} onKeyDown={onKeyboard}>
      <header className="game-header">
        <div>
          <p className="eyebrow">Recursive Box Lab</p>
          <h1>{level.title}</h1>
          <p>{level.lesson}</p>
        </div>
        <div className="level-counter" aria-label="Current level">
          {levelIndex + 1}
          <span>/ {totalLevels}</span>
        </div>
      </header>

      <section className="play-layout" aria-label="Playable puzzle">
        <div className="board-panel">
          <div className="world-breadcrumb" aria-label="Current world path">
            {path.map((world, index) => (
              <span key={world.id}>
                {index > 0 ? <ChevronRight size={14} aria-hidden="true" /> : null}
                {world.name}
              </span>
            ))}
          </div>
          <RecursiveWorldView state={state} worldId={state.activeWorldId} activeWorldId={state.activeWorldId} />
          {state.won ? (
            <div className="win-banner" role="status">
              Layer solved. Advance when ready.
            </div>
          ) : null}
        </div>

        <aside className="side-panel" aria-label="Controls and level selection">
          <ControlPanel
            moves={state.moves}
            won={state.won}
            canAdvance={canAdvance}
            showDebug={showDebug}
            onMove={onMove}
            onUndo={onUndo}
            onReset={onReset}
            onNext={onNext}
            onToggleDebug={onToggleDebug}
          />
          {showDebug ? <DebugPanel state={state} /> : null}
          <LevelSelect
            levels={levels}
            currentIndex={levelIndex}
            onSelectLevel={onSelectLevel}
          />
          <section className="mechanic-note" aria-label="Keyboard controls">
            <h2>Controls</h2>
            <p>Use WASD or arrow keys. Push crates, enter open crates, and watch cargo move between worlds.</p>
          </section>
        </aside>
      </section>
    </main>
  );
}
