declare namespace naver.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  class Point {
    constructor(x: number, y: number);
    x: number;
    y: number;
  }

  class Size {
    constructor(width: number, height: number);
    width: number;
    height: number;
  }

  interface MapOptions {
    center?: LatLng;
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    mapTypeControl?: boolean;
    scaleControl?: boolean;
    logoControl?: boolean;
    zoomControl?: boolean;
    zoomControlOptions?: {
      position?: Position;
    };
  }

  class Map {
    constructor(element: HTMLElement, options?: MapOptions);
    setCenter(center: LatLng): void;
    getCenter(): LatLng;
    setZoom(zoom: number): void;
    getZoom(): number;
    getBounds(): LatLngBounds;
    panTo(center: LatLng): void;
    addListener(event: string, callback: () => void): void;
  }

  interface MarkerOptions {
    position: LatLng;
    map?: Map | null;
    icon?: string | MarkerIcon;
    title?: string;
    zIndex?: number;
  }

  interface MarkerIcon {
    content?: string;
    size?: Size;
    anchor?: Point;
    origin?: Point;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    getPosition(): LatLng;
    setPosition(position: LatLng): void;
    setIcon(icon: string | MarkerIcon): void;
    addListener(event: string, callback: () => void): void;
  }

  class LatLngBounds {
    constructor(sw: LatLng, ne: LatLng);
    getSW(): LatLng;
    getNE(): LatLng;
    extend(latlng: LatLng): LatLngBounds;
  }

  enum Position {
    TOP_LEFT = 1,
    TOP_CENTER = 2,
    TOP_RIGHT = 3,
    LEFT_CENTER = 4,
    CENTER = 5,
    RIGHT_CENTER = 6,
    BOTTOM_LEFT = 7,
    BOTTOM_CENTER = 8,
    BOTTOM_RIGHT = 9,
  }

  namespace Event {
    function addListener(
      target: Map | Marker,
      event: string,
      callback: () => void
    ): void;
    function clearListeners(target: Map | Marker, event: string): void;
  }
}

interface Window {
  naver: typeof naver;
}
