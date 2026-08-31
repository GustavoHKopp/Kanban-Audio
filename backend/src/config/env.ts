import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 3333),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  corsOrigin: process.env.CORS_ORIGIN ?? "",
};

const ORIGEM_DEV_PERMITIDA =
  /^http:\/\/(localhost|127\.0\.0\.1|(\d{1,3}\.){3}\d{1,3}):\d+$/;

export function origemPermitida(origin: string | undefined): boolean {
  if (!origin) return true;
  if (env.corsOrigin && origin === env.corsOrigin) return true;
  return ORIGEM_DEV_PERMITIDA.test(origin);
}
