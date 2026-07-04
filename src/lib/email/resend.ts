import { Resend } from "resend";

// Instanciado sob demanda: o SDK lança na construção se não houver API key,
// o que derrubaria (no import) qualquer módulo que apenas importe funções
// puras deste arquivo (ex.: em testes, scripts, ou ambientes sem a env var
// configurada) mesmo sem nunca chegar a enviar um e-mail.
let resendClient: Resend | null = null;
function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@exemplo.com.br";
const DPO_EMAIL = process.env.DPO_EMAIL ?? "dpo@exemplo.com.br";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Todo valor que pode conter texto fornecido por um candidato (nome, vaga,
// respostas) precisa ser escapado antes de entrar no HTML do e-mail — caso
// contrário um candidato pode injetar markup/links em um e-mail que o
// recrutador confia como notificação interna.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// O SDK do Resend não lança exceção em erro da API (ex.: domínio não
// verificado, chave inválida) — ele resolve normalmente com { data: null,
// error }. Sem checar isso explicitamente, o Inngest marca o step como
// bem-sucedido mesmo quando o e-mail nunca foi enviado de verdade.
function assertEmailSent(result: { error: { message: string } | null }): void {
  if (result.error) {
    throw new Error(`Falha ao enviar e-mail via Resend: ${result.error.message}`);
  }
}

export async function sendRecruiterNotificationEmail({
  toEmail,
  recruiterName,
  candidateName,
  jobTitle,
  candidateId,
}: {
  toEmail: string;
  recruiterName: string;
  candidateName: string;
  jobTitle: string;
  candidateId: string;
}) {
  const safeRecruiterName = escapeHtml(recruiterName);
  const safeCandidateName = escapeHtml(candidateName);
  const safeJobTitle = escapeHtml(jobTitle);
  const portalUrl = `${APP_URL}/dashboard/candidates/${candidateId}`;

  const result = await getResendClient().emails.send({
    from: FROM,
    to: toEmail,
    subject: `Novo candidato pronto: ${safeCandidateName} — ${safeJobTitle}`,
    html: `
      <h2>Olá, ${safeRecruiterName}</h2>
      <p>O candidato <strong>${safeCandidateName}</strong> concluiu a avaliação comportamental
      para a vaga <strong>${safeJobTitle}</strong>.</p>
      <p>O perfil comportamental já está disponível no portal para sua análise.</p>
      <p>
        <a href="${portalUrl}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">
          Ver perfil no portal
        </a>
      </p>
      <hr/>
      <p style="font-size:12px;color:#666">
        Acesse o portal: <a href="${APP_URL}/dashboard">${APP_URL}/dashboard</a>
      </p>
    `,
  });

  assertEmailSent(result);
}

export async function sendForgetMeEmail({
  toEmail,
  candidateName,
  token,
}: {
  toEmail: string;
  candidateName: string;
  token: string;
}) {
  const safeName = escapeHtml(candidateName);
  const confirmUrl = `${APP_URL}/api/candidate/forget-me?token=${encodeURIComponent(token)}`;

  const result = await getResendClient().emails.send({
    from: FROM,
    to: toEmail,
    subject: "Confirme a exclusão dos seus dados (LGPD)",
    html: `
      <h2>Olá, ${safeName}</h2>
      <p>Recebemos um pedido para excluir permanentemente seus dados desta avaliação
      comportamental, conforme seu direito de exclusão previsto na LGPD (art. 18).</p>
      <p>Se foi você quem solicitou, confirme clicando no botão abaixo. Este link
      expira em 30 dias e a exclusão é definitiva e irreversível.</p>
      <p>
        <a href="${confirmUrl}" style="background:#dc2626;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">
          Confirmar exclusão dos meus dados
        </a>
      </p>
      <p style="font-size:12px;color:#666">Se você não fez esse pedido, ignore este e-mail — nenhuma ação será tomada.</p>
      <hr/>
      <p style="font-size:12px;color:#666">
        Dúvidas? Fale com nosso Encarregado de Dados (DPO): <a href="mailto:${DPO_EMAIL}">${DPO_EMAIL}</a>
      </p>
    `,
  });

  assertEmailSent(result);
}
