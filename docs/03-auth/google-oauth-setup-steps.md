# Google OAuth 설정 단계별 가이드

## 1. Google Cloud Console 설정

### Step 1: 프로젝트 생성
1. https://console.cloud.google.com/ 접속
2. 상단의 프로젝트 선택 드롭다운 클릭
3. "새 프로젝트" 클릭
4. 프로젝트 이름: **OPIc Helper** 입력
5. "만들기" 클릭

### Step 2: OAuth 동의 화면 구성
1. 왼쪽 메뉴에서 **"API 및 서비스"** → **"OAuth 동의 화면"** 클릭
2. 사용자 유형: **"외부"** 선택 → "만들기" 클릭
3. 앱 정보 입력:
   - 앱 이름: `OPIc Helper`
   - 사용자 지원 이메일: 본인 이메일 선택
   - 앱 로고: (선택사항)
4. 앱 도메인 (선택사항):
   - 애플리케이션 홈페이지: `http://localhost:3000`
5. 개발자 연락처 정보: 본인 이메일 입력
6. **"저장 후 계속"** 클릭

### Step 3: 범위 추가 (선택사항)
1. **"저장 후 계속"** 클릭 (기본 범위 사용)

### Step 4: 테스트 사용자 추가
1. **"+ ADD USERS"** 클릭
2. 테스트에 사용할 Google 계정 이메일 추가
3. **"저장 후 계속"** 클릭

### Step 5: OAuth 2.0 클라이언트 ID 생성
1. 왼쪽 메뉴에서 **"사용자 인증 정보"** 클릭
2. 상단의 **"+ 사용자 인증 정보 만들기"** → **"OAuth 2.0 클라이언트 ID"** 클릭
3. 애플리케이션 유형: **"웹 애플리케이션"** 선택
4. 이름: `OPIc Helper Web Client` 입력
5. **승인된 JavaScript 원본** - "URI 추가" 클릭:
   ```
   http://localhost:3000
   ```
6. **승인된 리디렉션 URI** - "URI 추가" 클릭하여 2개 추가:
   ```
   http://localhost:3000/auth/callback
   https://bvnkditlhsdfizduafus.supabase.co/auth/v1/callback
   ```
7. **"만들기"** 클릭
8. ✅ **Client ID**와 **Client Secret** 복사해서 메모장에 저장

**예시:**
```
Client ID: 123456789-abcdefghijk.apps.googleusercontent.com
Client Secret: GOCSPX-abc123def456ghi789
```

---

## 2. Supabase Dashboard 설정

### Step 1: Google Provider 활성화
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택: **bvnkditlhsdfizduafus**
3. 왼쪽 메뉴에서 **"Authentication"** 클릭 (🔒 자물쇠 아이콘)
4. **"Providers"** 탭 클릭
5. 목록에서 **"Google"** 찾아서 클릭

### Step 2: Google OAuth 정보 입력
1. **"Enable Sign in with Google"** 토글을 **ON**으로 변경
2. Google Cloud Console에서 복사한 정보 입력:
   - **Client ID (for OAuth)**: 복사한 Client ID 붙여넣기
   - **Client Secret (for OAuth)**: 복사한 Client Secret 붙여넣기
3. 하단의 **"Save"** 버튼 클릭

---

## 3. 로컬에서 테스트

### Step 1: 데이터베이스 마이그레이션 (처음 한 번만)
```bash
cd frontend
npm run db:push
npm run db:seed
```

### Step 2: 개발 서버 실행
```bash
npm run dev
```

### Step 3: 브라우저에서 테스트
1. http://localhost:3000 접속
2. 우측 상단 **"로그인"** 버튼 클릭
3. **"Google로 로그인"** 버튼 클릭
4. Google 계정 선택 (테스트 사용자로 추가한 계정)
5. 권한 승인
6. ✅ 대시보드로 자동 리다이렉트 확인
7. ✅ 헤더 우측 상단에 프로필 사진 표시 확인
8. 프로필 사진 클릭 → 드롭다운 메뉴 확인
9. **"로그아웃"** 클릭 → 홈페이지로 리다이렉트 확인

