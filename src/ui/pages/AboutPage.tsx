export default function AboutPage() {
  return (
    <section className="page-panel text-page" aria-label="About project">
      <div className="page-heading">
        <p className="eyebrow">About</p>
        <h2>Recursive Box Lab</h2>
      </div>
      <div className="text-columns">
        <section>
          <h3>Project Motive</h3>
          <p>Build a small, inspectable browser demo around recursive puzzle spaces and finite nested-world state transitions.</p>
        </section>
        <section>
          <h3>Architecture</h3>
          <p>The game engine is pure TypeScript. React owns rendering, controls, debug panels, level selection, and progress persistence.</p>
        </section>
        <section>
          <h3>State Model</h3>
          <p>Entities carry world-local positions. Boxes may own inner worlds. Moving a box updates the parent metadata for its inner world.</p>
        </section>
        <section>
          <h3>Testing</h3>
          <p>Vitest covers movement, push rules, recursion guards, undo/reset, progress helpers, and a winning route for every tutorial level.</p>
        </section>
      </div>
    </section>
  );
}
