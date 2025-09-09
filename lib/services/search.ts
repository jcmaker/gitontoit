import OpenAI from "openai";
import { env } from "@/lib/env";
import { Chunk, SearchHit, Citation } from "@/lib/types/analyze";
import { embedQuery } from "./embedding";

if (!env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

/**
 * 코사인 유사도를 계산합니다
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 임베딩을 사용하여 청크들을 검색합니다
 */
export async function searchChunks(
  chunks: Chunk[],
  query: string,
  topK: number = 8
): Promise<SearchHit[]> {
  try {
    // 쿼리 임베딩 생성
    const queryEmbedding = await embedQuery(query);
    if (!queryEmbedding) {
      throw new Error("Failed to generate query embedding");
    }

    // 임베딩이 있는 청크만 필터링
    const chunksWithEmbeddings = chunks.filter((chunk) => chunk.embedding);

    if (chunksWithEmbeddings.length === 0) {
      return [];
    }

    // 유사도 계산
    const hits: SearchHit[] = chunksWithEmbeddings.map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding!),
    }));

    // 점수순 정렬 및 상위 K개 반환
    return hits.sort((a, b) => b.score - a.score).slice(0, topK);
  } catch (error) {
    console.error("Error searching chunks:", error);
    return [];
  }
}

/**
 * 검색 결과를 기반으로 LLM 답변을 생성합니다
 */
export async function generateAnswer(
  question: string,
  hits: SearchHit[]
): Promise<{ answer: string; citations: Citation[] } | null> {
  try {
    if (hits.length === 0) {
      return null;
    }

    // 컨텍스트 구성
    const context = hits
      .map((hit, index) => {
        const snippet = extractSnippet(hit.chunk.content, 200);
        return `[${index + 1}] ${hit.chunk.filePath}:${hit.chunk.startLine}-${
          hit.chunk.endLine
        }\n${snippet}`;
      })
      .join("\n\n");

    // 인용 정보 추출
    const citations: Citation[] = hits.map((hit) => ({
      filePath: hit.chunk.filePath,
      startLine: hit.chunk.startLine,
      endLine: hit.chunk.endLine,
      content: extractSnippet(hit.chunk.content, 200),
    }));

    // LLM 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that answers questions about code repositories. 
Use the provided code snippets to answer the user's question accurately. 
Always cite the specific file paths and line numbers when referencing code.
If you cannot find the answer in the provided context, say so clearly.`,
        },
        {
          role: "user",
          content: `Question: ${question}\n\nContext:\n${context}\n\nPlease provide a comprehensive answer based on the code context above.`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const answer = response.choices[0]?.message?.content;
    if (!answer) {
      return null;
    }

    return { answer, citations };
  } catch (error) {
    console.error("Error generating answer:", error);
    return null;
  }
}

/**
 * 텍스트에서 스니펫을 추출합니다
 */
function extractSnippet(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  // 중간 부분을 중심으로 스니펫 추출
  const start = Math.max(0, Math.floor((text.length - maxLength) / 2));
  const end = start + maxLength;

  let snippet = text.substring(start, end);

  // 단어 경계에서 자르기
  if (start > 0) {
    const firstSpace = snippet.indexOf(" ");
    if (firstSpace > 0 && firstSpace < 50) {
      snippet = "..." + snippet.substring(firstSpace + 1);
    } else {
      snippet = "..." + snippet;
    }
  }

  if (end < text.length) {
    const lastSpace = snippet.lastIndexOf(" ");
    if (lastSpace > snippet.length - 50) {
      snippet = snippet.substring(0, lastSpace) + "...";
    } else {
      snippet = snippet + "...";
    }
  }

  return snippet;
}
