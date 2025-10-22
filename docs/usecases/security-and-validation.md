# 맛집 지도 서비스 - 보안 및 검증 유스케이스

## 문서 정보

- **버전**: 1.0.0
- **작성일**: 2025-10-21
- **카테고리**: 보안 및 검증
- **참조 문서**:
  - [사용자 플로우 문서](/docs/userflow.md) - 섹션 7.6
  - [PRD](/docs/prd.md) - 섹션 8.2
  - [데이터베이스 설계](/docs/database.md) - 섹션 8

---

## 목차

1. [개요](#개요)
2. [UC-SEC-001: 비밀번호 bcrypt 해싱](#uc-sec-001-비밀번호-bcrypt-해싱)
3. [UC-SEC-002: XSS 방지 (입력값 Sanitization)](#uc-sec-002-xss-방지-입력값-sanitization)
4. [UC-SEC-003: 클라이언트 측 유효성 검증](#uc-sec-003-클라이언트-측-유효성-검증)
5. [UC-SEC-004: 서버 측 유효성 검증](#uc-sec-004-서버-측-유효성-검증)
6. [UC-SEC-005: 비밀번호 기반 리뷰 인증](#uc-sec-005-비밀번호-기반-리뷰-인증)
7. [비기능 요구사항](#비기능-요구사항)
8. [보안 체크리스트](#보안-체크리스트)

---

## 개요

### 목적

맛집 지도 서비스는 비로그인 방식으로 운영되므로, 사용자 데이터 보호와 시스템 무결성을 위한 강력한 보안 및 검증 메커니즘이 필수적입니다. 본 문서는 다음 세 가지 핵심 보안 기능의 유스케이스를 정의합니다:

1. **비밀번호 보호**: bcrypt 해싱을 통한 안전한 비밀번호 저장
2. **XSS 방지**: 악의적인 스크립트 삽입 차단
3. **데이터 유효성 검증**: 클라이언트 및 서버 양측에서의 입력값 검증

### 보안 원칙

- **Defense in Depth**: 다층 방어 전략 (클라이언트 + 서버 검증)
- **Zero Trust**: 모든 입력값은 신뢰하지 않음
- **Fail Secure**: 에러 발생 시 안전한 상태로 복구
- **Least Privilege**: 최소 권한 원칙 적용

### 기술 스택

| 기술 | 용도 | 버전/설정 |
|------|------|----------|
| **bcrypt** | 비밀번호 해싱 | salt rounds: 10 |
| **zod** | 스키마 검증 | 3.x |
| **DOMPurify** | XSS 방지 (선택) | 최신 버전 |
| **react-hook-form** | 폼 유효성 검증 | 7.x |
| **Hono** | 서버 미들웨어 | 4.9.9 |

---

## UC-SEC-001: 비밀번호 bcrypt 해싱

### 유스케이스 정보

- **ID**: UC-SEC-001
- **이름**: 리뷰 작성 시 비밀번호 bcrypt 해싱
- **우선순위**: P0 (필수)
- **관련 기능**: 리뷰 작성, 리뷰 수정/삭제

### 액터

- **Primary**: 서버 시스템 (Hono API)
- **Secondary**: 사용자 (리뷰 작성자)

### 사전 조건

1. 사용자가 리뷰 작성 폼에서 비밀번호를 입력함
2. 비밀번호가 클라이언트 측 유효성 검증을 통과함 (4~20자)
3. HTTPS 연결이 활성화되어 있음 (평문 전송 보호)

### 기본 플로우

#### 1단계: 비밀번호 수신 및 검증

**액터 액션**:
- 사용자가 리뷰 작성 폼에서 비밀번호를 입력하고 "작성하기" 버튼 클릭

**시스템 동작**:
1. 클라이언트가 HTTPS를 통해 평문 비밀번호를 서버로 전송
2. 서버가 요청 본문에서 비밀번호 추출
3. Zod 스키마로 비밀번호 길이 검증 (4~20자)

```typescript
// 요청 스키마
const createReviewSchema = z.object({
  authorName: z.string().min(2).max(10),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(10).max(500),
  password: z.string().min(4).max(20),
  visitDate: z.string().optional()
});
```

#### 2단계: bcrypt 해싱 수행

**시스템 동작**:
1. bcrypt 라이브러리의 `hash()` 함수 호출
2. Salt rounds 10으로 해싱 수행 (약 100ms 소요)
3. 60자 길이의 해시 문자열 생성

```typescript
// 서버 측 코드 (service.ts)
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(plainPassword: string): Promise<string> {
  const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

  // 해시 길이 검증 (bcrypt는 항상 60자)
  if (passwordHash.length !== 60) {
    throw new Error('Invalid password hash generated');
  }

  return passwordHash;
}
```

#### 3단계: 해시 저장

**시스템 동작**:
1. 생성된 해시를 `reviews` 테이블의 `password_hash` 컬럼에 저장
2. 데이터베이스 제약조건 검증 (60자 고정 길이)
3. 원본 평문 비밀번호는 메모리에서 즉시 제거

```sql
-- 데이터베이스 제약조건
CREATE TABLE reviews (
  ...
  password_hash TEXT NOT NULL CHECK (length(password_hash) = 60),
  ...
);
```

#### 4단계: 성공 응답

**시스템 동작**:
1. 리뷰 작성 완료 응답 반환 (password_hash는 포함하지 않음)
2. 클라이언트에서 성공 토스트 메시지 표시

```typescript
// 응답 예시
{
  "success": true,
  "data": {
    "id": "review-uuid",
    "authorName": "홍길동",
    "rating": 5,
    "content": "맛있어요!",
    "createdAt": "2025-10-21T10:00:00Z"
    // password_hash는 응답에 포함되지 않음
  }
}
```

### 대체 플로우

#### A1: 해싱 실패

**조건**: bcrypt 해싱 중 에러 발생

**시스템 동작**:
1. 에러 로그 기록 (비밀번호 내용은 제외)
2. 사용자에게 500 에러 응답 반환
3. "일시적인 오류가 발생했습니다" 메시지 표시
4. 리뷰 작성 롤백 (트랜잭션 활용)

```typescript
// 에러 처리
try {
  const passwordHash = await hashPassword(password);
} catch (error) {
  logger.error('Password hashing failed', {
    userId: userIdentifier,
    // 비밀번호는 로그에 포함하지 않음
  });

  return c.json({
    success: false,
    error: {
      code: 'HASHING_ERROR',
      message: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    }
  }, 500);
}
```

### 예외 플로우

#### E1: 비밀번호 길이 초과

**조건**: 비밀번호가 20자를 초과함

**시스템 동작**:
1. Zod 검증 실패
2. 400 에러 응답 반환
3. "비밀번호는 4~20자 사이여야 합니다" 메시지 표시

#### E2: HTTP 연결 사용 시도

**조건**: 사용자가 HTTPS 대신 HTTP로 접속 시도

**시스템 동작**:
1. 미들웨어에서 프로토콜 확인
2. HTTPS로 리다이렉트
3. 평문 비밀번호 전송 차단

```typescript
// middleware/https-redirect.ts
if (c.req.header('x-forwarded-proto') !== 'https') {
  return c.redirect(`https://${c.req.header('host')}${c.req.path}`);
}
```

### 사후 조건

**성공 시**:
- 비밀번호가 bcrypt 해시로 안전하게 저장됨
- 평문 비밀번호는 어디에도 저장되지 않음
- 해시는 60자 고정 길이로 저장됨

**실패 시**:
- 리뷰가 생성되지 않음
- 사용자에게 명확한 에러 메시지 제공
- 시스템 로그에 에러 기록 (비밀번호 제외)

### 비기능 요구사항

| 항목 | 요구사항 | 목표값 |
|------|----------|--------|
| **성능** | bcrypt 해싱 시간 | < 200ms (salt rounds 10) |
| **보안** | Salt rounds | 10 (OWASP 권장) |
| **보안** | 해시 길이 검증 | 항상 60자 (bcrypt 표준) |
| **보안** | 평문 로깅 금지 | 100% 준수 |
| **가용성** | 해싱 실패 시 복구 | 자동 롤백 |

---

## UC-SEC-002: XSS 방지 (입력값 Sanitization)

### 유스케이스 정보

- **ID**: UC-SEC-002
- **이름**: 악의적인 스크립트 삽입 방지
- **우선순위**: P0 (필수)
- **관련 기능**: 리뷰 작성, 리뷰 수정

### 액터

- **Primary**: 서버 시스템 (Hono API)
- **Secondary**: 사용자, 잠재적 공격자

### 사전 조건

1. 사용자가 텍스트 입력 필드에 데이터 입력
2. 입력 데이터가 서버로 전송됨
3. 데이터베이스에 저장되기 전 단계

### 기본 플로우

#### 1단계: 입력값 수신

**시스템 동작**:
1. 클라이언트에서 리뷰 작성 요청 수신
2. 요청 본문에서 `authorName`, `content` 추출

```typescript
// 요청 예시
{
  "authorName": "홍길동<script>alert('XSS')</script>",
  "content": "맛있어요!<img src=x onerror=alert('XSS')>",
  "rating": 5,
  "password": "1234"
}
```

#### 2단계: HTML 엔티티 이스케이프 (React 기본)

**시스템 동작**:
1. React의 기본 이스케이프 기능 활용
2. `<`, `>`, `&`, `"`, `'` 문자를 HTML 엔티티로 변환

```typescript
// React가 자동으로 처리하는 이스케이프
// 입력: <script>alert('XSS')</script>
// 출력: &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;
```

#### 3단계: 위험한 패턴 제거 (서버 측)

**시스템 동작**:
1. 정규식을 사용하여 위험한 패턴 제거
2. JavaScript 이벤트 핸들러 제거 (`on*` 속성)
3. `<script>`, `<iframe>`, `<object>` 태그 제거

```typescript
// 서버 측 sanitization 함수
export function sanitizeInput(input: string): string {
  // 1. 기본 트림
  let sanitized = input.trim();

  // 2. HTML 태그 제거 (허용된 태그 제외)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');

  // 3. 이벤트 핸들러 제거
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

  // 4. javascript: 프로토콜 제거
  sanitized = sanitized.replace(/javascript:/gi, '');

  // 5. data: URI 제거 (base64 인코딩된 스크립트 방지)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  return sanitized;
}
```

#### 4단계: DOMPurify 활용 (선택적 강화)

**시스템 동작** (향후 확장):
1. DOMPurify 라이브러리로 추가 정화
2. 허용된 태그만 유지
3. 위험한 속성 자동 제거

```typescript
// DOMPurify 사용 예시 (선택적)
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeWithDOMPurify(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // 모든 HTML 태그 제거
    ALLOWED_ATTR: [], // 모든 속성 제거
    KEEP_CONTENT: true // 텍스트 내용은 유지
  });
}
```

#### 5단계: 정화된 데이터 저장

**시스템 동작**:
1. 정화된 텍스트를 데이터베이스에 저장
2. 클라이언트 응답 시 React가 자동 이스케이프

```typescript
// 서비스 레이어
export async function createReview(data: CreateReviewInput) {
  const sanitizedData = {
    ...data,
    authorName: sanitizeInput(data.authorName),
    content: sanitizeInput(data.content)
  };

  const { data: review } = await supabase
    .from('reviews')
    .insert(sanitizedData)
    .select()
    .single();

  return review;
}
```

#### 6단계: 클라이언트 렌더링

**시스템 동작**:
1. 데이터베이스에서 리뷰 조회
2. React가 JSX에서 자동 이스케이프 처리
3. 안전한 HTML로 렌더링

```tsx
// 클라이언트 컴포넌트 (자동 이스케이프)
export function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="review-card">
      <h3>{review.authorName}</h3> {/* 자동 이스케이프 */}
      <p>{review.content}</p> {/* 자동 이스케이프 */}
    </div>
  );
}
```

### 대체 플로우

#### A1: 위험한 패턴 감지

**조건**: 입력값에 명백한 XSS 공격 패턴이 포함됨

**시스템 동작**:
1. 정화 후 원본과 비교
2. 큰 변화가 있으면 로그 기록
3. 정화된 데이터로 계속 진행

```typescript
export function sanitizeAndLog(input: string, userId: string): string {
  const sanitized = sanitizeInput(input);

  // 원본과 정화된 데이터 비교
  if (sanitized !== input) {
    logger.warn('Potential XSS attempt detected', {
      userId,
      originalLength: input.length,
      sanitizedLength: sanitized.length,
      diff: input.length - sanitized.length
      // 실제 내용은 로그하지 않음 (개인정보 보호)
    });
  }

  return sanitized;
}
```

### 예외 플로우

#### E1: 입력값 전체가 스크립트인 경우

**조건**: 정화 후 빈 문자열이 됨

**시스템 동작**:
1. 유효성 검증 실패 (최소 길이 미달)
2. 400 에러 응답 반환
3. "유효한 내용을 입력해주세요" 메시지 표시

```typescript
const sanitized = sanitizeInput(content);

if (sanitized.trim().length < 10) {
  return c.json({
    success: false,
    error: {
      code: 'INVALID_CONTENT',
      message: '리뷰 내용은 10자 이상이어야 합니다.'
    }
  }, 400);
}
```

#### E2: dangerouslySetInnerHTML 사용 시도

**조건**: 개발자가 실수로 위험한 API 사용

**시스템 동작**:
1. ESLint 규칙으로 사전 차단
2. 코드 리뷰에서 검출
3. 대체 방법 제안 (React 기본 렌더링)

```javascript
// ❌ 위험한 코드 (사용 금지)
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ 안전한 코드
<div>{userInput}</div>
```

### 사후 조건

**성공 시**:
- 모든 HTML 태그 및 스크립트가 제거됨
- 텍스트 내용은 보존됨
- 렌더링 시 추가 이스케이프 적용

**실패 시**:
- 입력값이 거부됨
- 사용자에게 재입력 요청

### 비기능 요구사항

| 항목 | 요구사항 | 목표값 |
|------|----------|--------|
| **성능** | Sanitization 시간 | < 10ms |
| **보안** | XSS 방어율 | 100% (OWASP Top 10 기준) |
| **보안** | 허용된 HTML 태그 | 0개 (순수 텍스트만) |
| **사용성** | 정상 입력 보존율 | > 99% |

---

## UC-SEC-003: 클라이언트 측 유효성 검증

### 유스케이스 정보

- **ID**: UC-SEC-003
- **이름**: 리뷰 작성 폼 클라이언트 측 유효성 검증
- **우선순위**: P0 (필수)
- **관련 기능**: 리뷰 작성, 리뷰 수정

### 액터

- **Primary**: 클라이언트 시스템 (React 컴포넌트)
- **Secondary**: 사용자

### 사전 조건

1. 사용자가 리뷰 작성 페이지에 진입
2. react-hook-form과 Zod가 설정됨
3. 유효성 검증 스키마가 정의됨

### 기본 플로우

#### 1단계: 폼 초기화

**시스템 동작**:
1. react-hook-form 훅 초기화
2. Zod 스키마 resolver 연결
3. 기본값 설정 (수정 시)

```typescript
// 클라이언트 컴포넌트
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const reviewFormSchema = z.object({
  authorName: z.string()
    .min(2, '작성자명은 2자 이상이어야 합니다')
    .max(10, '작성자명은 10자 이하여야 합니다'),

  rating: z.number()
    .int('평점은 정수여야 합니다')
    .min(1, '평점은 최소 1점입니다')
    .max(5, '평점은 최대 5점입니다'),

  content: z.string()
    .min(10, '리뷰 내용은 10자 이상이어야 합니다')
    .max(500, '리뷰 내용은 500자 이하여야 합니다'),

  visitDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다')
    .refine(
      (date) => new Date(date) <= new Date(),
      '미래 날짜는 선택할 수 없습니다'
    )
    .optional(),

  password: z.string()
    .min(4, '비밀번호는 4자 이상이어야 합니다')
    .max(20, '비밀번호는 20자 이하여야 합니다')
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

export function ReviewForm() {
  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    mode: 'onChange', // 실시간 검증
    defaultValues: {
      authorName: '',
      rating: 0,
      content: '',
      visitDate: '',
      password: ''
    }
  });

  // ...
}
```

#### 2단계: 실시간 검증 (onChange 모드)

**사용자 액션**:
- 입력 필드에 텍스트 입력

**시스템 동작**:
1. 각 입력마다 Zod 스키마 검증 실행
2. 에러 발생 시 실시간으로 에러 메시지 표시
3. 필드별 에러 상태 시각화 (빨간 테두리 등)

```tsx
<FormField
  control={form.control}
  name="authorName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>작성자명</FormLabel>
      <FormControl>
        <Input
          {...field}
          placeholder="2~10자 입력"
          className={form.formState.errors.authorName ? 'border-red-500' : ''}
        />
      </FormControl>
      <FormMessage /> {/* 에러 메시지 자동 표시 */}
      <FormDescription>
        수정/삭제 시 작성자명이 필요합니다
      </FormDescription>
    </FormItem>
  )}
/>
```

#### 3단계: 글자 수 카운터 표시

**시스템 동작**:
1. 실시간으로 입력된 글자 수 계산
2. 남은 글자 수 또는 현재/최대 글자 수 표시
3. 제한 초과 시 경고 색상 표시

```tsx
<FormField
  control={form.control}
  name="content"
  render={({ field }) => (
    <FormItem>
      <FormLabel>리뷰 내용</FormLabel>
      <FormControl>
        <Textarea
          {...field}
          placeholder="10~500자 입력"
          rows={5}
        />
      </FormControl>
      <div className="flex justify-between items-center">
        <FormMessage />
        <span className={cn(
          'text-sm',
          field.value.length > 500 ? 'text-red-500' : 'text-muted-foreground'
        )}>
          {field.value.length} / 500자
        </span>
      </div>
    </FormItem>
  )}
/>
```

#### 4단계: 제출 전 최종 검증

**사용자 액션**:
- "작성하기" 버튼 클릭

**시스템 동작**:
1. 전체 폼 데이터 재검증
2. 모든 필드가 유효한 경우에만 제출
3. 에러가 있으면 첫 번째 에러 필드로 포커스 이동

```typescript
const onSubmit = async (data: ReviewFormData) => {
  // 모든 검증 통과 시에만 호출됨
  try {
    await createReviewMutation.mutateAsync(data);
    toast.success('리뷰가 작성되었습니다');
    router.push(`/place/${placeId}`);
  } catch (error) {
    toast.error('리뷰 작성에 실패했습니다');
  }
};

<form onSubmit={form.handleSubmit(onSubmit)}>
  {/* 폼 필드들 */}
  <Button
    type="submit"
    disabled={!form.formState.isValid || form.formState.isSubmitting}
  >
    {form.formState.isSubmitting ? '작성 중...' : '작성하기'}
  </Button>
</form>
```

#### 5단계: 사용자 피드백

**시스템 동작**:
1. 제출 버튼 비활성화 (isSubmitting)
2. 로딩 인디케이터 표시
3. 성공/실패 토스트 메시지 표시

### 대체 플로우

#### A1: 필수 필드 미입력

**조건**: 사용자가 필수 필드를 비워둠

**시스템 동작**:
1. 제출 버튼 비활성화 유지
2. 필드 포커스 아웃 시 "이 항목은 필수입니다" 메시지 표시
3. 빨간색 테두리로 시각적 강조

#### A2: 평점 미선택

**조건**: 사용자가 별점을 선택하지 않음 (기본값 0)

**시스템 동작**:
1. 제출 시 "평점을 선택해주세요" 에러 표시
2. 별점 컴포넌트로 포커스 이동
3. 별점 컴포넌트 흔들림 애니메이션

```tsx
<FormField
  control={form.control}
  name="rating"
  render={({ field }) => (
    <FormItem>
      <FormLabel>평점 *</FormLabel>
      <FormControl>
        <StarRating
          value={field.value}
          onChange={field.onChange}
          error={!!form.formState.errors.rating}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 예외 플로우

#### E1: 네트워크 에러로 제출 실패

**조건**: 클라이언트 검증은 통과했으나 서버 요청 실패

**시스템 동작**:
1. 에러 토스트 메시지 표시
2. 폼 데이터 유지 (입력값 손실 방지)
3. 재시도 버튼 활성화
4. 제출 버튼 다시 활성화

```typescript
const createReviewMutation = useMutation({
  mutationFn: createReview,
  onError: (error) => {
    if (error instanceof NetworkError) {
      toast.error('네트워크 연결을 확인해주세요', {
        action: {
          label: '재시도',
          onClick: () => form.handleSubmit(onSubmit)()
        }
      });
    } else {
      toast.error('리뷰 작성에 실패했습니다');
    }
  }
});
```

#### E2: 서버 측 검증 실패

**조건**: 클라이언트 검증 통과했으나 서버에서 거부

**시스템 동작**:
1. 서버 에러 메시지를 해당 필드에 표시
2. 필드별 에러 매핑
3. 첫 번째 에러 필드로 포커스 이동

```typescript
onError: (error) => {
  if (error.response?.data?.errors) {
    // 서버 에러를 필드별로 매핑
    Object.entries(error.response.data.errors).forEach(([field, message]) => {
      form.setError(field as keyof ReviewFormData, {
        type: 'server',
        message: message as string
      });
    });
  }
}
```

### 사후 조건

**성공 시**:
- 모든 입력값이 유효성 기준을 만족함
- 서버로 안전하게 전송 가능한 상태
- 사용자에게 명확한 피드백 제공

**실패 시**:
- 입력값이 유지되어 재입력 불필요
- 에러 메시지가 명확하게 표시됨
- 제출이 차단되어 잘못된 데이터 전송 방지

### 비기능 요구사항

| 항목 | 요구사항 | 목표값 |
|------|----------|--------|
| **성능** | 검증 응답 시간 | < 100ms |
| **사용성** | 에러 메시지 명확성 | 100% 이해 가능 |
| **사용성** | 실시간 피드백 | onChange 모드 |
| **접근성** | ARIA 속성 | WCAG AA 준수 |

---

## UC-SEC-004: 서버 측 유효성 검증

### 유스케이스 정보

- **ID**: UC-SEC-004
- **이름**: API 요청 데이터 서버 측 유효성 검증
- **우선순위**: P0 (필수)
- **관련 기능**: 모든 API 엔드포인트

### 액터

- **Primary**: 서버 시스템 (Hono API)
- **Secondary**: 클라이언트 (신뢰할 수 없는 입력 소스)

### 사전 조건

1. 클라이언트에서 HTTP 요청 수신
2. Zod 스키마가 API 라우트에 정의됨
3. Hono 미들웨어가 설정됨

### 기본 플로우

#### 1단계: 요청 수신 및 파싱

**시스템 동작**:
1. Hono가 HTTP 요청 수신
2. Content-Type 검증 (application/json)
3. 요청 본문 JSON 파싱

```typescript
// route.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

const reviewRoute = new Hono()
  .post(
    '/reviews',
    zValidator('json', createReviewSchema), // 자동 검증
    async (c) => {
      // 검증 통과한 데이터만 여기 도달
      const validatedData = c.req.valid('json');
      // ...
    }
  );
```

#### 2단계: Zod 스키마 검증

**시스템 동작**:
1. `@hono/zod-validator` 미들웨어가 자동 검증 수행
2. 스키마 정의에 따라 타입 및 제약조건 검사
3. 검증 실패 시 자동으로 400 에러 반환

```typescript
// schema.ts
export const createReviewSchema = z.object({
  placeId: z.string().uuid('유효하지 않은 장소 ID입니다'),

  authorName: z.string()
    .min(2, '작성자명은 2자 이상이어야 합니다')
    .max(10, '작성자명은 10자 이하여야 합니다')
    .regex(/^[가-힣a-zA-Z0-9\s]+$/, '특수문자는 사용할 수 없습니다'),

  rating: z.number()
    .int('평점은 정수여야 합니다')
    .min(1, '평점은 1점 이상이어야 합니다')
    .max(5, '평점은 5점 이하여야 합니다'),

  content: z.string()
    .min(10, '리뷰 내용은 10자 이상이어야 합니다')
    .max(500, '리뷰 내용은 500자 이하여야 합니다')
    .transform(sanitizeInput), // 자동 sanitization

  visitDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다')
    .refine(
      (date) => new Date(date) <= new Date(),
      '미래 날짜는 입력할 수 없습니다'
    )
    .optional(),

  password: z.string()
    .min(4, '비밀번호는 4자 이상이어야 합니다')
    .max(20, '비밀번호는 20자 이하여야 합니다')
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
```

#### 3단계: 비즈니스 로직 검증

**시스템 동작**:
1. 기본 유효성 검증 통과 후 추가 검증 수행
2. 데이터베이스 제약조건 확인
3. 비즈니스 규칙 적용

```typescript
// service.ts
export async function createReview(
  supabase: SupabaseClient,
  input: CreateReviewInput
): Promise<ServiceResult<Review>> {
  // 1. 장소 존재 여부 확인
  const { data: place } = await supabase
    .from('places')
    .select('id')
    .eq('id', input.placeId)
    .single();

  if (!place) {
    return failure('PLACE_NOT_FOUND', '장소를 찾을 수 없습니다');
  }

  // 2. 비밀번호 해싱
  const passwordHash = await hashPassword(input.password);

  // 3. 리뷰 생성
  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      place_id: input.placeId,
      author_name: input.authorName,
      rating: input.rating,
      content: input.content,
      visited_at: input.visitDate,
      password_hash: passwordHash
    })
    .select()
    .single();

  if (error) {
    return failure('DATABASE_ERROR', '리뷰 작성에 실패했습니다');
  }

  return success(review);
}
```

#### 4단계: 데이터베이스 제약조건 검증

**시스템 동작**:
1. PostgreSQL 제약조건 자동 검사
2. 제약조건 위반 시 에러 반환
3. 트랜잭션 자동 롤백

```sql
-- 데이터베이스 제약조건 (추가 안전망)
CREATE TABLE reviews (
  author_name TEXT NOT NULL CHECK (
    length(author_name) >= 2 AND
    length(author_name) <= 10
  ),
  rating INTEGER NOT NULL CHECK (
    rating >= 1 AND rating <= 5
  ),
  content TEXT NOT NULL CHECK (
    length(content) >= 10 AND
    length(content) <= 500
  ),
  visited_at DATE CHECK (
    visited_at IS NULL OR visited_at <= CURRENT_DATE
  ),
  password_hash TEXT NOT NULL CHECK (
    length(password_hash) = 60
  )
);
```

#### 5단계: 에러 응답 포맷팅

**시스템 동작**:
1. 검증 실패 시 표준 에러 형식 반환
2. 필드별 에러 메시지 제공
3. 클라이언트가 파싱 가능한 구조

```typescript
// route.ts (에러 핸들링)
.post('/reviews', zValidator('json', createReviewSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await createReview(c.get('supabase'), data);

  return respond(c, result);
});

// Zod 검증 실패 시 자동 응답
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값이 유효하지 않습니다",
    "details": {
      "authorName": ["작성자명은 2자 이상이어야 합니다"],
      "rating": ["평점은 1점 이상이어야 합니다"]
    }
  }
}
```

### 대체 플로우

#### A1: Content-Type 불일치

**조건**: 요청이 JSON이 아닌 경우

**시스템 동작**:
1. 415 Unsupported Media Type 반환
2. "Content-Type은 application/json이어야 합니다" 메시지

```typescript
// middleware/content-type.ts
export const requireJSON = createMiddleware(async (c, next) => {
  const contentType = c.req.header('Content-Type');

  if (!contentType?.includes('application/json')) {
    return c.json({
      success: false,
      error: {
        code: 'INVALID_CONTENT_TYPE',
        message: 'Content-Type은 application/json이어야 합니다'
      }
    }, 415);
  }

  await next();
});
```

#### A2: 요청 본문 크기 초과

**조건**: 요청 본문이 1MB를 초과

**시스템 동작**:
1. 413 Payload Too Large 반환
2. 요청 읽기 중단
3. "요청 크기가 너무 큽니다" 메시지

```typescript
// middleware/body-limit.ts
export const bodyLimit = (maxBytes: number = 1024 * 1024) => {
  return createMiddleware(async (c, next) => {
    const contentLength = c.req.header('Content-Length');

    if (contentLength && parseInt(contentLength) > maxBytes) {
      return c.json({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: `요청 크기는 ${maxBytes / 1024}KB 이하여야 합니다`
        }
      }, 413);
    }

    await next();
  });
};
```

### 예외 플로우

#### E1: 잘못된 JSON 형식

**조건**: 파싱 불가능한 JSON

**시스템 동작**:
1. JSON 파싱 에러 catch
2. 400 Bad Request 반환
3. "잘못된 JSON 형식입니다" 메시지

```typescript
// error-handler.ts
app.onError((err, c) => {
  if (err instanceof SyntaxError) {
    return c.json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: '잘못된 JSON 형식입니다'
      }
    }, 400);
  }

  // 기타 에러 처리...
});
```

#### E2: SQL Injection 시도

**조건**: 입력값에 SQL 명령어 패턴 포함

**시스템 동작**:
1. Supabase SDK의 파라미터화된 쿼리 사용 (자동 방어)
2. 추가 검증: 특수문자 제한
3. 로그 기록 및 모니터링

```typescript
// Supabase는 자동으로 SQL Injection 방지
const { data } = await supabase
  .from('reviews')
  .select('*')
  .eq('author_name', userInput); // 안전하게 이스케이프됨

// ❌ 절대 사용 금지 (Raw SQL)
// await supabase.rpc('raw_sql', { query: `SELECT * FROM reviews WHERE author_name = '${userInput}'` });
```

### 사후 조건

**성공 시**:
- 모든 입력값이 검증을 통과함
- 데이터베이스에 안전하게 저장됨
- 타입 안전성이 보장됨

**실패 시**:
- 잘못된 데이터가 데이터베이스에 도달하지 않음
- 명확한 에러 메시지 반환
- 클라이언트가 수정 가능한 정보 제공

### 비기능 요구사항

| 항목 | 요구사항 | 목표값 |
|------|----------|--------|
| **성능** | 검증 오버헤드 | < 50ms |
| **보안** | SQL Injection 방어 | 100% |
| **보안** | 타입 안전성 | TypeScript strict mode |
| **가용성** | 검증 실패율 | < 1% (정상 요청) |

---

## UC-SEC-005: 비밀번호 기반 리뷰 인증

### 유스케이스 정보

- **ID**: UC-SEC-005
- **이름**: 리뷰 수정/삭제 시 비밀번호 인증
- **우선순위**: P0 (필수)
- **관련 기능**: 리뷰 수정, 리뷰 삭제

### 액터

- **Primary**: 서버 시스템 (Hono API)
- **Secondary**: 리뷰 작성자 (사용자)

### 사전 조건

1. 리뷰가 데이터베이스에 존재함
2. 사용자가 수정/삭제 버튼 클릭
3. 비밀번호 입력 모달이 열림

### 기본 플로우

#### 1단계: 비밀번호 입력 모달 표시

**사용자 액션**:
- 리뷰 카드의 "수정" 또는 "삭제" 버튼 클릭

**시스템 동작**:
1. 비밀번호 입력 모달 렌더링
2. 리뷰 ID를 state에 저장
3. 비밀번호 입력 필드 포커스

```tsx
// PasswordModal.tsx
export function PasswordModal({
  reviewId,
  action, // 'edit' | 'delete'
  onSuccess,
  onCancel
}: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === 'edit' ? '리뷰 수정' : '리뷰 삭제'}
          </DialogTitle>
          <DialogDescription>
            작성 시 입력한 비밀번호를 입력해주세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            type="password"
            placeholder="비밀번호 (4~20자)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? '확인 중...' : '확인'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### 2단계: 비밀번호 전송

**사용자 액션**:
- 비밀번호 입력 후 "확인" 버튼 클릭

**시스템 동작**:
1. 클라이언트에서 비밀번호 검증 API 호출
2. HTTPS를 통해 평문 비밀번호 전송
3. 로딩 상태 표시

```typescript
// useReviewAuth.ts
export function useReviewAuth() {
  const verifyPasswordMutation = useMutation({
    mutationFn: async ({
      reviewId,
      password
    }: {
      reviewId: string;
      password: string;
    }) => {
      const response = await apiClient.post(
        `/api/reviews/${reviewId}/verify`,
        { password }
      );
      return response.data;
    }
  });

  return { verifyPasswordMutation };
}
```

#### 3단계: 서버 측 비밀번호 검증

**시스템 동작**:
1. 리뷰 ID로 password_hash 조회
2. bcrypt.compare()로 비밀번호 비교
3. 결과 반환 (성공/실패)

```typescript
// service.ts
export async function verifyReviewPassword(
  supabase: SupabaseClient,
  reviewId: string,
  password: string
): Promise<ServiceResult<{ verified: true }>> {
  // 1. 리뷰 조회 (password_hash만)
  const { data: review, error } = await supabase
    .from('reviews')
    .select('password_hash')
    .eq('id', reviewId)
    .single();

  if (error || !review) {
    return failure('REVIEW_NOT_FOUND', '리뷰를 찾을 수 없습니다');
  }

  // 2. bcrypt 비교
  const isValid = await bcrypt.compare(password, review.password_hash);

  if (!isValid) {
    // 3. 실패 시 일정 시간 대기 (타이밍 공격 방지)
    await new Promise(resolve => setTimeout(resolve, 1000));
    return failure('INVALID_PASSWORD', '비밀번호가 일치하지 않습니다');
  }

  // 4. 성공
  return success({ verified: true });
}
```

#### 4단계: 검증 결과 처리

**시스템 동작** (성공 시):
1. 모달 닫기
2. 수정 페이지로 이동 또는 삭제 확인 다이얼로그 표시
3. 성공 토스트 메시지 (선택)

```typescript
// PasswordModal.tsx
const handleSubmit = async () => {
  setIsLoading(true);
  setError('');

  try {
    await verifyPasswordMutation.mutateAsync({
      reviewId,
      password
    });

    // 검증 성공
    onSuccess();
  } catch (error) {
    if (error.response?.data?.error?.code === 'INVALID_PASSWORD') {
      setError('비밀번호가 일치하지 않습니다');
    } else {
      setError('인증에 실패했습니다. 잠시 후 다시 시도해주세요');
    }
  } finally {
    setIsLoading(false);
  }
};
```

#### 5단계: 인증된 작업 수행

**시스템 동작** (수정):
1. 리뷰 수정 페이지로 이동
2. 기존 데이터 자동 입력
3. 수정 API 호출 시 비밀번호 재검증

```typescript
// route.ts (수정 API)
.patch(
  '/reviews/:id',
  zValidator('json', updateReviewSchema),
  async (c) => {
    const reviewId = c.req.param('id');
    const data = c.req.valid('json');

    // 1. 비밀번호 재검증 (필수)
    const verifyResult = await verifyReviewPassword(
      c.get('supabase'),
      reviewId,
      data.password
    );

    if (!verifyResult.success) {
      return c.json({
        success: false,
        error: verifyResult.error
      }, 401);
    }

    // 2. 리뷰 수정
    const updateResult = await updateReview(
      c.get('supabase'),
      reviewId,
      data
    );

    return respond(c, updateResult);
  }
);
```

**시스템 동작** (삭제):
1. 삭제 확인 다이얼로그 표시
2. 사용자 확인 후 삭제 API 호출
3. 비밀번호 재검증 후 삭제 수행

```typescript
// route.ts (삭제 API)
.delete(
  '/reviews/:id',
  zValidator('json', z.object({
    password: z.string().min(4).max(20)
  })),
  async (c) => {
    const reviewId = c.req.param('id');
    const { password } = c.req.valid('json');

    // 1. 비밀번호 검증
    const verifyResult = await verifyReviewPassword(
      c.get('supabase'),
      reviewId,
      password
    );

    if (!verifyResult.success) {
      return c.json({
        success: false,
        error: verifyResult.error
      }, 401);
    }

    // 2. 리뷰 삭제
    const deleteResult = await deleteReview(
      c.get('supabase'),
      reviewId
    );

    return respond(c, deleteResult);
  }
);
```

### 대체 플로우

#### A1: 비밀번호 찾기 요청

**조건**: 사용자가 비밀번호를 잊어버림

**시스템 동작**:
1. "비밀번호를 잊으셨나요?" 안내 메시지 표시
2. "비밀번호 복구는 불가능합니다" 설명
3. 작성자명과 내용으로 본인 확인 유도 (향후 기능)

```tsx
<DialogDescription>
  작성 시 입력한 비밀번호를 입력해주세요.
  <br />
  <span className="text-sm text-muted-foreground">
    비밀번호를 잊으신 경우 복구가 불가능합니다.
  </span>
</DialogDescription>
```

#### A2: 연속된 실패 시도

**조건**: 동일 IP에서 5회 이상 실패

**시스템 동작**:
1. Rate Limiting 발동
2. 5분간 해당 IP 차단
3. "너무 많은 시도가 있었습니다" 메시지

```typescript
// middleware/rate-limit.ts
export const passwordVerifyRateLimit = rateLimit({
  maxRequests: 5,
  windowMs: 5 * 60 * 1000, // 5분
  keyGenerator: (c) => c.req.header('x-forwarded-for') || 'unknown',
  message: '너무 많은 시도가 있었습니다. 5분 후 다시 시도해주세요.'
});
```

### 예외 플로우

#### E1: 리뷰가 이미 삭제됨

**조건**: 비밀번호 확인 중 다른 사용자가 리뷰 삭제

**시스템 동작**:
1. 404 Not Found 반환
2. "리뷰를 찾을 수 없습니다" 메시지
3. 리뷰 목록 페이지로 리다이렉트

#### E2: 타이밍 공격 시도

**조건**: 응답 시간 차이로 비밀번호 추측 시도

**시스템 동작**:
1. 성공/실패 모두 일정 시간 대기 (1초)
2. 응답 시간 일관성 유지
3. 타이밍 공격 무력화

```typescript
// 타이밍 공격 방지
const startTime = Date.now();

const isValid = await bcrypt.compare(password, hash);

const elapsed = Date.now() - startTime;
const minDelay = 1000; // 최소 1초

if (elapsed < minDelay) {
  await new Promise(resolve =>
    setTimeout(resolve, minDelay - elapsed)
  );
}

if (!isValid) {
  return failure('INVALID_PASSWORD', '비밀번호가 일치하지 않습니다');
}
```

### 사후 조건

**성공 시**:
- 비밀번호 검증 완료
- 리뷰 수정/삭제 권한 획득
- 작업 수행 가능

**실패 시**:
- 리뷰 수정/삭제 차단
- 명확한 에러 메시지 표시
- 재시도 가능

### 비기능 요구사항

| 항목 | 요구사항 | 목표값 |
|------|----------|--------|
| **보안** | bcrypt 비교 시간 | < 200ms |
| **보안** | 타이밍 공격 방어 | 일관된 응답 시간 |
| **보안** | Rate Limiting | 5회/5분 |
| **사용성** | 에러 메시지 명확성 | 100% |

---

## 비기능 요구사항

### 성능 요구사항

| 기능 | 목표 응답 시간 | 최대 허용 시간 |
|------|--------------|--------------|
| bcrypt 해싱 | < 150ms | 200ms |
| bcrypt 비교 | < 150ms | 200ms |
| XSS Sanitization | < 10ms | 50ms |
| Zod 검증 (클라이언트) | < 50ms | 100ms |
| Zod 검증 (서버) | < 30ms | 50ms |
| 전체 리뷰 작성 플로우 | < 1초 | 2초 |

### 보안 요구사항

| 항목 | 요구사항 |
|------|----------|
| **비밀번호 저장** | bcrypt salt rounds 10 이상 |
| **HTTPS 강제** | 모든 API 요청 HTTPS 필수 |
| **XSS 방어** | 모든 사용자 입력값 sanitization |
| **SQL Injection 방어** | 파라미터화된 쿼리 100% 사용 |
| **Rate Limiting** | 비밀번호 검증 5회/5분 제한 |
| **타이밍 공격 방어** | 응답 시간 일관성 유지 |
| **에러 정보 노출** | 민감 정보 에러 메시지 제외 |
| **로깅** | 비밀번호 평문/해시 로깅 금지 |

### 가용성 요구사항

| 항목 | 목표값 |
|------|--------|
| **서비스 가동률** | 99.5% |
| **검증 실패 복구** | 즉시 재시도 가능 |
| **에러율** | < 1% (정상 요청) |

### 확장성 요구사항

| 항목 | 요구사항 |
|------|----------|
| **동시 요청 처리** | 최소 100 req/s |
| **데이터베이스 부하** | 인덱스 활용으로 최적화 |
| **캐싱 전략** | 검증 스키마 메모리 캐싱 |

---

## 보안 체크리스트

### 구현 단계 체크리스트

#### 개발 시

- [ ] bcrypt salt rounds가 10 이상으로 설정됨
- [ ] 모든 비밀번호 해싱이 서버 측에서만 수행됨
- [ ] 평문 비밀번호가 로그에 기록되지 않음
- [ ] XSS sanitization 함수가 모든 텍스트 입력에 적용됨
- [ ] Zod 스키마가 클라이언트와 서버 양측에 정의됨
- [ ] SQL 쿼리가 파라미터화되어 있음
- [ ] Rate Limiting이 비밀번호 검증 API에 적용됨
- [ ] HTTPS 리다이렉트 미들웨어가 활성화됨

#### 테스트 시

- [ ] 비밀번호 해싱 성능 테스트 (< 200ms)
- [ ] 잘못된 비밀번호 거부 테스트
- [ ] XSS 공격 패턴 차단 테스트
- [ ] SQL Injection 시도 차단 테스트
- [ ] 타이밍 공격 방어 테스트
- [ ] Rate Limiting 동작 테스트
- [ ] 유효성 검증 실패 케이스 테스트
- [ ] 에러 메시지에 민감 정보 포함 여부 확인

#### 배포 시

- [ ] 환경변수에 bcrypt salt rounds 설정 확인
- [ ] HTTPS 인증서 설치 및 강제 적용
- [ ] Content Security Policy 헤더 설정
- [ ] Rate Limiting 임계값 프로덕션 환경에 맞게 조정
- [ ] 에러 로그 모니터링 시스템 연동
- [ ] 보안 취약점 스캔 (OWASP ZAP 등)

### 정기 점검 체크리스트

#### 주간

- [ ] 비정상적인 비밀번호 검증 실패율 모니터링
- [ ] XSS 공격 시도 로그 확인
- [ ] Rate Limiting 발동 로그 검토
- [ ] API 응답 시간 모니터링

#### 월간

- [ ] bcrypt 라이브러리 버전 업데이트 확인
- [ ] Zod 라이브러리 보안 패치 확인
- [ ] 보안 감사 로그 분석
- [ ] 비밀번호 해싱 성능 벤치마크

#### 분기별

- [ ] 보안 취약점 스캔 (침투 테스트)
- [ ] 의존성 라이브러리 보안 감사
- [ ] OWASP Top 10 준수 여부 검증
- [ ] 보안 정책 문서 업데이트

---

## 참고 문서

### 내부 문서

- [사용자 플로우 문서](/docs/userflow.md) - 섹션 7.6 보안 및 검증
- [PRD](/docs/prd.md) - 섹션 8.2 보안 요구사항
- [데이터베이스 설계](/docs/database.md) - 섹션 8 보안 고려사항
- [아키텍처 가이드라인](/CLAUDE.md) - Backend Layer

### 외부 문서

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [bcrypt Best Practices](https://github.com/kelektiv/node.bcrypt.js)
- [Zod 공식 문서](https://zod.dev/)
- [React Security Best Practices](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### 보안 표준

- OWASP Password Storage Cheat Sheet
- NIST Digital Identity Guidelines
- CWE Top 25 Most Dangerous Software Weaknesses
- SANS Top 25 Software Errors

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2025-10-21 | Security Engineer | 초안 작성 |

---

**문서 끝**
