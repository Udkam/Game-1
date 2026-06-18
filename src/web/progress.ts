// Local progress (always works offline) plus best-effort server sync. The server
// is authoritative for the public leaderboard, but the game never blocks on it.

export interface Progress {
  completed: Record<string, boolean>;
  best: Record<string, number>; // best move count per level id
}

const KEY = 'driftbox.progress.v1';
const NAME_KEY = 'driftbox.name';

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { completed: {}, best: {}, ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt storage */
  }
  return { completed: {}, best: {} };
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage may be unavailable (private mode) — fine */
  }
}

/** Record a clear. Returns true if this is a new personal best (or first clear). */
export function recordClear(p: Progress, id: string, moves: number): boolean {
  const first = !p.completed[id];
  p.completed[id] = true;
  const prev = p.best[id];
  const improved = prev === undefined || moves < prev;
  if (improved) p.best[id] = moves;
  saveProgress(p);
  return first || improved;
}

export function isUnlocked(order: string[], id: string, p: Progress): boolean {
  const i = order.indexOf(id);
  if (i <= 0) return true;
  return !!p.completed[order[i - 1]!];
}

export function getName(): string {
  return localStorage.getItem(NAME_KEY) || '旅人';
}
export function setName(name: string): void {
  localStorage.setItem(NAME_KEY, name.slice(0, 24));
}

// ---- server sync (all best-effort; swallow errors so offline play is seamless) ----

export interface ScoreRow {
  name: string;
  moves: number;
  pushes: number;
}

export async function submitScore(
  levelId: string,
  moves: number,
  pushes: number,
  solution: string[],
): Promise<void> {
  try {
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ levelId, name: getName(), moves, pushes, solution }),
    });
  } catch {
    /* offline / no backend — local progress already saved */
  }
}

export async function fetchLeaderboard(levelId: string): Promise<ScoreRow[]> {
  try {
    const res = await fetch(`/api/scores/${encodeURIComponent(levelId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.scores) ? data.scores : [];
  } catch {
    return [];
  }
}
