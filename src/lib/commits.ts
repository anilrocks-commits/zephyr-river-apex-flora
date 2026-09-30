import type { Program, RecruitCommit } from "@/data/types";
import rawCommits from "../../public/data/commits.json";

export interface ScrapedCommitsFile {
  scrapedAt: string | null;
  classYear?: number;
  source?: string;
  teams: Record<
    string,
    {
      id: string;
      name: string;
      commits: RecruitCommit[];
    }
  >;
}

export const SCRAPED_COMMITS = rawCommits as unknown as ScrapedCommitsFile;

function nameKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function mergeOne(scraped: RecruitCommit | undefined, curated: RecruitCommit | undefined): RecruitCommit {
  if (!scraped) return curated as RecruitCommit;
  if (!curated) return scraped;
  return {
    ...scraped,
    hometown: curated.hometown || scraped.hometown,
    highSchool: curated.highSchool || scraped.highSchool,
    note: curated.note || scraped.note,
    sourceUrl: curated.sourceUrl || scraped.sourceUrl,
    source: curated.source && curated.source !== scraped.source
      ? `${scraped.source}; ${curated.source}`
      : scraped.source || curated.source,
    status: scraped.status === "signed" || curated.status === "signed" ? "signed" : scraped.status,
  };
}

export function withCommits(
  program: Program,
  file: ScrapedCommitsFile | null | undefined = SCRAPED_COMMITS,
): Program {
  const scraped = file?.teams?.[program.id]?.commits ?? [];
  const curated = program.commits ?? [];
  const map = new Map<string, RecruitCommit>();
  for (const c of scraped) map.set(nameKey(c.name), c);
  for (const c of curated) {
    const k = nameKey(c.name);
    map.set(k, mergeOne(map.get(k), c));
  }
  const commits = [...map.values()]
    .filter((c) => c.classYear === 2027)
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    ...program,
    commits,
    clippdScrapedAt: program.clippdScrapedAt,
  };
}
