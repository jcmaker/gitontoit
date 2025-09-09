/**
 * GitHub URL 파싱 및 검증 유틸리티
 */

export interface ParsedGitHubUrl {
  owner: string;
  name: string;
  ref?: string;
  isValid: boolean;
}

/**
 * GitHub URL을 파싱하여 owner, name, ref를 추출합니다
 */
export function parseGitHubUrl(url: string): ParsedGitHubUrl {
  try {
    // URL 정규화
    const normalizedUrl = normalizeGitHubUrl(url);
    
    // GitHub URL 패턴 매칭
    const patterns = [
      // https://github.com/owner/repo
      // https://github.com/owner/repo/
      /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/,
      
      // https://github.com/owner/repo/tree/branch
      // https://github.com/owner/repo/tree/branch/
      /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/?$/,
      
      // https://github.com/owner/repo/blob/branch/path
      /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/.*$/,
      
      // https://github.com/owner/repo/commit/hash
      /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/commit\/([^\/]+)$/,
    ];

    for (const pattern of patterns) {
      const match = normalizedUrl.match(pattern);
      if (match) {
        const [, owner, name, ref] = match;
        
        // .git 확장자 제거
        const cleanName = name.replace(/\.git$/, '');
        
        return {
          owner: owner.toLowerCase(),
          name: cleanName.toLowerCase(),
          ref: ref || undefined,
          isValid: true,
        };
      }
    }

    return {
      owner: '',
      name: '',
      isValid: false,
    };
  } catch (error) {
    return {
      owner: '',
      name: '',
      isValid: false,
    };
  }
}

/**
 * GitHub URL을 정규화합니다
 */
function normalizeGitHubUrl(url: string): string {
  // 공백 제거
  let normalized = url.trim();
  
  // 프로토콜이 없으면 https 추가
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  
  // www.github.com을 github.com으로 변경
  normalized = normalized.replace(/^https?:\/\/www\.github\.com/, 'https://github.com');
  
  // 마지막 슬래시 제거
  normalized = normalized.replace(/\/$/, '');
  
  return normalized;
}

/**
 * GitHub URL이 유효한지 검증합니다
 */
export function isValidGitHubUrl(url: string): boolean {
  const parsed = parseGitHubUrl(url);
  return parsed.isValid;
}

/**
 * GitHub URL에서 리포지토리 정보를 추출합니다
 */
export function extractRepoInfo(url: string): { owner: string; name: string; ref?: string } | null {
  const parsed = parseGitHubUrl(url);
  
  if (!parsed.isValid) {
    return null;
  }
  
  return {
    owner: parsed.owner,
    name: parsed.name,
    ref: parsed.ref,
  };
}

/**
 * GitHub URL을 생성합니다
 */
export function buildGitHubUrl(owner: string, name: string, ref?: string): string {
  const baseUrl = `https://github.com/${owner}/${name}`;
  return ref ? `${baseUrl}/tree/${ref}` : baseUrl;
}
