export default function HelpPage() {
  return (
    <section className="page-panel text-page" aria-label="Help">
      <div className="page-heading">
        <p className="eyebrow">Help</p>
        <h2>Play Notes</h2>
      </div>
      <div className="text-columns">
        <section>
          <h3>Rules</h3>
          <p>Move the player through compact grid worlds. Cargo blocks can be pushed, open crates can be entered, and cargo can cross between parent and inner worlds.</p>
        </section>
        <section>
          <h3>Legend</h3>
          <p>Yellow disc: player. Green block: cargo. Teal crate with preview: open crate. Dashed amber ring: receiver target.</p>
        </section>
        <section>
          <h3>Shortcuts</h3>
          <p>WASD and arrow keys move. Undo rewinds one accepted move. Reset restarts the current level.</p>
        </section>
        <section>
          <h3>Originality</h3>
          <p>This demo uses original names, layouts, UI, and rendering. It references recursive-space puzzle mechanics without copying protected game content.</p>
        </section>
      </div>
    </section>
  );
}
