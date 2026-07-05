"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [descriptionRaw, setDescriptionRaw] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const previewRequestIdRef = useRef(0);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError("");
    setUploading(true);
    const requestId = ++previewRequestIdRef.current;

    // Preview parse (upload happens after job creation)
    const formData = new FormData();
    formData.append("file", f);
    const res = await fetch("/api/files/parse-preview", {
      method: "POST",
      body: formData,
    });

    // Discard the response if a newer file was selected meanwhile
    if (requestId !== previewRequestIdRef.current) return;

    if (res.ok) {
      const data = await res.json();
      setDescriptionRaw(data.text ?? "");
    } else {
      setError("Não foi possível ler o arquivo. Verifique o formato (PDF ou DOCX).");
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, descriptionRaw }),
    });

    if (!res.ok) {
      setError("Erro ao criar vaga. Tente novamente.");
      setSaving(false);
      return;
    }

    const job = await res.json();

    // Upload arquivo se houver
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      await fetch(`/api/jobs/${job.id}/description`, {
        method: "POST",
        body: formData,
      });
    }

    const quizUrl = `${window.location.origin}/q/${job.publicSlug}`;
    router.push(`/dashboard/jobs/${job.id}?created=1&quizUrl=${encodeURIComponent(quizUrl)}`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <a href="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm">
            ← Dashboard
          </a>
          <h1 className="text-lg font-semibold text-slate-900">Nova vaga</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
              Título da vaga
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Analista de Marketing Sênior"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-700 mb-2">
              Descrição da vaga (Job Description)
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Faça upload de um PDF ou DOCX. O texto será extraído automaticamente para revisão.
            </p>
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
              Não é necessário definir um perfil DISC-alvo: ao gerar a análise de fit para
              cada candidato, a IA lê este texto e infere os requisitos comportamentais
              da vaga diretamente da descrição. Quanto mais detalhada a descrição
              (responsabilidades, rotina, tipo de ambiente), mais precisa a análise.
            </p>

            <label className="block">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors">
                <p className="text-sm text-slate-500">
                  {file ? file.name : "Clique ou arraste um PDF ou DOCX (máx 10MB)"}
                </p>
                {uploading && (
                  <p className="text-xs text-indigo-600 mt-2">Processando arquivo...</p>
                )}
              </div>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>

            {descriptionRaw && (
              <div className="mt-4">
                <label htmlFor="desc" className="block text-xs font-medium text-slate-600 mb-1">
                  Texto extraído (editável):
                </label>
                <textarea
                  id="desc"
                  value={descriptionRaw}
                  onChange={(e) => setDescriptionRaw(e.target.value)}
                  rows={10}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <a
              href="/dashboard"
              className="flex-1 text-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </a>
            <button
              type="submit"
              disabled={saving || uploading || !title}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Criando..." : "Criar vaga e gerar link"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
