'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ReviewNewPageContent } from '@/features/review/components/ReviewNewPageContent';

interface ReviewNewPageProps {
  params: Promise<{ placeId: string }>;
}

export default function ReviewNewPage({ params }: ReviewNewPageProps) {
  const { placeId } = use(params);
  const router = useRouter();

  // 유효성 검증: placeId가 없으면 홈으로 리다이렉트
  if (!placeId) {
    router.replace('/');
    return null;
  }

  return <ReviewNewPageContent placeId={placeId} />;
}
