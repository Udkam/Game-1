import { X } from "lucide-react";

interface HelpOverlayProps {
  onClose: () => void;
}

export default function HelpOverlay({ onClose }: HelpOverlayProps) {
  return (
    <div className="help-backdrop" role="presentation">
      <section className="help-overlay" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <button className="close-button" type="button" aria-label="Close help" onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </button>
        <p className="eyebrow">Field Notes</p>
        <h2 id="help-title">Recursive Crate Instruments</h2>
        <div className="help-grid">
          <div>
            <span className="legend-sprite legend-probe" aria-hidden="true" />
            <strong>Probe</strong>
            <span>WASD / arrow keys</span>
          </div>
          <div>
            <span className="legend-sprite legend-crate" aria-hidden="true" />
            <strong>Cargo</strong>
            <span>Pushable crate</span>
          </div>
          <div>
            <span className="legend-sprite legend-window" aria-hidden="true" />
            <strong>Recursive Box</strong>
            <span>Enter its window</span>
          </div>
          <div>
            <span className="legend-sprite legend-dock" aria-hidden="true" />
            <strong>Dock</strong>
            <span>Power it with the target</span>
          </div>
          <div>
            <strong>Undo</strong>
            <span>Reverse one accepted move</span>
          </div>
          <div>
            <strong>Reset</strong>
            <span>Restores the current level</span>
          </div>
        </div>
      </section>
    </div>
  );
}
