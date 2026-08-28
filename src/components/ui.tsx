import type { ReactNode } from "react";

export function PageHead({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-semibold leading-none">{title}</h1>
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-sm border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
      {children}
    </p>
  );
}

/** Bullet cost, always in the mono face so columns of numbers line up. */
export function Bullets({ n }: { n: number }) {
  return (
    <span className="font-mono text-[0.78rem] text-brass">
      {n.toLocaleString()}
      <span className="ml-1 text-[0.66rem] text-brass-dim">BLT</span>
    </span>
  );
}

const DAY_TONE: Record<string, string> = {
  War: "text-danger",
  League: "text-signal",
  Glory: "text-brass",
  Other: "text-muted",
};

export function DayChip({ type }: { type: string }) {
  return <span className={`chip ${DAY_TONE[type] ?? "text-muted"}`}>{type}</span>;
}

const STATUS_TONE: Record<string, string> = {
  planned: "text-signal",
  completed: "text-ok",
  archived: "text-muted",
};

export function StatusChip({ status }: { status: string }) {
  return <span className={`chip ${STATUS_TONE[status] ?? "text-muted"}`}>{status}</span>;
}

export function AdminOnly({ admin, children }: { admin: boolean; children: ReactNode }) {
  return admin ? <>{children}</> : null;
}
