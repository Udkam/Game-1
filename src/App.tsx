import { useCallback, useEffect, useState } from "react";
import { applyMove, createGameState, reset, undo, type Direction } from "./game";
import { tutorialLevels } from "./levels/tutorial";
import {
  completeLevel,
  readProgress,
  setCurrentLevel,
  writeProgress,
  type ProgressState,
} from "./progress/storage";
import GameShell from "./ui/GameShell";

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  W: "up",
  a: "left",
  A: "left",
  s: "down",
  S: "down",
  d: "right",
  D: "right",
};

type ViewMode = "play" | "levels" | "help" | "about";

function levelIndexFromProgress(progress: ProgressState) {
  const index = tutorialLevels.findIndex((level) => level.id === progress.currentLevelId);
  return index >= 0 ? index : 0;
}

export default function App() {
  const [progress, setProgress] = useState(() => readProgress());
  const [levelIndex, setLevelIndex] = useState(() => levelIndexFromProgress(readProgress()));
  const [state, setState] = useState(() => createGameState(tutorialLevels[levelIndexFromProgress(readProgress())]));
  const [showDebug, setShowDebug] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [view, setView] = useState<ViewMode>("play");

  const level = tutorialLevels[levelIndex];
  const canAdvance = levelIndex < tutorialLevels.length - 1;

  const updateProgress = useCallback((updater: (current: ProgressState) => ProgressState) => {
    setProgress((current) => {
      const next = updater(current);
      writeProgress(next);
      return next;
    });
  }, []);

  const loadLevel = useCallback((nextIndex: number) => {
    const boundedIndex = Math.min(Math.max(nextIndex, 0), tutorialLevels.length - 1);
    setLevelIndex(boundedIndex);
    setState(createGameState(tutorialLevels[boundedIndex]));
    updateProgress((current) => setCurrentLevel(current, tutorialLevels[boundedIndex].id));
  }, [updateProgress]);

  const selectLevel = useCallback(
    (nextIndex: number) => {
      loadLevel(nextIndex);
      setView("play");
    },
    [loadLevel],
  );

  const move = useCallback((direction: Direction) => {
    setState((current) => applyMove(current, direction));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showHelp) {
        if (event.key === "Escape") {
          setShowHelp(false);
        }
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select")) {
        return;
      }
      const direction = KEY_DIRECTIONS[event.key];
      if (!direction) {
        return;
      }
      event.preventDefault();
      move(direction);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move, showHelp]);

  useEffect(() => {
    if (!state.won) {
      return;
    }
    updateProgress((current) => completeLevel(current, level.id, state.moves));
  }, [level.id, state.moves, state.won, updateProgress]);

  return (
    <GameShell
      state={state}
      level={level}
      levelIndex={levelIndex}
      totalLevels={tutorialLevels.length}
      levels={tutorialLevels}
      progress={progress}
      view={view}
      canAdvance={canAdvance}
      onMove={move}
      onUndo={() => setState((current) => undo(current))}
      onReset={() => setState((current) => reset(current))}
      onNext={() => loadLevel(levelIndex + 1)}
      onSelectLevel={selectLevel}
      onViewChange={setView}
      showDebug={showDebug}
      onToggleDebug={() => setShowDebug((current) => !current)}
      showHelp={showHelp}
      onToggleHelp={() => setShowHelp((current) => !current)}
    />
  );
}
