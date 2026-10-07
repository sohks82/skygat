import type { Metadata, Viewport } from "next";
import {
  Archivo,
  Barlow_Condensed,
  IBM_Plex_Sans_Condensed,
  Inter,
  JetBrains_Mono,
  Oswald,
  Outfit,
  Playfair_Display,
  Figtree,
  Rajdhani,
  Saira_Condensed,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { isAdmin } from "@/lib/auth";
import { type Theme } from "@/lib/config";
import { getSettings } from "@/lib/settings";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

/**
 * One display face per theme, all exposed under the same variable name so the
 * stylesheet never needs to know which is active.
 *
 * next/font requires each loader to be called and assigned to its own const at
 * module scope, with literal arguments — they are read by static analysis at
 * build time, not evaluated. Hence the repetition below.
 */
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-face",
});
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-face",
});
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-face",
});
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-face",
});
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-face",
});
const saira = Saira_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-face",
});
const plex = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-face",
});
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-face",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-face",
});
const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-face",
});

const DISPLAY: Record<Theme, { variable: string }> = {
  brass: barlow,
  jade: grotesk,
  crimson: oswald,
  azure: rajdhani,
  orchid: archivo,
  sand: saira,
  slate: plex,
  paper: outfit,
  royal: playfair,
  sunburst: figtree,
};

export async function generateMetadata(): Promise<Metadata> {
  const { allianceName } = await getSettings();
  return {
    title: `${allianceName} — Auction Control`,
    description: `Queues, items and auction results for the ${allianceName} alliance.`,
  };
}

const THEME_COLOR: Record<Theme, string> = {
  brass: "#0e141b",
  jade: "#0f1320",
  crimson: "#15100f",
  azure: "#0a121c",
  orchid: "#150f1c",
  sand: "#16130d",
  slate: "#101214",
  paper: "#ffffff",
  royal: "#0a1838",
  sunburst: "#ffe94a",
};

export async function generateViewport(): Promise<Viewport> {
  const { theme } = await getSettings();
  return { themeColor: THEME_COLOR[theme] };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [admin, { theme }] = await Promise.all([isAdmin(), getSettings()]);
  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${DISPLAY[theme].variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen">
        <Nav admin={admin} />
        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
