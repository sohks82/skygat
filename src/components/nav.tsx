import Link from "next/link";
import { lockAction } from "@/app/actions";

const LINKS = [
  { href: "/", label: "Board" },
  { href: "/queues", label: "Queues" },
  { href: "/auctions", label: "Auctions" },
  { href: "/history", label: "History" },
  { href: "/members", label: "Members" },
  { href: "/items", label: "Items" },
];

export function Nav({ admin }: { admin: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-void/92 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-baseline gap-2">
          <span className="font-display text-xl font-bold tracking-[0.16em] text-ink">SKYGAT</span>
          <span className="hidden font-display text-[0.68rem] font-semibold tracking-[0.22em] text-brass sm:inline">
            AUCTION CONTROL
          </span>
        </Link>

        <nav className="-mx-1 flex flex-1 items-center gap-0.5 overflow-x-auto">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-sm px-2.5 py-1.5 font-display text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-muted transition-colors hover:bg-panel2 hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {admin ? (
          <form action={lockAction} className="shrink-0">
            <button className="btn btn-tiny" title="Lock editing">
              <span className="text-brass">●</span> Admin
            </button>
          </form>
        ) : (
          <Link href="/unlock" className="btn btn-tiny shrink-0">
            Unlock
          </Link>
        )}
      </div>
    </header>
  );
}
