import type { TutorialLevel } from "../../levels/tutorial";
import type { ProgressState } from "../../progress/storage";

interface LevelLibraryProps {
  levels: TutorialLevel[];
  currentIndex: number;
  progress: ProgressState;
  onSelectLevel: (index: number) => void;
  onBack: () => void;
}

export default function LevelLibrary({
  levels,
  currentIndex,
  progress,
  onSelectLevel,
  onBack,
}: LevelLibraryProps) {
  return (
    <section className="page-panel level-library" aria-label="Level library">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Lab Notebook</p>
          <h2>Experiment Grid</h2>
        </div>
        <button type="button" onClick={onBack}>Back to stage</button>
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
              <small>{level.subtitle ?? level.lesson}</small>
              <span className="library-tags">
                {(level.mechanicTags ?? []).map((tag) => <i key={tag}>{tag}</i>)}
              </span>
              <em>{completed ? `Complete${best ? ` / best ${best}` : ""}` : index === currentIndex ? "Current" : "Unlocked"}</em>
            </button>
          );
        })}
      </div>
    </section>
  );
}
