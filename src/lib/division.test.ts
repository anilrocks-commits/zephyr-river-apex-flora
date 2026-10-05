import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  divisionFromSnippet,
  eventMatchesProgramDivision,
  normalizeEventDivision,
} from "./division.ts";

describe("event division filter", () => {
  it("maps NAIA / NCAA strings", () => {
    assert.equal(normalizeEventDivision("NAIA"), "NAIA");
    assert.equal(normalizeEventDivision("NCAA Division I"), "NCAA Division I");
    assert.equal(normalizeEventDivision("NCAA Division III"), "NCAA Division III");
  });

  it("drops NAIA events from a D1 program", () => {
    assert.equal(eventMatchesProgramDivision("D1", "NAIA", "TMU Danish Classic 2026"), false);
    assert.equal(
      eventMatchesProgramDivision("D1", "NCAA Division I", "Cullan Brown Collegiate"),
      true,
    );
    assert.equal(eventMatchesProgramDivision("D3", "NCAA Division III", "some invite"), true);
    assert.equal(eventMatchesProgramDivision("D3", "NCAA Division I", "D1 invite"), false);
  });

  it("reads NAIA out of a Clippd schedule snippet", () => {
    const snippet = [
      "Oct 12 - Oct 14, 2026",
      "Visit Stockton Pacific Invitational",
      "Stockton, California",
      "NCAA Division I",
      "Men",
      "Pacific",
      "Oct 5 - Oct 6, 2026",
      "TMU Danish Classic 2026",
      "Solvang, California",
      "Alisal Guest Ranch & Resort - Solvang - California",
      "ScoreboardLive",
      "NAIA",
      "Men",
      "Master's",
    ].join("\n");
    assert.equal(divisionFromSnippet(snippet, "TMU Danish Classic 2026"), "NAIA");
    assert.equal(divisionFromSnippet(snippet, "Visit Stockton Pacific Invitational"), "NCAA Division I");
  });
});
