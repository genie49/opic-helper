# 배포 가이드

## 목차
- [개요](#개요)
- [배포 전략](#배포-전략)
- [Option 1: 전부 Vercel (권장 - MVP)](#option-1-전부-vercel-권장---mvp)
- [Option 2: 하이브리드 (안정적 - 프로덕션)](#option-2-하이브리드-안정적---프로덕션)
- [환경 변수 관리](#환경-변수-관리)
- [CI/CD 설정](#cicd-설정)
- [모니터링 및 로깅](#모니터링-및-로깅)

---

## 개요

OPIc 학습 서비스는 3개의 주요 컴포넌트로 구성됩니다:

1. **Frontend**: Next.js (App Router) + TypeScript
2. **API Server**: Next.js API Routes (Drizzle ORM)
3. **AI Agent Server**: FastAPI + LangChain

이 문서에서는 두 가지 배포 전략을 제시합니다.

---

## 배포 전략

### 비교표

| 항목 | Option 1: 전부 Vercel | Option 2: 하이브리드 |
|-----|----------------------|---------------------|
| **Frontend** | Vercel | Vercel |
| **Next.js API** | Vercel | Vercel |
| **FastAPI** | ✅ Vercel Functions | ✅ GCP Cloud Run |
| **복잡도** | ⭐ 낮음 | ⭐⭐ 중간 |
| **비용 (월)** | $0~$20 (Hobby/Pro) | $0~$10 (프리 티어 내) |
| **SSE 제한** | ⚠️ 60초 타임아웃 | ✅ 제한 없음 |
| **관리** | 단일 플랫폼 | 두 플랫폼 |
| **추천 단계** | **MVP (Phase 1-2)** | **프로덕션 (Phase 3+)** |

---

## Option 1: 전부 Vercel (권장 - MVP)

### 장점
- ✅ 단일 플랫폼에서 모든 것 관리
- ✅ 설정이 간단함
- ✅ 자동 배포 (Git push 시)
- ✅ 무료 플랜으로 시작 가능 (Hobby: $0/월)
- ✅ 도메인, HTTPS 자동 설정

### 단점
- ⚠️ **SSE 응답 60초 제한** (긴 AI 평가 시 문제 가능)
- ⚠️ Python Functions 실행 시간 제한
- ⚠️ 메모리 제한 (최대 3GB)

### 적합한 경우
- MVP 단계 (Phase 1-2)
- AI 평가가 60초 이내에 완료
- 빠른 프로토타이핑 우선

---

### 1.1 Frontend + Next.js API 배포

#### 프로젝트 구조
```
opic-helper/
├── app/                    # Next.js App Router
├── components/             # React 컴포넌트
├── lib/                    # 유틸리티
├── drizzle/                # Drizzle ORM 스키마
├── public/                 # 정적 파일
├── .env.local              # 로컬 환경 변수
├── next.config.js          # Next.js 설정
├── package.json
└── vercel.json             # Vercel 설정
```

#### Vercel 프로젝트 생성

```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 디렉토리에서
cd opic-helper
vercel login
vercel

# 질문에 답변:
# - Link to existing project? No
# - Project name: opic-helper
# - Framework: Next.js
# - Root directory: ./
```

#### 환경 변수 설정 (Vercel Dashboard)

```bash
# Vercel Dashboard → Settings → Environment Variables

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database
DATABASE_URL=postgresql://postgres:...@db.xxx.supabase.co:5432/postgres

# FastAPI URL (Option 1: Vercel Functions)
NEXT_PUBLIC_FASTAPI_URL=https://opic-helper.vercel.app/api/ai
```

#### 자동 배포 설정

Vercel은 GitHub 연동 시 자동 배포됩니다:

```bash
# 1. GitHub 리포지토리 연결
vercel link

# 2. main 브랜치 푸시 시 자동 배포
git push origin main
# → Production 배포

# 3. feature 브랜치 푸시 시 자동 프리뷰
git push origin feature/new-feature
# → Preview 배포 (https://opic-helper-git-feature-xxx.vercel.app)
```

---

### 1.2 FastAPI 배포 (Vercel Python Functions)

#### 프로젝트 구조 (FastAPI)

```
opic-helper/
├── api/                    # Vercel Python Functions
│   └── ai/
│       ├── __init__.py
│       ├── evaluate.py     # POST /api/ai/evaluate
│       ├── roleplay.py     # POST /api/ai/roleplay
│       └── agents/
│           ├── question_agent.py
│           └── evaluation_agent.py
├── requirements.txt        # Python 의존성
└── vercel.json            # Vercel 설정
```

#### `vercel.json` 설정

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/ai/(.*)",
      "dest": "/api/ai/$1"
    }
  ],
  "env": {
    "SUPABASE_URL": "@supabase_url",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key",
    "XAI_API_KEY": "@xai_api_key"
  }
}
```

#### FastAPI 코드 (Vercel Functions용)

```python
# api/ai/evaluate.py
from fastapi import FastAPI, Request, Depends
from fastapi.responses import StreamingResponse
from mangum import Mangum
import json
import asyncio

app = FastAPI()

# Supabase 클라이언트
from supabase import create_client, Client
import os

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# JWT 검증
async def verify_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(401, "인증 토큰 필요")

    token = auth_header.replace("Bearer ", "")
    user = supabase.auth.get_user(token)

    if not user:
        raise HTTPException(401, "유효하지 않은 토큰")

    return user

# SSE 평가 엔드포인트
@app.post("/api/ai/evaluate")
async def evaluate(request: Request, user = Depends(verify_token)):
    """
    답변 평가 (SSE 스트리밍)

    ⚠️ Vercel Functions: 최대 60초 실행 제한
    """
    body = await request.json()

    async def event_generator():
        try:
            # 진행 상황 스트리밍
            yield f"data: {json.dumps({'progress': 20, 'message': '발화량 분석 중...'})}\n\n"
            await asyncio.sleep(0.5)

            yield f"data: {json.dumps({'progress': 40, 'message': '문법 평가 중...'})}\n\n"
            await asyncio.sleep(0.5)

            # LangChain Agent 실행
            from agents.evaluation_agent import evaluation_agent
            result = await evaluation_agent.ainvoke({
                "question": body["question"],
                "answer": body["answer"],
                "current_level": body["current_level"]
            })

            # 최종 결과
            yield f"data: {json.dumps({'progress': 100, 'result': result})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

# Vercel용 핸들러
handler = Mangum(app)
```

#### `requirements.txt`

```txt
fastapi==0.109.0
mangum==0.17.0
langchain==0.1.0
langchain-openai==0.0.5
supabase==2.3.4
sse-starlette==1.8.2
pydantic==2.5.0
python-dotenv==1.0.0
```

#### 배포

```bash
# 환경 변수 설정
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add XAI_API_KEY

# 배포
vercel --prod
```

---

## Option 2: 하이브리드 (안정적 - 프로덕션)

### 장점
- ✅ **SSE 제한 없음** (GCP Cloud Run)
- ✅ AI 평가 시간 무제한 (최대 60분)
- ✅ 메모리 최대 32GB 사용 가능
- ✅ WebSocket 지원 (필요 시)
- ✅ 독립적 스케일링

### 단점
- ⚠️ 두 플랫폼 관리 필요
- ⚠️ 설정이 복잡
- ⚠️ GCP 계정 필요

### 적합한 경우
- 프로덕션 환경 (Phase 3+)
- AI 평가가 60초 이상 소요
- 높은 안정성 필요

---

### 2.1 Frontend + Next.js API 배포 (Vercel)

**Option 1과 동일** (위 참조)

---

### 2.2 FastAPI 배포 (GCP Cloud Run)

#### 프로젝트 구조

```
fastapi-server/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 앱
│   ├── agents/
│   │   ├── question_agent.py
│   │   └── evaluation_agent.py
│   ├── database.py          # Supabase 클라이언트
│   └── auth.py              # JWT 검증
├── Dockerfile
├── requirements.txt
├── .dockerignore
└── .env.example
```

#### `Dockerfile`

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 앱 코드 복사
COPY ./app ./app

# 포트 노출
EXPOSE 8080

# 실행 (Cloud Run은 PORT 환경 변수 사용)
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
```

#### `requirements.txt`

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
langchain==0.1.0
langchain-openai==0.0.5
supabase==2.3.4
sse-starlette==1.8.2
pydantic==2.5.0
python-dotenv==1.0.0
```

#### `app/main.py`

```python
# app/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
import os

app = FastAPI(title="OPIc AI Agent API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://opic-helper.vercel.app",  # 프로덕션 도메인
        "http://localhost:3000"             # 로컬 개발
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT 검증
from app.auth import verify_token

# SSE 평가 엔드포인트
@app.post("/evaluate")
async def evaluate_answer(
    request: EvaluationRequest,
    user = Depends(verify_token)
):
    """답변 평가 (SSE 스트리밍)"""

    async def event_generator():
        # ... (이전 코드와 동일)
        pass

    return EventSourceResponse(event_generator())

# 헬스 체크
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

#### GCP 설정 및 배포

```bash
# 1. GCP CLI 설치
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# 2. 프로젝트 생성
gcloud projects create opic-helper-ai --name="OPIc AI Server"
gcloud config set project opic-helper-ai

# 3. Cloud Run API 활성화
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 4. Docker 이미지 빌드 및 푸시
gcloud builds submit --tag gcr.io/opic-helper-ai/fastapi-server

# 5. Cloud Run 배포
gcloud run deploy fastapi-server \
  --image gcr.io/opic-helper-ai/fastapi-server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY,XAI_API_KEY=$XAI_API_KEY \
  --memory 2Gi \
  --cpu 2 \
  --timeout 600 \
  --max-instances 10 \
  --min-instances 0

# 배포 후 URL 확인
# https://fastapi-server-xxx-uc.a.run.app
```

#### 환경 변수 관리 (GCP Secret Manager)

```bash
# Secret 생성
echo -n "your-supabase-url" | gcloud secrets create supabase-url --data-file=-
echo -n "your-service-role-key" | gcloud secrets create supabase-service-role-key --data-file=-
echo -n "your-xai-api-key" | gcloud secrets create xai-api-key --data-file=-

# Cloud Run에서 Secret 사용
gcloud run services update fastapi-server \
  --update-secrets SUPABASE_URL=supabase-url:latest,SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest,XAI_API_KEY=xai-api-key:latest
```

#### Next.js 환경 변수 업데이트

```bash
# Vercel Dashboard → Environment Variables
NEXT_PUBLIC_FASTAPI_URL=https://fastapi-server-xxx-uc.a.run.app
```

---

## 환경 변수 관리

### 로컬 개발

```bash
# .env.local (Next.js)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000  # 로컬 FastAPI

# .env (FastAPI)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
XAI_API_KEY=xai-...
```

### Vercel (Production)

```bash
# Vercel Dashboard → Settings → Environment Variables
# 또는 CLI로:

vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_FASTAPI_URL production
```

### GCP Cloud Run (Production)

```bash
# Secret Manager 사용 (권장)
gcloud secrets create supabase-url --data-file=-
gcloud secrets create supabase-service-role-key --data-file=-
gcloud secrets create xai-api-key --data-file=-

# Cloud Run 배포 시 연결
gcloud run deploy fastapi-server \
  --update-secrets SUPABASE_URL=supabase-url:latest
```

---

## CI/CD 설정

### Vercel (자동 배포)

Vercel은 GitHub 연동 시 자동으로 CI/CD가 설정됩니다:

```yaml
# 별도 설정 불필요
# main 브랜치 푸시 → Production 배포
# feature 브랜치 푸시 → Preview 배포
```

### GCP Cloud Run (GitHub Actions)

```yaml
# .github/workflows/deploy-fastapi.yml
name: Deploy FastAPI to Cloud Run

on:
  push:
    branches:
      - main
    paths:
      - 'fastapi-server/**'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1

      - name: Build and Push Docker image
        run: |
          gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/fastapi-server \
            ./fastapi-server

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy fastapi-server \
            --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/fastapi-server \
            --platform managed \
            --region us-central1 \
            --allow-unauthenticated
```

---

## 모니터링 및 로깅

### Vercel Analytics

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### GCP Cloud Monitoring

```bash
# Cloud Logging 보기
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=fastapi-server" \
  --limit 50 \
  --format json

# 메트릭 확인
gcloud monitoring dashboards list
```

### 에러 추적 (Sentry)

```bash
# Next.js
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs

# FastAPI
pip install sentry-sdk[fastapi]
```

```python
# app/main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
)
```

---

## 배포 체크리스트

### Phase 1: MVP (Vercel Only)

- [ ] Vercel 프로젝트 생성
- [ ] GitHub 리포지토리 연결
- [ ] 환경 변수 설정 (Supabase, XAI API)
- [ ] 도메인 설정 (선택적)
- [ ] HTTPS 확인
- [ ] Vercel Analytics 활성화

### Phase 2: 하이브리드 전환 (선택적)

- [ ] GCP 프로젝트 생성
- [ ] Cloud Run API 활성화
- [ ] Dockerfile 작성
- [ ] Secret Manager 설정
- [ ] FastAPI Cloud Run 배포
- [ ] CORS 설정 (Vercel 도메인 허용)
- [ ] Next.js 환경 변수 업데이트

### 공통

- [ ] 데이터베이스 마이그레이션 (Drizzle)
- [ ] Supabase RLS 정책 활성화
- [ ] 초기 데이터 시드
- [ ] 헬스 체크 엔드포인트 테스트
- [ ] 에러 모니터링 설정 (Sentry)

---

## 비용 예상

### Option 1: 전부 Vercel

| 서비스 | 플랜 | 월 비용 |
|-------|-----|--------|
| Vercel (Frontend + API + FastAPI) | Hobby | **$0** |
| Vercel (Frontend + API + FastAPI) | Pro | **$20** |
| Supabase | Free | **$0** |
| Grok API | 종량제 | **~$5** |
| **총합** | | **$0~$25** |

### Option 2: 하이브리드

| 서비스 | 플랜 | 월 비용 |
|-------|-----|--------|
| Vercel (Frontend + Next.js API) | Hobby | **$0** |
| GCP Cloud Run (FastAPI) | Free Tier | **$0** (180만 요청/월) |
| Supabase | Free | **$0** |
| Grok API | 종량제 | **~$5** |
| **총합** | | **$5~$10** |

**참고**: Grok API 비용은 사용량에 따라 변동

---

## 다음 단계

1. **배포 전략 결정**: Option 1 (MVP) vs Option 2 (프로덕션)
2. **환경 변수 준비**: Supabase, XAI API 키 발급
3. **Vercel 프로젝트 생성** (공통)
4. **FastAPI 배포**: Vercel Functions 또는 GCP Cloud Run
5. **도메인 설정** (선택적)
6. **모니터링 설정**: Analytics + Sentry

---

## 참고 자료

### Vercel
- [Vercel 공식 문서](https://vercel.com/docs)
- [Vercel Python Functions](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)

### GCP Cloud Run
- [Cloud Run 공식 문서](https://cloud.google.com/run/docs)
- [Cloud Run 빠른 시작](https://cloud.google.com/run/docs/quickstarts)
- [Secret Manager 가이드](https://cloud.google.com/secret-manager/docs)

### FastAPI
- [FastAPI 배포 가이드](https://fastapi.tiangolo.com/deployment/)
- [Mangum (Vercel용 ASGI 어댑터)](https://mangum.io/)
