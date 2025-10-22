'use client';

import { useRouter, useParams } from 'next/navigation';
import { EmptyState } from '@/components/common/EmptyState';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyReviewState() {
  const router = useRouter();
  const params = useParams();
  const placeId = params.placeId as string;

  return (
    <EmptyState
      icon={MessageSquare}
      title="아직 리뷰가 없습니다"
      description="첫 번째 리뷰를 작성해보세요!"
      action={
        <Button onClick={() => router.push(`/place/${placeId}/review/new`)}>
          리뷰 작성하기
        </Button>
      }
    />
  );
}
