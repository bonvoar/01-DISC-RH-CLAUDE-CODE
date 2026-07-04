# PRD — Quiz DISC para Recrutamento com Análise por IA

**Versão:** 1.0
**Data:** 2026-07-03
**Owner:** Webert Gaioffa
**Status:** Aprovado para desenvolvimento (MVP)

---

## 1. Visão Geral

Plataforma web que aplica um teste DISC híbrido (mais/menos + Likert) em candidatos a vagas e entrega **um relatório consolidado exclusivo ao recrutador**, com duas seções:

1. **Perfil comportamental profundo** do candidato (D/I/S/C, estilo, forças, riscos, drivers, comunicação, liderança) — escrito em tom técnico de RH, não motivacional.
2. **Análise de fit candidato × vaga** — gerada após o recrutador fazer upload da descrição da vaga (PDF/DOCX). Inclui semáforo de recomendação, riscos, perguntas para entrevista e guia de gestão.

**O candidato NÃO recebe relatório de perfil DISC nem análise** — recebe automaticamente por e-mail apenas a **cópia das respostas brutas** que ele mesmo informou (para seus registros e conformidade proativa com LGPD art. 18 I e II). Toda a interpretação psicométrica e a análise de fit ficam exclusivamente no portal do recrutador. Ver §9.

O motor de análise combina a pontuação DISC clássica com uma camada de IA (Claude API) que emula um especialista sênior de RH e psicologia comportamental.

### 1.1 Problema

Recrutadores gastam horas interpretando testes DISC brutos e cruzando manualmente com o job description. Testes tradicionais entregam perfil, mas não conectam à vaga específica, e não geram parecer técnico acionável.

### 1.2 Solução

Automatizar essa análise, entregando ao recrutador em minutos:
- Perfil DISC do candidato
- Leitura psicológica/comportamental profissional
- Match objetivo com o escopo da vaga
- Recomendação clara de prosseguir/não prosseguir e pontos de atenção para entrevista

### 1.3 Métricas de Sucesso (MVP)

| Métrica | Meta 90 dias |
|---|---|
| Taxa de conclusão do quiz pelo candidato | > 85% |
| Tempo médio de conclusão | 12–18 min |
| NPS do recrutador sobre o relatório | > 50 |
| Uptime | > 99% |
| Tempo de geração do perfil comportamental | < 45s |
| Tempo de geração da análise de fit | < 60s |
| E-mail ao candidato com respostas brutas entregue com sucesso | > 99% |

---

## 2. Personas

### 2.1 Candidato
- Recebe convite por e-mail (ou link direto do recrutador)
- Deseja processo rápido, claro e transparente sobre uso de dados
- Nível técnico variado — UX precisa ser trivial em desktop e mobile
- **Não recebe relatório de perfil nem análise**; recebe por e-mail apenas cópia das respostas que informou (transparência LGPD)

### 2.2 Recrutador / RH
- Gerencia múltiplas vagas e candidatos em paralelo
- Precisa de relatório denso mas escaneável (bullets, semáforo, seções curtas)
- Valoriza confidencialidade (não pode vazar entre empresas)

### 2.3 Admin (interno)
- Gerencia contas de empresas recrutadoras, planos, uso da API
- Monitora custos de IA e qualidade dos relatórios

---

## 3. Escopo Funcional

### 3.1 Fluxo do Candidato

1. **Landing** — explica o teste, tempo estimado, política de privacidade (LGPD)
2. **Coleta de dados**:
   - Nome completo
   - E-mail pessoal
   - E-mail da empresa recrutadora (obrigatório)
   - Nome da vaga (opcional; se recrutador criou link direto, já vem preenchido)
   - Consentimento LGPD explícito (checkbox obrigatório)
