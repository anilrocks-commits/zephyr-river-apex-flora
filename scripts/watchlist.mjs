/**
 * Single roster of watchlist programs for the daily scrapers.
 * Adding a college: append a row here (aliases for College Golf Commits
 * matching, clippdId if Clippd has a team page). Curated intel still
 * lives in src/data/programs.ts — this file is scrape identity only.
 */
export const TEAMS = [
  {
    id: "siu",
    name: "Southern Illinois",
    clippdId: "4127",
    rosterUrl: "https://siusalukis.com/sports/mens-golf/roster",
    aliases: ["southern illinois", "siu", "southern illinois university", "southern illinois salukis"],
  },
  {
    id: "ksu",
    name: "Kennesaw State",
    clippdId: "4172",
    rosterUrl: "https://ksuowls.com/sports/mens-golf/roster",
    aliases: ["kennesaw state", "kennesaw state university", "ksu"],
  },
  {
    id: "shu",
    name: "Seton Hall",
    clippdId: "3163",
    rosterUrl: "https://shupirates.com/sports/mens-golf/roster",
    aliases: ["seton hall", "seton hall university"],
  },
  {
    id: "ucsb",
    name: "UC Santa Barbara",
    clippdId: "2520",
    rosterUrl: "https://ucsbgauchos.com/sports/mens-golf/roster",
    aliases: ["uc santa barbara", "ucsb", "california santa barbara", "santa barbara gauchos"],
  },
  {
    id: "memphis",
    name: "Memphis",
    clippdId: "3916",
    rosterUrl: "https://gotigersgo.com/sports/mgolf/roster",
    aliases: ["memphis", "university of memphis", "memphis tigers"],
  },
  {
    id: "howard",
    name: "Howard",
    rosterUrl: "https://hubison.com/sports/mgolf/roster",
    aliases: ["howard", "howard university", "howard bison"],
  },
  {
    id: "man",
    name: "Manhattan",
    clippdId: "3652",
    rosterUrl: "https://gojaspers.com/sports/mens-golf/roster",
    aliases: ["manhattan", "manhattan university", "manhattan college", "manhattan jaspers"],
  },
  {
    id: "fdu",
    name: "Fairleigh Dickinson",
    rosterUrl: "https://fduknights.com/sports/mens-golf/roster",
    aliases: ["fairleigh dickinson", "fdu", "fairleigh dickinson university"],
  },
  {
    id: "umhb",
    name: "UMHB",
    rosterUrl: "https://cruathletics.com/sports/mens-golf/roster",
    aliases: ["umhb", "mary hardin baylor", "university of mary hardin baylor", "mary hardin-baylor"],
  },
  {
    id: "rochester",
    name: "University of Rochester",
    clippdId: "2457",
    rosterUrl: "https://uofrathletics.com/sports/mens-golf/roster",
    aliases: ["university of rochester", "rochester", "rochester yellowjackets"],
  },
  {
    id: "cmu",
    name: "Carnegie Mellon",
    rosterUrl: "https://athletics.cmu.edu/sports/mgolf/roster",
    aliases: ["carnegie mellon", "carnegie mellon university", "cmu"],
  },
];

export const CLIPPD_TEAMS = TEAMS.filter((t) => t.clippdId);
