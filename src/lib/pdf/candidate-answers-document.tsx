import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import {
  groupPartAAnswers,
  sortPartBAnswers,
  CANDIDATE_ANSWERS_NOTICE,
} from "@/lib/candidates/answers-format";

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: "#1e293b" },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  sub: { fontSize: 11, color: "#475569", marginBottom: 4 },
  notice: { fontSize: 10, lineHeight: 1.6, color: "#334155", marginTop: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 6 },
  table: { borderWidth: 1, borderColor: "#e2e8f0" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  tableRowLast: { flexDirection: "row" },
  tableHeaderCell: {
    flex: 1,
    padding: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    backgroundColor: "#f8fafc",
  },
  tableCell: { flex: 1, padding: 6, fontSize: 9 },
  disclaimer: {
    fontSize: 8,
    color: "#94a3b8",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    marginTop: 24,
  },
});

interface Answer {
  itemKey: string;
  value: string;
}


interface CandidateAnswersDocumentProps {
  candidateName: string;
  jobTitle?: string | null;
  submittedAt: Date;
  answers: Answer[];
}

export function CandidateAnswersDocument({
  candidateName,
  jobTitle,
  submittedAt,
  answers,
}: CandidateAnswersDocumentProps) {
  const partAGroups = groupPartAAnswers(answers.filter((a) => a.itemKey.startsWith("A-")));
  const partBAnswers = sortPartBAnswers(answers.filter((a) => a.itemKey.startsWith("B-")));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Cópia das suas respostas</Text>
        <Text style={styles.sub}>{candidateName}</Text>
        {jobTitle && <Text style={styles.sub}>Vaga: {jobTitle}</Text>}
        <Text style={styles.sub}>
          Avaliação realizada em {submittedAt.toLocaleString("pt-BR")}
        </Text>

        <Text style={styles.notice}>{CANDIDATE_ANSWERS_NOTICE}</Text>

        <Text style={styles.sectionTitle}>Parte A — Seleção de palavras (mais/menos)</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableHeaderCell}>Grupo</Text>
            <Text style={styles.tableHeaderCell}>Mais parecido comigo</Text>
            <Text style={styles.tableHeaderCell}>Menos parecido comigo</Text>
          </View>
          {partAGroups.map((g, i) => (
            <View key={g.groupNum} style={i === partAGroups.length - 1 ? styles.tableRowLast : styles.tableRow}>
              <Text style={styles.tableCell}>A-{g.groupNum}</Text>
              <Text style={styles.tableCell}>{g.most ?? "—"}</Text>
              <Text style={styles.tableCell}>{g.least ?? "—"}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Parte B — Afirmações (escala 1-5)</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableHeaderCell}>Questão</Text>
            <Text style={styles.tableHeaderCell}>Nota</Text>
          </View>
          {partBAnswers.map((a, i) => (
            <View key={a.itemKey} style={i === partBAnswers.length - 1 ? styles.tableRowLast : styles.tableRow}>
              <Text style={styles.tableCell}>{a.itemKey}</Text>
              <Text style={styles.tableCell}>{a.value}/5</Text>
            </View>
          ))}
        </View>

        <View style={styles.disclaimer}>
          <Text>
            Em caso de dúvidas ou para exercer seus direitos previstos na LGPD (acesso,
            correção, exclusão de dados), entre em contato com nosso Encarregado de Dados (DPO).
          </Text>
        </View>
      </Page>
    </Document>
  );
}
