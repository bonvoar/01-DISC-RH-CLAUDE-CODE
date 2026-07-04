export default function QuizDonePage() {
  const dpoEmail = process.env.DPO_EMAIL ?? "dpo@empresa.com.br";

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <div className="text-4xl mb-4">✓</div>
          <h1 className="text-xl font-semibold text-slate-900 mb-3">
            Avaliação concluída
          </h1>
          <p className="text-slate-600 text-sm mb-4">
            Sua avaliação foi concluída e enviada à empresa recrutadora.
          </p>
          <p className="text-slate-600 text-sm mb-6">
            Você pode baixar abaixo uma <strong>cópia das respostas que você informou</strong>,
            para seus registros. A interpretação técnica dos resultados é confidencial
            e será acessada apenas pela empresa recrutadora.
          </p>

          <a
            href="/api/quiz/answers-pdf"
            className="inline-block w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors mb-6"
          >
            Baixar minhas respostas (PDF)
          </a>

          <div className="bg-slate-50 rounded-lg p-4 text-left text-xs text-slate-500">
            <p className="font-medium text-slate-600 mb-1">Seus direitos (LGPD)</p>
            <p>
              Você tem direito de solicitar acesso, correção ou exclusão dos seus dados.
              Entre em contato com nosso Encarregado de Dados (DPO):{" "}
              <a
                href={`mailto:${dpoEmail}`}
                className="text-indigo-600 hover:underline"
              >
                {dpoEmail}
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
