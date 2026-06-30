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
            <strong>Move</strong>
            <span>WASD / arrow keys</span>
          </div>
          <div>
            <strong>Player</strong>
            <span>Yellow disc</span>
          </div>
          <div>
            <strong>Cargo</strong>
            <span>Green block</span>
          </div>
          <div>
            <strong>Open crate</strong>
            <span>Interior preview</span>
          </div>
          <div>
            <strong>Receiver</strong>
            <span>Dashed ring</span>
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
