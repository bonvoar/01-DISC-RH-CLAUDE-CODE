import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const PROFILE_REPORT_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";
export const PROFILE_REPORT_PROMPT_VERSION = "1.0";
export const FIT_REPORT_PROMPT_VERSION = "1.0";
