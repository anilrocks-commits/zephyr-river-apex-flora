import test from "node:test";
import assert from "node:assert/strict";
import { htmlToLines, matchTeam, parseCgcLines, normSchool } from "./scrape-commits.mjs";
import { TEAMS } from "./watchlist.mjs";

test("D1 star listing assigns players to the school header above them", () => {
  const lines = [
    "-University of Kansas",
    "⭐️Martin Ramirez, 2027",
    "Columbia",
    "Three junior event wins",
    "-Kennesaw State University",
    "⭐️Cole Rosich, 2027",
    "Bogart, GA",
    "Two Top 10 AJGA finishes in 2025",
    "-University of Kentucky",
    "⭐️Denton Brooks, 2027",
    "Birmingham, AL",
    "⭐️MacKinnley Yarbrough, 2027",
    "Temple, GA",
    "-Longwood University",
  ];
  const rows = parseCgcLines(lines, "https://collegegolfcommits.com/2027boysd1kl");
  const ksu = rows.filter((r) => /kennesaw/i.test(r.school));
  assert.equal(ksu.length, 1);
  assert.equal(ksu[0].name, "Cole Rosich");
  assert.equal(ksu[0].hometown, "Bogart, GA");
  const kansas = rows.filter((r) => matchTeam(r.school)?.id === "ksu");
  assert.equal(kansas.length, 1);
  const memphisish = rows.find((r) => r.name === "Martin Ramirez");
  assert.equal(memphisish.school, "University of Kansas");
});

test("watchlist aliases match CGC school headers", () => {
  assert.equal(matchTeam("Kennesaw State University", TEAMS)?.id, "ksu");
  assert.equal(matchTeam("University of Memphis", TEAMS)?.id, "memphis");
  assert.equal(matchTeam("Seton Hall University", TEAMS)?.id, "shu");
  assert.equal(matchTeam("Manhattan University", TEAMS)?.id, "man");
  assert.equal(matchTeam("Carnegie Mellon University", TEAMS)?.id, "cmu");
  assert.equal(matchTeam("University of Kansas", TEAMS), null);
});

test("D3 compact lines parse Carnegie Mellon", () => {
  const html =
    "<p>Carnegie Mellon, Valencia CA: Ziqi Lang, China</p><p>Anderson University: Reed Cook, Awendaw SC</p>";
  const rows = parseCgcLines(htmlToLines(html), "https://collegegolfcommits.com/2027boysd3");
  const cmu = rows.filter((r) => matchTeam(r.school)?.id === "cmu");
  assert.equal(cmu.length, 1);
  assert.equal(cmu[0].name, "Ziqi Lang");
  assert.equal(cmu[0].hometown, "China");
});

test("normSchool strips university noise", () => {
  assert.equal(normSchool("University of Memphis"), "memphis");
  assert.equal(normSchool("Kennesaw State University"), "kennesaw state");
});
