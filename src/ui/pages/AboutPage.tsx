interface AboutPageProps {
  onBack: () => void;
}

export default function AboutPage({ onBack }: AboutPageProps) {
  return (
    <section className="page-panel text-page" aria-label="About project">
      <div className="page-heading">
        <div>
          <p className="eyebrow">About</p>
          <h2>Recursive Box Lab</h2>
        </div>
        <button type="button" onClick={onBack}>Back to stage</button>
      </div>
      <div className="text-columns">
        <section>
          <h3>What it is</h3>
          <p>A recursive Sokoban-inspired web puzzle about crates that contain playable worlds.</p>
        </section>
        <section>
          <h3>Original content</h3>
          <p>Levels, sprites, UI, copy, and styling are original to this demo.</p>
        </section>
        <section>
          <h3>Affiliation</h3>
          <p>Not affiliated with Patrick's Parabox. It references a broad recursive puzzle idea without copying protected content.</p>
        </section>
        <section>
          <h3>Testing</h3>
          <p>Vitest covers movement, recursion guards, progress helpers, validation, and scripted solution paths.</p>
        </section>
      </div>
    </section>
  );
}
