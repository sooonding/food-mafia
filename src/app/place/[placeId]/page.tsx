import { Metadata } from 'next';
import { PlaceDetailClient } from '@/features/place-detail/components/PlaceDetailClient';

interface PageProps {
  params: Promise<{ placeId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { placeId } = await params;

  return {
    title: '장소 상세 | 맛집 지도',
    description: '맛집 정보와 리뷰를 확인하세요',
  };
}

export default async function PlaceDetailPage({ params }: PageProps) {
  const { placeId } = await params;

  return <PlaceDetailClient placeId={placeId} />;
}
