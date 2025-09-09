import { GitHubFile, Chunk, CHUNK_CONFIG } from "@/lib/types/analyze";

/**
 * GitHub 파일들을 청크로 분할합니다
 */
export function chunkFiles(files: GitHubFile[]): Chunk[] {
  const chunks: Chunk[] = [];
  let chunkId = 0;

  for (const file of files) {
    const fileChunks = chunkFile(file, chunkId);
    chunks.push(...fileChunks);
    chunkId += fileChunks.length;
  }

  return chunks;
}

/**
 * 단일 파일을 청크로 분할합니다
 */
function chunkFile(file: GitHubFile, startId: number): Chunk[] {
  const lines = file.content.split("\n");

  // 파일이 너무 크면 샘플링
  if (lines.length > CHUNK_CONFIG.maxLines) {
    return chunkLargeFile(file, lines, startId);
  }

  const chunks: Chunk[] = [];
  let currentChunk = "";
  let currentStartLine = 0;
  let chunkId = startId;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineWithNewline = line + "\n";

    // 청크 크기 초과 시 현재 청크 저장
    if (
      currentChunk.length + lineWithNewline.length > CHUNK_CONFIG.targetSize &&
      currentChunk.length > 0
    ) {
      chunks.push(
        createChunk(
          chunkId,
          currentChunk.trim(),
          file.path,
          currentStartLine,
          i - 1
        )
      );
      chunkId++;

      // 오버랩 처리
      const overlapText = getOverlapText(currentChunk);
      currentChunk = overlapText + lineWithNewline;
      currentStartLine = Math.max(0, i - getOverlapLines(overlapText));
    } else {
      currentChunk += lineWithNewline;
    }
  }

  // 마지막 청크 처리
  if (currentChunk.trim().length > 0) {
    chunks.push(
      createChunk(
        chunkId,
        currentChunk.trim(),
        file.path,
        currentStartLine,
        lines.length - 1
      )
    );
  }

  return chunks;
}

/**
 * 큰 파일을 샘플링하여 청킹합니다
 */
function chunkLargeFile(
  file: GitHubFile,
  lines: string[],
  startId: number
): Chunk[] {
  const chunks: Chunk[] = [];
  const totalLines = lines.length;
  const sampleSize = Math.floor(CHUNK_CONFIG.maxLines / 3); // 앞, 중간, 뒤 샘플

  // 앞부분 샘플
  const headLines = lines.slice(0, sampleSize);
  const headChunks = chunkText(headLines.join("\n"), file.path, 0, startId);
  chunks.push(...headChunks);

  // 중간부분 샘플
  const middleStart = Math.floor(totalLines / 2) - Math.floor(sampleSize / 2);
  const middleLines = lines.slice(middleStart, middleStart + sampleSize);
  const middleChunks = chunkText(
    middleLines.join("\n"),
    file.path,
    middleStart,
    startId + headChunks.length
  );
  chunks.push(...middleChunks);

  // 뒷부분 샘플
  const tailStart = totalLines - sampleSize;
  const tailLines = lines.slice(tailStart);
  const tailChunks = chunkText(
    tailLines.join("\n"),
    file.path,
    tailStart,
    startId + headChunks.length + middleChunks.length
  );
  chunks.push(...tailChunks);

  return chunks;
}

/**
 * 텍스트를 청크로 분할합니다
 */
function chunkText(
  text: string,
  filePath: string,
  startLine: number,
  startId: number
): Chunk[] {
  const chunks: Chunk[] = [];
  const lines = text.split("\n");
  let currentChunk = "";
  let currentStartLine = startLine;
  let chunkId = startId;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineWithNewline = line + "\n";

    if (
      currentChunk.length + lineWithNewline.length > CHUNK_CONFIG.targetSize &&
      currentChunk.length > 0
    ) {
      chunks.push(
        createChunk(
          chunkId,
          currentChunk.trim(),
          filePath,
          currentStartLine,
          currentStartLine + i - 1
        )
      );
      chunkId++;

      const overlapText = getOverlapText(currentChunk);
      currentChunk = overlapText + lineWithNewline;
      currentStartLine = Math.max(
        startLine,
        currentStartLine + i - getOverlapLines(overlapText)
      );
    } else {
      currentChunk += lineWithNewline;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(
      createChunk(
        chunkId,
        currentChunk.trim(),
        filePath,
        currentStartLine,
        currentStartLine + lines.length - 1
      )
    );
  }

  return chunks;
}

/**
 * 청크 객체를 생성합니다
 */
function createChunk(
  id: number,
  content: string,
  filePath: string,
  startLine: number,
  endLine: number
): Chunk {
  return {
    id: `chunk_${id}`,
    content,
    filePath,
    startLine,
    endLine,
  };
}

/**
 * 오버랩 텍스트를 추출합니다
 */
function getOverlapText(text: string): string {
  const lines = text.split("\n");
  const overlapLines = Math.floor(CHUNK_CONFIG.overlap / 50); // 대략적인 라인 수
  return lines.slice(-overlapLines).join("\n") + "\n";
}

/**
 * 오버랩 텍스트의 라인 수를 계산합니다
 */
function getOverlapLines(overlapText: string): number {
  return overlapText.split("\n").length - 1;
}
