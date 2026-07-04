import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function QuizLandingPage({ params }: Props) {
  const { slug } = await params;

  const job = await prisma.job.findUnique({
    where: { publicSlug: slug },
    include: { recruiter: true },
  });

  if (!job) notFound();

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">
              Avaliação comportamental
            </h1>
            <p className="text-slate-600 mt-1">Vaga: {job.title}</p>
          </div>

          <div className="space-y-3 mb-8">
            <InfoItem emoji="⏱" text="Duração estimada: 12 a 18 minutos" />
            <InfoItem emoji="💾" text="Suas respostas são salvas automaticamente" />
            <InfoItem emoji="🔒" text="Apenas a empresa recrutadora acessa os resultados técnicos" />
            <InfoItem emoji="📄" text="Você poderá baixar em PDF uma cópia das respostas que informar" />
          </div>

          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 mb-6">
            <p className="font-medium text-slate-700 mb-1">Política de privacidade (LGPD)</p>
            <p>
              Seus dados serão utilizados exclusivamente para fins deste processo seletivo.
              A interpretação técnica dos resultados é confidencial e acessada apenas pela empresa recrutadora.
              Em caso de dúvidas, entre em contato com o responsável pelo processo seletivo pelo e-mail{" "}
              <span className="text-indigo-600">{job.recruiter.email}</span>.
            </p>
          </div>

          <Link
            href={`/q/${slug}/start`}
            className="block w-full text-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Iniciar avaliação
          </Link>
        </div>
      </div>
    </main>
  );
}

function InfoItem({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg">{emoji}</span>
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  );
}
