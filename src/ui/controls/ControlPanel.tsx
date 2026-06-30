import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCcw,
  SkipForward,
  Undo2,
} from "lucide-react";
import type { Direction } from "../../game";

interface ControlPanelProps {
  moves: number;
  won: boolean;
  canAdvance: boolean;
  onMove: (direction: Direction) => void;
  onUndo: () => void;
  onReset: () => void;
  onNext: () => void;
}

export default function ControlPanel({
  moves,
  won,
  canAdvance,
  onMove,
  onUndo,
  onReset,
  onNext,
}: ControlPanelProps) {
  return (
    <section className="control-panel" aria-label="Puzzle controls">
      <div className="status-row">
        <span>Moves</span>
        <strong>{moves}</strong>
      </div>
      <div className="status-row">
        <span>Status</span>
        <strong>{won ? "Solved" : "In progress"}</strong>
      </div>

      <div className="d-pad" aria-label="Move controls">
        <button className="icon-button up" type="button" aria-label="Move up" onClick={() => onMove("up")}>
          <ArrowUp size={18} aria-hidden="true" />
        </button>
        <button className="icon-button left" type="button" aria-label="Move left" onClick={() => onMove("left")}>
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <button className="icon-button right" type="button" aria-label="Move right" onClick={() => onMove("right")}>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
        <button className="icon-button down" type="button" aria-label="Move down" onClick={() => onMove("down")}>
          <ArrowDown size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="command-row">
        <button type="button" onClick={onUndo}>
          <Undo2 size={16} aria-hidden="true" />
          Undo
        </button>
        <button type="button" onClick={onReset}>
          <RotateCcw size={16} aria-hidden="true" />
          Reset
        </button>
        <button type="button" onClick={onNext} disabled={!won || !canAdvance}>
          <SkipForward size={16} aria-hidden="true" />
          Next Level
        </button>
      </div>
    </section>
  );
}
