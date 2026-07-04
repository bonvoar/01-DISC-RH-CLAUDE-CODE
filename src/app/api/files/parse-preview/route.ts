import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { parseJobFile } from "@/lib/files/parse";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Arquivo muito grande (máx 10MB)" }, { status: 400 });
  }

  try {
    const text = await parseJobFile(file);
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao processar arquivo" },
      { status: 422 }
    );
  }
}
