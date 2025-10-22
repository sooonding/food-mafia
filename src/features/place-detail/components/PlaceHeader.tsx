'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Place } from '@/types/place';

interface PlaceHeaderProps {
  place: Place;
}

export function PlaceHeader({ place }: PlaceHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.back()}
        aria-label="뒤로가기"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <h1 className="text-2xl font-bold text-gray-900 flex-1">{place.name}</h1>
    </div>
  );
}
