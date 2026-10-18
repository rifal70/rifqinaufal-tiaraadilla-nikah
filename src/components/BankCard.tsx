"use client";

import { useState } from "react";
import type { BankAccount } from "@/lib/content";

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function BankCard({ account }: { account: BankAccount }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const disabled = !account.is_enabled;

  const onCopy = async () => {
    const ok = await copyText(account.account_number);
    setState(ok ? "copied" : "failed");
    setTimeout(() => setState("idle"), 2500);
  };

  return (
    <div className={`bank-card ${disabled ? "bank-card-disabled" : ""}`} id={`bank-${account.id}`}>
      <p className="text-xs uppercase tracking-[0.25em] text-gold-300">{account.bank_name}</p>
      <p className="mt-3 font-display text-2xl text-cream select-all break-all" style={{ fontVariantNumeric: "tabular-nums" }}>
        {account.account_number}
      </p>
      <p className="mt-1 text-sm text-green-100">a.n. {account.account_holder}</p>
      {!disabled && (
        <button
          type="button"
          id={`copy-${account.id}`}
          onClick={onCopy}
          className={`btn-copy mt-4 ${state === "copied" ? "copied" : ""}`}
          aria-live="polite"
        >
          {state === "copied" ? "Tersalin ✓" : state === "failed" ? "Gagal, salin manual" : "Salin Nomor"}
        </button>
      )}
    </div>
  );
}