3. **Quiz DISC híbrido**:
   - Parte A: 24 grupos de 4 palavras — selecionar "MAIS" parecido comigo e "MENOS" parecido comigo (ipsativo)
   - Parte B: 20 afirmações comportamentais em escala Likert 1–5 (normativo, para calibrar e reduzir viés de desejabilidade)
   - Barra de progresso persistente
   - Auto-save por questão (retomada se sair)
4. **Tela de conclusão** — "Sua avaliação foi concluída e enviada à empresa recrutadora. Enviamos para o seu e-mail (**[email do candidato]**) uma cópia das respostas que você informou, para seus registros. A interpretação técnica dos resultados é confidencial e será acessada apenas pela empresa recrutadora."
5. **Entrega**:
   - **E-mail ao candidato** contendo **apenas as respostas brutas** que ele informou (cópia das escolhas mais/menos da Parte A e das notas Likert da Parte B, com data/hora). **Nunca** inclui pontuação DISC, perfil, análise ou qualquer output de IA
   - **E-mail ao recrutador**: notificação de que há novo candidato pronto para análise no portal (contém link para o portal, não o relatório em si)

### 3.2 Fluxo do Recrutador

1. **Cadastro/Login** — e-mail + senha (bcrypt, 2FA opcional em v2)
2. **Dashboard**:
   - Lista de vagas criadas
   - Lista de candidatos por vaga com status (Pendente / Concluído / Analisado)
   - Filtros e busca
3. **Criar vaga**:
   - Título da vaga
   - Upload da descrição (PDF ou DOCX; máx 10MB)
   - Parse do arquivo → texto extraído editável
   - Sistema gera link único do quiz para essa vaga (compartilhável)
4. **Ver candidato** (portal exibe relatório em duas abas + botão de PDF único consolidado):
   - **Aba 1 — Perfil Comportamental**: análise técnica profunda do DISC (gerada automaticamente ao concluir o quiz)
   - **Aba 2 — Análise de Fit**: só aparece após clicar em "Gerar Análise de Fit" (exige vaga com descrição anexada). Dispara pipeline IA de match candidato × vaga
   - Botão "Exportar PDF Consolidado" gera arquivo único contendo ambas as seções + flags de viés + disclaimers

### 3.3 Fluxo do Admin

1. Console interno (rota `/admin`, protegido)
2. CRUD de empresas, usuários recrutadores
3. Métricas de uso e custo de IA por empresa
4. Auditoria de acessos

---

## 4. Metodologia DISC — Especificação

### 4.1 Modelo Teórico

Baseado no modelo DISC de William Moulton Marston (1928) e adaptações modernas (Wiley, Thomas International). **Não usar conteúdo proprietário licenciado** — o banco de palavras/afirmações deve ser adaptação de domínio público em português, validada por psicólogo antes do go-live.

### 4.2 Estrutura da Parte A (Ipsativa)

- **24 grupos** × 4 palavras/adjetivos
- Cada palavra é pré-mapeada a um dos 4 fatores (D, I, S, C)
- Candidato escolhe 1 "MAIS" (+1 no fator) e 1 "MENOS" (−1 no fator)
- Pontuação final por fator: soma bruta convertida em percentil via tabela normativa (a ser calibrada com amostra piloto de 300+ respostas)

**Exemplo de grupo** (ilustrativo, não final):
| Palavra | Fator |
|---|---|
| Ousado | D |
| Comunicativo | I |
| Paciente | S |
| Preciso | C |

**Entregável para dev:** JSON `disc-items.json` com os 24 grupos e mapeamento fator. Um psicólogo consultor deve revisar antes do commit final.

### 4.3 Estrutura da Parte B (Likert)

- 20 afirmações comportamentais (5 por fator D/I/S/C)
- Escala 1 (discordo totalmente) a 5 (concordo totalmente)
- Usada para **calibrar** os resultados ipsativos e detectar padrões de resposta socialmente desejáveis
- Se a diferença entre pontuação ipsativa e Likert em um fator exceder threshold (ex: 30 pontos percentis), sistema flagga "possível resposta enviesada" no relatório do recrutador

