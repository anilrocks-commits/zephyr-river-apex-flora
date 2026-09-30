#!/usr/bin/env node
/**
 * Daily 2027 men's golf commit scraper.
 *
 * Primary source: collegegolfcommits.com (player announcements).
 * Secondary: athletics news archives (official signing-class posts).
 * Runs for every team in scripts/watchlist.mjs — adding a college there
 * is enough for the next daily pass to pick up new verbals.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { TEAMS } from "./watchlist.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "data");
const OUT_FILE = join(OUT_DIR, "commits.json");
const CLASS_YEAR = 2027;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const CGC_PAGES = [
  "2027boysd1a",
  "2027boysd1b",
  "2027boysd1c",
  "2027boysd1de",
  "2027boysd1fg",
  "2027boysd1hj",
  "2027boysd1kl",
  "2027boysd1m",
  "2027boysd1n",
  "2027boysd1or",
  "2027boysd1s",
  "2027boysd1tv",
  "2027boysd1wz",
  "2027boysd2",
  "2027boysd3",
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadPrevious() {
  if (!existsSync(OUT_FILE)) return { teams: {}, scrapedAt: null };
  try {
    return JSON.parse(readFileSync(OUT_FILE, "utf8"));
  } catch {
    return { teams: {}, scrapedAt: null };
  }
}

export function unescapeHtml(html) {
  let prev = "";
  let out = html;
  for (let i = 0; i < 3 && out !== prev; i++) {
    prev = out;
    out = out
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/&/g, "&");
  }
  return out;
}

export function htmlToLines(html) {
  let text = unescapeHtml(html);
  text = text.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/(p|h[1-6]|li|div|tr|blockquote)>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");
  return text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function normSchool(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|university|univ|college|of)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugName(name) {
  return String(name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function looksLikeSchoolHeader(line) {
  if (!line.startsWith("-")) return false;
  const body = line.replace(/^[-–—]+\s*/, "").trim();
  if (body.length < 4 || body.length > 80) return false;
  if (/^(two|three|four|five|class of|updated|keep up|contacts|email)/i.test(body)) return false;
  return /(university|college|state|institute|tech|hall|memphis|howard|manhattan|rochester|cmu)/i.test(
    body,
  );
}

function isJunkLine(line) {
  return /^(contacts|contact form|email address|submit|instagram|keep up|subscribe|copyright|support the|general:|graphic design)/i.test(
    line,
  );
}

const PLAYER_RE = /^⭐\s*(.+?),\s*(20\d{2})\s*$/;
const COMPACT_RE = /^(.{3,80}?):\s*([A-Z][\w.'-]+(?:\s+[A-Z][\w.'-]+){0,3}),\s*(.+)$/;
const CONTINUATION_RE = /^([A-Z][\w.'-]+(?:\s+[A-Z][\w.'-]+){1,2}),\s*([A-Za-z].{1,40})$/;

