import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const [companies, totalCandidates, aiUsage] = await Promise.all([
    prisma.company.findMany({
      include: {
        _count: { select: { recruiters: true, jobs: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.candidate.count(),
    prisma.report.aggregate({
      _sum: { tokensInput: true, tokensOutput: true },
    }),
  ]);

  const totalTokens =
    (aiUsage._sum.tokensInput ?? 0) + (aiUsage._sum.tokensOutput ?? 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">Admin Console</h1>
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
            Portal RH
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Métricas gerais */}
        <div className="grid grid-cols-3 gap-4">
          <MetricCard label="Empresas" value={String(companies.length)} />
          <MetricCard label="Candidatos totais" value={String(totalCandidates)} />
          <MetricCard label="Tokens IA consumidos" value={totalTokens.toLocaleString("pt-BR")} />
        </div>

        {/* Empresas */}
        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-3">Empresas</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 font-medium text-slate-600">Empresa</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-600">Domínio</th>
                  <th className="text-center px-6 py-3 font-medium text-slate-600">Recrutadores</th>
                  <th className="text-center px-6 py-3 font-medium text-slate-600">Vagas</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-6 py-3 font-medium text-slate-800">{company.name}</td>
                    <td className="px-6 py-3 text-slate-500 font-mono text-xs">{company.domain}</td>
                    <td className="px-6 py-3 text-center text-slate-600">{company._count.recruiters}</td>
                    <td className="px-6 py-3 text-center text-slate-600">{company._count.jobs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Log de acessos recentes */}
        <AuditLogSection />
      </main>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

async function AuditLogSection() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <h2 className="text-base font-semibold text-slate-900 mb-3">
        Log de acessos (últimos 20)
      </h2>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-2 font-medium text-slate-600">Ação</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Entidade</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Data</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-2 font-mono text-slate-700">{log.action}</td>
                <td className="px-4 py-2 text-slate-500">
                  {log.entityType} · {log.entityId.slice(0, 8)}…
                </td>
                <td className="px-4 py-2 text-slate-400">
                  {new Date(log.createdAt).toLocaleString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
