"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useFormStatus } from "react-dom";

export type ErrorModalData = {
    message: string;
    title?: string;
    onRetry?: () => Promise<void> | void;
};

type ToastContextType = {
    showToast: (message: string) => void;
    showErrorModal: (data: ErrorModalData) => void;
    closeErrorModal: () => void;
};

const ToastContext = createContext<ToastContextType>({
    showToast: () => { },
    showErrorModal: () => { },
    closeErrorModal: () => { },
});

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [errorModal, setErrorModal] = useState<ErrorModalData | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => {
            setToastMessage(null);
        }, 3000);
    };

    const showErrorModal = (data: ErrorModalData) => {
        setErrorModal(data);
    };

    const closeErrorModal = () => {
        setErrorModal(null);
        setIsRetrying(false);
    };

    const handleRetry = async () => {
        if (!errorModal?.onRetry || isRetrying) return;
        setIsRetrying(true);
        try {
            await errorModal.onRetry();
        } catch (err: any) {
            setErrorModal((prev) =>
                prev ? { ...prev, message: err?.message || prev.message } : null
            );
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <ToastContext.Provider value={{ showToast, showErrorModal, closeErrorModal }}>
            {children}

            {/* Success Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-gold-500/40 bg-[#0d2218]/95 px-5 py-3.5 text-sm font-medium text-gold-300 shadow-2xl backdrop-blur-md transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                        ✓
                    </span>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Error Popup Modal with Coba Lagi */}
            {errorModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isRetrying) {
                            closeErrorModal();
                        }
                    }}
                >
                    <div
                        className="relative w-full max-w-md rounded-2xl border border-red-500/40 bg-[#0c1f17] p-6 text-cream shadow-2xl animate-in zoom-in-95 duration-200"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="admin-error-title"
                        aria-describedby="admin-error-desc"
                    >
                        {/* Glow ambience */}
                        <div className="absolute -top-10 -left-10 h-28 w-28 rounded-full bg-red-500/10 blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-gold-500/10 blur-2xl pointer-events-none" />

                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/30 bg-red-950/60 text-red-400 shadow-inner">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 id="admin-error-title" className="font-display text-xl text-gold-shimmer font-semibold">
                                    {errorModal.title || "Gagal Menyimpan"}
                                </h3>
                                <p id="admin-error-desc" className="mt-2 text-sm text-cream/90 leading-relaxed break-words">
                                    {errorModal.message}
                                </p>
                                <p className="mt-1 text-xs text-cream/60">
                                    Data belum tersimpan ke server. Silakan coba lagi tanpa memuat ulang halaman.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gold-500/15">
                            <button
                                type="button"
                                onClick={closeErrorModal}
                                disabled={isRetrying}
                                className="btn-copy text-xs px-4 py-2"
                            >
                                Tutup
                            </button>
                            {errorModal.onRetry && (
                                <button
                                    type="button"
                                    onClick={handleRetry}
                                    disabled={isRetrying}
                                    className="btn-gold text-xs px-5 py-2 flex items-center gap-2"
                                >
                                    {isRetrying && (
                                        <svg className="animate-spin h-3.5 w-3.5 text-forest-950" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    <span>{isRetrying ? "Mencoba Lagi..." : "Coba Lagi"}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);

export function ToastSubmitButton({
    children = "Simpan",
    className = "btn-copy",
    disabled,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    successMessage?: string;
}) {
    const formStatus = useFormStatus();
    const pending = formStatus.pending;

    return (
        <button
            type="submit"
            disabled={disabled || pending}
            className={`${className} ${pending ? "opacity-50 cursor-not-allowed" : ""}`}
            {...props}
        >
            {pending ? "Menyimpan..." : children}
        </button>
    );
}