import { useEffect, useRef } from "react";
import { createSimulationSession } from "../core/history";
import { createStage3BSimulationState } from "../core/worldGraph";
import { GameRuntime } from "../runtime/GameRuntime";
import { parseR2QaQuery, type R2QaScenario } from "../runtime/r2QaScenario";
import { parseV1QaQuery, type V1QaScenario } from "../runtime/v1QaScenario";

declare global {
  interface Window {
    __V1_QA__?: unknown;
    __R2_QA__?: unknown;
  }
}

let runtimeInstanceSequence = 0;

export function GameCanvasHost() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const hasR2Intent = new URLSearchParams(window.location.search).getAll("qa").includes("r2");
    const query = hasR2Intent
      ? parseR2QaQuery(window.location.search, import.meta.env.DEV)
      : parseV1QaQuery(window.location.search, import.meta.env.DEV);
    const instanceToken = ++runtimeInstanceSequence;
    if (query.kind === "invalid-query") {
      if (import.meta.env.DEV) {
        const readiness = { instanceToken, status: "invalid-query", reason: query.reason, runtimeConstructed: false, canvasCount: 0 };
        if (hasR2Intent) window.__R2_QA__ = readiness;
        else window.__V1_QA__ = readiness;
      }
      // Invalid QA intent must never silently start normal composition.
      return () => {
        if (instanceToken === runtimeInstanceSequence) runtimeInstanceSequence += 1;
      };
    }

    const scenario = query.kind === "scenario" ? query : null;
    // Normal composition may temporarily use the existing canonical study
    // state. The runtime itself receives only the injected session.
    const runtime = new GameRuntime(host, {
      session: scenario?.session ?? createSimulationSession(createStage3BSimulationState()),
      manualProgress: scenario !== null,
    });

    void runtime.start().then(() => {
      if (instanceToken !== runtimeInstanceSequence) return;
      if (scenario) {
        if ("commands" in scenario) publishR2QaReadiness(runtime, scenario, instanceToken);
        else publishV1QaReadiness(runtime, scenario, instanceToken);
      }
    });

    return () => {
      runtime.destroy();
      if (instanceToken === runtimeInstanceSequence) runtimeInstanceSequence += 1;
    };
  }, []);

  return (
    <main className="app-shell" aria-label="Recursive box study">
      <div ref={hostRef} className="pixi-stage-host" data-testid="pixi-stage-host" />
    </main>
  );
}

function publishV1QaReadiness(runtime: GameRuntime, scenario: V1QaScenario, instanceToken: number) {
  runtime.submit(scenario.command);
  runtime.setManualProgress(scenario.progress);
  if (instanceToken !== runtimeInstanceSequence) return;

  const snapshot = runtime.getQaSnapshot();
  const result = snapshot.result;
  window.__V1_QA__ = {
    instanceToken,
    status: "ready",
    tickerRunning: snapshot.pixi?.tickerRunning ?? null,
    progress: snapshot.progress,
    renderRevision: snapshot.pixi?.renderRevision ?? null,
    explicitRenderRevision: snapshot.pixi?.explicitRenderRevision ?? null,
    query: { qa: "v1", case: scenario.case, progress: scenario.progress },
    command: result?.result.command ?? null,
    result: result?.result ?? null,
    transaction: result?.result.kind === "accepted" ? result.result.transaction : null,
    hashes: result ? { previous: result.previousHash, next: result.nextHash } : null,
    visibleOccurrences: snapshot.pixi?.visibleOccurrences ?? [],
    worldFrames: snapshot.pixi?.worldFrames ?? [],
    apertures: snapshot.pixi?.apertures ?? [],
    transfers: snapshot.pixi?.transfers ?? [],
    camera: snapshot.pixi?.camera ?? null,
    activeAddress: snapshot.pixi?.activeAddress ?? null,
    portal: snapshot.pixi?.portal ?? null,
    canvas: snapshot.pixi?.canvas ?? null,
  };

  // Stability checks are reporting-only. The explicit controller sample above
  // is the capture frame; rAFs never select or advance it.
  const firstRevision = snapshot.pixi?.renderRevision;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (instanceToken !== runtimeInstanceSequence || !window.__V1_QA__ || typeof window.__V1_QA__ !== "object") return;
    const current = runtime.getQaSnapshot();
    Object.assign(window.__V1_QA__ as object, {
      stability: {
        checked: true,
        renderRevisionStable: current.pixi?.renderRevision === firstRevision,
        progressStable: current.progress === scenario.progress,
      },
    });
  }));
}

function publishR2QaReadiness(runtime: GameRuntime, scenario: R2QaScenario, instanceToken: number) {
  for (const [index, command] of scenario.commands.entries()) {
    runtime.submit(command);
    runtime.setManualProgress(index === scenario.commands.length - 1 ? scenario.progress : 1);
  }
  if (instanceToken !== runtimeInstanceSequence) return;
  const snapshot = runtime.getQaSnapshot();
  const result = snapshot.result;
  window.__R2_QA__ = {
    instanceToken,
    status: "ready",
    tickerRunning: snapshot.pixi?.tickerRunning ?? null,
    progress: snapshot.progress,
    renderRevision: snapshot.pixi?.renderRevision ?? null,
    explicitRenderRevision: snapshot.pixi?.explicitRenderRevision ?? null,
    query: { qa: "r2", case: scenario.case, progress: scenario.progress },
    commands: scenario.commands,
    command: result?.result.command ?? null,
    result: result?.result ?? null,
    transaction: result?.result.kind === "accepted" ? result.result.transaction : null,
    hashes: result ? { previous: result.previousHash, next: result.nextHash } : null,
    visibleOccurrences: snapshot.pixi?.visibleOccurrences ?? [],
    worldFrames: snapshot.pixi?.worldFrames ?? [],
    apertures: snapshot.pixi?.apertures ?? [],
    transfers: snapshot.pixi?.transfers ?? [],
    transferCarrierCount: snapshot.pixi?.transferCarrierCount ?? 0,
    transferImpactCount: snapshot.pixi?.transferImpactCount ?? 0,
    transferEventPortReady: snapshot.pixi?.transferEventPortReady ?? false,
    camera: snapshot.pixi?.camera ?? null,
    activeAddress: snapshot.pixi?.activeAddress ?? null,
    portal: snapshot.pixi?.portal ?? null,
    canvas: snapshot.pixi?.canvas ?? null,
  };
}
