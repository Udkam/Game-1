import { Container } from "pixi.js";
import { describe, expect, it } from "vitest";
import { RecursiveTransitionRenderer, interpolateTransferBounds, sampleTransferCamera, transitionProgressForDirection, visibilityPreservingProgress } from "./RecursiveTransitionRenderer";
import { Camera2D } from "./Camera2D";

describe("RecursiveTransitionRenderer progress sampling", () => {
  it("maps controller progress to enter/exit camera aperture continuity without a clock", () => {
    expect(transitionProgressForDirection("enter", 0)).toBe(0);
    expect(transitionProgressForDirection("enter", 0.5)).toBe(0.5);
    expect(transitionProgressForDirection("enter", 1)).toBe(1);
    expect(transitionProgressForDirection("exit", 0)).toBe(1);
    expect(transitionProgressForDirection("exit", 0.5)).toBe(0.5);
    expect(transitionProgressForDirection("exit", 1)).toBe(0);
  });

  it("uses the same visibility-preserving midpoint for enter and exit without rewriting semantic endpoints", () => {
    expect(visibilityPreservingProgress(0)).toBe(0);
    expect(visibilityPreservingProgress(0.5)).toBe(0.125);
    expect(visibilityPreservingProgress(1)).toBe(1);
    expect(visibilityPreservingProgress(transitionProgressForDirection("enter", 0.5))).toBe(
      visibilityPreservingProgress(transitionProgressForDirection("exit", 0.5)),
    );
  });

  it("samples an addressed transfer bridge at controller p=0, 0.5, and 1 without a second clock", () => {
    const from = { x: 20, y: 40, width: 30, height: 30 };
    const to = { x: 140, y: 90, width: 12, height: 12 };
    expect(interpolateTransferBounds(from, to, 0)).toEqual(from);
    expect(interpolateTransferBounds(from, to, 0.5)).toEqual({ x: 80, y: 65, width: 21, height: 21 });
    expect(interpolateTransferBounds(from, to, 1)).toEqual(to);
  });

  it("uses direction-free union geometry with continuous reversal-invariant near-endpoint samples", () => {
    const camera = new Camera2D();
    const endpoint = { x: 12, y: 18, scale: 1.05 };
    const geometry = {
      viewport: { width: 1440, height: 900 },
      endpoint,
      sourceRootBounds: { x: 100, y: 130, width: 48, height: 48 },
      destinationRootBounds: { x: 420, y: 250, width: 22, height: 22 },
      apertureRootBounds: { x: 270, y: 190, width: 70, height: 70 },
      activeWorldRootBounds: { x: 220, y: 150, width: 180, height: 130 },
      parentWorldRootBounds: { x: 40, y: 40, width: 520, height: 360 },
    } as const;
    const reversed = { ...geometry, sourceRootBounds: geometry.destinationRootBounds, destinationRootBounds: geometry.sourceRootBounds };
    expect(sampleTransferCamera(camera, geometry, 0)).toEqual(endpoint);
    expect(sampleTransferCamera(camera, geometry, 1)).toEqual(endpoint);
    for (const progress of [0.001, 0.5, 0.999]) {
      expect(sampleTransferCamera(camera, geometry, progress)).toEqual(sampleTransferCamera(camera, reversed, progress));
    }
    expect(sampleTransferCamera(camera, geometry, 0.001)).not.toEqual(endpoint);
    expect(sampleTransferCamera(camera, geometry, 0.999)).not.toEqual(endpoint);
  });

  it("batches every addressed alias carrier while preserving one aggregate transfer impact", () => {
    const renderer = new RecursiveTransitionRenderer(new Camera2D(), new Container(), new Container());
    const eventAperture = transferGeometry("left|receiver");
    const mirroredAlias = transferGeometry("right|receiver", "left|receiver");
    renderer.beginTransferFrame();
    renderer.appendTransferProgress(0.5, mirroredAlias, false);
    renderer.appendTransferProgress(0.5, eventAperture, true);
    expect(renderer.renderedTransferCarrierCount).toBe(2);
    expect(renderer.renderedTransferImpactCount).toBe(1);
    expect(renderer.renderedTransferImpactApertureContainer).toEqual(eventAperture.aperture.container);
    renderer.beginTransferFrame();
    expect(renderer.renderedTransferCarrierCount).toBe(0);
    expect(renderer.renderedTransferImpactCount).toBe(0);
  });
});

function transferGeometry(receiverId: string, eventReceiverId = receiverId) {
  return {
    transfer: {
      mode: "push-in" as const,
      direction: "forward" as const,
      entityBefore: { world: { rootWorldId: "root|id", containerPath: [] }, entityId: "payload|id" },
      entityAfter: { world: { rootWorldId: "root|id", containerPath: [receiverId] }, entityId: "payload|id" },
      from: { world: { rootWorldId: "root|id", containerPath: [] }, x: 1, y: 1 },
      to: { world: { rootWorldId: "root|id", containerPath: [receiverId] }, x: 0, y: 0 },
      via: { container: { world: { rootWorldId: "root|id", containerPath: [] }, entityId: eventReceiverId }, portId: "p|1" },
      carriedSubtree: { innerWorldId: "carried|world", beforeRoot: { rootWorldId: "root|id", containerPath: ["payload|id"] }, afterRoot: { rootWorldId: "root|id", containerPath: [receiverId, "payload|id"] } },
      durationMs: 360,
    },
    source: { occurrence: { world: { rootWorldId: "root|id", containerPath: [] }, entityId: "payload|id" }, rootBounds: { x: 20, y: 30, width: 28, height: 28 } },
    destination: { occurrence: { world: { rootWorldId: "root|id", containerPath: [receiverId] }, entityId: "payload|id" }, rootBounds: { x: 110, y: 92, width: 16, height: 16 } },
    aperture: {
      eventPort: { container: { world: { rootWorldId: "root|id", containerPath: [] }, entityId: eventReceiverId }, portId: "p|1" },
      container: { world: { rootWorldId: "root|id", containerPath: [] }, entityId: receiverId },
      rootBounds: { x: 74, y: 64, width: 42, height: 42 },
    },
    carriedWorld: { beforeRoot: { rootWorldId: "root|id", containerPath: ["payload|id"] }, afterRoot: { rootWorldId: "root|id", containerPath: [receiverId, "payload|id"] }, fromRootBounds: { x: 20, y: 30, width: 28, height: 28 }, toRootBounds: { x: 110, y: 92, width: 16, height: 16 } },
  };
}
