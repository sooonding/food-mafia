import { z } from 'zod';

// 리뷰 파라미터 스키마
export const ReviewParamsSchema = z.object({
  reviewId: z.string().uuid({ message: 'Review id must be a valid UUID.' }),
});

export type ReviewParams = z.infer<typeof ReviewParamsSchema>;

// 장소 ID 파라미터 스키마
export const PlaceIdParamsSchema = z.object({
  placeId: z.string().uuid({ message: 'Place id must be a valid UUID.' }),
});

export type PlaceIdParams = z.infer<typeof PlaceIdParamsSchema>;

// 리뷰 테이블 Row 스키마
export const ReviewTableRowSchema = z.object({
  id: z.string().uuid(),
  place_id: z.string().uuid(),
  author_name: z.string(),
  rating: z.number().int().min(1).max(5),
  content: z.string(),
  visited_at: z.string().nullable(),
  password_hash: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ReviewRow = z.infer<typeof ReviewTableRowSchema>;

// 리뷰 응답 스키마 (password_hash 제외)
export const ReviewResponseSchema = z.object({
  id: z.string().uuid(),
  placeId: z.string().uuid(),
  authorName: z.string(),
  rating: z.number().int().min(1).max(5),
  content: z.string(),
  visitedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ReviewResponse = z.infer<typeof ReviewResponseSchema>;

// 리뷰 작성 요청 스키마
export const ReviewCreateSchema = z.object({
  authorName: z
    .string()
    .min(2, '작성자명은 최소 2자 이상이어야 합니다')
    .max(10, '작성자명은 최대 10자까지 가능합니다'),
  rating: z
    .number()
    .int('평점은 정수여야 합니다')
    .min(1, '평점은 최소 1점입니다')
    .max(5, '평점은 최대 5점입니다'),
  content: z
    .string()
    .min(10, '리뷰 내용은 최소 10자 이상이어야 합니다')
    .max(500, '리뷰 내용은 최대 500자까지 가능합니다'),
  visitedAt: z.string().nullable().optional(),
  password: z
    .string()
    .min(4, '비밀번호는 최소 4자 이상이어야 합니다')
    .max(20, '비밀번호는 최대 20자까지 가능합니다'),
});

export type ReviewCreateInput = z.infer<typeof ReviewCreateSchema>;

// 리뷰 수정 요청 스키마 (작성자명 제외)
export const ReviewUpdateSchema = z.object({
  rating: z
    .number()
    .int('평점은 정수여야 합니다')
    .min(1, '평점은 최소 1점입니다')
    .max(5, '평점은 최대 5점입니다'),
  content: z
    .string()
    .min(10, '리뷰 내용은 최소 10자 이상이어야 합니다')
    .max(500, '리뷰 내용은 최대 500자까지 가능합니다'),
  visitedAt: z.string().nullable().optional(),
  password: z
    .string()
    .min(4, '비밀번호는 최소 4자 이상이어야 합니다')
    .max(20, '비밀번호는 최대 20자까지 가능합니다'),
});

export type ReviewUpdateInput = z.infer<typeof ReviewUpdateSchema>;

// 리뷰 삭제 요청 스키마
export const ReviewDeleteSchema = z.object({
  password: z
    .string()
    .min(4, '비밀번호는 최소 4자 이상이어야 합니다')
    .max(20, '비밀번호는 최대 20자까지 가능합니다'),
});

export type ReviewDeleteInput = z.infer<typeof ReviewDeleteSchema>;

// 리뷰 목록 조회 쿼리 파라미터 스키마
export const ReviewListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, '페이지는 1 이상이어야 합니다'),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, '한 페이지당 최대 100개까지 조회 가능합니다'),
  sort: z.enum(['latest', 'rating']).optional().default('latest'),
});

export type ReviewListQuery = z.infer<typeof ReviewListQuerySchema>;
