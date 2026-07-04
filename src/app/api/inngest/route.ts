import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { quizSubmittedFn } from "@/inngest/functions/quiz-submitted";
import { generateFitFn } from "@/inngest/functions/generate-fit";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [quizSubmittedFn, generateFitFn],
});
