"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useFormStatus } from "react-dom";

type ToastContextType = {
    showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextType>({
    showToast: () => { },
});

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => {
            setToastMessage(null);
        }, 2500);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-gold-500/40 bg-emerald-950/95 px-5 py-3 text-sm font-medium text-gold-300 shadow-2xl backdrop-blur-md transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-2">
                    <span>✓</span>
                    <span>{toastMessage}</span>
                </div>
            )}
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);

export function ToastSubmitButton({
    children = "Simpan",
    className = "btn-copy",
    successMessage = "Berhasil disimpan!",
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    successMessage?: string;
}) {
    const { pending } = useFormStatus();
    const { showToast } = useToast();
    const wasPending = useRef(false);

    useEffect(() => {
        if (wasPending.current && !pending) {
            showToast(successMessage);
        }
        wasPending.current = pending;
    }, [pending, successMessage, showToast]);

    return (
        <button
            type="submit"
            disabled={pending}
            className={`${className} ${pending ? "opacity-50 cursor-not-allowed" : ""}`}
            {...props}
        >
            {pending ? "Menyimpan..." : children}
        </button>
    );
}