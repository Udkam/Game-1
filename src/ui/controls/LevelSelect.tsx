import type { TutorialLevel } from "../../levels/tutorial";
import type { ProgressState } from "../../progress/storage";

interface LevelSelectProps {
  levels: TutorialLevel[];
  currentIndex: number;
  progress: ProgressState;
  onSelectLevel: (index: number) => void;
}

export default function LevelSelect({ levels, currentIndex, progress, onSelectLevel }: LevelSelectProps) {
  return (
    <section className="level-select" aria-label="Tutorial levels">
      <h2>Levels</h2>
      <div>
        {levels.map((level, index) => (
          <button
            key={level.id}
            type="button"
            className={index === currentIndex ? "active" : undefined}
            onClick={() => onSelectLevel(index)}
          >
            <span>{index + 1}</span>
            <strong>{level.title}</strong>
            {progress.completedLevelIds.includes(level.id) ? <em>done</em> : null}
          </button>
        ))}
      </div>
    </section>
  );
}
