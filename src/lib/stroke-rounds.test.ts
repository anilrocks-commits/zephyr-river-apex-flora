import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { trimStrokeRounds } from "./stroke-rounds.ts";

describe("trimStrokeRounds", () => {
  it("drops Clippd points that landed in R5 after an empty R4", () => {
    assert.deepEqual(trimStrokeRounds([73, 72, 76, null, 62, null], 221), [73, 72, 76]);
    assert.deepEqual(trimStrokeRounds([76, 79, 79, null, 88, null], 234), [76, 79, 79]);
  });

  it("drops points sitting in R4 when the board has no empty column", () => {
    assert.deepEqual(trimStrokeRounds([73, 72, 76, 62], 221), [73, 72, 76]);
  });

  it("keeps a real fourth round and a cancelled middle round", () => {
    assert.deepEqual(trimStrokeRounds([70, 71, 72, 68, 90], 281), [70, 71, 72, 68]);
    assert.deepEqual(trimStrokeRounds([70, null, 72], 142), [70, null, 72]);
  });

  it("uses the planned round count when there is no total", () => {
    assert.deepEqual(trimStrokeRounds([73, 72, 76, 62], null, 3), [73, 72, 76]);
    assert.deepEqual(trimStrokeRounds([288, 300, 297, null], 885), [288, 300, 297]);
  });
});
