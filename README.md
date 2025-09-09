# gitontoit

GitHub 링크만으로 즉시 리포지토리 분석하는 AI 서비스

## 🚀 기술 스택

- **Frontend**: Next.js 15 (App Router) + TypeScript + TailwindCSS + shadcn/ui
- **State Management**: TanStack Query
- **Icons**: Lucide React
- **Validation**: Zod
- **Styling**: TailwindCSS v4 with CSS Variables

## 📁 프로젝트 구조

```
├── app/                    # Next.js App Router
├── components/
│   ├── ui/                # shadcn/ui 원자 컴포넌트
│   └── common/            # 도메인별 공통 컴포넌트
├── lib/                   # 서버 전용 유틸리티 및 데이터 접근
├── hooks/                 # 커스텀 React 훅
└── .cursor/rules/         # 프로젝트 개발 규칙
```

## 🚀 사용 방법

1. **GitHub URL 입력**: 분석하고 싶은 리포지토리의 GitHub 링크를 붙여넣기
2. **자동 분석**: 시스템이 자동으로 리포지토리를 분석하고 인덱싱
3. **질문하기**: 코드에 대해 자연어로 질문하고 AI 답변 받기

### 예시
```
https://github.com/vercel/next.js
```

## 🛠️ 개발 환경 설정

### 필수 요구사항

- Node.js 18+
- npm 또는 yarn
- OpenAI API 키

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local에 OPENAI_API_KEY 추가

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 린트 검사
npm run lint
```

개발 서버는 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

## 🎯 주요 기능

- **원클릭 분석**: GitHub URL만 붙여넣으면 즉시 분석 시작
- **스마트 인덱싱**: 리포지토리 구조와 코드 자동 분석
- **AI Q&A**: 코드에 대해 자연어로 질문하고 답변 받기
- **실시간 검색**: 관련 코드 스니펫을 정확하게 찾아주기

## 📝 개발 규칙

프로젝트의 개발 규칙은 `.cursor/rules/` 디렉토리에 정의되어 있습니다:

- 함수형/선언적 프로그래밍 우선
- TypeScript strict 모드
- 컴포넌트 분리 및 모듈화
- 안전한 에러 처리
- 성능과 가독성의 균형

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feat/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'feat: add amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feat/amazing-feature`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.
