import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeTeams, TEAMS } from "./watchlist.mjs";

test("extra teams append without duplicating a built-in Clippd id", () => {
  const merged = mergeTeams(TEAMS, [
    { id: "texas-state", name: "Texas State", div: "D1", clippdId: "2485" },
    { id: "ksu-dup", name: "Kennesaw Again", clippdId: "4172" },
  ]);
  assert.equal(merged.filter((t) => t.clippdId === "2485").length, 1);
  assert.equal(merged.filter((t) => t.id === "ksu").length, 1);
  assert.equal(merged.some((t) => t.id === "ksu-dup"), false);
  assert.equal(merged.length, TEAMS.length + 1);
});
