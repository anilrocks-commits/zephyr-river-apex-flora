import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lookupRanking, type RankingsFile } from "./rankings.ts";

const file: RankingsFile = {
  scrapedAt: "2026-10-16T00:00:00.000Z",
  divisions: {
    D1: {
      label: "NCAA Division I",
      currentSeason: "2027",
      previousSeason: "2026",
      asOf: "2026-10-14T14:46:03",
      teams: [
        { id: "4172", name: "Kennesaw State", school: "Kennesaw State University", current: 143, previous: 113 },
        { id: "3163", name: "Seton Hall", school: "Seton Hall University", current: 115, previous: 162 },
        { id: "2972", name: "Howard", school: "Howard University", current: 222, previous: 200 },
        { id: "2345", name: "FDU", school: "Fairleigh Dickinson University", current: 185, previous: 190 },
      ],
    },
    D3: {
      label: "NCAA Division III",
      currentSeason: "2027",
      previousSeason: "2026",
      teams: [
        { id: "2457", name: "Rochester", school: "University of Rochester", current: 59, previous: 40 },
        { id: "2161", name: "Mary Hardin-Baylor", school: "University of Mary Hardin-Baylor", current: 20, previous: 15 },
        { id: "2041", name: "FDU-Florham", school: "Fairleigh Dickinson, Florham", current: null, previous: 80 },
      ],
    },
  },
};

describe("team ranking lookup", () => {
  it("uses the Clippd team id and treats a lower number as a move up", () => {
    const row = lookupRanking(
      { id: "shu", name: "Seton Hall", short: "SHU", div: "D1", clippd: "https://scoreboard.clippd.com/teams/3163" },
      file,
    );
    assert.equal(row?.current, 115);
    assert.equal(row?.previous, 162);
    assert.equal(row?.delta, 47);
    assert.equal(row?.currentSeason, "2026/27");
    assert.equal(row?.previousSeason, "2025/26");
  });

  it("shows a drop when the rank number got worse", () => {
    const row = lookupRanking(
      { id: "ksu", name: "Kennesaw State", short: "KSU", div: "D1", clippd: "https://scoreboard.clippd.com/teams/4172" },
      file,
    );
    assert.equal(row?.delta, -30);
  });

  it("matches a school with no team id by name, inside its division", () => {
    const howard = lookupRanking(
      { id: "howard", name: "Howard", short: "Howard", div: "D1", clippd: "https://scoreboard.clippd.com/" },
      file,
    );
    assert.equal(howard?.current, 222);
    const fdu = lookupRanking(
      { id: "fdu", name: "Fairleigh Dickinson", short: "FDU", div: "D1", clippd: "https://scoreboard.clippd.com/" },
      file,
    );
    assert.equal(fdu?.current, 185);
    const umhb = lookupRanking(
      { id: "umhb", name: "UMHB", short: "UMHB", div: "D3", clippd: "https://scoreboard.clippd.com/" },
      file,
    );
    assert.equal(umhb?.current, 20);
  });

  it("does not borrow a D3 school for a D1 page", () => {
    const row = lookupRanking(
      { id: "rochester", name: "University of Rochester", short: "Rochester", div: "D1", clippd: "https://scoreboard.clippd.com/" },
      file,
    );
    assert.equal(row, null);
  });
});
