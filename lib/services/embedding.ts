import OpenAI from "openai";
import { env } from "@/lib/env";
import { Chunk } from "@/lib/types/analyze";

if (!env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export interface EmbeddingResult {
  ok: true;
  chunks: Chunk[];
} | {
  ok: false;
  error: string;
}

/**
 * 청크들에 임베딩을 생성합니다
 */
export async function embedChunks(chunks: Chunk[]): Promise<EmbeddingResult> {
  try {
    if (chunks.length === 0) {
      return { ok: true, chunks: [] };
    }

    // 배치 크기 설정 (OpenAI 권장: 256-512)
    const batchSize = 256;
    const embeddedChunks: Chunk[] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchResult = await embedBatch(batch);
      
      if (!batchResult.ok) {
        return batchResult;
      }
      
      embeddedChunks.push(...batchResult.chunks);
    }

    return { ok: true, chunks: embeddedChunks };
  } catch (error) {
    console.error("Error embedding chunks:", error);
    return { ok: false, error: "Failed to generate embeddings" };
  }
}

/**
 * 청크 배치에 임베딩을 생성합니다
 */
async function embedBatch(chunks: Chunk[]): Promise<EmbeddingResult> {
  try {
    // 텍스트 추출 및 길이 제한
    const texts = chunks.map(chunk => truncateText(chunk.content, 8000)); // 토큰 제한 고려
    
    // OpenAI 임베딩 API 호출
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: texts,
    });

    // 임베딩을 청크에 추가
    const embeddedChunks: Chunk[] = chunks.map((chunk, index) => ({
      ...chunk,
      embedding: response.data[index]?.embedding,
    }));

    return { ok: true, chunks: embeddedChunks };
  } catch (error) {
    console.error("Error in embedBatch:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("rate_limit")) {
        return { ok: false, error: "Rate limit exceeded. Please try again later." };
      }
      if (error.message.includes("invalid_request")) {
        return { ok: false, error: "Invalid request to embedding service" };
      }
    }
    
    return { ok: false, error: "Failed to generate embeddings for batch" };
  }
}

/**
 * 텍스트를 안전하게 잘라냅니다
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  // 단어 경계에서 자르기
  const truncated = text.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(" ");
  
  if (lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex);
  }
  
  return truncated;
}

/**
 * 쿼리 텍스트에 대한 임베딩을 생성합니다
 */
export async function embedQuery(query: string): Promise<number[] | null> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: [query],
    });

    return response.data[0]?.embedding || null;
  } catch (error) {
    console.error("Error embedding query:", error);
    return null;
  }
}