export function parseCgcLines(lines, pageUrl) {
  const out = [];
  let school = null;
  let current = null;
  let compactSchool = null;
  let inStarListing = false;

  const push = (row) => {
    if (!row?.name || !row.school) return;
    if (row.classYear !== CLASS_YEAR) return;
    out.push({
      name: row.name,
      classYear: row.classYear,
      hometown: row.hometown || "",
      note: (row.notes || []).map((n) => n.replace(/&/g, "&")).slice(0, 3).join("; "),
      school: row.school,
      source: "College Golf Commits",
      sourceUrl: pageUrl,
      status: "verbal",
    });
  };

  const flush = () => {
    if (current && school) push({ ...current, school });
    current = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/⭐️/g, "⭐").trim();
    if (isJunkLine(line)) continue;
    if (looksLikeSchoolHeader(line)) {
      flush();
      school = line.replace(/^[-–—]+\s*/, "").trim();
      inStarListing = true;
      compactSchool = null;
      continue;
    }
    const pm = line.match(PLAYER_RE);
    if (pm) {
      const year = Number(pm[2]);
      flush();
      inStarListing = true;
      current = {
        name: pm[1].replace(/^⭐\s*/, "").trim(),
        classYear: year,
        hometown: "",
        notes: [],
      };
      continue;
    }
    const compact = line.match(COMPACT_RE);
    if (compact && /(university|college|state|institute|mellon|baylor|tech)/i.test(compact[1])) {
      flush();
      inStarListing = false;
      compactSchool = compact[1].trim();
      push({
        name: compact[2].trim(),
        classYear: CLASS_YEAR,
        hometown: compact[3].trim(),
        notes: [],
        school: compactSchool,
      });
      continue;
    }
    const cont = line.match(CONTINUATION_RE);
    if (cont && compactSchool && !inStarListing && !line.includes(":")) {
      push({
        name: cont[1].trim(),
        classYear: CLASS_YEAR,
        hometown: cont[2].trim(),
        notes: [],
        school: compactSchool,
      });
      continue;
    }
    if (current) {
      if (!current.hometown) current.hometown = line;
      else current.notes.push(line.replace(/&/g, "&"));
    }
  }
  flush();
  return out;
}

export function matchTeam(school, teams = TEAMS) {
  const n = normSchool(school);
  if (!n) return null;
  let best = null;
  let bestLen = 0;
  for (const team of teams) {
    for (const alias of team.aliases) {
      const a = normSchool(alias);
      if (!a) continue;
      const exact = n === a;
      const prefix = a.split(" ").length >= 2 && n.startsWith(a + " ");
      if (exact || prefix) {
        if (a.length > bestLen) {
          best = team;
          bestLen = a.length;
        }
      }
    }
  }
  return best;
}

async function httpGet(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });
  const text = await res.text();
  return { status: res.status, ok: res.ok, text, url };
}

function newsCandidateUrls(rosterUrl) {
  try {
    const u = new URL(rosterUrl);
    const origin = u.origin;
    const path = u.pathname.replace(/\/+$/, "");
    const sportRoot = path.replace(/\/roster$/i, "");
    return [
      `${origin}${sportRoot}/archives`,
      `${origin}${sportRoot}/news`,
      `${origin}/sports/mens-golf/archives`,
    ].filter((v, i, a) => a.indexOf(v) === i);
  } catch {
    return [];
  }
}

const SIGNING_HREF =
  /href="([^"]+)"[^>]*>[^<]*(?:signing|signee|commit(?:ed|ment)?|nli)[^<]*</gi;
const TITLE_HINT = /(signing|signee|commit(?:ed|ment)?|class of 2027|ink three|ink two)/i;

function extractArticleLinks(html, pageUrl) {
  const links = new Set();
  let m;
  const re = /href="([^"]+)"/gi;
  while ((m = re.exec(html))) {
    let href = m[1];
    if (!/\/news\//i.test(href)) continue;
    if (!TITLE_HINT.test(href) && !/2027/.test(href) && !/signing/i.test(href)) continue;
    try {
      href = new URL(href, pageUrl).href;
    } catch {
      continue;
    }
    links.add(href);
  }
  SIGNING_HREF.lastIndex = 0;
  while ((m = SIGNING_HREF.exec(html))) {
    try {
      links.add(new URL(m[1], pageUrl).href);
    } catch {
      /* ignore */
    }
  }
  return [...links].slice(0, 6);
}

