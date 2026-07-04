import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { inngest } from "@/lib/inngest";
import { TOTAL_QUIZ_ITEMS } from "@/lib/disc/items";

export async function POST(req: NextRequest) {
  void req;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("quiz_session")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 });
  }

  const candidate = await prisma.candidate.findUnique({
    where: { sessionToken },
    include: { answers: true },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });
  }

  if (candidate.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Quiz já enviado" }, { status: 400 });
  }

  // Valida itens únicos respondidos
  const uniqueItems = new Set(candidate.answers.map((a) => a.itemKey));
  if (uniqueItems.size < TOTAL_QUIZ_ITEMS) {
    return NextResponse.json(
      { error: `Responda todas as questões (${uniqueItems.size}/${TOTAL_QUIZ_ITEMS} respondidas)` },
      { status: 400 }
    );
  }

  const candidateId = candidate.id;

  await prisma.candidate.update({
    where: { id: candidateId },
    data: { status: "COMPLETED" },
  });

  await inngest.send({
    name: "quiz/submitted",
    data: { candidateId },
  });

  // O sessionToken/cookie continuam válidos após o envio de propósito: a
  // tela final (/q/[slug]/done) usa esse mesmo cookie para permitir que o
  // candidato baixe uma cópia das próprias respostas (GET /api/quiz/answers-pdf).
  // Reabrir/alterar o quiz já enviado continua bloqueado — /api/quiz/answer e
  // este endpoint rejeitam qualquer candidato cujo status não seja IN_PROGRESS.
  return NextResponse.json({ ok: true });
}
