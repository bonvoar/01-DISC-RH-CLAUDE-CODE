"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  candidateId: string;
  candidateName: string;
  canDownloadPdf: boolean;
}

export function CandidateRowActions({ candidateId, candidateName, canDownloadPdf }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Excluir permanentemente "${candidateName}"? Isso remove respostas, perfil e relatórios. Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setDeleting(true);
    const res = await fetch(`/api/candidates/${candidateId}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      setDeleting(false);
      alert("Erro ao excluir candidato. Tente novamente.");
    }
  }

  return (
    <div className="flex items-center gap-3">
      {canDownloadPdf ? (
        <a
          href={`/api/candidates/${candidateId}/reports/CONSOLIDATED`}
          target="_blank"
          className="text-slate-500 hover:text-indigo-600 text-xs font-medium"
        >
          Baixar PDF
        </a>
      ) : (
        <span className="text-slate-300 text-xs font-medium cursor-not-allowed" title="Perfil ainda não gerado">
          Baixar PDF
        </span>
      )}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
      >
        {deleting ? "Excluindo..." : "Excluir"}
      </button>
    </div>
  );
}