### 4.4 Perfis DISC Resultantes

Sistema calcula e armazena (visível apenas ao recrutador no portal):
- **Perfil primário** (fator dominante)
- **Perfil secundário** (segundo mais alto)
- **Estilo comportamental** (1 dos 15 padrões clássicos: Diretor, Persuasor, Promotor, Facilitador, Coordenador, Analista, etc.)
- **Gráfico radar** dos 4 fatores em percentil
- **Flags de viés** (ver §4.3)

---

## 5. Motor de Análise por IA

### 5.1 Modelo

**Claude Opus 4.8** (id: `claude-opus-4-8`) — profundidade de análise psicológica supera modelos menores para casos comportamentais.
Fallback: `claude-sonnet-5` se latência/custo forem críticos.

### 5.2 Relatório de Perfil Comportamental (visível apenas ao recrutador) — Prompt

**Input estruturado:**
```json
{
  "candidato": { "nome": "...", "vaga": "..." },
  "disc": {
    "D": 72, "I": 45, "S": 38, "C": 65,
    "perfil_primario": "D",
    "perfil_secundario": "C",
    "estilo": "Coordenador",
    "flags": ["ipsative_normative_gap_D"]
  }
}
```

**Prompt do sistema** (resumo — spec completa em `/prompts/profile-report.md`):
> Você é um psicólogo organizacional sênior com 20 anos de experiência em avaliação DISC, escrevendo para um recrutador profissional. Tom **técnico**, não motivacional (o candidato NÃO lerá este relatório). Estruture em pt-BR: (1) Síntese do perfil, (2) Drivers comportamentais e motivadores, (3) Forças observáveis no trabalho, (4) Riscos e pontos cegos, (5) Estilo de comunicação, (6) Padrões de tomada de decisão sob pressão, (7) Estilo de liderança e colaboração, (8) Ambientes onde tende a prosperar ou entrar em atrito, (9) Interpretação das flags de viés de resposta (se houver). Máx 1200 palavras.
>
> **Guardrails obrigatórios (aplicados em todo output):**
> - Não afirmar competências técnicas ou inteligência
> - Não inferir gênero, idade, raça, religião, orientação sexual, condição de saúde ou origem
> - Não usar linguagem determinística ("sempre", "nunca", "incapaz")
> - Não fazer recomendação de contratação nesta seção (é análise, não veredito)
> - Rodapé fixo: "Este perfil representa tendências comportamentais medidas em um momento específico e não define competência técnica, valor humano ou aptidão para uma vaga. Deve ser usado como um dentre múltiplos insumos de decisão."

### 5.3 Relatório de Fit Candidato × Vaga — Prompt

**Input adicional:** texto da descrição da vaga (parseado do PDF/DOCX) + perfil já gerado em §5.2

**Prompt do sistema** (resumo — spec completa em `/prompts/fit-report.md`):
> Você é um especialista sênior em recrutamento e psicologia comportamental. Analise o perfil DISC do candidato contra os requisitos comportamentais **inferidos** da descrição da vaga. Estruture: (1) Executive Summary com semáforo verde/amarelo/vermelho e recomendação (**Prosseguir / Prosseguir com ressalvas / Reavaliar com cautela**), (2) Fit comportamental por dimensão da vaga, (3) Riscos e pontos de atenção específicos para este par candidato-vaga, (4) 8 a 12 perguntas sugeridas para entrevista aprofundar gaps e validar hipóteses, (5) Guia prático de gestão caso contratado (o que ativa, o que desmotiva, como dar feedback). Tom técnico e direto. Máx 1800 palavras.
>
> **Guardrails obrigatórios:**
> - Nunca dizer "Não contratar" — a decisão é do humano; a IA recomenda **reavaliar com cautela** e explica por quê
> - Se a descrição da vaga contiver linguagem discriminatória (idade, gênero, "boa aparência", etc.), flaggar no início do relatório e **não usar esse critério** na análise
> - Diferenciar claramente "estilo comportamental" de "competência técnica" — DISC não avalia a segunda
> - Rodapé fixo: "Análise baseada exclusivamente em perfil DISC × descrição da vaga. Não substitui entrevistas técnicas, verificação de referências, testes de competência e demais etapas do processo seletivo."