### Step 4: 데이터베이스 확인
```bash
npm run db:studio
```
- 브라우저에서 http://localhost:4983 접속
- **user_profiles** 테이블 클릭
- 새로 생성된 사용자 프로필 확인

---

## 트러블슈팅

### 문제 1: "앱이 확인되지 않았습니다" 경고
**원인**: OAuth 앱이 아직 Google의 검증을 받지 않음

**해결방법**:
- "고급" 클릭
- "OPIc Helper(으)로 이동(안전하지 않음)" 클릭
- 개발/테스트 단계에서는 정상적인 경고입니다

### 문제 2: Redirect URI mismatch 오류
**원인**: Google Cloud Console에 등록한 리디렉션 URI가 일치하지 않음

**해결방법**:
1. Google Cloud Console → 사용자 인증 정보
2. OAuth 2.0 클라이언트 ID 클릭
3. 승인된 리디렉션 URI 확인:
   ```
   http://localhost:3000/auth/callback
   https://bvnkditlhsdfizduafus.supabase.co/auth/v1/callback
   ```
4. 정확히 일치하는지 확인 (끝에 `/` 없어야 함)

### 문제 3: 로그인 후 프로필이 생성되지 않음
**원인**: 데이터베이스 마이그레이션이 실행되지 않음

**해결방법**:
```bash
cd frontend
npm run db:push
```

### 문제 4: "Access blocked: OPIc Helper has not completed the Google verification process"
**원인**: 테스트 사용자로 추가되지 않은 계정으로 로그인 시도

**해결방법**:
1. Google Cloud Console → OAuth 동의 화면
2. "테스트 사용자" 섹션에서 "+ ADD USERS"
3. 사용할 Google 계정 추가

---

## 프로덕션 배포 시 추가 작업

프로덕션 환경에 배포할 때는 다음을 추가로 설정해야 합니다:

### 1. Google Cloud Console
**승인된 JavaScript 원본**에 프로덕션 도메인 추가:
```
https://your-domain.com
```

**승인된 리디렉션 URI**에 프로덕션 콜백 추가:
```
https://your-domain.com/auth/callback
```

### 2. OAuth 앱 검증 (선택사항)
- 100명 이상의 사용자가 사용할 경우 Google의 앱 검증 필요
- Google Cloud Console → OAuth 동의 화면 → "앱 게시" 클릭
- 검증 프로세스 진행 (약 4-6주 소요)

---

## 체크리스트

### Google Cloud Console
- [ ] 프로젝트 생성 완료
- [ ] OAuth 동의 화면 구성 완료
- [ ] 테스트 사용자 추가 완료
- [ ] OAuth 2.0 클라이언트 ID 생성 완료
- [ ] Client ID와 Secret 복사 완료
- [ ] 승인된 리디렉션 URI 2개 추가 완료

### Supabase Dashboard
- [ ] Google Provider 활성화 완료
- [ ] Client ID 입력 완료
- [ ] Client Secret 입력 완료
- [ ] 설정 저장 완료

### 로컬 테스트
- [ ] 데이터베이스 마이그레이션 완료 (`npm run db:push`)
- [ ] 데이터베이스 시딩 완료 (`npm run db:seed`)
- [ ] 개발 서버 실행 완료 (`npm run dev`)
- [ ] 로그인 페이지 접속 확인
- [ ] Google 로그인 성공 확인
- [ ] 대시보드 리다이렉트 확인
- [ ] 사용자 프로필 표시 확인
- [ ] 로그아웃 기능 확인
- [ ] `user_profiles` 테이블에 데이터 확인

모든 항목이 체크되면 인증 시스템이 정상적으로 작동합니다! 🎉
