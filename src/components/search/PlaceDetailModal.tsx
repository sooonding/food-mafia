'use client';

import { useState } from 'react';
import { MapPin, Star, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ReviewWriteModal } from './ReviewWriteModal';
import type { SearchResultItem } from '@/features/search/backend/schema';

interface PlaceDetailModalProps {
  open: boolean;
  onClose: () => void;
  place: SearchResultItem | null;
}

export function PlaceDetailModal({ open, onClose, place }: PlaceDetailModalProps) {
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  if (!place) return null;

  const handleWriteReview = () => {
    // 바로 리뷰 작성 모달 열기 (장소 저장하지 않음)
    setReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setReviewModalOpen(false);
    // 장소 상세 모달도 닫기
    onClose();
  };

  const handleDialogChange = (newOpen: boolean) => {
    // Dialog를 닫으려는 경우 onClose 호출
    if (!newOpen) {
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>장소 상세 정보</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 장소명 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{place.title}</h2>
            </div>

            {/* 주소 */}
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-gray-700">
                {place.roadAddress || place.address}
              </div>
            </div>

            {/* 리뷰 섹션 */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <h3 className="font-semibold text-gray-900">리뷰</h3>
                </div>
                <Button
                  type="button"
                  onClick={handleWriteReview}
                  size="sm"
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  리뷰 작성
                </Button>
              </div>

              {/* 평점 표시 */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-5 w-5 text-gray-300"
                    />
                  ))}
                </div>
                <div className="text-2xl font-bold text-gray-900">0.0</div>
                <div className="text-sm text-gray-500">(0개의 리뷰)</div>
              </div>

              {/* 빈 상태 */}
              <div className="text-center py-8 text-gray-500">
                아직 작성된 리뷰가 없습니다
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 리뷰 작성 모달 */}
      <ReviewWriteModal
        open={reviewModalOpen}
        onClose={handleCloseReviewModal}
        place={place}
      />
    </>
  );
}