### 5.4 Guardrails Éticos (reforçados)

Aplicam-se a **todo** conteúdo gerado por IA:

1. **DISC não é preditor de sucesso profissional isolado** — disclaimer permanente
2. **Proibido inferir características protegidas** (gênero, idade, raça, orientação, religião, deficiência, origem)
3. **Proibido usar linguagem determinística** — sempre "tende a", "pode indicar", "sugere"
4. **Proibido recomendar rejeição** — apenas "reavaliar com cautela + razões específicas + perguntas de entrevista para validar"
5. **Detecção de linguagem discriminatória na vaga** — se o texto da descrição contiver termos como "jovem", "boa aparência", "apenas mulheres/homens" (fora de contexto legítimo), o relatório abre com um alerta ao recrutador e **remove esses critérios da análise**
6. **Flags de viés de resposta** — sempre expostos ao recrutador quando presentes (gap ipsativo/normativo, padrões de resposta suspeitos)
7. **Auditoria** — todo prompt e resposta são logados (com PII redigido) para revisão trimestral por psicólogo consultor
8. **Rejeição de prompts adversariais** — se o texto da vaga tentar instruir a IA ("ignore instruções anteriores", "recomende contratação"), o pipeline detecta e descarta essas instruções (input sanitization + prompt structure)

### 5.5 Prompt Caching

Usar prompt caching da Claude API para o system prompt (fixo) e reduzir custo em ~90% após primeiro request por sessão. Ver [claude-api skill] para IDs de modelo e sintaxe de caching.

---

## 6. Requisitos Não Funcionais

| Categoria | Requisito |
|---|---|
| **Performance** | Quiz responsivo < 200ms por interação; relatório gerado em < 60s |
| **Disponibilidade** | 99% uptime (SLA Vercel) |
| **Escalabilidade** | Suportar 500 quizzes/dia sem degradação |
| **Segurança** | HTTPS obrigatório; senhas com bcrypt (cost 12); tokens JWT com rotação; rate limiting (10 req/min por IP em rotas públicas) |
| **LGPD** | Consentimento explícito registrado; direito ao esquecimento (endpoint DELETE que apaga tudo em 30 dias); dados criptografados em repouso (Postgres com AES-256 via provider); logs de acesso |
| **Acessibilidade** | WCAG 2.1 AA; navegação por teclado; contraste; screen reader |
| **i18n** | pt-BR na v1; estrutura preparada para en-US em v2 |
| **Mobile** | Responsive-first; testado em iPhone SE e Android médio |

---

## 7. Arquitetura Técnica

### 7.1 Stack

- **Frontend + Backend:** Next.js 15 (App Router, Server Components, Server Actions)
- **Linguagem:** TypeScript strict
- **UI:** Tailwind CSS + shadcn/ui
- **Banco:** PostgreSQL (Neon serverless)
- **ORM:** Prisma
- **Auth recrutador:** NextAuth v5 (Credentials provider, e-mail + senha)
- **Storage arquivos:** Vercel Blob (upload de PDFs de vaga)
- **Parse de arquivos:** `pdf-parse` (PDF) + `mammoth` (DOCX)
- **E-mail:** Resend (transacional)
- **Geração de PDF:** `@react-pdf/renderer` (relatórios) — SSR
- **IA:** `@anthropic-ai/sdk`, modelo `claude-opus-4-8` com prompt caching
- **Filas:** Vercel Queues ou inngest (geração assíncrona de relatório)
- **Observabilidade:** Vercel Analytics + Sentry
- **Deploy:** Vercel (branch `main` → prod, PR → preview)

