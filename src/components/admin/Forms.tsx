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

export function InviteCreator({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="admin-label" htmlFor="guests">
          Format input (satu per baris): <span className="text-gold-300 font-mono">nama;jumlah;urutan_rekening</span>
        </label>
        <p className="text-xs text-green-200/80 mb-2">
          Contoh: <br />
          • <span className="font-mono">Keluarga Budi;4;1</span> (Urutan #1 saja) <br />
          • <span className="font-mono">Siti Rahma;2;1,2</span> (Urutan #1 dan #2) <br />
          • <span className="font-mono">Ahmad Subarjo;1;all</span> (Tampilkan semua rekening aktif) <br />
          • <span className="font-mono">Rian;1;none</span> (Tanpa rekening / amplop disembunyikan)
        </p>
        <textarea
          id="guests"
          name="guests"
          rows={6}
          className="admin-input font-mono text-sm"
          placeholder={"Keluarga Budi;4;1\nSiti Rahma;2;1,2\nAhmad Subarjo;1;all\nRian;1;none"}
          required
        />
      </div>

      <button type="submit" className="btn-gold" id="create-invites">
        Buat Link Undangan
      </button>
    </form>
  );
}