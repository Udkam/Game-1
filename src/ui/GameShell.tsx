import { Box, ChevronRight, FlaskConical } from "lucide-react";
import type { CSSProperties } from "react";
import { getWorldPath, type Direction, type GameState } from "../game";
import type { TutorialLevel } from "../levels/tutorial";
import type { ProgressState } from "../progress/storage";
import ControlPanel from "./controls/ControlPanel";
import DebugPanel from "./debug/DebugPanel";
import LevelSelect from "./controls/LevelSelect";
import HelpOverlay from "./help/HelpOverlay";
import AboutPage from "./pages/AboutPage";
import LevelLibrary from "./pages/LevelLibrary";
import RecursiveWorldView from "./world/RecursiveWorldView";

interface GameShellProps {
  state: GameState;
  level: TutorialLevel;
  levelIndex: number;
  totalLevels: number;
  levels: TutorialLevel[];
  progress: ProgressState;
  view: "play" | "levels" | "about";
  canAdvance: boolean;
  onMove: (direction: Direction) => void;
  onUndo: () => void;
  onReset: () => void;
  onNext: () => void;
  onSelectLevel: (index: number) => void;
  onViewChange: (view: "play" | "levels" | "about") => void;
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
  const tags = level.mechanicTags ?? [level.lesson];
  const lastAction = state.lastAction ?? "ready";

  return (
    <main className={`game-shell action-${lastAction.replaceAll(":", "-")} ${state.won ? "is-solved" : ""}`}>
      <header className="game-hud">
        <div className="hud-title">
          <div className="game-mark" aria-hidden="true">
            <FlaskConical size={20} />
          </div>
          <div>
            <p className="eyebrow">Recursive Box Lab</p>
            <h1>{String(levelIndex + 1).padStart(2, "0")} / {level.title}</h1>
          </div>
        </div>
        <div className="hud-tags" aria-label="Mechanics">
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="hud-readout" aria-label="Run status">
          <span>Steps <strong>{state.moves}</strong></span>
          <span className={state.won ? "status-solved" : "status-live"}>{state.won ? "Solved" : "Live"}</span>
        </div>
      </header>

      {view === "play" ? (
      <section className="game-stage-layout" aria-label="Playable puzzle">
        <section className="stage-column" aria-label="Recursive game stage">
          <div className="stage-frame">
            <div className="world-breadcrumb" aria-label="Current world path">
              {path.map((world, index) => (
                <span key={world.id}>
                  {index > 0 ? <ChevronRight size={14} aria-hidden="true" /> : null}
                  {world.name}
                </span>
              ))}
            </div>
            <RecursiveWorldView
              state={state}
              worldId={state.activeWorldId}
              activeWorldId={state.activeWorldId}
              action={lastAction}
            />
            {state.won ? (
              <div className="win-banner" role="status">
                Dock array aligned. Experiment complete.
              </div>
            ) : null}
          </div>
          <section className="recursion-stack" aria-label="Recursive layer stack">
            <div className="stack-heading">
              <Box size={16} aria-hidden="true" />
              <span>Spatial Stack</span>
            </div>
            <div className="stack-cards">
              {path.map((world, index) => (
                <article
                  key={world.id}
                  className={index === path.length - 1 ? "stack-card active" : "stack-card"}
                  style={{ "--stack-index": index } as CSSProperties}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{world.name}</strong>
                  <small>{index === 0 ? "root plane" : "contained fold"}</small>
                </article>
              ))}
            </div>
          </section>
        </section>

        <aside className="instrument-panel" aria-label="Controls and level selection">
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
            onOpenLevels={() => onViewChange("levels")}
            onOpenAbout={() => onViewChange("about")}
          />
          {showDebug ? <DebugPanel state={state} /> : null}
          <LevelSelect
            levels={levels}
            currentIndex={levelIndex}
            progress={progress}
            onSelectLevel={onSelectLevel}
          />
          <section className="mechanic-note" aria-label="Current objective">
            <h2>Experiment Goal</h2>
            <p>{level.subtitle ?? level.description}</p>
            <small>{level.designIntent ?? "Solve the fold without breaking parent-child space."}</small>
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
          onBack={() => onViewChange("play")}
        />
      ) : null}
      {view === "about" ? <AboutPage onBack={() => onViewChange("play")} /> : null}
      {showHelp ? <HelpOverlay onClose={onToggleHelp} /> : null}
    </main>
  );
}
