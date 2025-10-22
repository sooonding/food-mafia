import { z } from 'zod';
import { REVIEW_VALIDATION } from '@/constants/review';

export const reviewCreateSchema = z.object({
  authorName: z
    .string()
    .min(REVIEW_VALIDATION.AUTHOR_NAME.MIN, '작성자명은 최소 2자 이상이어야 합니다')
    .max(REVIEW_VALIDATION.AUTHOR_NAME.MAX, '작성자명은 최대 10자 이하여야 합니다'),

  rating: z
    .number()
    .int('평점은 정수여야 합니다')
    .min(REVIEW_VALIDATION.RATING.MIN, '평점은 최소 1점 이상이어야 합니다')
    .max(REVIEW_VALIDATION.RATING.MAX, '평점은 최대 5점 이하여야 합니다'),

  content: z
    .string()
    .min(REVIEW_VALIDATION.CONTENT.MIN, '리뷰 내용은 최소 10자 이상이어야 합니다')
    .max(REVIEW_VALIDATION.CONTENT.MAX, '리뷰 내용은 최대 500자 이하여야 합니다'),

  visitedAt: z.string().optional(),

  password: z
    .string()
    .min(REVIEW_VALIDATION.PASSWORD.MIN, '비밀번호는 최소 4자 이상이어야 합니다')
    .max(REVIEW_VALIDATION.PASSWORD.MAX, '비밀번호는 최대 20자 이하여야 합니다'),
});

export const reviewUpdateSchema = z.object({
  rating: z
    .number()
    .int()
    .min(REVIEW_VALIDATION.RATING.MIN)
    .max(REVIEW_VALIDATION.RATING.MAX),

  content: z
    .string()
    .min(REVIEW_VALIDATION.CONTENT.MIN)
    .max(REVIEW_VALIDATION.CONTENT.MAX),

  visitedAt: z.string().optional().nullable(),

  password: z
    .string()
    .min(REVIEW_VALIDATION.PASSWORD.MIN)
    .max(REVIEW_VALIDATION.PASSWORD.MAX),
});

export const reviewDeleteSchema = z.object({
  password: z.string().min(REVIEW_VALIDATION.PASSWORD.MIN),
});

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;
export type ReviewDeleteInput = z.infer<typeof reviewDeleteSchema>;