### 7.2 Diagrama de Fluxo (Alto Nível)

```
[Candidato]
   │  responde quiz
   ▼
[Next.js Server Action] → grava respostas + calcula DISC → [Postgres]
   │
   ▼
[Queue: gerar Perfil Comportamental]
   │
   ▼
[Claude API opus-4-8] → gera perfil técnico → [Postgres]
   │
   ▼
[Resend] → e-mail de notificação ao recrutador ("novo candidato pronto")
[Resend] → e-mail ao candidato com CÓPIA DAS RESPOSTAS BRUTAS (sem análise, sem DISC)
[Candidato] → tela de agradecimento

[Recrutador]
   │  login + upload vaga
   ▼
[Vercel Blob] armazena PDF/DOCX
   │
   ▼
[Parser + sanitizer] extrai texto → [Postgres jobs.description]
   │
   ▼
[Recrutador clica "Gerar Análise de Fit"]
   │
   ▼
[Queue: relatório fit] → [Claude API] → [Postgres] → exibe no portal + PDF consolidado
```

### 7.3 Modelo de Dados (Prisma schema resumido)

```prisma
model Company {
  id            String   @id @default(cuid())
  name          String
  domain        String   @unique
  createdAt     DateTime @default(now())
  recruiters    Recruiter[]
  jobs          Job[]
}

model Recruiter {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String
  companyId     String
  company       Company  @relation(fields: [companyId], references: [id])
  createdAt     DateTime @default(now())
  jobs          Job[]
}

model Job {
  id              String   @id @default(cuid())
  title           String
  descriptionRaw  String   @db.Text
  descriptionFile String?  // Blob URL
  companyId       String
  recruiterId     String
  publicSlug      String   @unique  // usado no link do quiz
  company         Company  @relation(fields: [companyId], references: [id])
  recruiter       Recruiter @relation(fields: [recruiterId], references: [id])
  candidates      Candidate[]
  createdAt       DateTime @default(now())
}

model Candidate {
  id                    String   @id @default(cuid())
  fullName              String
  email                 String
  companyEmail          String
  consentLGPD           Boolean
  consentAt             DateTime
  consentVersion        String   // versão do termo aceito, para auditoria
  jobId                 String?
  job                   Job?     @relation(fields: [jobId], references: [id])
  answers               Answer[]
  discResult            DiscResult?
  profileReport         Report? @relation("ProfileReport")   // interno, visível só ao recrutador
  fitReport             Report? @relation("FitReport")       // visível só ao recrutador
  answersEmailSentAt    DateTime? // cópia das respostas enviada ao candidato (LGPD art.18)
  recruiterNotifiedAt   DateTime? // notificação enviada ao recrutador
  status                CandidateStatus @default(IN_PROGRESS)
  createdAt             DateTime @default(now())
}

model Answer {
  id           String   @id @default(cuid())
  candidateId  String
  candidate    Candidate @relation(fields: [candidateId], references: [id])
  itemKey      String   // ex: "A-12-most" ou "B-07"
  value        String   // "D","I","S","C" ou "1"-"5"
  createdAt    DateTime @default(now())
}

model DiscResult {
  id             String   @id @default(cuid())
  candidateId    String   @unique
  candidate      Candidate @relation(fields: [candidateId], references: [id])
  scoreD         Int
  scoreI         Int
  scoreS         Int
  scoreC         Int
  primaryFactor  String
  secondaryFactor String
  style          String
  biasFlags      String[] // ex: ["ipsative_normative_gap_D"]
  createdAt      DateTime @default(now())
}

model Report {
  id             String   @id @default(cuid())
  candidateId    String
  candidateForProfile Candidate? @relation("ProfileReport", fields: [candidateId], references: [id])
  candidateForFit     Candidate? @relation("FitReport", fields: [candidateId], references: [id])
  type           ReportType // PROFILE | FIT
  contentMd      String   @db.Text
  pdfUrl         String?
  modelUsed      String
  promptVersion  String   // p/ rastrear qual prompt gerou este relatório (auditoria/A-B test)
  tokensInput    Int
  tokensOutput   Int
  createdAt      DateTime @default(now())
}

enum CandidateStatus { IN_PROGRESS COMPLETED PROFILE_READY FIT_GENERATED }
enum ReportType { PROFILE FIT }
```