const NAME_NEAR_COMMIT =
  /\b([A-Z][a-z]+(?:\s+[A-Z][a-z.'-]+){1,2})\b(?=[^.]{0,40}\b(?:committed|commit|signed|signee|signing)\b)/g;

async function scrapeAthletics(team) {
  const found = [];
  const urls = newsCandidateUrls(team.rosterUrl);
  for (const url of urls) {
    try {
      const page = await httpGet(url);
      if (!page.ok) continue;
      const articles = extractArticleLinks(page.text, url);
      for (const articleUrl of articles) {
        await sleep(250);
        const art = await httpGet(articleUrl);
        if (!art.ok) continue;
        const lines = htmlToLines(art.text);
        const blob = lines.join(" ");
        if (!/2027/.test(blob) && !/class of 2027/i.test(blob)) continue;
        const names = new Set();
        let m;
        NAME_NEAR_COMMIT.lastIndex = 0;
        while ((m = NAME_NEAR_COMMIT.exec(blob))) {
          const n = m[1].trim();
          if (n.split(" ").length < 2) continue;
          if (/^(Head Coach|University|College|Go |The )/.test(n)) continue;
          names.add(n);
        }
        for (const name of names) {
          found.push({
            name,
            classYear: CLASS_YEAR,
            hometown: "",
            note: `Named on athletics signing/commit article.`,
            school: team.name,
            source: "Athletics news",
            sourceUrl: articleUrl,
            status: "signed",
          });
        }
      }
    } catch {
      /* best-effort */
    }
  }
  return found;
}

function toRecord(team, row) {
  return {
    id: `${team.id}-c-${slugName(row.name)}`,
    name: row.name,
    classYear: row.classYear || CLASS_YEAR,
    hometown: row.hometown || "",
    status: row.status === "signed" ? "signed" : "verbal",
    source: row.source,
    sourceUrl: row.sourceUrl,
    note: row.note || "",
  };
}

function mergeRows(prevList, nextList) {
  const map = new Map();
  const key = (c) => slugName(c.name);
  for (const c of prevList || []) map.set(key(c), c);
  for (const c of nextList) {
    const k = key(c);
    const prev = map.get(k);
    if (!prev) {
      map.set(k, c);
      continue;
    }
    map.set(k, {
      ...prev,
      ...c,
      hometown: c.hometown || prev.hometown,
      note: c.note || prev.note,
      sourceUrl: c.sourceUrl || prev.sourceUrl,
      status: c.status === "signed" || prev.status === "signed" ? "signed" : c.status || prev.status,
    });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function main() {
  const previous = loadPrevious();
  const byTeam = {};
  for (const team of TEAMS) byTeam[team.id] = [];

  for (const slug of CGC_PAGES) {
    const url = `https://collegegolfcommits.com/${slug}`;
    process.stdout.write(`CGC ${slug} … `);
    try {
      const page = await httpGet(url);
      if (!page.ok) {
        console.log(`HTTP ${page.status}`);
        continue;
      }
      const rows = parseCgcLines(htmlToLines(page.text), url);
      let hit = 0;
      for (const row of rows) {
        const team = matchTeam(row.school);
        if (!team) continue;
        byTeam[team.id].push(toRecord(team, row));
        hit++;
      }
      console.log(`${rows.length} players, ${hit} watchlist`);
    } catch (err) {
      console.log(`fail: ${err.message}`);
    }
    await sleep(400);
  }

  for (const team of TEAMS) {
    process.stdout.write(`athletics ${team.id} … `);
    try {
      const rows = await scrapeAthletics(team);
      for (const row of rows) byTeam[team.id].push(toRecord(team, row));
      console.log(`${rows.length} names`);
    } catch (err) {
      console.log(`fail: ${err.message}`);
    }
    await sleep(300);
  }

  const teamsOut = {};
  for (const team of TEAMS) {
    const prev = previous.teams?.[team.id]?.commits || [];
    const next = byTeam[team.id];
    const merged = next.length ? mergeRows(prev, next) : prev;
    teamsOut[team.id] = {
      id: team.id,
      name: team.name,
      commits: merged,
    };
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const payload = {
    scrapedAt: new Date().toISOString(),
    classYear: CLASS_YEAR,
    source: "collegegolfcommits.com + athletics news",
    teams: teamsOut,
  };
  writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + "\n");
  const total = Object.values(teamsOut).reduce((n, t) => n + t.commits.length, 0);
  console.log(`Wrote ${OUT_FILE} (${total} commits across ${TEAMS.length} teams)`);
}

const invoked = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invoked) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
