import { describe, expect, it } from "vitest";
import { EventPipeline } from "./EventPipeline";
import { parseR2QaQuery } from "./r2QaScenario";

describe("R2 QA query", () => {
  it("accepts only exact dev tuples and creates real addressed transfer command traces", () => {
    for (const captureCase of ["push-in", "undo-push-in", "push-out", "undo-push-out"] as const) {
      const scenario = parseR2QaQuery(`?qa=r2&case=${captureCase}&progress=0.5`, true);
      expect(scenario).toMatchObject({ kind: "scenario", case: captureCase, progress: 0.5 });
      if (scenario.kind !== "scenario") throw new Error("Expected R2 QA scenario.");
      const pipeline = new EventPipeline();
      let result = pipeline.dispatch(scenario.session, scenario.commands[0]);
      for (const command of scenario.commands.slice(1)) {
        expect(result.result.kind, `${captureCase}/${command.type}`).toBe("accepted");
        result = pipeline.dispatch(result.session, command);
      }
      expect(result.result.kind, `${captureCase}/final`).toBe("accepted");
      const isUndo = captureCase.startsWith("undo-");
      expect(result.events.map((event) => event.type), captureCase).toEqual(isUndo
        ? ["entity-moved", "entity-transferred", "push-resolved"]
        : ["push-resolved", "entity-transferred", "entity-moved"]);
      expect(result.events.find((event) => event.type === "entity-transferred")).toMatchObject({
        type: "entity-transferred",
        mode: isUndo
          ? captureCase.endsWith("push-out") ? "push-in" : "push-out"
          : captureCase.endsWith("push-out") ? "push-out" : "push-in",
        direction: isUndo ? "reverse" : "forward",
        carriedSubtree: { beforeRoot: expect.any(Object), afterRoot: expect.any(Object) },
      });
    }
  });

  it("fails closed for production, duplicate, unknown, and non-exact progress queries", () => {
    for (const query of [
      "?qa=r2&case=push-in&progress=0.50",
      "?qa=r2&case=push-in&progress=0.5&extra=x",
      "?qa=r2&qa=r2&case=push-in&progress=0.5",
      "?qa=r2&case=unknown&progress=0.5",
    ]) {
      expect(parseR2QaQuery(query, true).kind).toBe("invalid-query");
    }
    expect(parseR2QaQuery("?qa=r2&case=push-in&progress=0.5", false)).toMatchObject({ kind: "invalid-query", reason: "qa-is-dev-only" });
  });
});
