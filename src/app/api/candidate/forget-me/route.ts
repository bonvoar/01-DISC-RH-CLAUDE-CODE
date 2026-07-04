import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { sendForgetMeEmail } from "@/lib/email/resend";

// POST /api/candidate/forget-me → solicita exclusão, envia e-mail com token
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email } = body as { email?: string };

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });
  }

  const candidates = await prisma.candidate.findMany({
    where: { email },
    select: { id: true, fullName: true },
  });

  if (candidates.length === 0) {
    // Não revelar se existe ou não (segurança)
    return NextResponse.json({ ok: true });
  }

  for (const candidate of candidates) {
    const token = nanoid(32);
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { forgetMeToken: token, forgetMeRequestedAt: new Date() },
    });

    await sendForgetMeEmail({ toEmail: email, candidateName: candidate.fullName, token });
  }

  return NextResponse.json({ ok: true });
}

async function confirmDeletion(token: string | null) {
  if (!token) {
    return { status: 400 as const, error: "Token obrigatório" };
  }

  const candidate = await prisma.candidate.findFirst({
    where: { forgetMeToken: token },
  });

  if (!candidate) {
    return { status: 404 as const, error: "Token inválido ou expirado" };
  }

  // Valida que o pedido foi feito nos últimos 30 dias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (!candidate.forgetMeRequestedAt || candidate.forgetMeRequestedAt < thirtyDaysAgo) {
    return { status: 410 as const, error: "Token expirado" };
  }

  // Hard-delete em cascata (Answer, DiscResult, Report deletados via onDelete: Cascade)
  await prisma.candidate.delete({ where: { id: candidate.id } });

  await prisma.auditLog.create({
    data: {
      action: "CANDIDATE_DELETED",
      entityType: "Candidate",
      entityId: candidate.id,
    },
  });

  return { status: 200 as const };
}

// GET /api/candidate/forget-me?token=xxx → link de confirmação clicado a partir do e-mail
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const result = await confirmDeletion(token);

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, message: "Dados excluídos com sucesso" });
}

// DELETE /api/candidate/forget-me?token=xxx → confirma e executa exclusão (uso programático)
export async function DELETE(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const result = await confirmDeletion(token);

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, message: "Dados excluídos com sucesso" });
}
