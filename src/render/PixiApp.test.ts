import { describe, expect, it } from "vitest";
import {
  deriveTransferBridges,
  isExactTransferEventAperture,
  projectionEntityMap,
  rebaseWorldAddress,
  retainSettledTransferDiagnostics,
  rootOriginForLocalBounds,
  selectAddressedPortalTarget,
  selectAddressedWorld,
  transferProjectionOpacity,
  translateRectToRoot,
} from "./PixiApp";
import type { WorldProjection } from "../projection/types";
import type { TransferTransition } from "../animation/transitions";

describe("PixiApp occurrence lookup", () => {
  it("does not collapse matching canonical IDs from distinct addressed worlds", () => {
    const first = world("root", ["left"], [entity("actor", "root", ["left"])]);
    const second = world("root", ["right"], [entity("actor", "root", ["right"])]);
    const root = world("root", [], [
      { occurrence: { world: { rootWorldId: "root", containerPath: [] }, entityId: "left" }, entity: { id: "left", kind: "recursive-container", bounds: rect() }, childWorld: first },
      { occurrence: { world: { rootWorldId: "root", containerPath: [] }, entityId: "right" }, entity: { id: "right", kind: "recursive-container", bounds: rect() }, childWorld: second },
    ]);

    const actors = [...projectionEntityMap(root).values()].filter((entry) => entry.occurrence.entityId === "actor");
    expect(actors).toHaveLength(2);
    expect(actors.map((entry) => entry.occurrence.world.containerPath)).toEqual([["left"], ["right"]]);
  });

  it("selects a portal only by its full sibling/nested occurrence addresses", () => {
    const outer = { rootWorldId: "root|id", containerPath: ["left|container"] } as const;
    const inner = { rootWorldId: "root|id", containerPath: ["left|container", "nested|container"] } as const;
    const sibling = { rootWorldId: "root|id", containerPath: ["right|container"] } as const;
    const portal = {
      mode: "enter" as const,
      actorBefore: { world: outer, entityId: "actor|id" },
      actorAfter: { world: inner, entityId: "actor|id" },
      port: { container: { world: outer, entityId: "nested|container" }, portId: "p|0" },
      from: { world: outer, x: 1, y: 1 },
      to: { world: inner, x: 0, y: 0 },
    };

    expect(selectAddressedPortalTarget(portal, outer, portal.port.container, inner)).toBe(true);
    expect(selectAddressedPortalTarget(portal, sibling, { ...portal.port.container, world: sibling }, inner)).toBe(false);
    expect(selectAddressedPortalTarget(portal, outer, portal.port.container, sibling)).toBe(false);
  });

  it("keeps draw-local bounds separate from accumulated root diagnostics through depth two", () => {
    const rootLocal = { x: 20, y: 30, width: 700, height: 500 };
    const rootOrigin = rootOriginForLocalBounds(rootLocal, { x: 0, y: 0 });
    const childLocal = { x: 250, y: 180, width: 70, height: 50 };
    const childRoot = translateRectToRoot(childLocal, rootOrigin);
    const childOrigin = rootOriginForLocalBounds(childLocal, rootOrigin);
    const grandchildLocal = { x: 24, y: 16, width: 7, height: 5 };
    const grandchildRoot = translateRectToRoot(grandchildLocal, childOrigin);
    const nestedEntityLocal = { x: 2, y: 1, width: 1, height: 1 };

    expect(rootOrigin).toEqual({ x: 20, y: 30 });
    expect(childLocal).toEqual({ x: 250, y: 180, width: 70, height: 50 });
    expect(childRoot).toEqual({ x: 270, y: 210, width: 70, height: 50 });
    expect(childOrigin).toEqual({ x: 270, y: 210 });
    expect(grandchildLocal).toEqual({ x: 24, y: 16, width: 7, height: 5 });
    expect(grandchildRoot).toEqual({ x: 294, y: 226, width: 7, height: 5 });
    expect(translateRectToRoot(nestedEntityLocal, rootOriginForLocalBounds(grandchildLocal, childOrigin)))
      .toEqual({ x: 296, y: 227, width: 1, height: 1 });
  });

  it("selects the fully addressed depth-two world for fixed non-portal camera focus", () => {
    const rootAddress = { rootWorldId: "root", containerPath: [] } as const;
    const childAddress = { rootWorldId: "root", containerPath: ["outer"] } as const;
    const grandchildAddress = { rootWorldId: "root", containerPath: ["outer", "inner"] } as const;
    const frames = [
      { address: rootAddress, depth: 0, rootBounds: { x: 0, y: 0, width: 700, height: 500 } },
      { address: childAddress, depth: 1, rootBounds: { x: 270, y: 210, width: 70, height: 50 } },
      { address: grandchildAddress, depth: 2, rootBounds: { x: 294, y: 226, width: 7, height: 5 } },
    ];

    expect(selectAddressedWorld(frames, grandchildAddress)).toBe(frames[2]);
    expect(selectAddressedWorld(frames, { rootWorldId: "root", containerPath: ["other", "inner"] })).toBeUndefined();
  });

  it("rebases carried descendants only under the exact full source root", () => {
    const before = { rootWorldId: "root|id", containerPath: ["source|box"] } as const;
    const after = { rootWorldId: "root|id", containerPath: ["receiver|box", "source|box"] } as const;
    expect(rebaseWorldAddress(
      { rootWorldId: "root|id", containerPath: ["source|box", "nested|container"] },
      before,
      after,
    )).toEqual({ rootWorldId: "root|id", containerPath: ["receiver|box", "source|box", "nested|container"] });
    expect(rebaseWorldAddress(
      { rootWorldId: "root|id", containerPath: ["source|boxish", "nested|container"] },
      before,
      after,
    )).toBeUndefined();
  });

  it("keeps transfer source/destination projection continuity at p=0, 0.5, and 1", () => {
    expect([0, 0.5, 1].map((progress) => [
      transferProjectionOpacity("source", progress),
      transferProjectionOpacity("destination", progress),
    ])).toEqual([
      [1, 0],
      [0, 0],
      [0, 1],
    ]);
  });

  it("pairs delimiter-like sibling aliases structurally and rebases every carried descendant", () => {
    const { from, to, transfer } = aliasTransferProjections();
    const bridges = deriveTransferBridges(from, to, transfer);
    expect(bridges).toHaveLength(2);
    expect(bridges.map((bridge) => [bridge.source.occurrence.world.containerPath, bridge.destination.occurrence.world.containerPath])).toEqual([
      [["alias|left"], ["alias|left", "receiver|left"]],
      [["alias|right"], ["alias|right", "receiver|right"]],
    ]);
    expect(bridges.map((bridge) => rebaseWorldAddress(
      { rootWorldId: "root|id", containerPath: [...bridge.source.occurrence.world.containerPath, "payload|id", "nested|id"] },
      { rootWorldId: "root|id", containerPath: [...bridge.source.occurrence.world.containerPath, "payload|id"] },
      { rootWorldId: "root|id", containerPath: [...bridge.destination.occurrence.world.containerPath, "payload|id"] },
    ))).toEqual([
      { rootWorldId: "root|id", containerPath: ["alias|left", "receiver|left", "payload|id", "nested|id"] },
      { rootWorldId: "root|id", containerPath: ["alias|right", "receiver|right", "payload|id", "nested|id"] },
    ]);
    expect(deriveTransferBridges(reorderProjection(from), reorderProjection(to), transfer).map((bridge) => [
      bridge.source.occurrence.world.containerPath,
      bridge.destination.occurrence.world.containerPath,
      bridge.eventPort,
      bridge.apertureContainer,
    ])).toEqual([
      [["alias|left"], ["alias|left", "receiver|left"], transfer.via, { world: { rootWorldId: "root|id", containerPath: ["alias|left"] }, entityId: "receiver|left" }],
      [["alias|right"], ["alias|right", "receiver|right"], transfer.via, { world: { rootWorldId: "root|id", containerPath: ["alias|right"] }, entityId: "receiver|right" }],
    ]);
    expect(bridges.every((bridge) => bridge.eventPort === transfer.via)).toBe(true);
    expect(bridges.map((bridge) => bridge.apertureContainer)).toEqual([
      { world: { rootWorldId: "root|id", containerPath: ["alias|left"] }, entityId: "receiver|left" },
      { world: { rootWorldId: "root|id", containerPath: ["alias|right"] }, entityId: "receiver|right" },
    ]);
    expect(isExactTransferEventAperture(transfer.via, bridges[0]!.apertureContainer, true)).toBe(true);
    expect(isExactTransferEventAperture(transfer.via, bridges[1]!.apertureContainer, true)).toBe(false);
    expect(isExactTransferEventAperture(transfer.via, bridges[0]!.apertureContainer, false)).toBe(false);
  });

  it("pairs every differently-containered alias for push-out without selecting the event receiver ID", () => {
    const { from, to, transfer } = aliasTransferProjections();
    const reverse: TransferTransition = {
      ...transfer,
      mode: "push-out",
      direction: "reverse",
      entityBefore: transfer.entityAfter,
      entityAfter: transfer.entityBefore,
      from: transfer.to,
      to: transfer.from,
      carriedSubtree: transfer.carriedSubtree && {
        ...transfer.carriedSubtree,
        beforeRoot: transfer.carriedSubtree.afterRoot,
        afterRoot: transfer.carriedSubtree.beforeRoot,
      },
    };
    const bridges = deriveTransferBridges(to, from, reverse);
    expect(bridges.map((bridge) => [
      bridge.source.occurrence.world.containerPath,
      bridge.destination.occurrence.world.containerPath,
      bridge.eventPort,
      bridge.apertureContainer,
    ])).toEqual([
      [["alias|left", "receiver|left"], ["alias|left"], reverse.via, { world: { rootWorldId: "root|id", containerPath: ["alias|left"] }, entityId: "receiver|left" }],
      [["alias|right", "receiver|right"], ["alias|right"], reverse.via, { world: { rootWorldId: "root|id", containerPath: ["alias|right"] }, entityId: "receiver|right" }],
    ]);
    expect(bridges.every((bridge) => bridge.eventPort === reverse.via)).toBe(true);
  });

  it("retains settled transfer diagnostic data for the p=1 QA snapshot without retaining render objects", () => {
    const original = [{ port: { portId: "p|1" }, carrier: { renderable: false, progress: 1 } }];
    const captured = retainSettledTransferDiagnostics(original);
    expect(captured).toEqual(original);
    expect(captured).not.toBe(original);
  });
});

