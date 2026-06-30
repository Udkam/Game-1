import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Box,
  Bug,
  HelpCircle,
  RotateCcw,
  SkipForward,
  Undo2,
} from "lucide-react";
import type { Direction } from "../../game";

interface ControlPanelProps {
  moves: number;
  won: boolean;
  canAdvance: boolean;
  showDebug: boolean;
  onMove: (direction: Direction) => void;
  onUndo: () => void;
  onReset: () => void;
  onNext: () => void;
  onToggleDebug: () => void;
  onToggleHelp: () => void;
  onOpenLevels: () => void;
  onOpenAbout: () => void;
}

export default function ControlPanel({
  moves,
  won,
  canAdvance,
  showDebug,
  onMove,
  onUndo,
  onReset,
  onNext,
  onToggleDebug,
  onToggleHelp,
  onOpenLevels,
  onOpenAbout,
}: ControlPanelProps) {
  return (
    <section className="control-panel" aria-label="Puzzle controls">
      <div className="panel-readout">
        <span>Step Counter</span>
        <strong>{moves}</strong>
        <em>{won ? "alignment locked" : "experiment live"}</em>
      </div>

      <div className="d-pad" aria-label="Move controls">
        <button className="icon-button up" type="button" aria-label="Move up" title="Move up" onClick={() => onMove("up")}>
          <ArrowUp size={18} aria-hidden="true" />
        </button>
        <button className="icon-button left" type="button" aria-label="Move left" title="Move left" onClick={() => onMove("left")}>
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <button className="icon-button right" type="button" aria-label="Move right" title="Move right" onClick={() => onMove("right")}>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
        <button className="icon-button down" type="button" aria-label="Move down" title="Move down" onClick={() => onMove("down")}>
          <ArrowDown size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="command-row">
        <button type="button" onClick={onToggleHelp}>
          <HelpCircle size={16} aria-hidden="true" />
          Field Notes
        </button>
        <button type="button" onClick={onOpenLevels}>
          <Box size={16} aria-hidden="true" />
          Level Map
        </button>
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
        <button type="button" onClick={onToggleDebug} aria-pressed={showDebug}>
          <Bug size={16} aria-hidden="true" />
          Debug
        </button>
        <button type="button" onClick={onOpenAbout}>
          <HelpCircle size={16} aria-hidden="true" />
          About
        </button>
      </div>
    </section>
  );
}
