"use client";

import { useRef, useState, useTransition } from "react";
import { removeItemIconAction, setItemIconAction } from "@/app/actions";

const MAX_PX = 128;

/**
 * Shrinks the chosen file to a small square PNG in the browser before it is
 * sent. Keeps stored icons at a few KB each regardless of what gets picked,
 * and means no image library is needed on the server.
 */
async function shrink(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(MAX_PX / bitmap.width, MAX_PX / bitmap.height, 1);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available in this browser.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  return canvas.toDataURL("image/png");
}

export function IconUpload({
  itemId,
  itemName,
  iconSrc,
}: {
  itemId: number;
  itemName: string;
  iconSrc: string | null;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    try {
      const dataUrl = await shrink(file);
      const fd = new FormData();
      fd.set("id", String(itemId));
      fd.set("icon", dataUrl);
      start(async () => {
        try {
          await setItemIconAction(fd);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed.");
        }
      });
    } catch {
      setError("That file could not be read as an image.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={pending}
        title={iconSrc ? `Replace the icon for ${itemName}` : `Add an icon for ${itemName}`}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-sm border border-line bg-void transition-colors hover:border-brass disabled:opacity-40"
      >
        {pending ? (
          <span className="text-[0.6rem] text-muted">…</span>
        ) : iconSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={iconSrc} alt="" className="h-9 w-9 object-contain" />
        ) : (
          <span className="font-display text-[0.6rem] uppercase tracking-wider text-muted">Add</span>
        )}
      </button>

      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={onPick}
        className="hidden"
      />

      {iconSrc ? (
        <form action={removeItemIconAction}>
          <input type="hidden" name="id" value={itemId} />
          <button className="btn btn-ghost btn-tiny hover:text-danger" title="Remove icon">
            ✕
          </button>
        </form>
      ) : null}

      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  );
}
