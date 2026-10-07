import { cache } from "react";
import { sql } from "./db";
import {
  ALLIANCE_NAME as ENV_ALLIANCE_NAME,
  THEME as ENV_THEME,
  THEMES,
  type Theme,
} from "./config";

export type Settings = {
  theme: Theme;
  allianceName: string;
};

/**
 * Live settings, overriding the environment defaults.
 *
 * Wrapped in React's cache so the layout, the nav and the page all share one
 * query per request. Falls back to the environment if the settings table is
 * missing, so the app still renders before migration 003 has been run.
 */
export const getSettings = cache(async (): Promise<Settings> => {
  try {
    const rows = (await sql`select key, value from settings`) as { key: string; value: string }[];
    const map = new Map(rows.map((r) => [r.key, r.value]));

    const theme = map.get("theme")?.trim().toLowerCase();
    const name = map.get("alliance_name")?.trim();

    return {
      theme: (THEMES as readonly string[]).includes(theme ?? "") ? (theme as Theme) : ENV_THEME,
      allianceName: name || ENV_ALLIANCE_NAME,
    };
  } catch {
    return { theme: ENV_THEME, allianceName: ENV_ALLIANCE_NAME };
  }
});
