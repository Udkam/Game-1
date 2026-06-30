import type { TutorialLevel } from "../../levels/tutorial";
import type { ProgressState } from "../../progress/storage";

interface LevelLibraryProps {
  levels: TutorialLevel[];
  currentIndex: number;
  progress: ProgressState;
  onSelectLevel: (index: number) => void;
}

export default function LevelLibrary({
  levels,
  currentIndex,
  progress,
  onSelectLevel,
}: LevelLibraryProps) {
  return (
    <section className="page-panel level-library" aria-label="Level library">
      <div className="page-heading">
        <p className="eyebrow">Level Library</p>
        <h2>Fifteen Original Folds</h2>
      </div>
      <div className="level-library-grid">
        {levels.map((level, index) => {
          const completed = progress.completedLevelIds.includes(level.id);
          const best = progress.bestMoves[level.id];
          return (
            <button
              key={level.id}
              type="button"
              className={index === currentIndex ? "active" : undefined}
              onClick={() => onSelectLevel(index)}
            >
              <span className="library-number">{index + 1}</span>
              <strong>{level.title}</strong>
              <small>{level.lesson}</small>
              <em>{completed ? `Complete${best ? ` / best ${best}` : ""}` : "Unsolved"}</em>
            </button>
          );
        })}
      </div>
    </section>
  );
}
