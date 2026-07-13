import { useEffect, useMemo, useRef, useState } from 'react';
import { getCurrentSection, isTurnWindow, type FailureReason } from './game/core';
import type { RunnerAction } from './game/input/InputController';
import { GameRuntime, type RuntimeOptions, type RuntimeSnapshot } from './game/runtime/GameRuntime';

const RECORD_KEY = 'tide-relay.best-distance';
const SCORE_KEY = 'tide-relay.best-score';
const AUDIO_KEY = 'tide-relay.audio';
const CONTRAST_KEY = 'tide-relay.high-contrast';

function readBoolean(key: string, fallback: boolean): boolean {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value === 'true';
  } catch {
    return fallback;
  }
}

function readBest(): number {
  try {
    const value = Number(window.localStorage.getItem(RECORD_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function readBestScore(): number {
  try {
    const value = Number(window.localStorage.getItem(SCORE_KEY));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

function describeFailure(reason: FailureReason | null): string {
  if (!reason) return 'The meridian signal was lost.';
  if (reason.kind === 'wrong-turn') return `Wrong turn — relay expected ${reason.expected}.`;
  if (reason.kind === 'missed-turn') return `Missed ${reason.expected} turn window.`;
  if (reason.kind === 'gap-fall') return 'The causeway collapsed beneath the relay.';
  return `Impact detected: ${reason.hazard}.`;
}

function formatDistance(value: number): string {
  return Math.floor(value).toString().padStart(5, '0');
}

export default function App() {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(() => readBoolean(AUDIO_KEY, true));
  const [highContrast, setHighContrast] = useState(() => readBoolean(CONTRAST_KEY, false));
  const [reducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const [bestDistance, setBestDistance] = useState(readBest);
  const [bestScore, setBestScore] = useState(readBestScore);

  const options = useMemo<RuntimeOptions>(() => ({
    seed: 0x54494445,
    audioEnabled,
    highContrast,
    reducedMotion,
  }), [audioEnabled, highContrast, reducedMotion]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const runtime = new GameRuntime(options);
    runtimeRef.current = runtime;
    const unsubscribe = runtime.subscribe(setSnapshot);
    let disposed = false;
    void runtime.init(host).catch((error: unknown) => {
      if (!disposed) console.error('TIDE//RELAY failed to initialize', error);
    });
    return () => {
      disposed = true;
      unsubscribe();
      runtime.destroy();
      if (runtimeRef.current === runtime) runtimeRef.current = null;
    };
    // Runtime lifecycle is intentionally mount-bound. Options update through setOptions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    runtimeRef.current?.setOptions(options);
    try {
      window.localStorage.setItem(AUDIO_KEY, String(audioEnabled));
      window.localStorage.setItem(CONTRAST_KEY, String(highContrast));
    } catch {
      // Storage is optional; gameplay remains available in privacy-restricted contexts.
    }
  }, [options, audioEnabled, highContrast]);

  const state = snapshot?.state;
  useEffect(() => {
    if (!state || state.status !== 'game-over') return;
    const nextDistance = Math.max(bestDistance, state.distance);
    const nextScore = Math.max(bestScore, state.score);
    if (nextDistance !== bestDistance) setBestDistance(nextDistance);
    if (nextScore !== bestScore) setBestScore(nextScore);
    try {
      window.localStorage.setItem(RECORD_KEY, String(nextDistance));
      window.localStorage.setItem(SCORE_KEY, String(nextScore));
    } catch {
      // Record persistence is optional.
    }
  }, [state, bestDistance, bestScore]);

  const focusCanvas = () => requestAnimationFrame(() => hostRef.current?.querySelector('canvas')?.focus());
  const start = () => {
    runtimeRef.current?.start();
    focusCanvas();
  };
  const resume = () => {
    runtimeRef.current?.resume();
    focusCanvas();
  };
  const restart = () => {
    runtimeRef.current?.restart();
    focusCanvas();
  };
  const action = (value: RunnerAction) => {
    runtimeRef.current?.action(value);
    focusCanvas();
  };
  const toggleAudio = () => {
    const next = !audioEnabled;
    runtimeRef.current?.setOptions({ audioEnabled: next });
    if (next) runtimeRef.current?.primeAudio();
    setAudioEnabled(next);
  };

  const status = state?.status ?? 'ready';
  const section = state ? getCurrentSection(state) : null;
  const turnWindowActive = Boolean(state && isTurnWindow(state));
  const showTurnCue = Boolean(
    state &&
    section &&
    state.status === 'running' &&
    state.sectionDistance >= section.turnWarningStart,
  );
  const liveMessage = status === 'game-over'
    ? describeFailure(state?.failureReason ?? null)
    : status === 'paused'
      ? 'Relay paused.'
      : turnWindowActive && section
        ? `${section.requiredTurn} turn now.`
        : '';

  return (
    <main className={`app${highContrast ? ' is-high-contrast' : ''}${status === 'running' ? ' is-running' : ''}${status === 'paused' ? ' is-paused' : ''}${status === 'game-over' ? ' is-game-over' : ''}`} id="game">
      <a className="skip-link" href="#primary-action">Skip to game controls</a>
      <div ref={hostRef} className="world-host" data-testid="world-host" />

      <header className="brandbar" aria-label="TIDE RELAY">
        <span className="brand-glyph" aria-hidden="true" />
        <span className="brand-copy"><strong>TIDE//RELAY</strong><span>RUN THE LAST MERIDIAN</span></span>
      </header>

      <section className="hud" aria-label="Run status">
        <div className="metric"><span>DISTANCE</span><strong>{formatDistance(state?.distance ?? 0)} M</strong></div>
        <div className="metric metric--center"><span>FLOW</span><strong>×{(state?.multiplier ?? 1).toFixed(1)}</strong></div>
        <div className="metric metric--end"><span>SCORE {String(state?.score ?? 0).padStart(6, '0')}</span><strong>{String(state?.shards ?? 0).padStart(3, '0')} SIG</strong></div>
      </section>

      <button
        className="pause-control"
        type="button"
        aria-label={status === 'paused' ? 'Resume' : 'Pause'}
        disabled={status === 'ready' || status === 'game-over'}
        onClick={() => status === 'paused' ? resume() : runtimeRef.current?.pause()}
      >{status === 'paused' ? '▶' : 'Ⅱ'}</button>

      {showTurnCue && section ? (
        <div className={`turn-cue${turnWindowActive ? '' : ' turn-cue--warning'}`} data-testid="turn-cue">
          <strong aria-hidden="true">{section.requiredTurn === 'left' ? '←' : '→'}</strong>
          <span>{turnWindowActive ? 'TURN' : 'PREPARE'} {section.requiredTurn.toUpperCase()}</span>
        </div>
      ) : null}

      {(state?.runner.shieldCharges ?? 0) > 0 ? <div className="shield-rail" aria-label="Aegis charge ready"><i /></div> : null}

      {status !== 'running' ? (
        <section className="overlay" aria-modal="true" role="dialog" aria-labelledby="overlay-title">
          <div className="overlay-card">
            {status === 'ready' ? (
              <>
                <p className="overlay-eyebrow">OBSERVATORY LINK // 01</p>
                <h1 id="overlay-title">TIDE<em>//</em><br />RELAY</h1>
                <p className="overlay-copy">Carry the last star-map beyond the black tide. Shift lanes, vault broken meridians, slide beneath the instruments, and commit each turn before the causeway ends.</p>
                <div className="record-grid">
                  <article><span>BEST</span><strong>{formatDistance(bestDistance)} M</strong></article>
                  <article><span>TOP SCORE</span><strong>{String(bestScore).padStart(6, '0')}</strong></article>
                  <article><span>CONTROL</span><strong>ARROWS / WASD</strong></article>
                </div>
                <div className="overlay-actions"><button id="primary-action" className="primary-action" type="button" onClick={start}>Begin relay</button></div>
              </>
            ) : status === 'paused' ? (
              <>
                <p className="overlay-eyebrow">LINK SUSPENDED</p>
                <h2 id="overlay-title">HOLD<br />THE LINE</h2>
                <p className="overlay-copy">The tide is frozen. Resume when your path is clear.</p>
                <div className="overlay-actions">
                  <button id="primary-action" className="primary-action" type="button" onClick={resume}>Resume</button>
                  <button className="secondary-action" type="button" onClick={restart}>Restart run</button>
                </div>
              </>
            ) : (
              <>
                <p className="overlay-eyebrow">TRANSMISSION ENDED</p>
                <h2 id="overlay-title">SIGNAL<br />LOST</h2>
                <p className="failure-reason">{describeFailure(state?.failureReason ?? null)}</p>
                <div className="record-grid record-grid--four">
                  <article><span>DISTANCE</span><strong>{formatDistance(state?.distance ?? 0)} M</strong></article>
                  <article><span>BEST</span><strong>{formatDistance(Math.max(bestDistance, state?.distance ?? 0))} M</strong></article>
                  <article><span>SCORE</span><strong>{String(state?.score ?? 0).padStart(6, '0')}</strong></article>
                  <article><span>SIGNAL</span><strong>{String(state?.shards ?? 0).padStart(3, '0')}</strong></article>
                </div>
                <div className="overlay-actions"><button id="primary-action" className="primary-action" type="button" onClick={restart}>Run again</button></div>
              </>
            )}
          </div>
        </section>
      ) : null}

      <nav className="touch-controls" aria-label="Runner controls">
        <button className="touch-action" type="button" aria-label="Move or turn left" onClick={() => action('left')}>←</button>
        <button className="touch-action" type="button" aria-label="Jump" onClick={() => action('jump')}>↑</button>
        <button className="touch-action" type="button" aria-label="Slide" onClick={() => action('slide')}>↓</button>
        <button className="touch-action" type="button" aria-label="Move or turn right" onClick={() => action('right')}>→</button>
      </nav>
      {status === 'running' && (state?.distance ?? 0) < 20 ? <p className="gesture-hint">SWIPE TO SHIFT · JUMP · SLIDE</p> : null}

      <div className="settings" aria-label="Presentation settings">
        <button className="setting-button" type="button" aria-pressed={audioEnabled} onClick={toggleAudio}>SOUND</button>
        <button className="setting-button" type="button" aria-pressed={highContrast} onClick={() => setHighContrast((value) => !value)}>CONTRAST</button>
      </div>
      <p className="sr-only" aria-live="polite">{liveMessage}</p>
    </main>
  );
}
