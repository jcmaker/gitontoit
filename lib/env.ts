import { z } from "zod";

// 환경변수 로딩 확인
const checkEnvVars = () => {
  console.log("=== Environment Variables Check ===");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
  console.log("OPENAI_API_KEY length:", process.env.OPENAI_API_KEY?.length || 0);
  console.log("All env keys:", Object.keys(process.env).filter(key => key.includes('OPENAI')));
  console.log("===================================");
};

// 서버 사이드에서만 로그 출력
if (typeof window === 'undefined') {
  checkEnvVars();
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  OPENAI_API_KEY: z.string().min(1, "OpenAI API key is required").optional(),
});

export const env = envSchema.parse(process.env);
