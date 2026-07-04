"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function QuizStartPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    companyEmail: "",
    consentLGPD: false,
  });

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const res = await fetch("/api/quiz/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, jobSlug: slug }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrors(data.error ?? {});
      setLoading(false);
      return;
    }

    router.push(`/q/${slug}/quiz`);
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900 mb-6">
          Seus dados
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            id="fullName"
            label="Nome completo"
            type="text"
            value={form.fullName}
            onChange={(v) => set("fullName", v)}
            errors={errors.fullName}
          />
          <Field
            id="email"
            label="Seu e-mail pessoal"
            type="email"
            value={form.email}
            onChange={(v) => set("email", v)}
            errors={errors.email}
            hint="Usado apenas para identificação e para eventual solicitação de exclusão de dados (LGPD)"
          />
          <Field
            id="companyEmail"
            label="E-mail da empresa recrutadora"
            type="email"
            value={form.companyEmail}
            onChange={(v) => set("companyEmail", v)}
            errors={errors.companyEmail}
          />

          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={form.consentLGPD}
                onChange={(e) => set("consentLGPD", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              <span className="text-sm text-slate-600">
                Concordo com o uso dos meus dados para fins deste processo seletivo,
                conforme a Lei Geral de Proteção de Dados (LGPD). Sei que a interpretação
                técnica dos resultados é confidencial e acessada apenas pela empresa recrutadora.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !form.consentLGPD}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Iniciando..." : "Iniciar avaliação"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  id, label, type, value, onChange, errors, hint,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  errors?: string[];
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      {errors?.map((msg) => (
        <p key={msg} className="text-xs text-red-600 mt-1">{msg}</p>
      ))}
    </div>
  );
}
