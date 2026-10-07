import type { Metadata, Viewport } from "next";
import {
  Archivo,
  Barlow_Condensed,
  IBM_Plex_Sans_Condensed,
  Inter,
  JetBrains_Mono,
  Oswald,
  Rajdhani,
  Saira_Condensed,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { isAdmin } from "@/lib/auth";
import { ALLIANCE_NAME, THEME, type Theme } from "@/lib/config";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains" });

/**
 * One display face per theme, each exposed under the same variable name. Only
 * the active theme's class reaches the markup, so only its font is fetched.
 */
const W = ["400", "500", "600", "700"] as const;
const V = "--font-display-face";

const DISPLAY: Record<Theme, { variable: string }> = {
  brass: Barlow_Condensed({ subsets: ["latin"], weight: [...W], variable: V }),
  jade: Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: V }),
  crimson: Oswald({ subsets: ["latin"], weight: [...W], variable: V }),
  azure: Rajdhani({ subsets: ["latin"], weight: [...W], variable: V }),
  orchid: Archivo({ subsets: ["latin"], weight: [...W], variable: V }),
  sand: Saira_Condensed({ subsets: ["latin"], weight: [...W], variable: V }),
  slate: IBM_Plex_Sans_Condensed({ subsets: ["latin"], weight: [...W], variable: V }),
};

export const metadata: Metadata = {
  title: `${ALLIANCE_NAME} — Auction Control`,
  description: `Queues, items and auction results for the ${ALLIANCE_NAME} alliance.`,
};

const THEME_COLOR: Record<Theme, string> = {
  brass: "#0e141b",
  jade: "#0f1320",
  crimson: "#15100f",
  azure: "#0a121c",
  orchid: "#150f1c",
  sand: "#16130d",
  slate: "#101214",
};

export const viewport: Viewport = { themeColor: THEME_COLOR[THEME] };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  return (
    <html
      lang="en"
      data-theme={THEME}
      className={`${DISPLAY[THEME].variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen">
        <Nav admin={admin} />
        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
