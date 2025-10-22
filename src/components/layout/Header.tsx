'use client';

import Link from 'next/link';
import { Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onSearchClick: () => void;
}

export function Header({ onSearchClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary md:text-2xl">
            🍽️ 맛집지도
          </span>
        </Link>

        {/* 중앙 검색바 */}
        <button
          onClick={onSearchClick}
          className="flex-1 mx-4 md:mx-8 md:max-w-[600px]"
          aria-label="장소 검색"
        >
          <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-gray-50 px-4 py-2 transition hover:border-gray-400 hover:bg-gray-100">
            <Search className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500 md:text-base">
              장소, 음식 종류를 검색하세요
            </span>
          </div>
        </button>

        {/* 즐겨찾기 아이콘 */}
        <Link href="/my-places" aria-label="즐겨찾기 목록">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full md:h-12 md:w-12"
          >
            <Heart className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
