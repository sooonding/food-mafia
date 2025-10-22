export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 37.5665, lng: 126.9780 } as { lat: number; lng: number },
  DEFAULT_ZOOM: 15 as number,
  MIN_ZOOM: 10 as number,
  MAX_ZOOM: 19 as number,
  CLUSTER_MIN_ZOOM: 13 as number,
  MAX_MARKERS: 100 as number,
};

export const GEOLOCATION_CONFIG = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
} as const;

export const CATEGORY_ICONS = {
  한식: '🍚',
  일식: '🍣',
  양식: '🥩',
  중식: '🥟',
  카페: '☕',
  디저트: '🍰',
  패스트푸드: '🍔',
  주점: '🍺',
  뷔페: '🍱',
  기타: '🍽️',
} as const;

export const CATEGORY_COLORS = {
  한식: '#FF6B6B',
  일식: '#4ECDC4',
  양식: '#95E1D3',
  중식: '#F38181',
  카페: '#AA96DA',
  디저트: '#FCBAD3',
  패스트푸드: '#FFFFB5',
  주점: '#FFA07A',
  뷔페: '#98D8C8',
  기타: '#B0BEC5',
} as const;
