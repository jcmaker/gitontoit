import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchRepoFiles } from "@/lib/services/github";
import { chunkFiles } from "@/lib/services/chunking";
import { embedChunks } from "@/lib/services/embedding";
import { searchChunks, generateAnswer } from "@/lib/services/search";
import { AnalyzeRequest, AnalyzeResult } from "@/lib/types/analyze";

// 요청 스키마 검증
const analyzeRequestSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  name: z.string().min(1, "Repository name is required"),
  ref: z.string().optional().default("main"),
  question: z.string().optional(),
  topK: z.number().int().min(1).max(20).optional().default(8),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<AnalyzeResult>> {
  // AbortController로 90초 타임아웃 설정
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    // 요청 본문 파싱 및 검증
    const body = await request.json();
    const validatedData = analyzeRequestSchema.parse(body);

    const { owner, name, ref, question, topK } = validatedData;

    // 1. GitHub API로 리포지토리 파일 가져오기
    const repoResult = await fetchRepoFiles(owner, name, ref);
    if (!repoResult.ok) {
      return NextResponse.json(
        { ok: false, error: repoResult.error },
        { status: 400 }
      );
    }

    const { files } = repoResult;

    // 파일이 없으면 에러
    if (files.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No text files found in repository" },
        { status: 400 }
      );
    }

    // 2. 청킹
    const chunks = chunkFiles(files);

    // 3. 임베딩 생성
    const embeddingResult = await embedChunks(chunks);
    if (!embeddingResult.ok) {
      return NextResponse.json(
        { ok: false, error: embeddingResult.error },
        { status: 500 }
      );
    }

    const embeddedChunks = embeddingResult.chunks;

    // 4. 질문이 있으면 검색 및 답변 생성
    let hits;
    let answer;
    let citations;

    if (question) {
      // 검색
      hits = await searchChunks(embeddedChunks, question, topK);

      // 답변 생성
      if (hits.length > 0) {
        const answerResult = await generateAnswer(question, hits);
        if (answerResult) {
          answer = answerResult.answer;
          citations = answerResult.citations;
        }
      }
    }

    // 5. 응답 반환
    const response: AnalyzeResult = {
      ok: true,
      files,
      chunks: embeddedChunks,
      ...(hits && { hits }),
      ...(answer && { answer }),
      ...(citations && { citations }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in analyze API:", error);

    // 타임아웃 에러
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        {
          ok: false,
          error: "Request timeout. Please try again with a smaller repository.",
        },
        { status: 408 }
      );
    }

    // Zod 검증 에러
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return NextResponse.json(
        { ok: false, error: `Validation error: ${errorMessage}` },
        { status: 400 }
      );
    }

    // 기타 에러
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// GET 요청은 허용하지 않음
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { ok: false, error: "Method not allowed. Use POST instead." },
    { status: 405 }
  );
}
