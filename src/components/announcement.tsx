"use client";

import { useState } from "react";

/**
 * The generated text is a starting point, not a fixed format — it lands in a
 * textarea so the wording can be adjusted before it goes out.
 */
export function Announcement({ initial, missing }: { initial: string; missing: string[] }) {
  const [text, setText] = useState(initial);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older browsers and non-secure contexts fall back to a manual select.
      const el = document.getElementById("announcement") as HTMLTextAreaElement | null;
      el?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const lines = text.split("\n").length;

  return (
    <section className="mb-8">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <p className="eyebrow">WhatsApp announcement</p>
        <button onClick={copy} className="btn btn-primary btn-tiny">
          {copied ? "Copied" : "Copy"}
        </button>
        <button onClick={() => setText(initial)} className="btn btn-ghost btn-tiny">
          Reset
        </button>
      </div>

      {missing.length > 0 ? (
        <p className="mb-2 text-xs text-danger">
          No WhatsApp handle set for {missing.join(", ")} — their in-game name is used instead. Add
          handles on the Members page.
        </p>
      ) : null}

      <textarea
        id="announcement"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={Math.min(Math.max(lines + 1, 8), 40)}
        spellCheck={false}
        className="field w-full resize-y font-mono text-[0.8rem] leading-relaxed"
      />

      <p className="mt-1.5 text-xs text-muted">
        Edit freely before sending. Asterisks are WhatsApp&apos;s bold markers and survive the paste.
      </p>
    </section>
  );
}
