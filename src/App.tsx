import { useCallback, useMemo, useState } from "react";
import { applyMove, createGameState, reset, undo, type Direction } from "./game";
import { tutorialLevels } from "./levels/tutorial";
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

export default function App() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [state, setState] = useState(() => createGameState(tutorialLevels[0]));

  const level = tutorialLevels[levelIndex];
  const canAdvance = levelIndex < tutorialLevels.length - 1;

  const loadLevel = useCallback((nextIndex: number) => {
    const boundedIndex = Math.min(Math.max(nextIndex, 0), tutorialLevels.length - 1);
    setLevelIndex(boundedIndex);
    setState(createGameState(tutorialLevels[boundedIndex]));
  }, []);

  const move = useCallback((direction: Direction) => {
    setState((current) => applyMove(current, direction));
  }, []);

  const keyboardHandler = useMemo(
    () => (event: React.KeyboardEvent) => {
      const direction = KEY_DIRECTIONS[event.key];
      if (!direction) {
        return;
      }
      event.preventDefault();
      move(direction);
    },
    [move],
  );

  return (
    <GameShell
      state={state}
      level={level}
      levelIndex={levelIndex}
      totalLevels={tutorialLevels.length}
      levels={tutorialLevels}
      canAdvance={canAdvance}
      onMove={move}
      onUndo={() => setState((current) => undo(current))}
      onReset={() => setState((current) => reset(current))}
      onNext={() => loadLevel(levelIndex + 1)}
      onSelectLevel={loadLevel}
      onKeyboard={keyboardHandler}
    />
  );
}
