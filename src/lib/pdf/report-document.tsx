import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: "#1e293b" },
  coverTitle: { fontSize: 24, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  coverSub: { fontSize: 13, color: "#475569", marginBottom: 4 },
  coverMeta: { fontSize: 10, color: "#94a3b8", marginTop: 16 },
  sectionTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 6, marginTop: 20, color: "#1e293b" },
  paragraph: { fontSize: 10, lineHeight: 1.6, color: "#334155", marginBottom: 6 },
  disclaimer: { fontSize: 8, color: "#94a3b8", borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 8, marginTop: 16 },
  biasBox: { backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fbbf24", padding: 8, borderRadius: 4, marginBottom: 12 },
  biasText: { fontSize: 9, color: "#92400e" },
  discRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  discFactor: { alignItems: "center", flex: 1 },
  discLabel: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  discValue: { fontSize: 10, color: "#475569" },
  footer: { position: "absolute", bottom: 30, left: 48, right: 48 },
  pageNumber: { fontSize: 8, color: "#94a3b8", textAlign: "center" },
});

interface ReportDocumentProps {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  generatedAt: Date;
  discResult: {
    D: number;
    I: number;
    S: number;
    C: number;
    style: string;
    biasFlags: string[];
  } | null;
  profileReportMd: string;
  fitReportMd: string | null;
}

function splitMarkdownToParagraphs(md: string): string[] {
  return md
    .split("\n")
    .filter((l) => l.trim() !== "" && !l.startsWith("#") && l !== "---")
    .map((l) => l.replace(/^\*\*(.+)\*\*$/, "$1").replace(/^[-•]\s/, "• ").trim());
}

export function ConsolidatedReportDocument({
  candidateName,
  jobTitle,
  companyName,
  generatedAt,
  discResult,
  profileReportMd,
  fitReportMd,
}: ReportDocumentProps) {
  const profileParagraphs = splitMarkdownToParagraphs(profileReportMd);
  const fitParagraphs = fitReportMd ? splitMarkdownToParagraphs(fitReportMd) : [];

  return (
    <Document>
      {/* Página de capa */}
      <Page size="A4" style={styles.page}>
        <View style={{ marginBottom: 40 }}>
          <Text style={styles.coverTitle}>Relatório Comportamental DISC</Text>
          <Text style={styles.coverSub}>{candidateName}</Text>
          {jobTitle && <Text style={styles.coverSub}>Vaga: {jobTitle}</Text>}
          {companyName && <Text style={styles.coverSub}>Empresa: {companyName}</Text>}
          <Text style={styles.coverMeta}>
            Gerado em: {generatedAt.toLocaleString("pt-BR")}
          </Text>
        </View>

        {discResult && (
          <View>
            <Text style={styles.sectionTitle}>Perfil DISC — Percentis</Text>
            <View style={styles.discRow}>
              {(["D", "I", "S", "C"] as const).map((f) => (
                <View key={f} style={styles.discFactor}>
                  <Text style={styles.discLabel}>{f}</Text>
                  <Text style={styles.discValue}>{discResult[f]}%</Text>
                </View>
              ))}
            </View>
            <Text style={styles.paragraph}>
              Estilo comportamental: {discResult.style}
            </Text>
            {discResult.biasFlags.length > 0 && (
              <View style={styles.biasBox}>
                <Text style={styles.biasText}>
                  ⚠ Flags de viés de resposta: {discResult.biasFlags.join(", ")}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={[styles.disclaimer, styles.footer]}>
          <Text>
            Confidencial — uso exclusivo do recrutador. DISC representa tendências
            comportamentais e não define competência técnica ou aptidão para a vaga.
          </Text>
        </View>
      </Page>

      {/* Páginas do Perfil Comportamental */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Perfil Comportamental</Text>
        {profileParagraphs.map((p, i) => (
          <Text key={i} style={styles.paragraph}>{p}</Text>
        ))}
        <View style={[styles.disclaimer, styles.footer]}>
          <Text>
            Este perfil representa tendências comportamentais medidas em um momento
            específico e não define competência técnica, valor humano ou aptidão para
            uma vaga. Deve ser usado como um dentre múltiplos insumos de decisão.
          </Text>
        </View>
      </Page>

      {/* Páginas do Relatório de Fit (se existir) */}
      {fitReportMd && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Análise de Fit — Candidato × Vaga</Text>
          {fitParagraphs.map((p, i) => (
            <Text key={i} style={styles.paragraph}>{p}</Text>
          ))}
          <View style={[styles.disclaimer, styles.footer]}>
            <Text>
              Análise baseada exclusivamente em perfil DISC × descrição da vaga. Não
              substitui entrevistas técnicas, verificação de referências, testes de
              competência e demais etapas do processo seletivo.
            </Text>
          </View>
        </Page>
      )}
    </Document>
  );
}
