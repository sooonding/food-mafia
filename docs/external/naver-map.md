# 맛집 지도 서비스 - 외부 서비스 연동 가이드

## 목차

1. [연동 개요](#연동-개요)
2. [네이버 지도 SDK](#1-네이버-지도-sdk)

---

## 연동 개요

### 연동 수단 요약

| 서비스           | 연동 방식        | 사용 위치         | 용도                   |
| ---------------- | ---------------- | ----------------- | ---------------------- |
| 네이버 지도      | SDK (JavaScript) | 클라이언트        | 지도 표시 및 마커 관리 |
| 네이버 로컬 검색 | REST API         | 서버 (API Route)  | 장소 검색              |
| Supabase         | SDK (JavaScript) | 클라이언트 + 서버 | 데이터베이스           |

**Webhook 사용**: ❌ 없음

---

## 1. 네이버 지도 SDK

### 1.1 사용할 기능

- 지도 렌더링 및 표시
- 커스텀 마커 생성 (카테고리별 아이콘)
- 마커 클러스터링
- 지도 이벤트 핸들링 (클릭, 드래그, 줌)
- 현재 위치 표시
- 지도 bounds 기반 데이터 로딩

### 1.2 설치/세팅 방법

#### Step 1: 네이버 클라우드 플랫폼 가입 및 키 발급

1. [네이버 클라우드 플랫폼](https://www.ncloud.com/) 접속 및 회원가입
2. 콘솔 > AI·NAVER API > Application 등록
3. Maps 선택 후 Web Dynamic Map 서비스 추가
4. Client ID 발급 받기

#### Step 2: Script 로드 (권장 방법)

```tsx
// app/layout.tsx 또는 _document.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <script
          type='text/javascript'
          src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

#### Step 3: TypeScript 타입 정의

```bash
npm install -D @types/navermaps
```

또는 수동으로 타입 정의:

```typescript
// types/naver-maps.d.ts
declare global {
  interface Window {
    naver: any;
  }
}
export {};
```

### 1.3 인증정보 관리 방법

**환경변수 설정**:

```env
# .env.local
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_client_id_here
```

**주의사항**:

- `NEXT_PUBLIC_` 접두사 필수 (클라이언트에서 접근)
- Client ID는 공개되어도 무방 (도메인 제한으로 보안)
- 네이버 클라우드 콘솔에서 허용 도메인 설정 필수

### 1.4 호출 방법

#### 기본 지도 생성

```typescript
// components/map/NaverMap.tsx
'use client';

import { useEffect, useRef } from 'react';

export default function NaverMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !window.naver) return;

    // 지도 생성
    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(37.5665, 126.978), // 서울시청
      zoom: 15,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
      },
    });

    mapInstance.current = map;

    // 현재 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const location = new window.naver.maps.LatLng(
          position.coords.latitude,
          position.coords.longitude
        );
        map.setCenter(location);
      });
    }
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />;
}
```

#### 마커 생성

```typescript
// 커스텀 마커 추가
function addMarker(map: any, place: Place) {
  const marker = new window.naver.maps.Marker({
    position: new window.naver.maps.LatLng(place.latitude, place.longitude),
    map: map,
    title: place.name,
    icon: {
      content: `<div class="custom-marker">
        <img src="/markers/${getCategoryIcon(place.category)}.png" />
      </div>`,
      size: new window.naver.maps.Size(38, 38),
      anchor: new window.naver.maps.Point(19, 38),
    },
  });

  // 마커 클릭 이벤트
  window.naver.maps.Event.addListener(marker, 'click', () => {
    // 장소 상세 모달 열기
    router.push(`/place/${place.id}`);
  });

  return marker;
}
```

#### 지도 영역 변경 이벤트

```typescript
// 지도 이동 시 보이는 영역의 장소 로드
window.naver.maps.Event.addListener(map, 'idle', () => {
  const bounds = map.getBounds();
  const ne = bounds.getNE(); // 북동쪽 좌표
  const sw = bounds.getSW(); // 남서쪽 좌표

  // API 호출로 해당 영역의 장소 가져오기
  fetchPlacesInBounds({
    lat1: sw.lat(),
    lng1: sw.lng(),
    lat2: ne.lat(),
    lng2: ne.lng(),
  });
});
```

---

### .env.local 파일 생성

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 네이버 지도 (클라이언트)
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=xxxxx


```

---

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
