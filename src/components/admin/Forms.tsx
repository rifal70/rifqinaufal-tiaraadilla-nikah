"use client";

import React, { createContext, useContext, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "./ToastContext";
import type { ActionState } from "@/app/admin/actions";

interface FormPendingContextType {
  pending: boolean;
}

const FormPendingContext = createContext<FormPendingContextType>({ pending: false });

export const useFormPending = () => useContext(FormPendingContext);

/**
 * Enhanced Admin Form that handles submissions client-side,
 * catches any server/network errors, prevents Next.js full-page reloads,
 * and displays an error modal with a "Coba Lagi" (retry) button.
 */
export function AdminForm({
  action,
  children,
  id,
  className,
  successMessage = "Berhasil disimpan!",
  errorMessage = "Gagal menyimpan. Silakan coba lagi.",
  onSuccess,
}: {
  action: (formData: FormData) => Promise<ActionState | void>;
  children: React.ReactNode;
  id?: string;
  className?: string;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (res?: ActionState | void) => void;
}) {
  const { showToast, showErrorModal, closeErrorModal } = useToast();
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);

    const execute = async () => {
      setPending(true);
      try {
        const res = await action(formData);
        if (res && res.ok === false) {
          showErrorModal({
            title: "Gagal Menyimpan",
            message: res.error || errorMessage,
            onRetry: execute,
          });
          return;
        }

        // Successfully saved
        closeErrorModal();
        if (successMessage) {
          showToast((res && res.message) || successMessage);
        }
        if (onSuccess) {
          onSuccess(res);
        }
      } catch (err: any) {
        showErrorModal({
          title: "Gagal Menyimpan",
          message: err?.message || errorMessage,
          onRetry: execute,
        });
      } finally {
        setPending(false);
      }
    };

    await execute();
  };

  return (
    <FormPendingContext.Provider value={{ pending }}>
      <form onSubmit={handleSubmit} id={id} className={className}>
        {children}
      </form>
    </FormPendingContext.Provider>
  );
}

/**
 * Submit button that reflects the pending state of either AdminForm or native form.
 */
export function AdminSubmitButton({
  children = "Simpan",
  className = "btn-copy",
  disabled,
  pendingLabel = "Menyimpan...",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
}) {
  const { pending: adminPending } = useFormPending();
  const formStatus = useFormStatus();
  const pending = adminPending || formStatus.pending;

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`${className} ${pending ? "opacity-50 cursor-not-allowed" : ""}`}
      {...props}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/**
 * Generic form wired to an action with popup error retry and message display.
 */
export function ActionForm({
  action,
  children,
  submitLabel,
  id,
  className,
  successMessage,
}: {
  action: (formData: FormData) => Promise<ActionState | void>;
  children: React.ReactNode;
  submitLabel: string;
  id: string;
  className?: string;
  successMessage?: string;
}) {
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  return (
    <AdminForm
      action={async (formData) => {
        const res = await action(formData);
        if (res && res.message) {
          setResultMessage(res.message);
        }
        return res;
      }}
      id={id}
      className={className}
      successMessage={successMessage}
    >
      {children}
      <AdminSubmitButton
        className="btn-gold mt-3"
        id={`${id}-submit`}
        pendingLabel="Memproses..."
      >
        {submitLabel}
      </AdminSubmitButton>
      {resultMessage && (
        <p className="mt-2 text-sm text-green-200 break-all select-all font-mono bg-forest-950/60 p-2 rounded border border-gold-500/20">
          {resultMessage}
        </p>
      )}
    </AdminForm>
  );
}

/** Bulk invitation creator with retry modal on failure. */
export function InviteCreator({
  action,
}: {
  action: (formData: FormData) => Promise<ActionState | void>;
}) {
  return (
    <AdminForm
      action={action}
      successMessage="Undangan berhasil dibuat!"
      errorMessage="Gagal membuat undangan. Silakan periksa format data dan coba lagi."
      className="space-y-4"
    >
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

      <AdminSubmitButton
        className="btn-gold"
        id="create-invites"
        pendingLabel="Membuat undangan..."
      >
        Buat Link Undangan
      </AdminSubmitButton>
    </AdminForm>
  );
}