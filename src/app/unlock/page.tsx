"use client";

import { useActionState } from "react";
import { unlockAction } from "@/app/actions";

export default function UnlockPage() {
  const [error, formAction, pending] = useActionState(unlockAction, undefined);

  return (
    <div className="mx-auto max-w-sm pt-16">
      <p className="eyebrow">Admin</p>
      <h1 className="mt-1 text-3xl font-semibold">Unlock editing</h1>
      <p className="mt-2 text-sm text-muted">
        Everyone can read the board. The PIN is only needed to change queues, items and results.
      </p>

      <form action={formAction} className="mt-6 space-y-3">
        <input
          name="pin"
          type="password"
          className="field"
          placeholder="Admin PIN"
          autoComplete="current-password"
          autoFocus
          required
        />
        <button className="btn btn-primary w-full justify-center" disabled={pending}>
          {pending ? "Checking…" : "Unlock"}
        </button>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </form>
    </div>
  );
}
