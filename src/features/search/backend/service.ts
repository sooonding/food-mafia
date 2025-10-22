import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import type { SearchQuery, SearchResponse } from './schema';
import {
  NaverSearchResponseSchema,
  SearchResultItemSchema,
} from './schema';
import {
  searchErrorCodes,
  type SearchErrorCode,
} from './error';

/**
 * 네이버 로컬 검색 API 호출
 */
export async function searchPlaces(
  query: SearchQuery,
  config: { clientId: string; clientSecret: string }
): Promise<HandlerResult<SearchResponse, SearchErrorCode, unknown>> {
  const { clientId, clientSecret } = config;

  if (!clientId || !clientSecret) {
    return failure(
      500,
      searchErrorCodes.configError,
      'Naver API credentials are not configured'
    );
  }

  try {
    // 네이버 로컬 검색 API 호출
    const url = new URL('https://openapi.naver.com/v1/search/local.json');
    url.searchParams.set('query', query.query);
    url.searchParams.set('display', query.display?.toString() || '20');
    url.searchParams.set('sort', 'random'); // random 또는 comment (리뷰 개수순)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return failure(
        response.status as any, // ContentfulStatusCode
        searchErrorCodes.naverApiError,
        `Naver API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();

    // 응답 검증
    const parsed = NaverSearchResponseSchema.safeParse(data);

    if (!parsed.success) {
      return failure(
        500,
        searchErrorCodes.parseError,
        'Failed to parse Naver API response',
        parsed.error.format()
      );
    }

    // HTML 태그 제거 함수
    const stripHtml = (text: string): string => {
      return text.replace(/<[^>]*>/g, '');
    };

    // 네이버 좌표계 → WGS84 변환
    const convertCoordinates = (
      mapx: string,
      mapy: string
    ): { latitude: number; longitude: number } => {
      // 네이버는 KATECH 좌표계를 10^7로 곱한 값을 반환
      // 그러나 최근 API는 WGS84를 그대로 반환하기도 함
      // mapx/mapy 값의 크기로 판단
      const x = parseInt(mapx, 10);
      const y = parseInt(mapy, 10);

      if (x > 1000000) {
        // KATECH 좌표계 (10^7 곱해진 상태)
        return {
          longitude: x / 10000000,
          latitude: y / 10000000,
        };
      } else {
        // 이미 WGS84 좌표계 (정수 형태)
        return {
          longitude: x / 10000000,
          latitude: y / 10000000,
        };
      }
    };

    // 카테고리 매핑
    const mapCategory = (naverCategory: string): string | null => {
      if (!naverCategory) return null;

      const lower = naverCategory.toLowerCase();

      if (lower.includes('한식') || lower.includes('korean')) return '한식';
      if (lower.includes('일식') || lower.includes('japanese') || lower.includes('초밥'))
        return '일식';
      if (lower.includes('양식') || lower.includes('western') || lower.includes('이탈리안'))
        return '양식';
      if (lower.includes('중식') || lower.includes('chinese')) return '중식';
      if (lower.includes('카페') || lower.includes('cafe') || lower.includes('커피'))
        return '카페';
      if (lower.includes('디저트') || lower.includes('dessert') || lower.includes('베이커리'))
        return '디저트';
      if (lower.includes('패스트푸드') || lower.includes('fastfood') || lower.includes('버거'))
        return '패스트푸드';
      if (lower.includes('주점') || lower.includes('bar') || lower.includes('술집'))
        return '주점';
      if (lower.includes('뷔페') || lower.includes('buffet')) return '뷔페';

      return '기타';
    };

    // 검색 결과 변환
    const items = parsed.data.items.map((item) => {
      const coords = convertCoordinates(item.mapx, item.mapy);

      const result = {
        title: stripHtml(item.title),
        address: item.address,
        roadAddress: item.roadAddress || null,
        category: mapCategory(item.category || ''),
        telephone: item.telephone || null,
        latitude: coords.latitude,
        longitude: coords.longitude,
        link: item.link || null,
      };

      // 검증
      const validated = SearchResultItemSchema.safeParse(result);

      if (!validated.success) {
        console.error('Search result item validation failed:', validated.error);
        return null;
      }

      return validated.data;
    });

    // null 제거
    const validItems = items.filter((item) => item !== null);

    return success({
      items: validItems,
      total: parsed.data.total,
    });
  } catch (error) {
    console.error('Search service error:', error);

    return failure(
      500,
      searchErrorCodes.networkError,
      error instanceof Error ? error.message : 'Unknown network error'
    );
  }
}
