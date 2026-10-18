"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/app/admin/actions";

type Action = (s: ActionState, f: FormData) => Promise<ActionState>;

/** Generic form wired to a Server Action with status message. */
export function ActionForm({
  action,
  children,
  submitLabel,
  id,
  className,
}: {
  action: Action;
  children: React.ReactNode;
  submitLabel: string;
  id: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} id={id} className={className}>
      {children}
      <button type="submit" className="btn-gold mt-3" disabled={pending} id={`${id}-submit`}>
        {pending ? "Memproses…" : submitLabel}
      </button>
      {state.error && <p className="mt-2 text-sm text-red-300">{state.error}</p>}
      {state.message && <p className="mt-2 text-sm text-green-200 break-all select-all">{state.message}</p>}
    </form>
  );
}

/** Bulk invitation creator — offers the one-time CSV download of raw links. */
export function InviteCreator({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [downloaded, setDownloaded] = useState(false);

  const download = () => {
    if (!state.csv) return;
    const blob = new Blob(["\ufeff" + state.csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `undangan-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    setDownloaded(true);
  };

  return (
    <form action={formAction} id="create-invites" onSubmit={() => setDownloaded(false)}>
      <label htmlFor="names" className="admin-label">
        Nama tamu (satu per baris, opsional <code>;jumlah</code> — contoh: <code>Keluarga Budi;4</code>)
      </label>
      <textarea id="names" name="names" rows={6} className="admin-input" required />
      <button type="submit" className="btn-gold mt-3" disabled={pending} id="create-invites-submit">
        {pending ? "Membuat…" : "Buat Link Undangan"}
      </button>
      {state.error && <p className="mt-2 text-sm text-red-300">{state.error}</p>}
      {state.message && (
        <div className="mt-3 rounded-lg border border-gold-500/40 p-3">
          <p className="text-sm text-gold-200">{state.message}</p>
          {state.csv && (
            <button type="button" id="download-csv" className="btn-copy mt-2" onClick={download}>
              {downloaded ? "CSV terunduh ✓ (unduh lagi)" : "Unduh CSV"}
            </button>
          )}
        </div>
      )}
    </form>
  );
}
