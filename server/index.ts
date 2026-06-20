// Fastify server: serves the built frontend and exposes a small API. Crucially,
// submitted solutions are *replayed through the shared engine* on the server, so
// a score only lands if the move sequence genuinely solves the level — the client
// can't fabricate clears. The move/push counts are taken from the authoritative
// replay, not from whatever the client claimed.

import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import type { Dir } from '../src/engine/types.js';
import { getLevel, LEVELS } from '../src/engine/levels.js';
import { replay, replayDiptych } from '../src/engine/solver.js';
import { Store } from './db.js';

const here = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = process.env.STATIC_DIR ?? join(here, '..', 'dist');
const DB_FILE = process.env.DB_FILE ?? join(here, '..', 'data', 'driftbox.sqlite');
const PORT = Number(process.env.PORT ?? 8787);
// Use a namespaced var: a bare `HOST` is commonly exported by shells (the
// machine hostname), which would otherwise hijack the bind address.
const HOST = process.env.BIND_HOST ?? '0.0.0.0';

const VALID_DIRS = new Set<Dir>(['up', 'down', 'left', 'right']);
// A move token is a direction, optionally `@`-prefixed for a pull/grab.
const isToken = (d: unknown): boolean =>
  typeof d === 'string' && VALID_DIRS.has((d.startsWith('@') ? d.slice(1) : d) as Dir);

export async function buildServer(store: Store) {
  const app = Fastify({ logger: false });

  app.get('/api/health', async () => ({ ok: true, levels: LEVELS.length }));

  // Level catalog (server-authoritative metadata; maps are bundled client-side).
  app.get('/api/levels', async () => ({
    levels: LEVELS.map((l) => ({
      id: l.id,
      name: l.name,
      subtitle: l.subtitle,
      par: l.par ?? null,
      best: store.bestMoves(l.id),
    })),
  }));

  app.get('/api/scores/:levelId', async (req) => {
    const { levelId } = req.params as { levelId: string };
    if (!getLevel(levelId)) return { scores: [] };
    return { scores: store.topScores(levelId, 10) };
  });

  app.post('/api/scores', async (req, reply) => {
    const body = (req.body ?? {}) as {
      levelId?: unknown;
      name?: unknown;
      solution?: unknown;
    };
    const levelId = typeof body.levelId === 'string' ? body.levelId : '';
    const level = getLevel(levelId);
    if (!level) return reply.code(400).send({ ok: false, error: 'unknown level' });

    if (
      !Array.isArray(body.solution) ||
      body.solution.length > 100_000 ||
      !body.solution.every(isToken)
    ) {
      return reply.code(400).send({ ok: false, error: 'invalid solution' });
    }

    // Authoritative replay — the only source of truth for a clear. Diptych
    // levels must solve both boards.
    const sol = body.solution as string[];
    let solved: boolean;
    let moves: number;
    let pushes: number;
    if (level.twin) {
      const r = replayDiptych(level, sol);
      solved = r.solved;
      moves = sol.length;
      pushes = r.a.pushes + r.b.pushes;
    } else {
      const r = replay(level, sol);
      solved = r.solved;
      moves = r.state.moves;
      pushes = r.state.pushes;
    }
    if (!solved) {
      return reply.code(400).send({ ok: false, error: 'solution does not solve the level' });
    }

    const name = sanitizeName(body.name);
    store.addScore(levelId, name, moves, pushes);

    const best = store.bestMoves(levelId);
    return { ok: true, moves, pushes, best, scores: store.topScores(levelId, 10) };
  });

  // Static frontend + SPA fallback.
  await app.register(fastifyStatic, { root: DIST_DIR, wildcard: false });
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api/')) return reply.code(404).send({ ok: false, error: 'not found' });
    return reply.sendFile('index.html');
  });

  return app;
}

function sanitizeName(raw: unknown): string {
  const s = (typeof raw === 'string' ? raw : '旅人').trim().replace(/\s+/g, ' ');
  return (s || '旅人').slice(0, 24);
}

// Start unless imported by a test (cross-platform main-module check).
const isMain = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const store = new Store(DB_FILE);
  const app = await buildServer(store);
  app
    .listen({ port: PORT, host: HOST })
    .then((addr) => console.log(`Driftbox server listening on ${addr} (static: ${DIST_DIR})`))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
  const shutdown = () => {
    app.close().then(() => {
      store.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
