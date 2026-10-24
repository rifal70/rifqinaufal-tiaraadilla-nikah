"use client";

import React, { createContext, useContext, useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "./ToastContext";
import type { ActionState, CreatedInvite } from "@/app/admin/actions";
import { regenerateLinkAction } from "@/app/admin/actions";
import { sanitizeInviteUrl } from "@/lib/url";

interface FormPendingContextType {
  pending: boolean;
}

const FormPendingContext = createContext<FormPendingContextType>({ pending: false });

export const useFormPending = () => useContext(FormPendingContext);

/**
 * Reusable Copy Button with copy icon and instant visual feedback
 */
export function CopyButton({
  text,
  label = "Salin",
  copiedLabel = "Tersalin!",
  className = "btn-copy text-[11px] py-1 px-2.5",
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanText = sanitizeInviteUrl(text);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(cleanText);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = cleanText;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${className} transition-all duration-200 ${
        copied
          ? "!border-emerald-400 !text-emerald-300 !bg-emerald-950/60 font-semibold"
          : ""
      }`}
      title="Salin link undangan ke clipboard"
    >
      {copied ? `✓ ${copiedLabel}` : label}
    </button>
  );
}

/**
 * Click-to-select input box with Copy button and Link Baru button for invitation links.
 */
export function CopyableLinkInput({
  initialUrl,
  invitationId,
  className = "w-44",
}: {
  initialUrl: string | null;
  invitationId?: string;
  className?: string;
}) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(initialUrl ? sanitizeInviteUrl(initialUrl) : null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { showToast, showErrorModal } = useToast();

  const handleRegenerate = async () => {
    if (!invitationId || isRegenerating) return;

    if (currentUrl) {
      const confirmRegen = window.confirm(
        "Link lama tidak akan bisa diakses lagi setelah link baru dibuat. Yakin ingin membuat link baru?"
      );
      if (!confirmRegen) return;
    }

    setIsRegenerating(true);
    try {
      const fd = new FormData();
      fd.append("id", invitationId);
      const res = await regenerateLinkAction(fd);
      if (res.ok && res.message) {
        setCurrentUrl(res.message);
        try {
          await navigator.clipboard.writeText(res.message);
          showToast("Link baru berhasil dibuat & disalin!");
        } catch {
          showToast("Link baru berhasil dibuat!");
        }
      } else {
        showErrorModal({
          title: "Gagal Membuat Link Baru",
          message: res.error || "Gagal membuat link undangan baru.",
          onRetry: handleRegenerate,
        });
      }
    } catch (err: any) {
      showErrorModal({
        title: "Gagal Membuat Link Baru",
        message: err?.message || "Terjadi kesalahan.",
        onRetry: handleRegenerate,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const cleanUrl = sanitizeInviteUrl(currentUrl);

  return (
    <div className="flex items-center gap-1.5 min-w-[280px]">
      {cleanUrl ? (
        <>
          <input
            type="text"
            readOnly
            value={cleanUrl}
            className={`${className} truncate bg-forest-900/60 border border-gold-500/20 rounded px-2 py-1 text-gold-200 font-mono text-[11px] select-all cursor-pointer focus:border-gold-400 focus:outline-none`}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            title={cleanUrl}
          />
          <CopyButton text={cleanUrl} label="Salin" />
          {invitationId && (
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="btn-copy text-[11px] py-1 px-2 text-gold-300 hover:text-gold-200 whitespace-nowrap"
              title="Buat link baru (link lama akan hangus)"
            >
              {isRegenerating ? "Membuat..." : "Link baru"}
            </button>
          )}
        </>
      ) : invitationId ? (
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="btn-copy text-[11px] py-1 px-2.5 text-gold-300 hover:text-gold-200"
        >
          {isRegenerating ? "Membuat..." : "Buat Link"}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Enhanced Admin Form that handles submissions client-side,
 * catches any server/network errors, prevents Next.js full-page reloads,
 * and displays an error modal with a "Coba Lagi" (retry) button.
 */
export function AdminForm({
  actionFn,
  children,
  id,
  className,
  successMessage = "Berhasil disimpan!",
  errorMessage = "Gagal menyimpan. Silakan coba lagi.",
  onSuccess,
}: {
  actionFn: (formData: FormData) => Promise<ActionState | void>;
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
        const res = await actionFn(formData);
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
  let statusPending = false;
  try {
    const formStatus = useFormStatus();
    statusPending = formStatus.pending;
  } catch {
    statusPending = false;
  }
  const pending = adminPending || statusPending;

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
  actionFn,
  children,
  submitLabel,
  id,
  className,
  successMessage,
}: {
  actionFn: (formData: FormData) => Promise<ActionState | void>;
  children: React.ReactNode;
  submitLabel: string;
  id: string;
  className?: string;
  successMessage?: string;
}) {
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  return (
    <AdminForm
      actionFn={async (formData) => {
        const res = await actionFn(formData);
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
        <p className="mt-2 text-xs text-emerald-300 flex items-center gap-1.5 font-medium">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
            ✓
          </span>
          <span>{resultMessage}</span>
        </p>
      )}
    </AdminForm>
  );
}

/**
 * Regenerate button for legacy invitations that don't have token saved yet
 */
export function RegenerateAndCopyButton({
  invitationId,
  siteUrl,
}: {
  invitationId: string;
  siteUrl: string;
}) {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast, showErrorModal } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("id", invitationId);
      const res = await regenerateLinkAction(fd);
      if (res.ok && res.message) {
        setLink(res.message);
        try {
          await navigator.clipboard.writeText(res.message);
          showToast("Link dibuat dan berhasil disalin!");
        } catch {
          showToast("Link berhasil dibuat!");
        }
      } else {
        showErrorModal({
          title: "Gagal Membuat Link",
          message: res.error || "Gagal membuat link undangan.",
          onRetry: handleGenerate,
        });
      }
    } catch (err: any) {
      showErrorModal({
        title: "Gagal Membuat Link",
        message: err?.message || "Terjadi kesalahan.",
        onRetry: handleGenerate,
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanLink = link ? sanitizeInviteUrl(link) : null;

  if (cleanLink) {
    return (
      <div className="flex items-center gap-1.5 max-w-xs">
        <input
          type="text"
          readOnly
          value={cleanLink}
          className="w-44 truncate bg-forest-900/60 border border-gold-500/20 rounded px-2 py-1 text-gold-200 font-mono text-[11px] select-all cursor-pointer"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <CopyButton text={cleanLink} label="Salin" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      className="btn-copy text-[11px] py-1 px-2 text-gold-300"
    >
      {loading ? "Membuat..." : "Buat & Salin Link"}
    </button>
  );
}

/** Bulk invitation creator with link column and copy button after input is done. */
export function InviteCreator({
  actionFn,
}: {
  actionFn: (formData: FormData) => Promise<ActionState | void>;
}) {
  const [createdList, setCreatedList] = useState<CreatedInvite[] | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = async () => {
    if (!createdList || createdList.length === 0) return;
    const allText = createdList
      .map((item) => `${item.name} (${item.count} pax): ${sanitizeInviteUrl(item.url)}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(allText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch {
      // fallback
      const textArea = document.createElement("textarea");
      textArea.value = allText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
  };

  return (
    <div className="space-y-4">
      <AdminForm
        actionFn={actionFn}
        successMessage="Undangan berhasil dibuat!"
        errorMessage="Gagal membuat undangan. Silakan periksa format data dan coba lagi."
        className="space-y-4"
        onSuccess={(res) => {
          if (res && res.createdInvites && res.createdInvites.length > 0) {
            setCreatedList(res.createdInvites);
          }
        }}
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

      {/* Tampilan kolom link dan button copy setelah selesai diinput */}
      {createdList && createdList.length > 0 && (
        <div className="mt-6 rounded-xl border border-gold-500/40 bg-forest-950/90 p-4 space-y-4 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold-500/20 pb-3">
            <div>
              <h4 className="font-display text-lg text-gold-300 font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                  ✓
                </span>
                {createdList.length} Undangan Berhasil Dibuat
              </h4>
              <p className="text-xs text-cream/70 mt-0.5">
                Link undangan tamu Anda sudah siap. Silakan salin link di bawah ini:
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyAll}
              className="btn-copy text-xs flex items-center gap-1.5 py-1.5 px-3"
            >
              {copiedAll ? "✓ Semua Tersalin!" : "📋 Salin Semua Link"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-gold-300 border-b border-gold-500/20 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Nama Tamu</th>
                  <th className="py-2.5 px-3">Pax</th>
                  <th className="py-2.5 px-3">Kolom Link Undangan</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-500/10">
                {createdList.map((item, idx) => {
                  const cleanUrl = sanitizeInviteUrl(item.url);
                  return (
                    <tr key={idx} className="hover:bg-gold-500/5 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-cream">{item.name}</td>
                      <td className="py-2.5 px-3 text-cream/80">{item.count} pax</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            readOnly
                            value={cleanUrl}
                            className="w-full min-w-[240px] bg-forest-900/80 border border-gold-500/25 rounded px-2.5 py-1.5 text-gold-200 font-mono text-[11px] select-all cursor-pointer focus:border-gold-400 focus:outline-none"
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <CopyButton text={cleanUrl} label="Salin Link" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function isValidMediaUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (
    trimmed === "" ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "-" ||
    trimmed === "none" ||
    trimmed === "/api/media" ||
    trimmed === "/api/media/" ||
    trimmed === "/api/media/null" ||
    trimmed === "/api/media/undefined" ||
    trimmed.startsWith("[PLACEHOLDER")
  ) {
    return false;
  }
  return true;
}

/**
 * File upload component with persistent preview of existing asset
 * and instant preview when choosing a new image or audio file.
 */
export function FileUploadWithPreview({
  actionFn,
  deleteActionFn,
  kind,
  label,
  accept,
  submitLabel,
  currentUrl,
  id,
  isAudio = false,
  hint,
}: {
  actionFn: (formData: FormData) => Promise<ActionState | void>;
  deleteActionFn?: (formData: FormData) => Promise<ActionState | void>;
  kind: string;
  label: string;
  accept: string;
  submitLabel: string;
  currentUrl?: string | null;
  id: string;
  isAudio?: boolean;
  hint?: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeUrl, setActiveUrl] = useState<string | null>(
    isValidMediaUrl(currentUrl) ? currentUrl! : null
  );
  const [hasLoadError, setHasLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const hasValidActiveUrl = isValidMediaUrl(activeUrl) && !hasLoadError;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objUrl = URL.createObjectURL(file);
      setPreviewUrl(objUrl);
      setHasLoadError(false);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteActionFn) return;
    const confirmDel = window.confirm(`Yakin ingin menghapus ${label}?`);
    if (!confirmDel) return;
    const fd = new FormData();
    fd.append("kind", kind);
    const res = await deleteActionFn(fd);
    if (res && res.ok !== false) {
      setActiveUrl(null);
      setPreviewUrl(null);
      setHasLoadError(false);
      showToast(`${label} berhasil dihapus.`);
    }
  };

  return (
    <div className="rounded-xl border border-gold-500/20 bg-forest-950/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <label className="admin-label font-medium text-gold-200" htmlFor={`${id}-file`}>
            {label}
          </label>
          {hint && <p className="text-xs text-green-200/70 mt-0.5">{hint}</p>}
        </div>
        <div className="flex items-center gap-2">
          {hasValidActiveUrl && !previewUrl && (
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
              ✓ Sudah ada
            </span>
          )}
          {hasValidActiveUrl && deleteActionFn && !previewUrl && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-[11px] font-medium text-red-300 hover:text-red-200 bg-red-950/40 border border-red-500/20 px-2 py-0.5 rounded-full"
              title="Hapus file ini"
            >
              Hapus
            </button>
          )}
        </div>
      </div>

      {/* Container Preview */}
      {(previewUrl || hasValidActiveUrl) && (
        <div className="rounded-lg border border-gold-500/30 bg-black/40 p-3">
          <p className="text-[11px] text-gold-300 mb-2 font-medium">
            {previewUrl ? "Preview file baru dipilih:" : "Preview file saat ini terpasang:"}
          </p>
          {isAudio ? (
            <div className="space-y-1.5">
              <audio
                controls
                src={previewUrl || (hasValidActiveUrl ? activeUrl! : undefined)}
                className="w-full h-9 rounded"
                onError={() => {
                  if (!previewUrl) setHasLoadError(true);
                }}
              />
              <p className="text-[10px] text-cream/60">
                Klik play untuk mendengarkan pratinjau audio.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative group overflow-hidden rounded-lg border border-gold-500/30 w-28 h-28 shrink-0 bg-black/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl || (hasValidActiveUrl ? activeUrl! : "")}
                  alt={label}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={() => {
                    if (!previewUrl) {
                      setHasLoadError(true);
                    }
                  }}
                />
              </div>
              <div className="text-xs text-cream/80 space-y-1">
                <a
                  href={previewUrl || (hasValidActiveUrl ? activeUrl! : "#")}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gold-300 hover:text-gold-200 underline font-medium inline-block"
                >
                  Buka Gambar Ukuran Penuh ↗
                </a>
                <p className="text-[11px] text-cream/50">
                  {previewUrl ? "Belum diunggah. Klik tombol di bawah untuk menyimpan." : "File ini sudah aktif di website."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Upload */}
      <AdminForm
        actionFn={async (formData) => {
          const res = await actionFn(formData);
          if (res?.ok) {
            if (previewUrl) {
              setActiveUrl(previewUrl);
              setPreviewUrl(null);
            }
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }
          return res;
        }}
        id={id}
        successMessage={`${label} berhasil diunggah!`}
        className="space-y-2 pt-1"
      >
        <input type="hidden" name="kind" value={kind} />
        <input
          ref={fileInputRef}
          id={`${id}-file`}
          name="file"
          type="file"
          accept={accept}
          required
          onChange={handleFileChange}
          className="admin-input text-xs cursor-pointer"
        />
        <AdminSubmitButton
          className="btn-gold w-full text-xs py-2 mt-2"
          id={`${id}-submit`}
          pendingLabel="Mengunggah..."
        >
          {submitLabel}
        </AdminSubmitButton>
      </AdminForm>
    </div>
  );
}

/**
 * Gallery upload component with multi-file preview before uploading.
 */
export function GalleryUploadWithPreview({
  actionFn,
}: {
  actionFn: (formData: FormData) => Promise<ActionState | void>;
}) {
  const [selectedPreviews, setSelectedPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const urls = Array.from(files).map((f) => URL.createObjectURL(f));
      setSelectedPreviews(urls);
    } else {
      setSelectedPreviews([]);
    }
  };

  return (
    <div className="space-y-3">
      {selectedPreviews.length > 0 && (
        <div className="rounded-xl border border-gold-500/30 bg-black/40 p-3">
          <p className="text-xs text-gold-300 mb-2 font-medium">
            Pratinjau {selectedPreviews.length} foto baru yang dipilih:
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {selectedPreviews.map((url, idx) => (
              <div key={idx} className="aspect-square rounded-lg border border-gold-500/20 overflow-hidden bg-black/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <AdminForm
        actionFn={async (formData) => {
          const res = await actionFn(formData);
          if (res?.ok) {
            setSelectedPreviews([]);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }
          return res;
        }}
        id="upload-gallery"
        successMessage="Foto galeri berhasil diunggah!"
      >
        <label className="admin-label" htmlFor="gallery-files">
          Foto (JPG/PNG/WebP, maks 255 KB per unggahan — pilih beberapa sekaligus bila kecil)
        </label>
        <input
          ref={fileInputRef}
          id="gallery-files"
          name="files"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          required
          onChange={handleFilesChange}
          className="admin-input cursor-pointer"
        />
        <AdminSubmitButton
          className="btn-gold mt-3"
          id="upload-gallery-submit"
          pendingLabel="Mengunggah foto..."
        >
          Unggah Foto ke Galeri
        </AdminSubmitButton>
      </AdminForm>
    </div>
  );
}