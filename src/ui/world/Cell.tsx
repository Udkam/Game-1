import type { ReactNode } from "react";

interface CellProps {
  x: number;
  y: number;
  hasGoal: boolean;
  children: ReactNode;
}

export default function Cell({ x, y, hasGoal, children }: CellProps) {
  return (
    <div className={hasGoal ? "cell has-goal" : "cell"} role="gridcell" aria-label={`Cell ${x}, ${y}`}>
      {hasGoal ? <span className="goal-ring" aria-hidden="true" /> : null}
      {children}
    </div>
  );
}