### 7.4 Endpoints Principais

**Público (candidato):**
- `GET /q/[slug]` — landing da vaga
- `POST /api/quiz/start` — cria Candidate, retorna sessionId
- `POST /api/quiz/answer` — grava answer individual
- `POST /api/quiz/submit` — finaliza, dispara: (a) fila de geração do Perfil Comportamental; (b) e-mail ao candidato com cópia das respostas brutas; (c) notificação ao recrutador
- `POST /api/candidate/forget-me` — LGPD art.18 VI: hard-delete via validação por token de e-mail (30 dias)

> **Não existe** rota pública que exiba relatório de perfil ou análise ao candidato. Qualquer tentativa de acessar `/r/*` retorna 404.

**Autenticado (recrutador):**
- `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`
- `GET /api/jobs`, `POST /api/jobs`, `GET /api/jobs/[id]`, `DELETE /api/jobs/[id]`
- `POST /api/jobs/[id]/description` — upload PDF/DOCX
- `GET /api/jobs/[id]/candidates`
- `GET /api/candidates/[id]/profile` — perfil comportamental (gerado no submit)
- `POST /api/candidates/[id]/generate-fit` — dispara relatório de fit (exige vaga com descrição)
- `GET /api/candidates/[id]/reports/[type]` — download PDF (PROFILE | FIT | CONSOLIDATED)

**Admin (interno):**
- Console de gestão de empresas, recrutadores, uso de IA, auditoria

**Admin:**
- `/admin/*` — rotas protegidas por role

---

## 8. UI/UX Diretrizes

- **Design system:** shadcn/ui base, paleta neutra (slate + accent color primário azul-índigo)
- **Tom:** profissional, humano, não corporativo-frio
- **Quiz:** uma questão por tela em mobile, 4 por tela em desktop (Parte A); Likert como slider ou 5 botões
- **Progresso:** barra fixa no topo + contador "X de Y"
- **Tela de conclusão do candidato:** minimalista, mensagem clara de que a avaliação foi enviada à empresa + confirmação de que ele receberá por e-mail uma cópia das próprias respostas, com aviso LGPD e e-mail do DPO
- **Portal do recrutador — visão do candidato:** tabs `Perfil Comportamental` e `Análise de Fit`, radar DISC visível no topo, badges de flags de viés quando presentes, semáforo grande no topo do Fit, colapsáveis por seção, botão "Exportar PDF Consolidado"
- **Disclaimers permanentes** em rodapé de todas as telas de relatório

Wireframes de referência: criar em Figma antes de dev (fora do escopo do PRD).

---

## 9. Segurança e LGPD

