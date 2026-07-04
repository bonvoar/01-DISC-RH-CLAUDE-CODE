"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import discItems from "@/../data/disc-items.json";

type Factor = "D" | "I" | "S" | "C";
type PartAGroup = { id: string; words: { word: string; factor: Factor }[] };
type PartBItem = { id: string; statement: string; factor: Factor };

const partA = discItems.partA as PartAGroup[];
const partB = discItems.partB as PartBItem[];

type PartAAnswer = { most: Factor | null; least: Factor | null };
type PartBAnswer = number | null;

export default function QuizPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [phase, setPhase] = useState<"A" | "B">("A");
  const [partAAnswers, setPartAAnswers] = useState<Record<string, PartAAnswer>>({});
  const [partBAnswers, setPartBAnswers] = useState<Record<string, PartBAnswer>>({});
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const totalSteps = partA.length + partB.length;
  const currentStep =
    phase === "A"
      ? currentGroupIndex + 1
      : partA.length + currentGroupIndex + 1;

  const saveAnswer = useCallback(async (itemKey: string, value: string) => {
    setSaving(true);
    setSaveError(false);
    try {
      const res = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemKey, value }),
      });
      if (!res.ok) throw new Error("save failed");
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }, []);

  function handlePartASelect(
    groupId: string,
    position: "most" | "least",
    factor: Factor
  ) {
    setPartAAnswers((prev) => {
      const current = prev[groupId] ?? { most: null, least: null };
      const other = position === "most" ? "least" : "most";

      // Prevent same word being selected for both most and least
      if (current[other] === factor) return prev;

      const updated = { ...current, [position]: factor };
      void saveAnswer(`${groupId}-${position}`, factor);
      return { ...prev, [groupId]: updated };
    });
  }

  function handlePartBSelect(itemId: string, value: number) {
    setPartBAnswers((prev) => {
      void saveAnswer(itemId, String(value));
      return { ...prev, [itemId]: value };
    });
  }

  function canAdvancePartA() {
    const current = partAAnswers[partA[currentGroupIndex]?.id ?? ""];
    return current?.most !== null && current?.least !== null;
  }

  function canAdvancePartB() {
    const current = partBAnswers[partB[currentGroupIndex]?.id ?? ""];
    return current !== null && current !== undefined;
  }

  function advance() {
    if (phase === "A") {
      if (currentGroupIndex < partA.length - 1) {
        setCurrentGroupIndex((i) => i + 1);
      } else {
        setPhase("B");
        setCurrentGroupIndex(0);
      }
    } else {
      if (currentGroupIndex < partB.length - 1) {
        setCurrentGroupIndex((i) => i + 1);
      }
    }
  }

  function back() {
    if (phase === "A" && currentGroupIndex > 0) {
      setCurrentGroupIndex((i) => i - 1);
    } else if (phase === "B") {
      if (currentGroupIndex > 0) {
        setCurrentGroupIndex((i) => i - 1);
      } else {
        setPhase("A");
        setCurrentGroupIndex(partA.length - 1);
      }
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    const res = await fetch("/api/quiz/submit", { method: "POST" });
    if (res.ok) {
      router.push(`/q/${slug}/done`);
    } else {
      const data = await res.json();
      alert(data.error ?? "Erro ao enviar. Tente novamente.");
      setSubmitting(false);
    }
  }

  const isLastStep =
    phase === "B" && currentGroupIndex === partB.length - 1;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>
              {phase === "A" ? "Parte A — Perfil de palavras" : "Parte B — Afirmações"}
            </span>
            <span>{currentStep} de {totalSteps}</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pt-20 pb-10 px-4">
        <div className="max-w-2xl mx-auto">
          {phase === "A" ? (
            <PartAQuestion
              group={partA[currentGroupIndex]}
              answer={partAAnswers[partA[currentGroupIndex]?.id ?? ""] ?? { most: null, least: null }}
              onSelect={handlePartASelect}
            />
          ) : (
            <PartBQuestion
              item={partB[currentGroupIndex]}
              answer={partBAnswers[partB[currentGroupIndex]?.id ?? ""] ?? null}
              onSelect={handlePartBSelect}
            />
          )}

          <div className="flex gap-3 mt-8">
            <button
              onClick={back}
              disabled={phase === "A" && currentGroupIndex === 0}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition-colors"
            >
              Anterior
            </button>

            {isLastStep ? (
              <button
                onClick={handleSubmit}
                disabled={!canAdvancePartB() || submitting}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Enviando..." : "Enviar avaliação"}
              </button>
            ) : (
              <button
                onClick={advance}
                disabled={phase === "A" ? !canAdvancePartA() : !canAdvancePartB()}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Próxima
              </button>
            )}
          </div>

          {saving && (
            <p className="text-center text-xs text-slate-400 mt-3">Salvando...</p>
          )}
          {saveError && (
            <p className="text-center text-xs text-red-500 mt-3">
              Não foi possível salvar sua última resposta. Verifique sua conexão.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function PartAQuestion({
  group,
  answer,
  onSelect,
}: {
  group: PartAGroup;
  answer: PartAAnswer;
  onSelect: (groupId: string, position: "most" | "least", factor: Factor) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500 mb-4">
        Selecione qual palavra mais e menos descreve você
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left font-medium text-slate-700 pb-3 w-full">Palavra</th>
              <th className="text-center font-medium text-indigo-600 pb-3 px-4 whitespace-nowrap">MAIS</th>
              <th className="text-center font-medium text-slate-500 pb-3 px-4 whitespace-nowrap">MENOS</th>
            </tr>
          </thead>
          <tbody>
            {group.words.map(({ word, factor }) => {
              const isMost = answer.most === factor;
              const isLeast = answer.least === factor;
              const mostDisabled = answer.least === factor;
              const leastDisabled = answer.most === factor;

              return (
                <tr key={factor} className="border-t border-slate-100">
                  <td className="py-3 pr-4 text-slate-800 font-medium">{word}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => !mostDisabled && onSelect(group.id, "most", factor)}
                      disabled={mostDisabled}
                      role="radio"
                      aria-checked={isMost}
                      aria-label={`Marcar "${word}" como a palavra que mais te descreve`}
                      className={`h-5 w-5 rounded-full border-2 transition-colors ${
                        isMost
                          ? "border-indigo-600 bg-indigo-600"
                          : mostDisabled
                          ? "border-slate-200 bg-slate-100 cursor-not-allowed"
                          : "border-slate-300 hover:border-indigo-400"
                      }`}
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => !leastDisabled && onSelect(group.id, "least", factor)}
                      disabled={leastDisabled}
                      role="radio"
                      aria-checked={isLeast}
                      aria-label={`Marcar "${word}" como a palavra que menos te descreve`}
                      className={`h-5 w-5 rounded-full border-2 transition-colors ${
                        isLeast
                          ? "border-slate-700 bg-slate-700"
                          : leastDisabled
                          ? "border-slate-200 bg-slate-100 cursor-not-allowed"
                          : "border-slate-300 hover:border-slate-500"
                      }`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PartBQuestion({
  item,
  answer,
  onSelect,
}: {
  item: PartBItem;
  answer: number | null;
  onSelect: (itemId: string, value: number) => void;
}) {
  const labels = ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <p className="text-base font-medium text-slate-800 mb-6">{item.statement}</p>
      <div role="radiogroup" aria-label={item.statement} className="flex gap-2 justify-between">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => onSelect(item.id, value)}
            role="radio"
            aria-checked={answer === value}
            aria-label={labels[value - 1]}
            className={`flex-1 flex flex-col items-center gap-2 rounded-lg border-2 py-3 px-1 transition-colors ${
              answer === value
                ? "border-indigo-600 bg-indigo-50"
                : "border-slate-200 hover:border-indigo-300"
            }`}
          >
            <span className="text-lg font-semibold text-slate-700">{value}</span>
            <span className="text-[10px] text-slate-500 text-center leading-tight hidden sm:block">
              {labels[value - 1]}
            </span>
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-slate-400 sm:hidden">
        <span>Discordo totalmente</span>
        <span>Concordo totalmente</span>
      </div>
    </div>
  );
}
