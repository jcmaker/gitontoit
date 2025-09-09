// API 요청/응답 타입 정의

export interface AnalyzeRequest {
  owner: string;
  name: string;
  ref?: string; // 브랜치 또는 커밋 해시, 기본값: main
  question?: string; // Q&A용 질문
  topK?: number; // 검색 결과 개수, 기본값: 8
}

export interface GitHubFile {
  path: string;
  content: string;
  size: number;
  sha: string;
}

export interface Chunk {
  id: string;
  content: string;
  filePath: string;
  startLine: number;
  endLine: number;
  embedding?: number[];
}

export interface SearchHit {
  chunk: Chunk;
  score: number;
}

export interface Citation {
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
}

export interface AnalyzeResponse {
  ok: true;
  files: GitHubFile[];
  chunks: Chunk[];
  hits?: SearchHit[];
  answer?: string;
  citations?: Citation[];
}

export interface AnalyzeError {
  ok: false;
  error: string;
}

export type AnalyzeResult = AnalyzeResponse | AnalyzeError;

// 허용된 파일 확장자
export const ALLOWED_EXTENSIONS = [
  "ts",
  "tsx",
  "js",
  "jsx",
  "md",
  "mdx",
  "py",
  "go",
  "rs",
  "java",
  "kt",
  "rb",
  "php",
  "c",
  "cpp",
  "cs",
  "sql",
  "json",
] as const;

export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

// 최대 파일 크기 (200KB)
export const MAX_FILE_SIZE = 200 * 1024;

// 청킹 설정
export const CHUNK_CONFIG = {
  targetSize: 600, // 목표 토큰 수 (문자 길이로 근사)
  overlap: 120, // 오버랩 크기
  maxLines: 5000, // 파일당 최대 라인 수
} as const;
