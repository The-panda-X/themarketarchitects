export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum ChallengeStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PHASE_1 = 'PHASE_1',
  PHASE_2 = 'PHASE_2',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  FUNDED = 'FUNDED',
}

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  CRYPTO = 'CRYPTO',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum ServiceType {
  CHALLENGE_PASSING = 'CHALLENGE_PASSING',
  ACCOUNT_MANAGEMENT = 'ACCOUNT_MANAGEMENT',
  ACCOUNT_GROWTH = 'ACCOUNT_GROWTH',
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: Role;
  emailVerified: string | null;
  twoFactorEnabled: boolean;
  referralCode: string;
  referredBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: Role;
  twoFactorEnabled: boolean;
  referralCode: string;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  serviceType: ServiceType;
  planName: string;
  planDetails: PlanDetails;
  accountSize: string | null;
  firmName: string | null;
  status: OrderStatus;
  totalAmount: number;
  discountAmount: number;
  couponCode: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  challenge?: Challenge;
  payments?: Payment[];
  credentials?: Credential[];
}

export interface PlanDetails {
  tier: string;
  features: string[];
  accountSize: string;
  firm: string;
  phases: number;
}

export interface Challenge {
  id: string;
  orderId: string;
  userId: string;
  firmName: string;
  accountSize: string;
  status: ChallengeStatus;
  currentPhase: number;
  startDate: string | null;
  endDate: string | null;
  targetProfit: number | null;
  currentProfit: number;
  maxDrawdown: number | null;
  currentDrawdown: number;
  daysTraded: number;
  winRate: number;
  proofImages: string[];
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  order?: Order;
  user?: User;
  dailyStats?: DailyStat[];
}

export interface DailyStat {
  id: string;
  challengeId: string;
  date: string;
  profit: number;
  loss: number;
  tradesCount: number;
  winCount: number;
  lossCount: number;
  notes: string | null;
}

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  stripePaymentId: string | null;
  status: string;
  invoiceUrl: string | null;
  createdAt: string;
  order?: Order;
  user?: User;
}

export interface Credential {
  id: string;
  orderId: string;
  platform: string;
  server: string | null;
  loginId: string;
  password: string;
  notes: string | null;
  submittedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number | null;
  discountAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: string;
  responses: TicketResponse[];
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface TicketResponse {
  sender: 'user' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'payment' | 'challenge';
  read: boolean;
  link: string | null;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  author: string;
  tags: string[];
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  avatar: string | null;
  title: string;
  content: string;
  rating: number;
  verified: boolean;
  featured: boolean;
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredEmail: string;
  orderId: string | null;
  commission: number;
  paid: boolean;
  createdAt: string;
}

export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  admin?: User;
}

export interface SiteStats {
  totalClients: number;
  totalPayouts: number;
  challengesPassed: number;
  successRate: number;
  totalFundedAmount: number;
}

// API response types

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Service plan types

export interface ServicePlan {
  id: string;
  name: string;
  tier: 'starter' | 'professional' | 'elite';
  serviceType: ServiceType;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  popular?: boolean;
  accountSizes: string[];
  guarantee?: string;
  successRate?: number;
  deliveryDays?: number;
}

export interface PropFirm {
  id: string;
  name: string;
  logo?: string;
  phases: number;
  accountSizes: string[];
}

// Purchase flow types

export interface CartItem {
  planId: string;
  serviceType: ServiceType;
  planName: string;
  tier: string;
  accountSize: string;
  firmName: string;
  price: number;
  couponCode?: string;
  discountAmount?: number;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

// Dashboard stat types

export interface DashboardStats {
  activeChallenges: number;
  totalProfit: number;
  successRate: number;
  referralEarnings: number;
}

export interface AdminStats {
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueTotal: number;
  newUsersToday: number;
  pendingOrders: number;
  openTickets: number;
  activeChallenges: number;
  challengesByStatus: Record<ChallengeStatus, number>;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

// Live notification type for social proof

export interface LiveNotification {
  id: string;
  name: string;
  action: string;
  amount: string;
  timestamp: string;
}

// FAQ type

export interface FAQItem {
  question: string;
  answer: string;
}

// Nav types

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export interface SidebarSection {
  title?: string;
  items: NavItem[];
}
