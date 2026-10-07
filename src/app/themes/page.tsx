import { THEMES, type Theme } from "@/lib/config";
import { getSettings } from "@/lib/settings";
import { isAdmin } from "@/lib/auth";
import { setAllianceNameAction, setThemeAction } from "@/app/actions";
import { PageHead } from "@/components/ui";

export const dynamic = "force-dynamic";

const BLURB: Record<Theme, string> = {
  brass: "Deep steel with warm amber. Barlow Condensed.",
  jade: "Night indigo with jade and violet. Space Grotesk.",
  crimson: "Warm charcoal with ember and gold. Oswald.",
  azure: "Deep navy with electric blue. Rajdhani.",
  orchid: "Plum with magenta and teal. Archivo.",
  sand: "Sepia with pale gold. Saira Condensed.",
  slate: "Graphite with silver, near monochrome. IBM Plex Sans Condensed.",
  paper: "White, rounded cards, soft shadows, sentence case. Outfit.",
  royal: "Royal blue surfaces with gold. Playfair Display, a serif.",
  sunburst: "Bright yellow page, white panels, deep orange. Figtree.",
};

/** Written out in full so Tailwind keeps these classes at build time. */
const SWATCHES = [
  { label: "accent", className: "bg-accent" },
  { label: "signal", className: "bg-signal" },
  { label: "ok", className: "bg-ok" },
  { label: "danger", className: "bg-danger" },
  { label: "muted", className: "bg-muted" },
  { label: "panel2", className: "bg-panel2" },
] as const;

export default async function ThemesPage() {
  const [admin, { theme: active, allianceName }] = await Promise.all([isAdmin(), getSettings()]);

  return (
    <>
      <PageHead eyebrow="Name and theme" title="Appearance" />

      {admin ? (
        <form
          action={setAllianceNameAction}
          className="panel mb-6 grid gap-2 p-3 sm:grid-cols-[1fr_auto]"
        >
          <input
            name="alliance_name"
            defaultValue={allianceName}
            maxLength={40}
            className="field"
            placeholder="Alliance name"
            required
          />
          <button className="btn btn-primary">Save name</button>
          <p className="text-xs text-muted sm:col-span-2">
            Shown in the header and the browser tab. Takes effect immediately.
          </p>
        </form>
      ) : null}

      <p className="mb-6 max-w-2xl text-sm text-muted">
        {admin
          ? "Pick a theme and it applies straight away — no redeploy. The swatches are live, so the colours below are exactly what each one renders."
          : "The swatches below are live — these are exactly the colours each theme renders."}{" "}
        Type faces differ too, but only the active theme&apos;s font is downloaded, so every card
        here is drawn in {active}&apos;s face.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {THEMES.map((name) => (
          <div key={name} data-theme={name} className="rounded-sm border border-line bg-void p-3">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-semibold uppercase tracking-[0.14em] text-ink">
                {name}
              </h2>
              {name === active ? <span className="chip text-accent">Active</span> : null}
            </div>

            <p className="mb-3 text-xs text-muted">{BLURB[name]}</p>

            {/* A queue card in miniature — the element people look at most. */}
            <div className="mb-3 rounded-sm border border-line bg-panel">
              <div className="flex items-baseline justify-between border-b border-line px-2.5 py-1.5">
                <span className="font-display text-sm font-semibold text-ink">Costume</span>
                <span className="font-mono text-[0.7rem] text-accent">
                  2200<span className="ml-1 text-accent-dim">BLT</span>
                </span>
              </div>
              <div className="flex items-center gap-2 border-l-2 border-l-accent row-next py-1 pl-2 pr-2">
                <span className="w-3 text-right font-mono text-[0.7rem] text-accent">1</span>
                <span className="flex-1 truncate text-xs text-ink">Taemin</span>
                <span className="chip text-accent">Next</span>
              </div>
              <div className="flex items-center gap-2 border-l-2 border-l-transparent py-1 pl-2 pr-2">
                <span className="w-3 text-right font-mono text-[0.7rem] text-muted">2</span>
                <span className="flex-1 truncate text-xs text-ink/85">Pigu</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SWATCHES.map(({ label, className }) => (
                <span
                  key={label}
                  title={label}
                  className={`h-5 w-5 rounded-[2px] border border-line ${className}`}
                />
              ))}
            </div>

            {admin && name !== active ? (
              <form action={setThemeAction} className="mt-3">
                <input type="hidden" name="theme" value={name} />
                <button className="btn w-full justify-center">Use {name}</button>
              </form>
            ) : (
              <code className="mt-3 block font-mono text-[0.68rem] text-muted">
                {name === active ? "in use" : `THEME=${name}`}
              </code>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
