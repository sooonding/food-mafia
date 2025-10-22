'use client';

import { ArrowLeft } from 'lucide-react';

export function FavoritesSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center px-4 py-3">
          <button
            disabled
            className="p-2 -ml-2 rounded-full"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="ml-2 text-lg font-semibold">즐겨찾기</h1>
        </div>
      </header>

      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="flex flex-col md:flex-row md:h-[calc(100vh-120px)]">
        <div className="w-full md:w-2/5 h-[300px] md:h-full bg-gray-200 animate-pulse" />

        <div className="w-full md:w-3/5 md:overflow-y-auto">
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-lg p-4 min-h-[120px]"
              >
                <div className="animate-pulse">
                  <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-full bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded mb-3" />
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
