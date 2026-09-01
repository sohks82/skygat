import { sql } from "@/lib/db";

/**
 * Serves an item's icon. Stored as a data URL in Postgres and decoded here, so
 * pages carry a short <img src> rather than the image bytes themselves.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number.parseInt((await params).id, 10);
  if (!Number.isFinite(id)) return new Response("Bad id", { status: 400 });

  const rows = (await sql`select icon from items where id = ${id}`) as { icon: string | null }[];
  const icon = rows[0]?.icon;
  if (!icon) return new Response("Not found", { status: 404 });

  const match = /^data:([^;]+);base64,(.+)$/s.exec(icon);
  if (!match) return new Response("Malformed icon", { status: 500 });

  const [, mime, b64] = match;
  const bytes = Buffer.from(b64, "base64");

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(bytes.length),
      // The URL carries a version param, so a stored icon can be cached hard.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
