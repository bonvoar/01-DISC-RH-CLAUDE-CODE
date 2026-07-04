"use client";

import { useState } from "react";

export function CopyLinkButton({ quizLink }: { quizLink: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(quizLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
    >
      {copied ? "Copiado!" : "Copiar"}
    </button>
  );
}
