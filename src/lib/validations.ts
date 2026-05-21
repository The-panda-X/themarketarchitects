import { z } from 'zod';

// Auth schemas

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    referralCode: z.string().optional(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms and conditions' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    token: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const twoFactorSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});

// Profile schemas

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  avatar: z.string().url().optional().nullable(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[a-z]/, 'Must contain lowercase')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

// Order schemas

export const createOrderSchema = z.object({
  serviceType: z.enum(['CHALLENGE_PASSING', 'ACCOUNT_MANAGEMENT', 'ACCOUNT_GROWTH']),
  planName: z.string().min(1, 'Plan is required'),
  planDetails: z.object({
    tier: z.string(),
    features: z.array(z.string()),
    accountSize: z.string(),
    firm: z.string(),
    phases: z.number(),
  }),
  accountSize: z.string().optional(),
  firmName: z.string().optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

// Credential schemas

export const credentialSchema = z.object({
  orderId: z.string().min(1, 'Order is required'),
  platform: z.enum(['MetaTrader 4', 'MetaTrader 5', 'cTrader', 'TradingView', 'Other']),
  server: z.string().optional(),
  loginId: z.string().min(1, 'Login ID is required'),
  password: z.string().min(1, 'Password is required'),
  notes: z.string().optional(),
});

// Support schemas

export const createTicketSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export const ticketReplySchema = z.object({
  message: z.string().min(1, 'Message is required').max(5000),
});

// Blog schemas

export const blogPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  slug: z.string().min(3).max(200).optional(),
  excerpt: z.string().min(10, 'Excerpt must be at least 10 characters').max(500),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  coverImage: z.string().url().optional().nullable(),
  author: z.string().min(1, 'Author is required'),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  scheduledAt: z.string().optional().nullable(), // ISO datetime string for future publish
});

// Coupon schemas

export const couponSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(20)
    .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase letters, numbers, hyphens, or underscores'),
  discountPercent: z.coerce.number().min(1, 'Must be at least 1%').max(100, 'Cannot exceed 100%').optional().nullable(),
  discountAmount: z.coerce.number().min(1, 'Must be at least $1').optional().nullable(),
  maxUses: z.coerce.number().min(1, 'Must be at least 1').optional().nullable(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

// Admin schemas

export const updateChallengeSchema = z.object({
  status: z
    .enum(['PENDING', 'IN_PROGRESS', 'PHASE_1', 'PHASE_2', 'PASSED', 'FAILED', 'FUNDED'])
    .optional(),
  currentPhase: z.number().min(1).max(3).optional(),
  currentProfit: z.number().optional(),
  currentDrawdown: z.number().optional(),
  daysTraded: z.number().min(0).optional(),
  winRate: z.number().min(0).max(100).optional(),
  adminNotes: z.string().optional(),
  targetProfit: z.number().optional(),
  maxDrawdown: z.number().optional(),
});

export const dailyStatSchema = z.object({
  date: z.string(),
  profit: z.number(),
  loss: z.number(),
  tradesCount: z.number().min(0),
  winCount: z.number().min(0),
  lossCount: z.number().min(0),
  notes: z.string().optional(),
});

export const sendNotificationSchema = z.object({
  userId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['info', 'success', 'warning', 'payment', 'challenge']).default('info'),
  link: z.string().optional(),
  sendToAll: z.boolean().optional(),
});

// Contact form schema

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
});

// Pagination schema

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type TwoFactorInput = z.infer<typeof twoFactorSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CredentialInput = z.infer<typeof credentialSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type TicketReplyInput = z.infer<typeof ticketReplySchema>;
export type BlogPostInput = z.infer<typeof blogPostSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type UpdateChallengeInput = z.infer<typeof updateChallengeSchema>;
export type DailyStatInput = z.infer<typeof dailyStatSchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
