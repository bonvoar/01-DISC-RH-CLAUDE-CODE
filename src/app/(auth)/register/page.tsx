"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    companyDomain: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrors(data.error ?? {});
      setLoading(false);
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900 mb-6">
          Cadastrar empresa recrutadora
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(
            [
              { id: "name", label: "Seu nome", type: "text" },
              { id: "email", label: "E-mail profissional", type: "email" },
              { id: "password", label: "Senha (mín. 8 caracteres)", type: "password" },
              { id: "companyName", label: "Nome da empresa", type: "text" },
              { id: "companyDomain", label: "Domínio da empresa (ex: empresa.com.br)", type: "text" },
            ] as const
          ).map(({ id, label, type }) => (
            <div key={id}>
              <label
                htmlFor={id}
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                {label}
              </label>
              <input
                id={id}
                type={type}
                required
                value={form[id]}
                onChange={(e) => set(id, e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors[id]?.map((msg) => (
                <p key={msg} className="text-xs text-red-600 mt-1">
                  {msg}
                </p>
              ))}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Cadastrando..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link href="/login" className="text-indigo-600 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
