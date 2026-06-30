import { ChevronRight } from "lucide-react";
import { getWorldPath, type Direction, type GameState } from "../game";
import type { TutorialLevel } from "../levels/tutorial";
import type { ProgressState } from "../progress/storage";
import ControlPanel from "./controls/ControlPanel";
import DebugPanel from "./debug/DebugPanel";
import LevelSelect from "./controls/LevelSelect";
import HelpOverlay from "./help/HelpOverlay";
import AboutPage from "./pages/AboutPage";
import HelpPage from "./pages/HelpPage";
import LevelLibrary from "./pages/LevelLibrary";
import RecursiveWorldView from "./world/RecursiveWorldView";

interface GameShellProps {
  state: GameState;
  level: TutorialLevel;
  levelIndex: number;
  totalLevels: number;
  levels: TutorialLevel[];
  progress: ProgressState;
  view: "play" | "levels" | "help" | "about";
  canAdvance: boolean;
  onMove: (direction: Direction) => void;
  onUndo: () => void;
  onReset: () => void;
  onNext: () => void;
  onSelectLevel: (index: number) => void;
  onViewChange: (view: "play" | "levels" | "help" | "about") => void;
  showDebug: boolean;
  onToggleDebug: () => void;
  showHelp: boolean;
  onToggleHelp: () => void;
}

export default function GameShell({
  state,
  level,
  levelIndex,
  totalLevels,
  levels,
  progress,
  view,
  canAdvance,
  onMove,
  onUndo,
  onReset,
  onNext,
  onSelectLevel,
  onViewChange,
  showDebug,
  onToggleDebug,
  showHelp,
  onToggleHelp,
}: GameShellProps) {
  const path = getWorldPath(state, state.activeWorldId);

  return (
    <main className="game-shell">
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

      <nav className="view-tabs" aria-label="Application views">
        {(["play", "levels", "help", "about"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={view === item ? "active" : undefined}
            onClick={() => onViewChange(item)}
          >
            {item === "play" ? "Play" : item === "levels" ? "Levels" : item === "help" ? "Help" : "About"}
          </button>
        ))}
      </nav>

      {view === "play" ? (
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
            onToggleHelp={onToggleHelp}
          />
          {showDebug ? <DebugPanel state={state} /> : null}
          <LevelSelect
            levels={levels}
            currentIndex={levelIndex}
            progress={progress}
            onSelectLevel={onSelectLevel}
          />
          <section className="mechanic-note" aria-label="Current objective">
            <h2>Objective</h2>
            <p>{level.description}</p>
          </section>
        </aside>
      </section>
      ) : null}
      {view === "levels" ? (
        <LevelLibrary
          levels={levels}
          currentIndex={levelIndex}
          progress={progress}
          onSelectLevel={onSelectLevel}
        />
      ) : null}
      {view === "help" ? <HelpPage /> : null}
      {view === "about" ? <AboutPage /> : null}
      {showHelp ? <HelpOverlay onClose={onToggleHelp} /> : null}
    </main>
  );
}
