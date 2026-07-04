"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Report } from "@prisma/client";

interface Props {
  candidateId: string;
  profileReport: Report | null;
  fitReport: Report | null;
  hasJobDescription: boolean;
  candidateStatus: string;
}

export function CandidateReportView({
  candidateId,
  profileReport,
  fitReport,
  hasJobDescription,
  candidateStatus,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "fit">("profile");
  const [generatingFit, setGeneratingFit] = useState(false);
  const [fitError, setFitError] = useState("");

  const profileReady = ["PROFILE_READY", "FIT_GENERATED"].includes(candidateStatus);

  async function handleGenerateFit() {
    setGeneratingFit(true);
    setFitError("");
    const res = await fetch(`/api/candidates/${candidateId}/generate-fit`, {
      method: "POST",
    });
    if (res.ok) {
      setActiveTab("fit");
      router.refresh();
    } else {
      const data = await res.json();
      setFitError(data.error ?? "Erro ao gerar análise. Tente novamente.");
    }
    setGeneratingFit(false);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Tabs */}
      <div role="tablist" className="flex border-b border-slate-200">
        <button
          role="tab"
          id="tab-profile"
          aria-selected={activeTab === "profile"}
          aria-controls="tabpanel-profile"
          onClick={() => setActiveTab("profile")}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "profile"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Perfil Comportamental
        </button>
        <button
          role="tab"
          id="tab-fit"
          aria-selected={activeTab === "fit"}
          aria-controls="tabpanel-fit"
          onClick={() => setActiveTab("fit")}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "fit"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Análise de Fit
        </button>

        <div className="ml-auto flex items-center px-4 gap-2">
          <a
            href={`/api/candidates/${candidateId}/reports/CONSOLIDATED`}
            target="_blank"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Exportar PDF
          </a>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6">
        {activeTab === "profile" && (
          <div role="tabpanel" id="tabpanel-profile" aria-labelledby="tab-profile">
            {!profileReady ? (
              <div className="text-center py-10">
                <div className="animate-pulse text-slate-400 text-4xl mb-3">⏳</div>
                <p className="text-slate-500">
                  O perfil comportamental está sendo gerado...
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Isso pode levar até 60 segundos. Recarregue a página em breve.
                </p>
              </div>
            ) : profileReport ? (
              <MarkdownContent content={profileReport.contentMd} />
            ) : (
              <p className="text-slate-500">Perfil não disponível.</p>
            )}
          </div>
        )}

        {activeTab === "fit" && (
          <div role="tabpanel" id="tabpanel-fit" aria-labelledby="tab-fit">
            {fitReport ? (
              <MarkdownContent content={fitReport.contentMd} />
            ) : (
              <div className="text-center py-10">
                {!hasJobDescription ? (
                  <div>
                    <p className="text-slate-500 mb-2">
                      Para gerar a análise de fit, faça upload da descrição da vaga.
                    </p>
                    <a
                      href={`/dashboard/jobs/new`}
                      className="text-indigo-600 text-sm hover:underline"
                    >
                      Adicionar descrição da vaga
                    </a>
                  </div>
                ) : !profileReady ? (
                  <p className="text-slate-500">
                    Aguarde o perfil comportamental ser gerado antes de gerar o fit.
                  </p>
                ) : (
                  <div>
                    <p className="text-slate-600 mb-4">
                      Gere a análise de compatibilidade entre este candidato e a vaga.
                    </p>
                    {fitError && (
                      <p className="text-red-600 text-sm mb-3">{fitError}</p>
                    )}
                    <button
                      onClick={handleGenerateFit}
                      disabled={generatingFit}
                      className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {generatingFit ? "Gerando análise..." : "Gerar Análise de Fit"}
                    </button>
                    <p className="text-xs text-slate-400 mt-2">
                      Processamento assíncrono — pode levar até 60s.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  // Renderização simples de Markdown com preservação de parágrafo
  const lines = content.split("\n");
  const elements = lines.map((line, i) => {
    if (line.startsWith("## ")) {
      return <h2 key={i} className="text-lg font-semibold text-slate-900 mt-6 mb-2">{line.slice(3)}</h2>;
    }
    if (line.startsWith("### ")) {
      return <h3 key={i} className="text-base font-semibold text-slate-800 mt-4 mb-1">{line.slice(4)}</h3>;
    }
    if (line.startsWith("**") && line.endsWith("**")) {
      return <p key={i} className="font-semibold text-slate-800">{line.slice(2, -2)}</p>;
    }
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return <li key={i} className="ml-4 text-slate-600 list-disc">{line.slice(2)}</li>;
    }
    if (line.startsWith("---")) {
      return <hr key={i} className="border-slate-200 my-4" />;
    }
    if (line.trim() === "") {
      return <div key={i} className="h-2" />;
    }
    // Semáforo
    if (line.includes("🟢") || line.includes("🟡") || line.includes("🔴")) {
      const semaphoreColor = line.includes("🟢")
        ? "bg-green-50 border-green-200"
        : line.includes("🟡")
        ? "bg-amber-50 border-amber-200"
        : "bg-red-50 border-red-200";
      return (
        <div key={i} className={`border rounded-lg p-4 my-4 font-medium text-slate-800 ${semaphoreColor}`}>
          {line}
        </div>
      );
    }
    return <p key={i} className="text-slate-700 leading-relaxed">{line}</p>;
  });

  return <div className="prose-sm max-w-none space-y-1">{elements}</div>;
}
