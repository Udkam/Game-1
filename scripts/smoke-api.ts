// API self-test. Builds the server against an in-memory DB and exercises the
// routes with Fastify's inject() (no port needed). Confirms the server-side
// authoritative validation: real solver solutions are accepted, bogus ones are
// rejected, and the leaderboard reflects what was stored.
//
// Run with:  npm run smoke:api

import { LEVELS } from '../src/engine/levels.js';
import { solve } from '../src/engine/solver.js';
import { Store } from '../server/db.js';
import { buildServer } from '../server/index.js';

let failures = 0;
const check = (cond: boolean, label: string) => {
  console.log(`${cond ? '✓' : '✗'}  ${label}`);
  if (!cond) failures++;
};

const store = new Store(':memory:');
const app = await buildServer(store);

console.log('\nDriftbox API smoke test (fastify.inject)');
console.log('─'.repeat(60));

const health = await app.inject({ method: 'GET', url: '/api/health' });
check(health.statusCode === 200 && health.json().ok === true, 'GET /api/health ok');

const cat = await app.inject({ method: 'GET', url: '/api/levels' });
check(cat.json().levels?.length === LEVELS.length, `GET /api/levels returns ${LEVELS.length} levels`);

for (const level of LEVELS) {
  const sol = solve(level);
  const ok = await app.inject({
    method: 'POST',
    url: '/api/scores',
    payload: { levelId: level.id, name: 'self-test', solution: sol.solution },
  });
  const body = ok.json();
  check(
    ok.statusCode === 200 && body.ok === true && body.moves === sol.moves,
    `POST valid solution for ${level.id} accepted (moves=${body.moves})`,
  );
}

// Bogus solution rejected.
const bogus = await app.inject({
  method: 'POST',
  url: '/api/scores',
  payload: { levelId: 'l1', name: 'cheater', solution: ['up', 'up', 'up'] },
});
check(bogus.statusCode === 400 && bogus.json().ok === false, 'POST bogus solution rejected (400)');

// Unknown level rejected.
const unknown = await app.inject({
  method: 'POST',
  url: '/api/scores',
  payload: { levelId: 'nope', name: 'x', solution: ['up'] },
});
check(unknown.statusCode === 400, 'POST unknown level rejected (400)');

// Malformed solution rejected.
const malformed = await app.inject({
  method: 'POST',
  url: '/api/scores',
  payload: { levelId: 'l1', name: 'x', solution: ['sideways'] },
});
check(malformed.statusCode === 400, 'POST malformed solution rejected (400)');

// Leaderboard reflects stored scores.
const board = await app.inject({ method: 'GET', url: '/api/scores/l1' });
const scores = board.json().scores;
check(Array.isArray(scores) && scores.length >= 1 && scores[0].name === 'self-test', 'GET /api/scores/l1 lists the stored clear');

await app.close();
store.close();

console.log('─'.repeat(60));
if (failures > 0) {
  console.error(`\n${failures} API check(s) FAILED.\n`);
  process.exit(1);
} else {
  console.log('\nAll API checks passed.\n');
  process.exit(0);
}
