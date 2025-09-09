"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, FileText, MessageSquare, Github, ArrowLeft } from "lucide-react";
import { AnalyzeRequest, AnalyzeResponse, SearchHit, Citation, parseGitHubUrl, isValidGitHubUrl } from "@/lib";
import Link from "next/link";

interface AnalyzeFormData {
  owner: string;
  name: string;
  ref: string;
  question: string;
  topK: number;
  githubUrl: string;
}

const defaultFormData: AnalyzeFormData = {
  owner: "",
  name: "",
  ref: "main",
  question: "",
  topK: 8,
  githubUrl: "",
};

async function analyzeRepository(
  data: AnalyzeRequest
): Promise<AnalyzeResponse> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to analyze repository");
  }

  return response.json();
}

export default function AnalyzePage() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<AnalyzeFormData>(defaultFormData);
  const [selectedHit, setSelectedHit] = useState<SearchHit | null>(null);

  const mutation = useMutation({
    mutationFn: analyzeRepository,
    onSuccess: (data) => {
      if (data.hits && data.hits.length > 0) {
        setSelectedHit(data.hits[0]);
      }
    },
  });

  // URL 파라미터에서 리포지토리 정보 가져오기
  useEffect(() => {
    const owner = searchParams.get("owner");
    const name = searchParams.get("name");
    const ref = searchParams.get("ref");

    if (owner && name) {
      setFormData({
        owner,
        name,
        ref: ref || "main",
        question: "",
        topK: 8,
      });

      // 자동으로 분석 시작
      mutation.mutate({
        owner,
        name,
        ref: ref || "main",
        topK: 8,
      });
    }
  }, [searchParams, mutation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.owner || !formData.name) {
      return;
    }

    mutation.mutate({
      owner: formData.owner,
      name: formData.name,
      ref: formData.ref || "main",
      question: formData.question || undefined,
      topK: formData.topK,
    });
  };

  const handleInputChange = (
    field: keyof AnalyzeFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGitHubUrlChange = (url: string) => {
    setFormData((prev) => ({ ...prev, githubUrl: url }));
    
    if (isValidGitHubUrl(url)) {
      const parsed = parseGitHubUrl(url);
      if (parsed.isValid) {
        setFormData((prev) => ({
          ...prev,
          owner: parsed.owner,
          name: parsed.name,
          ref: parsed.ref || "main",
        }));
      }
    }
  };

  const extractSnippet = (content: string, maxLines: number = 3): string => {
    const lines = content.split("\n");
    return lines.slice(0, maxLines).join("\n");
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              홈으로
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-2">Repository Analyzer</h1>
        <p className="text-muted-foreground">
          GitHub 리포지토리를 분석하고 코드에 대해 질문하세요
        </p>
      </div>

      {/* Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Repository Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* GitHub URL 입력 */}
            <div className="space-y-2">
              <Label htmlFor="githubUrl">GitHub URL (또는 개별 입력)</Label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="githubUrl"
                  placeholder="https://github.com/owner/repository"
                  value={formData.githubUrl}
                  onChange={(e) => handleGitHubUrlChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner">Repository Owner</Label>
                <Input
                  id="owner"
                  placeholder="e.g., vercel"
                  value={formData.owner}
                  onChange={(e) => handleInputChange("owner", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Repository Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., next.js"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ref">Branch/Ref (optional)</Label>
                <Input
                  id="ref"
                  placeholder="main"
                  value={formData.ref}
                  onChange={(e) => handleInputChange("ref", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topK">Top K Results</Label>
                <Input
                  id="topK"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.topK}
                  onChange={(e) =>
                    handleInputChange("topK", parseInt(e.target.value) || 8)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="question">Question (optional)</Label>
              <Textarea
                id="question"
                placeholder="Ask a question about the repository..."
                value={formData.question}
                onChange={(e) => handleInputChange("question", e.target.value)}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze Repository
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error State */}
      {mutation.isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {mutation.error?.message ||
              "An error occurred while analyzing the repository"}
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {mutation.isSuccess && mutation.data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Search Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Search Results ({mutation.data.hits?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mutation.data.hits && mutation.data.hits.length > 0 ? (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {mutation.data.hits.map((hit, index) => (
                      <Card
                        key={hit.chunk.id}
                        className={`cursor-pointer transition-colors ${
                          selectedHit?.chunk.id === hit.chunk.id
                            ? "ring-2 ring-primary"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedHit(hit)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-primary">
                                #{index + 1}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Score: {hit.score.toFixed(3)}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {hit.chunk.filePath}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Lines {hit.chunk.startLine}-{hit.chunk.endLine}
                            </p>
                            <div className="text-sm text-muted-foreground">
                              <pre className="whitespace-pre-wrap font-mono text-xs">
                                {extractSnippet(hit.chunk.content)}
                              </pre>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No search results found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Answer and Citations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Answer & Citations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mutation.data.answer ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Answer</h4>
                    <ScrollArea className="h-[300px]">
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap">
                          {mutation.data.answer}
                        </p>
                      </div>
                    </ScrollArea>
                  </div>

                  {mutation.data.citations &&
                    mutation.data.citations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Citations</h4>
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-3">
                            {mutation.data.citations.map((citation, index) => (
                              <Card key={index} className="p-3">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-primary">
                                    {citation.filePath}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Lines {citation.startLine}-
                                    {citation.endLine}
                                  </p>
                                  <div className="text-sm text-muted-foreground">
                                    <pre className="whitespace-pre-wrap font-mono text-xs">
                                      {extractSnippet(citation.content, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No answer available</p>
                  <p className="text-sm">
                    Try asking a question about the repository
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {mutation.isPending && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                      <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                      <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                <div className="h-3 bg-muted animate-pulse rounded w-full" />
                <div className="h-3 bg-muted animate-pulse rounded w-5/6" />
                <div className="h-3 bg-muted animate-pulse rounded w-4/6" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