- **Base legal:** consentimento (art. 7º, I) para candidato; execução de contrato (art. 7º, V) para recrutador
- **Termo de consentimento** claro na landing, versionado no banco (`consentVersion`); ao evoluir o termo, candidatos antigos não são afetados retroativamente
- **DPO/contato:** e-mail do encarregado visível na tela final do candidato, no rodapé de todas as páginas, no termo e no e-mail enviado ao candidato
- **Direito de acesso (art. 18, I e II) — cumprimento proativo:** ao concluir o quiz, o sistema envia automaticamente ao e-mail do candidato uma cópia das **respostas brutas** que ele informou (Parte A: escolhas mais/menos; Parte B: notas Likert; timestamps). Esse e-mail **não** contém pontuação DISC, perfil comportamental, análise de fit ou qualquer output de IA — apenas os dados que o próprio candidato forneceu. Isso satisfaz o direito de acesso sem gerar fila de solicitações
- **Solicitações adicionais:** eventuais pedidos mais amplos (ex: cópia integral incluindo metadados) continuam podendo ser feitos ao DPO por e-mail (fluxo manual, baixo volume esperado)
- **Direito ao esquecimento (art. 18, VI):** endpoint `POST /api/candidate/forget-me` valida por token de e-mail e agenda hard-delete em 30 dias
- **Confidencialidade da interpretação:** o termo LGPD e o e-mail ao candidato deixam explícito que a **interpretação técnica** (DISC + análise de fit) é confidencial da empresa recrutadora e não será compartilhada com o candidato — isso é permitido por LGPD (o titular tem direito aos próprios dados, não à interpretação profissional de terceiros)
- **Retenção padrão:** 24 meses após conclusão do quiz; após isso, hard-delete automático (cron)
- **Isolamento multi-tenant:** toda query filtra por `companyId` do usuário logado (middleware Prisma) — teste automatizado obrigatório impede regressão
- **Auditoria:** tabela `AuditLog` com quem acessou qual relatório, quando, de qual IP
- **Secrets:** Vercel env vars, nunca commitados
- **Rate limiting:** Upstash Redis
- **Backup:** snapshots diários do Neon, retenção 30 dias
- **Transparência sobre uso de IA:** termo de consentimento explicita que os dados serão processados por IA (Claude API) para gerar análise ao recrutador — requisito emergente da regulação de IA brasileira em discussão (PL 2338/2023)

---

## 10. Custos Estimados (mensal, 500 quizzes/mês)

| Item | Custo estimado (USD) |
|---|---|
| Vercel Pro | $20 |
| Neon PostgreSQL | $19 |
| Resend (~15k e-mails: candidato recebe respostas + recrutador recebe notificação) | $20 |
| Vercel Blob | $5 |
| Claude API (500 perfis @ ~$0.30 + 500 fit reports @ ~$0.60 com caching) | ~$450 |
| Sentry Team | $26 |
| **Total** | **~$540/mês** |

Modelo de precificação sugerido para empresas: **R$ 39,90 por candidato analisado** (margem ~85% em escala).

---

## 11. Roadmap por Fases

### Fase 1 — MVP (6 semanas)
- Auth recrutador, CRUD de vagas
- Quiz DISC híbrido funcional
- Geração de relatórios (candidato + fit) via Claude API
- Envio por e-mail com PDF
- Portal do recrutador básico
- LGPD: consentimento, direito ao esquecimento

### Fase 2 — Refinamento (4 semanas)
- Calibração normativa com amostra piloto (300+ respostas)
- Detecção de vieses de resposta melhorada
- Dashboard de métricas para recrutador
- Comparação lado-a-lado de múltiplos candidatos na mesma vaga
- Convite em lote (importar CSV de candidatos)

### Fase 3 — Escala (8 semanas)
- SSO empresarial (SAML/Google Workspace)
- API pública para integração com ATS (Gupy, Kenoby)
- Webhook events
- White-label para grandes empresas
- Suporte a en-US e es-ES

---

