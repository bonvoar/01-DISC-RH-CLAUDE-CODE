import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CopyLinkButton } from "./CopyLinkButton";

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

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; quizUrl?: string }>;
}

export default async function JobDetailPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const { created, quizUrl } = await searchParams;

  const job = await prisma.job.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      candidates: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!job) notFound();

  const quizLink = quizUrl
    ? decodeURIComponent(quizUrl)
    : `${process.env.NEXT_PUBLIC_APP_URL}/q/${job.publicSlug}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">{job.title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {created && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-800">Vaga criada com sucesso!</p>
          </div>
        )}

        {/* Link do quiz */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-700 mb-2">Link do quiz para candidatos</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={quizLink}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50 font-mono"
            />
            <CopyLinkButton quizLink={quizLink} />
          </div>
        </div>

        {/* Candidatos */}
        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-3">
            Candidatos ({job.candidates.length})
          </h2>
          {job.candidates.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
              <p className="text-slate-500 text-sm">Nenhum candidato ainda. Compartilhe o link acima.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-6 py-3 font-medium text-slate-600">Nome</th>
                    <th className="text-left px-6 py-3 font-medium text-slate-600">E-mail</th>
                    <th className="text-left px-6 py-3 font-medium text-slate-600">Status</th>
                    <th className="text-left px-6 py-3 font-medium text-slate-600">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {job.candidates.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-6 py-3">
                        <Link
                          href={`/dashboard/candidates/${c.id}`}
                          className="text-indigo-600 hover:underline font-medium"
                        >
                          {c.fullName}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-slate-500">{c.email}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                          {STATUS_LABELS[c.status]}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
