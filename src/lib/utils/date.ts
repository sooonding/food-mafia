import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 상대 시간 표시 (예: "2일 전", "3주 전")
 */
export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), {
    addSuffix: true,
    locale: ko,
  });
}

/**
 * 날짜 포맷팅 (예: "2025년 10월 21일")
 */
export function formatDate(dateString: string, formatStr = 'yyyy년 MM월 dd일'): string {
  return format(parseISO(dateString), formatStr, { locale: ko });
}

/**
 * 날짜+시간 포맷팅 (예: "2025-10-21 14:30")
 */
export function formatDateTime(dateString: string): string {
  return format(parseISO(dateString), 'yyyy-MM-dd HH:mm', { locale: ko });
}

/**
 * ISO 8601 형식으로 변환
 */
export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
