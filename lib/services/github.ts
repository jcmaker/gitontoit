import { Octokit } from "@octokit/rest";
import { GitHubFile, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from "@/lib/types/analyze";

const octokit = new Octokit({
  // GitHub API는 인증 없이도 public repo 접근 가능
  // 필요시 GITHUB_TOKEN 환경변수 추가 가능
});

export type FetchRepoResult = {
  ok: true;
  files: GitHubFile[];
} | {
  ok: false;
  error: string;
};

/**
 * GitHub 리포지토리의 트리와 텍스트 파일들을 가져옵니다
 */
export async function fetchRepoFiles(
  owner: string,
  name: string,
  ref: string = "main"
): Promise<FetchRepoResult> {
  try {
    // 1. 리포지토리 트리 가져오기
    const { data: treeData } = await octokit.rest.git.getTree({
      owner,
      repo: name,
      tree_sha: ref,
      recursive: "true",
    });

    if (!treeData.tree) {
      return { ok: false, error: "Repository tree not found" };
    }

    // 2. 텍스트 파일만 필터링
    const textFiles = treeData.tree.filter((item) => {
      if (item.type !== "blob" || !item.path || !item.size) {
        return false;
      }

      // 크기 제한 (200KB)
      if (item.size > MAX_FILE_SIZE) {
        return false;
      }

      // 확장자 체크
      const extension = getFileExtension(item.path);
      return extension && ALLOWED_EXTENSIONS.includes(extension);
    });

    // 3. 파일 내용 가져오기 (배치 처리)
    const files: GitHubFile[] = [];
    const batchSize = 10; // 동시 요청 제한

    for (let i = 0; i < textFiles.length; i += batchSize) {
      const batch = textFiles.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (file) => {
        try {
          const { data: blobData } = await octokit.rest.git.getBlob({
            owner,
            repo: name,
            file_sha: file.sha!,
          });

          // Base64 디코딩
          const content = Buffer.from(blobData.content, "base64").toString("utf-8");
          
          return {
            path: file.path!,
            content,
            size: file.size!,
            sha: file.sha!,
          };
        } catch (error) {
          console.warn(`Failed to fetch file ${file.path}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      files.push(...batchResults.filter((file): file is GitHubFile => file !== null));
    }

    return { ok: true, files };
  } catch (error) {
    console.error("Error fetching repository files:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("404")) {
        return { ok: false, error: "Repository not found" };
      }
      if (error.message.includes("403")) {
        return { ok: false, error: "Repository access denied" };
      }
    }
    
    return { ok: false, error: "Failed to fetch repository files" };
  }
}

/**
 * 파일 경로에서 확장자를 추출합니다
 */
function getFileExtension(filePath: string): string | null {
  const parts = filePath.split(".");
  if (parts.length < 2) return null;
  
  const extension = parts[parts.length - 1].toLowerCase();
  return ALLOWED_EXTENSIONS.includes(extension as any) ? extension : null;
}

/**
 * 파일이 바이너리인지 확인합니다
 */
function isBinaryFile(content: string): boolean {
  // null 바이트가 있으면 바이너리로 간주
  return content.includes("\0");
}
