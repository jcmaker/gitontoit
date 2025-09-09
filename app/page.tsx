"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, FileText, MessageSquare, Zap, Github, ArrowRight } from "lucide-react";
import { parseGitHubUrl, isValidGitHubUrl } from "@/lib";

export default function Home() {
  const [githubUrl, setGithubUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!githubUrl.trim()) {
      setError("GitHub URL을 입력해주세요.");
      return;
    }

    if (!isValidGitHubUrl(githubUrl)) {
      setError("올바른 GitHub URL을 입력해주세요. (예: https://github.com/owner/repo)");
      return;
    }

    const parsed = parseGitHubUrl(githubUrl);
    if (parsed.isValid) {
      // 분석 페이지로 이동하면서 URL 파라미터로 전달
      const params = new URLSearchParams({
        owner: parsed.owner,
        name: parsed.name,
        ...(parsed.ref && { ref: parsed.ref }),
      });
      router.push(`/analyze?${params.toString()}`);
    }
  };

  const exampleRepos = [
    { name: "Next.js", url: "https://github.com/vercel/next.js" },
    { name: "React", url: "https://github.com/facebook/react" },
    { name: "Vue.js", url: "https://github.com/vuejs/core" },
    { name: "TypeScript", url: "https://github.com/microsoft/TypeScript" },
    { name: "Tailwind CSS", url: "https://github.com/tailwindlabs/tailwindcss" },
    { name: "shadcn/ui", url: "https://github.com/shadcn-ui/ui" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            gitontoit
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            GitHub 링크만으로 즉시 리포지토리 분석
          </p>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            GitHub URL을 붙여넣으면 AI가 자동으로 코드를 분석하고 질문에 답변해드립니다.
          </p>

          {/* GitHub URL 입력 폼 */}
          <Card className="max-w-2xl mx-auto mb-8">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="url"
                      placeholder="https://github.com/owner/repository"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="pl-10 h-12 text-lg"
                    />
                  </div>
                  <Button type="submit" size="lg" className="h-12 px-8">
                    <Search className="mr-2 h-5 w-5" />
                    분석하기
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </form>
            </CardContent>
          </Card>

          {/* 예시 리포지토리 */}
          <div className="mb-12">
            <p className="text-sm text-muted-foreground mb-4">예시 리포지토리:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {exampleRepos.map((repo) => (
                <Button
                  key={repo.name}
                  variant="outline"
                  size="sm"
                  onClick={() => setGithubUrl(repo.url)}
                  className="text-xs"
                >
                  {repo.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>리포지토리 분석</CardTitle>
              <CardDescription>
                GitHub 리포지토리의 구조와 코드를 자동으로 분석하고
                인덱싱합니다.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>스마트 검색</CardTitle>
              <CardDescription>
                AI 임베딩을 사용하여 코드베이스에서 관련 코드를 정확하게
                찾아줍니다.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>AI Q&A</CardTitle>
              <CardDescription>
                코드에 대해 질문하면 GPT-4가 컨텍스트를 바탕으로 정확한 답변을
                제공합니다.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>지원하는 파일 형식</CardTitle>
              <CardDescription>
                TypeScript, JavaScript, Python, Go, Rust, Java, Kotlin, Ruby,
                PHP, C/C++, C#, SQL, JSON, Markdown
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
