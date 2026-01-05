# Supabase + Drizzle ORM 통합 가이드

## 개요

OPIc 학습 서비스는 **하이브리드 데이터베이스 접근 방식**을 사용합니다:

- **Supabase Auth + RLS**: 인증, 세션 관리, Row Level Security
- **Drizzle ORM**: 타입 안전 데이터베이스 쿼리

## 아키텍처

```
┌─────────────────────────────────────────┐
│         Next.js Application             │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐   ┌───────────────┐  │
│  │ Supabase     │   │ Drizzle ORM   │  │
│  │ (Auth/RLS)   │   │ (DB Queries)  │  │
│  └──────┬───────┘   └───────┬───────┘  │
│         │                   │          │
└─────────┼───────────────────┼──────────┘
          │                   │
          └────────┬──────────┘
                   ▼
         ┌─────────────────┐
         │ Supabase        │
         │ PostgreSQL      │
         └─────────────────┘
```

## 1. 환경 변수 설정

### `frontend/.env.local`

```bash
# Supabase Project
NEXT_PUBLIC_SUPABASE_URL=https://bvnkditlhsdfizduafus.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_xxxxx

# Drizzle ORM (Transaction Pooler)
DATABASE_URL="postgresql://postgres.bvnkditlhsdfizduafus:[YOUR-PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"

# FastAPI Backend
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8080

# Environment
NODE_ENV=development
```

**중요:**
- Supabase Auth는 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` 사용
- Drizzle은 `DATABASE_URL` (Transaction Pooler) 사용
- Transaction Pooler는 `pgbouncer=true` 옵션 불필요

## 2. Supabase Auth 설정

### 패키지 설치

```bash
npm install @supabase/ssr @supabase/supabase-js
```

### 유틸리티 파일 구조

```
lib/
├── supabase/
│   ├── server.ts      # Server Component용
│   ├── client.ts      # Client Component용
│   └── middleware.ts  # Middleware용
└── db/
    ├── schema.ts      # Drizzle 스키마
    └── index.ts       # Drizzle 클라이언트
```

### `lib/supabase/server.ts` (Server Components)

```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출된 경우 무시
            // Middleware가 세션을 갱신함
          }
        },
      },
    }
  );
};
```

### `lib/supabase/client.ts` (Client Components)

```typescript
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const createClient = () => {
  return createBrowserClient(
    supabaseUrl!,
    supabaseKey!
  );
};
```

### `lib/supabase/middleware.ts` (Middleware)

```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신 (중요!)
  await supabase.auth.getUser();

  return supabaseResponse;
};
```

## 3. Drizzle ORM 설정

### `lib/db/schema.ts`

```typescript
import { pgTable, serial, text, varchar, uuid, timestamp } from "drizzle-orm/pg-core";

// 예시: users 테이블
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: text('full_name'),
  phone: varchar('phone', { length: 256 }),
});

// 예시: user_profiles 테이블
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // FK to auth.users
  displayName: varchar('display_name', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

### `lib/db/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Transaction Pool Mode: prepare: false 필수
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
```

### `drizzle.config.ts`

```typescript
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  out: "./lib/db/migrations",
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

## 4. 사용 패턴

### Pattern 1: 인증 + Drizzle 쿼리 (Server Component)

```typescript
// app/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // 1. Supabase Auth로 사용자 확인
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // 2. Drizzle ORM으로 데이터 조회
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });

  return (
    <div>
      <h1>Welcome, {profile?.displayName || user.email}</h1>
    </div>
  );
}
```

### Pattern 2: API Route에서 사용

```typescript
// app/api/profile/route.ts
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  // 1. 인증 확인
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Drizzle로 데이터 조회
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });

  return NextResponse.json({ profile });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Drizzle로 데이터 삽입/업데이트
  const updated = await db
    .insert(userProfiles)
    .values({
      userId: user.id,
      displayName: body.displayName,
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: { displayName: body.displayName },
    })
    .returning();

  return NextResponse.json({ profile: updated[0] });
}
```

### Pattern 3: Client Component에서 인증

```typescript
"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function ProfileButton() {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return user ? (
    <button onClick={handleLogout}>Logout</button>
  ) : (
    <a href="/login">Login</a>
  );
}
```

## 5. Middleware 설정

### `middleware.ts` (프로젝트 루트)

```typescript
import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

## 6. 데이터베이스 마이그레이션

### 스키마 생성

```bash
cd frontend
npm run db:generate
```

### Supabase에 푸시

```bash
npm run db:push
```

### Drizzle Studio로 확인

```bash
npm run db:studio
```

## 7. Best Practices

### ✅ DO

1. **인증은 Supabase**: `supabase.auth.getUser()` 사용
2. **쿼리는 Drizzle**: 타입 안전 쿼리로 데이터 조회
3. **RLS 활성화**: Supabase에서 Row Level Security 설정
4. **Server Components 우선**: 가능하면 서버에서 데이터 페칭
5. **Transaction Pooler 사용**: 연결 풀 최적화

### ❌ DON'T

1. **Supabase-js로 복잡한 쿼리**: Drizzle 사용
2. **Client에서 민감한 쿼리**: Server Component/API Route 사용
3. **prepare: true**: Transaction Pooler와 호환 안됨
4. **직접 SQL**: Drizzle 쿼리 빌더 사용

## 8. 타입 안전성

Drizzle ORM은 자동으로 타입을 생성합니다:

```typescript
import { db } from "@/lib/db";
import { users, userProfiles } from "@/lib/db/schema";

// 타입 추론 자동
const allUsers = await db.select().from(users);
// allUsers: { id: number; fullName: string | null; phone: string | null }[]

// 조인 쿼리도 타입 안전
const usersWithProfiles = await db
  .select()
  .from(users)
  .leftJoin(userProfiles, eq(users.id, userProfiles.userId));
```

## 9. 디버깅

### Drizzle 쿼리 로깅

```typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!, {
  prepare: false,
  // SQL 로깅 활성화
  debug: process.env.NODE_ENV === 'development',
});

export const db = drizzle(client, {
  schema,
  logger: true, // 모든 쿼리 로깅
});
```

### Supabase Auth 디버깅

```typescript
const { data, error } = await supabase.auth.getUser();
console.log('Auth data:', data);
console.log('Auth error:', error);
```

## 10. 요약

| 기능 | 사용 도구 | 이유 |
|------|-----------|------|
| 인증/세션 | Supabase Auth | 간편한 OAuth, 세션 관리 |
| 데이터 쿼리 | Drizzle ORM | 타입 안전, 복잡한 쿼리 |
| 보안 | Supabase RLS | Row Level Security |
| 마이그레이션 | Drizzle Kit | 버전 관리, 스키마 변경 |
| 실시간 | Supabase Realtime | (필요시) 실시간 구독 |

이 하이브리드 접근 방식으로 **타입 안전성**과 **개발 편의성**을 동시에 확보할 수 있습니다.
