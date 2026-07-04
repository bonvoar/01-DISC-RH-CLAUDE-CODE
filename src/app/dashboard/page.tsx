import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";
import { CopyLinkButton } from "./jobs/[id]/CopyLinkButton";

const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  PROFILE_READY: "Perfil pronto",
  FIT_GENERATED: "Fit gerado",
};

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "bg-slate-100 text-slate-600",
  COMPLETED: "bg-blue-100 text-blue-700",
  PROFILE_READY: "bg-indigo-100 text-indigo-700",
  FIT_GENERATED: "bg-green-100 text-green-700",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const jobs = await prisma.job.findMany({
    where: { companyId: session.user.companyId },
    include: {
      _count: { select: { candidates: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const recentCandidates = await prisma.candidate.findMany({
    where: { job: { companyId: session.user.companyId } },
    include: { job: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Portal RH</h1>
            <p className="text-sm text-slate-500">{session.user.companyName}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{session.user.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Vagas</h2>
          <Link
            href="/dashboard/jobs/new"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            + Nova vaga
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500">Nenhuma vaga criada ainda.</p>
            <Link
              href="/dashboard/jobs/new"
              className="mt-3 inline-block text-indigo-600 text-sm hover:underline"
            >
              Criar primeira vaga
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 mb-10">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-slate-200 px-6 py-4 hover:border-indigo-300 transition-colors flex items-center justify-between gap-4"
              >
                <Link href={`/dashboard/jobs/${job.id}`} className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{job.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {new Date(job.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </Link>
                <div className="flex items-center gap-4">
                  <Link href={`/dashboard/jobs/${job.id}`} className="text-right">
                    <p className="text-lg font-semibold text-slate-900">
                      {job._count.candidates}
                    </p>
                    <p className="text-xs text-slate-500">candidatos</p>
                  </Link>
                  <CopyLinkButton
                    quizLink={`${process.env.NEXT_PUBLIC_APP_URL}/q/${job.publicSlug}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {recentCandidates.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Candidatos recentes
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-6 py-3 font-medium text-slate-600">Nome</th>
                    <th className="text-left px-6 py-3 font-medium text-slate-600">Vaga</th>
                    <th className="text-left px-6 py-3 font-medium text-slate-600">Status</th>
                    <th className="text-left px-6 py-3 font-medium text-slate-600">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCandidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="px-6 py-3">
                        <Link
                          href={`/dashboard/candidates/${candidate.id}`}
                          className="text-indigo-600 hover:underline font-medium"
                        >
                          {candidate.fullName}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {candidate.job?.title ?? "—"}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[candidate.status]}`}
                        >
                          {STATUS_LABELS[candidate.status]}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {new Date(candidate.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
