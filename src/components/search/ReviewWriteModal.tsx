'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReviewForm } from '@/features/review/components/ReviewForm';
import type { SearchResultItem } from '@/features/search/backend/schema';

interface ReviewWriteModalProps {
  open: boolean;
  onClose: () => void;
  place: SearchResultItem | null;
}

export function ReviewWriteModal({ open, onClose, place }: ReviewWriteModalProps) {
  if (!place) return null;

  return (
    <div className="relative z-[120]">
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{place.title}</DialogTitle>
            <p className="text-sm text-gray-600 mt-1">리뷰 작성</p>
          </DialogHeader>

          <div className="mt-4">
            <ReviewForm place={place} onSuccess={onClose} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
