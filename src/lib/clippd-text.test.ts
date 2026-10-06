import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeEntities, isPlayerName, parseCoursePar } from "./clippd-text.ts";
import { formatToPar } from "./format.ts";

describe("clippd text", () => {
  it("decodes O&#x27;Rear so the name parser keeps Rhett", () => {
    const raw = "Rhett O&#x27;Rear";
    assert.equal(decodeEntities(raw), "Rhett O'Rear");
    assert.equal(isPlayerName(raw), true);
    assert.equal(isPlayerName("Rhett O'Rear"), true);
    assert.equal(isPlayerName("Lucky Cruz"), true);
  });

  it("reads course par from Clippd totalPar payloads", () => {
    assert.equal(parseCoursePar('totalPar":[72,72,0]'), 72);
    assert.equal(parseCoursePar('xxx \\"totalPar\\":[71,71,71] yyy'), 71);
    assert.equal(parseCoursePar('totalPar":[71,55] totalPar":[71,58] totalPar":[72,72,72] totalPar":[71,71]'), 71);
    assert.equal(parseCoursePar("no par here"), null);
  });
});

describe("formatToPar", () => {
  it("keeps integers and rounds averages", () => {
    assert.equal(formatToPar(0), "E");
    assert.equal(formatToPar(-4), "-4");
    assert.equal(formatToPar(3), "+3");
    assert.equal(formatToPar(-0.16666666666666666), "-0.17");
    assert.equal(formatToPar(1.125), "+1.13");
    assert.equal(formatToPar(-0.75), "-0.75");
  });
});
