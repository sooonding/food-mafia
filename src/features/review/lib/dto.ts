// DTO 재노출: 백엔드 스키마를 프론트엔드에서 사용할 수 있도록 재노출
export type {
  ReviewResponse,
  ReviewCreateInput,
  ReviewUpdateInput,
  ReviewDeleteInput,
} from '@/features/review/backend/schema';

export {
  ReviewResponseSchema,
  ReviewCreateSchema,
  ReviewUpdateSchema,
  ReviewDeleteSchema,
} from '@/features/review/backend/schema';
