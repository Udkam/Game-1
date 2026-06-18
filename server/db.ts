// Persistence via Node 24's built-in SQLite (no native build step). A thin store
// for the leaderboard; the schema is intentionally tiny.

import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export interface ScoreRow {
  name: string;
  moves: number;
  pushes: number;
}

export class Store {
  private db: DatabaseSync;

  constructor(file: string) {
    mkdirSync(dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scores (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        level_id   TEXT    NOT NULL,
        name       TEXT    NOT NULL,
        moves      INTEGER NOT NULL,
        pushes     INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_scores_level ON scores (level_id, moves, pushes);
    `);
  }

  addScore(levelId: string, name: string, moves: number, pushes: number): void {
    this.db
      .prepare('INSERT INTO scores (level_id, name, moves, pushes, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(levelId, name, moves, pushes, Date.now());
  }

  topScores(levelId: string, limit = 10): ScoreRow[] {
    return this.db
      .prepare(
        `SELECT name, moves, pushes FROM scores
         WHERE level_id = ?
         ORDER BY moves ASC, pushes ASC, created_at ASC
         LIMIT ?`,
      )
      .all(levelId, limit) as unknown as ScoreRow[];
  }

  bestMoves(levelId: string): number | null {
    const row = this.db
      .prepare('SELECT MIN(moves) AS best FROM scores WHERE level_id = ?')
      .get(levelId) as { best: number | null } | undefined;
    return row?.best ?? null;
  }

  close(): void {
    this.db.close();
  }
}
