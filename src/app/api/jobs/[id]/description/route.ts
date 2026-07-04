import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseJobFile } from "@/lib/files/parse";
import { sanitizeJobDescription } from "@/lib/ai/sanitize";
import { put } from "@vercel/blob";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const job = await prisma.job.findFirst({
    where: { id, companyId: session.user.companyId },
  });

  if (!job) return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Arquivo muito grande (máx 10MB)" }, { status: 400 });
  }

  let descriptionRaw: string;
  try {
    descriptionRaw = await parseJobFile(file);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao processar arquivo" },
      { status: 422 }
    );
  }

  const sanitized = await sanitizeJobDescription(descriptionRaw, job.id);

  const blob = await put(`jobs/${job.id}/${file.name}`, file, {
    access: "private",
  });

  await prisma.job.update({
    where: { id },
    data: { descriptionRaw: sanitized, descriptionFile: blob.url },
  });

  return NextResponse.json({ descriptionRaw: sanitized });
}
