const MAX_TEXT_LENGTH = 50_000;

export async function parseJobFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    return parsePdf(buffer);
  }

  if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".docx")
  ) {
    return parseDocx(buffer);
  }

  throw new Error("Formato não suportado. Envie PDF ou DOCX.");
}

async function parsePdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;
  const data = await pdfParse(buffer);
  return data.text.slice(0, MAX_TEXT_LENGTH);
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value.slice(0, MAX_TEXT_LENGTH);
}
