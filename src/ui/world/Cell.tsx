import type { ReactNode } from "react";

interface CellProps {
  x: number;
  y: number;
  goalTarget?: string;
  terrain: "floor" | "wall" | "dock" | "entry" | "exit";
  children: ReactNode;
}

export default function Cell({ x, y, goalTarget, terrain, children }: CellProps) {
  return (
    <div className={`cell cell-${terrain}`} role="gridcell" aria-label={`Cell ${x}, ${y}`}>
      {terrain === "dock" ? <span className={`goal-dock goal-${goalTarget ?? "any"}`} aria-hidden="true" /> : null}
      {terrain === "entry" ? <span className="entry-glyph" aria-hidden="true" /> : null}
      {terrain === "exit" ? <span className="exit-glyph" aria-hidden="true" /> : null}
      {children}
    </div>
  );
}