function world(rootWorldId: string, containerPath: readonly string[], entities: WorldProjection["entities"]): WorldProjection {
  return {
    projectionId: JSON.stringify([rootWorldId, ...containerPath]),
    world: { id: "canonical", paletteId: "void-lab", size: { width: 3, height: 3 } },
    address: { rootWorldId, containerPath },
    activeAddress: { rootWorldId, containerPath },
    depth: containerPath.length,
    entities: [...entities],
  };
}

function entity(entityId: string, rootWorldId: string, containerPath: readonly string[]) {
  return { occurrence: { world: { rootWorldId, containerPath }, entityId }, entity: { id: entityId, kind: "player" as const, bounds: rect() } };
}

function aliasTransferProjections(): { readonly from: WorldProjection; readonly to: WorldProjection; readonly transfer: TransferTransition } {
  const left = ["alias|left"] as const;
  const right = ["alias|right"] as const;
  const makeBefore = (path: readonly string[], receiverId: string) => worldAt("shared|outer", path, [
    recursive(receiverId, path, worldAt("inside|world", [...path, receiverId], [])),
    recursive("payload|id", path, worldAt("carried|world", [...path, "payload|id"], [entity("marker|id", "root|id", [...path, "payload|id"])])),
  ]);
  const makeAfter = (path: readonly string[], receiverId: string) => worldAt("shared|outer", path, [
    recursive(receiverId, path, worldAt("inside|world", [...path, receiverId], [
      recursive("payload|id", [...path, receiverId], worldAt("carried|world", [...path, receiverId, "payload|id"], [entity("marker|id", "root|id", [...path, receiverId, "payload|id"])])),
    ])),
  ]);
  const from = worldAt("root|world", [], [recursive("alias|left", [], makeBefore(left, "receiver|left")), recursive("alias|right", [], makeBefore(right, "receiver|right"))]);
  const to = worldAt("root|world", [], [recursive("alias|left", [], makeAfter(left, "receiver|left")), recursive("alias|right", [], makeAfter(right, "receiver|right"))]);
  const transfer: TransferTransition = {
    mode: "push-in",
    direction: "forward",
    entityBefore: { world: { rootWorldId: "root|id", containerPath: left }, entityId: "payload|id" },
    entityAfter: { world: { rootWorldId: "root|id", containerPath: [...left, "receiver|left"] }, entityId: "payload|id" },
    from: { world: { rootWorldId: "root|id", containerPath: left }, x: 2, y: 2 },
    to: { world: { rootWorldId: "root|id", containerPath: [...left, "receiver|left"] }, x: 1, y: 1 },
    via: { container: { world: { rootWorldId: "root|id", containerPath: left }, entityId: "receiver|left" }, portId: "p|1" },
    carriedSubtree: { innerWorldId: "carried|world", beforeRoot: { rootWorldId: "root|id", containerPath: [...left, "payload|id"] }, afterRoot: { rootWorldId: "root|id", containerPath: [...left, "receiver|left", "payload|id"] } },
    durationMs: 360,
  };
  return { from, to, transfer };
}

function worldAt(canonicalId: string, containerPath: readonly string[], entities: WorldProjection["entities"]): WorldProjection {
  return {
    projectionId: JSON.stringify(["root|id", ...containerPath]),
    world: { id: canonicalId, paletteId: "void-lab", size: { width: 3, height: 3 } },
    address: { rootWorldId: "root|id", containerPath },
    activeAddress: { rootWorldId: "root|id", containerPath: [] },
    depth: containerPath.length,
    entities,
  };
}

function recursive(entityId: string, parentPath: readonly string[], childWorld: WorldProjection) {
  return { occurrence: { world: { rootWorldId: "root|id", containerPath: parentPath }, entityId }, entity: { id: entityId, kind: "recursive-container" as const, bounds: rect() }, childWorld };
}

function reorderProjection(projection: WorldProjection): WorldProjection {
  return {
    ...projection,
    entities: [...projection.entities].reverse().map((entry) => ({
      ...entry,
      ...(entry.childWorld ? { childWorld: reorderProjection(entry.childWorld) } : {}),
    })),
  };
}

function rect() { return { x: 0, y: 0, width: 1, height: 1 }; }
