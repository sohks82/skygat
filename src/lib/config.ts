/**
 * Everything that differs between one alliance's deployment and another.
 *
 * One codebase serves several alliances: each gets its own Vercel project, its
 * own database and its own values below, so a fix made once reaches all of them.
 * Read only from server components and server actions.
 */

export const THEMES = ["brass", "jade", "crimson", "azure", "orchid", "sand", "slate", "paper", "royal", "sunburst"] as const;
export type Theme = (typeof THEMES)[number];

function env(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v ? v : undefined;
}

/** Shown in the header and the browser tab. */
export const ALLIANCE_NAME = env("ALLIANCE_NAME") ?? "SkyGat";

/** Colour and display-type scheme. Unknown values fall back to the default. See /themes. */
export const THEME: Theme = (() => {
  const t = env("THEME")?.toLowerCase();
  return (THEMES as readonly string[]).includes(t ?? "") ? (t as Theme) : "brass";
})();

/** Roster cap. 25 unless the alliance runs to a different size. */
export const MEMBER_LIMIT: number = (() => {
  const n = Number.parseInt(env("MEMBER_LIMIT") ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 25;
})();
