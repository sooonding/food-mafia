# 맛집 지도 서비스 - 외부 서비스 연동 가이드

## 목차

1. [연동 개요](#연동-개요)
2. [네이버 로컬 검색 API](#2-네이버-로컬-검색-api)
3. [환경변수 설정](#환경변수-설정)

---

## 연동 개요

### 연동 수단 요약

| 서비스           | 연동 방식        | 사용 위치        | 용도                   |
| ---------------- | ---------------- | ---------------- | ---------------------- |
| 네이버 지도      | SDK (JavaScript) | 클라이언트       | 지도 표시 및 마커 관리 |
| 네이버 로컬 검색 | REST API         | 서버 (API Route) | 장소 검색              |

---

## 2. 네이버 로컬 검색 API

### 2.1 사용할 기능

- 키워드 기반 장소 검색
- 카테고리별 검색
- 좌표 기반 검색 (현재 위치 주변)
- 거리순 정렬

### 2.2 설치/세팅 방법

#### Step 1: API 키 발급

1. [네이버 개발자 센터](https://developers.naver.com/main/) 접속
2. Application > 애플리케이션 등록
3. 검색 API 선택
4. Client ID 및 Client Secret 발급

#### Step 2: 패키지 설치 (선택)

```bash
# HTTP 클라이언트 (Next.js는 내장 fetch 사용 가능)
npm install axios  # 선택사항
```

### 2.3 인증정보 관리 방법

**환경변수 설정**:

```env
# .env.local
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

**주의사항**:

- `NEXT_PUBLIC_` 접두사 **사용 금지** (서버 전용)
- Client Secret은 절대 클라이언트에 노출 금지
- API Route에서만 사용

### 2.4 호출 방법

#### API Route 생성

```typescript
// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const latitude = searchParams.get('latitude');
  const longitude = searchParams.get('longitude');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const url = new URL('https://openapi.naver.com/v1/search/local.json');
    url.searchParams.append('query', query);
    url.searchParams.append('display', '20');
    url.searchParams.append('start', '1');
    url.searchParams.append('sort', 'random'); // random 또는 comment (정확도순)

    const response = await fetch(url.toString(), {
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID!,
        'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET!,
      },
    });

    if (!response.ok) {
      throw new Error('Naver API request failed');
    }

    const data = await response.json();

    // 응답 데이터 가공
    const places = data.items.map((item: any) => ({
      title: item.title.replace(/<\/?b>/g, ''), // HTML 태그 제거
      address: item.roadAddress || item.address,
      category: item.category,
      telephone: item.telephone,
      mapx: item.mapx, // 네이버 좌표계 (카텍좌표)
      mapy: item.mapy,
      link: item.link,
    }));

    return NextResponse.json({ places });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Failed to search places' }, { status: 500 });
  }
}
```

#### 클라이언트에서 호출

```typescript
// hooks/useSearch.ts
import { useState } from 'react';

export function useSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async (query: string, latitude?: number, longitude?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ query });
      if (latitude && longitude) {
        params.append('latitude', latitude.toString());
        params.append('longitude', longitude.toString());
      }

      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();
      setResults(data.places || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, search };
}
```

#### 좌표 변환 (카텍 좌표 → WGS84)

```typescript
// 네이버 API는 카텍 좌표를 반환하므로 변환 필요
function convertNaverCoords(mapx: number, mapy: number) {
  return {
    longitude: mapx / 10000000,
    latitude: mapy / 10000000,
  };
}
```

### 3.3 인증정보 관리 방법

**환경변수 설정**:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**키 발급 위치**:

- Supabase 대시보드 > Settings > API
- `URL`: 프로젝트 URL
- `anon public`: 클라이언트용 (공개 가능)
- `service_role`: 서버 전용 (비밀)

**주의사항**:

- `anon` 키: `NEXT_PUBLIC_` 접두사 사용 (클라이언트 노출 가능)
- `service_role` 키: 서버 전용, 절대 클라이언트 노출 금지

---

## 환경변수 설정

### .env.local 파일 생성

```env
# 네이버 검색 API (서버)
NAVER_CLIENT_ID=xxxxx
NAVER_CLIENT_SECRET=xxxxx
```

## 보안 체크리스트

- [ ] `.env.local` 파일을 `.gitignore`에 추가
- [ ] `NEXT_PUBLIC_` 접두사는 공개 키만 사용
- [ ] Supabase RLS 정책 올바르게 설정
- [ ] 네이버 클라우드 콘솔에서 도메인 제한 설정
- [ ] API Rate Limiting 구현 (선택)
- [ ] 입력값 sanitization (DOMPurify)
- [ ] 비밀번호 bcrypt 해싱 (salt rounds: 10)

---

## 참고 문서

- [네이버 지도 API 문서](https://navermaps.github.io/maps.js.ncp/)
- [네이버 검색 API 문서](https://developers.naver.com/docs/serviceapi/search/local/local.md)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js 환경변수 가이드](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
