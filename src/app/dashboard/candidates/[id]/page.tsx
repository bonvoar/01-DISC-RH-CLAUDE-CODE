import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CandidateReportView } from "./CandidateReportView";
import { candidateScopedToCompanyWhere } from "@/lib/candidates/authorize";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CandidatePage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const candidate = await prisma.candidate.findFirst({
    where: candidateScopedToCompanyWhere(id, session.user.companyId),
    include: {
      job: true,
      discResult: true,
      reports: true,
    },
  });

  if (!candidate) notFound();

  // Registrar acesso no AuditLog
  await prisma.auditLog.create({
    data: {
      action: "VIEW_CANDIDATE",
      entityType: "Candidate",
      entityId: id,
      recruiterId: session.user.id,
    },
  });

  const profileReport = candidate.reports.find((r) => r.type === "PROFILE") ?? null;
  const fitReport = candidate.reports.find((r) => r.type === "FIT") ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link
            href={candidate.job ? `/dashboard/jobs/${candidate.job.id}` : "/dashboard"}
            className="text-slate-400 hover:text-slate-600 text-sm"
          >
            ← {candidate.job?.title ?? "Dashboard"}
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">{candidate.fullName}</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Cabeçalho do candidato */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex flex-wrap gap-6 items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">
                {candidate.job?.title ?? "Sem vaga associada"} ·{" "}
                {new Date(candidate.createdAt).toLocaleDateString("pt-BR")}
              </p>
              <p className="text-sm text-slate-600 mt-1">{candidate.email}</p>
            </div>

            {candidate.discResult && (
              <DiscRadar discResult={candidate.discResult} />
            )}
          </div>

          {candidate.discResult?.biasFlags && candidate.discResult.biasFlags.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-medium text-amber-800 mb-1">
                ⚠️ Flags de viés de resposta detectadas:
              </p>
              {candidate.discResult.biasFlags.map((flag) => (
                <p key={flag} className="text-xs text-amber-700">
                  • {formatBiasFlag(flag)}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Relatórios */}
        <CandidateReportView
          candidateId={id}
          profileReport={profileReport}
          fitReport={fitReport}
          hasJobDescription={!!candidate.job?.descriptionRaw}
          candidateStatus={candidate.status}
        />

        {/* Disclaimer permanente */}
        <div className="mt-8 p-4 bg-slate-100 rounded-lg text-xs text-slate-500">
          <p>
            Este perfil representa tendências comportamentais medidas em um momento específico
            e não define competência técnica, valor humano ou aptidão para uma vaga.
            Deve ser usado como um dentre múltiplos insumos de decisão.
            DISC não é preditor isolado de sucesso profissional.
          </p>
        </div>
      </main>
    </div>
  );
}

function DiscRadar({ discResult }: {
  discResult: { scoreD: number; scoreI: number; scoreS: number; scoreC: number; style: string };
}) {
  const factors = [
    { label: "D", value: discResult.scoreD, color: "bg-red-500" },
    { label: "I", value: discResult.scoreI, color: "bg-yellow-400" },
    { label: "S", value: discResult.scoreS, color: "bg-green-500" },
    { label: "C", value: discResult.scoreC, color: "bg-blue-500" },
  ];

  return (
    <div className="flex items-end gap-3">
      <div className="text-right mr-2">
        <p className="text-xs text-slate-500">Estilo comportamental</p>
        <p className="font-semibold text-slate-900">{discResult.style}</p>
      </div>
      {factors.map(({ label, value, color }) => (
        <div key={label} className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-slate-600">{value}%</span>
          <div className="w-10 bg-slate-100 rounded-sm overflow-hidden" style={{ height: 60 }}>
            <div
              className={`w-full ${color} rounded-sm`}
              style={{ height: `${value}%`, marginTop: `${100 - value}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700">{label}</span>
        </div>
      ))}
    </div>
  );
}

function formatBiasFlag(flag: string): string {
  const factor = flag.split("_").pop();
  return `Gap significativo entre resposta ipsativa e Likert no fator ${factor}. Interprete os resultados deste fator com cautela.`;
}
