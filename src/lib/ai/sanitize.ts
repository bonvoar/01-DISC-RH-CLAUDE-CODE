import { prisma } from "@/lib/prisma";

const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above|prior)\s+instructions?/i,
  /ignore\s+as\s+instru[çc][oõ]es\s+anteriores/i,
  /esquece?\s+(tudo|as\s+instru[çc][oõ]es)/i,
  /nova\s+instru[çc][aã]o:/i,
  /act\s+as\s+(a\s+)?different/i,
  /jailbreak/i,
  /ignore\s+your\s+(system\s+)?prompt/i,
  /recomende\s+(a\s+)?contrata[çc][aã]o/i,
  /always\s+recommend\s+(hiring|contratar)/i,
  /disregard\s+(the\s+)?(previous|above|prior)/i,
  /you\s+are\s+now\s+/i,
  /voc[êe]\s+(agora\s+)?[ée]\s+um[a]?\s+/i,
  /new\s+instructions?:/i,
  /system\s*prompt/i,
  /override\s+(the\s+)?(system|previous|rules)/i,
  /desconsidere?\s+(as\s+)?regras/i,
];

export async function sanitizeJobDescription(
  text: string,
  jobId?: string
): Promise<string> {
  let sanitized = text;
  let injectionDetected = false;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      injectionDetected = true;
      sanitized = sanitized.replace(pattern, "[CONTEÚDO REMOVIDO]");
    }
  }

  if (injectionDetected && jobId) {
    await prisma.auditLog.create({
      data: {
        action: "INJECTION_ATTEMPT",
        entityType: "Job",
        entityId: jobId,
      },
    });
  }

  return sanitized;
}