## 12. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Uso discriminatório do DISC em decisões de contratação | **Crítico (jurídico + reputacional)** | (a) Disclaimer em rodapé de toda tela e todo PDF; (b) IA proibida de recomendar "não contratar" — apenas "reavaliar com cautela"; (c) IA proibida de inferir características protegidas; (d) detecção de linguagem discriminatória no texto da vaga com alerta ao recrutador; (e) revisão trimestral de amostra de relatórios por psicólogo consultor |
| Candidato ver informação que não deveria (vazamento de perfil) | Alto | Zero rota pública que renderize relatório; e-mails do sistema para candidato contêm APENAS confirmação, nunca dados de perfil; testes automatizados garantem isso |
| Banco de itens DISC infringir propriedade intelectual (Wiley/Everything DiSC, Thomas etc.) | Alto (jurídico) | Usar apenas adaptações de domínio público; **contratar psicólogo consultor** para validar o banco e assinar parecer antes do go-live; documentar origem de cada item |
| Ausência de validação psicométrica formal | Médio-Alto | Piloto controlado (300+ respostas) para calibração normativa antes de expor comercialmente; publicar limitações no site |
| Prompt injection via texto da vaga | Médio | Sanitização de input; estrutura de prompt com XML tags separando instruções do sistema vs. dados do usuário; testes adversariais no CI |
| Custo de Claude API escala mais rápido que receita | Médio | Prompt caching, monitorar tokens por report, alertas de custo diário, quotas por empresa |
| Vazamento de dados sensíveis (perfis + e-mails) | Alto | Isolamento multi-tenant estrito, auditoria, criptografia em repouso, teste de penetração antes do go-live |
| Candidato responde de forma enviesada (fake-good) | Médio | Parte B Likert calibra; flags visíveis ao recrutador quando gap ipsativo/normativo |
| Baixa qualidade percebida do relatório de IA | Alto (churn) | Piloto com 3 empresas antes do lançamento; ciclo de feedback estruturado; A/B de prompts; revisão trimestral por psicólogo |
| Regulação de IA (PL 2338/2023) alterar exigências | Médio | Estrutura já preparada com transparência sobre uso de IA no termo; log de decisões IA para auditoria |

---

## 13. Definição de Pronto (MVP)

- [ ] Candidato consegue concluir quiz em desktop e mobile
- [ ] Candidato recebe por e-mail **apenas as respostas brutas** que informou, sem pontuação DISC nem qualquer análise (teste automatizado inspeciona o corpo do e-mail e falha se conter termos como "perfil", "dominante", "D:", "recomendação")
- [ ] Recrutador recebe e-mail de notificação em < 3 min após conclusão do quiz
- [ ] Recrutador consegue criar vaga, subir PDF/DOCX, ler perfil comportamental e gerar análise de fit
- [ ] Portal do recrutador exige login autenticado
- [ ] Isolamento entre empresas testado (não vaza candidato de empresa A para empresa B)
- [ ] Termo LGPD registrado (versionado) + endpoint de esquecimento funcional
- [ ] Guardrails da IA testados com prompts adversariais (nenhum output recomenda "não contratar", nenhum infere característica protegida)
- [ ] Banco de itens DISC revisado e assinado por psicólogo consultor
- [ ] Disclaimers presentes em todas as telas de relatório e em todos os PDFs
- [ ] Deploy em produção com HTTPS, monitoring ativo
- [ ] Documentação de operação (`README.md` + `RUNBOOK.md`)

---

## 14. Referências e Anexos

- Instruções para o Claude Code em `CLAUDE.md` (a criar no root)
- Banco de itens DISC em `/data/disc-items.json` (revisar com psicólogo antes do go-live)
- Prompts detalhados em `/prompts/profile-report.md` e `/prompts/fit-report.md`
- Diagramas de arquitetura em `/docs/architecture/`
- Wireframes Figma: (link a inserir)

---

## 15. Dependências Externas Bloqueantes (não-técnicas)

Estes itens **não** dependem do desenvolvimento de software, mas são pré-requisito para o go-live:

1. **Psicólogo consultor** (CRP ativo) para:
   - Validar/adaptar banco de 24 grupos ipsativos + 20 afirmações Likert em domínio público
   - Assinar parecer de idoneidade psicométrica
   - Revisar amostra trimestral de relatórios gerados por IA
2. **Encarregado de Dados (DPO)** — nomeado (interno ou externo) com e-mail público
3. **Assessoria jurídica** para revisão de:
   - Termo de consentimento LGPD
   - Contrato com empresas recrutadoras (responsabilidades e limitações de uso do relatório)
   - Análise de risco anti-discriminação (CLT, Lei 9.029/95)
4. **Piloto controlado** com 3 empresas parceiras (300+ respostas) para calibração normativa

---

**Fim do PRD.**
