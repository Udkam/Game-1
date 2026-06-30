import type { TutorialLevel } from "../../levels/tutorial";

interface LevelSelectProps {
  levels: TutorialLevel[];
  currentIndex: number;
  onSelectLevel: (index: number) => void;
}

export default function LevelSelect({ levels, currentIndex, onSelectLevel }: LevelSelectProps) {
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
            {level.title}
          </button>
        ))}
      </div>
    </section>
  );
}
