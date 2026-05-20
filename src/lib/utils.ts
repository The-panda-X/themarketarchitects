import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(d);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateId(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'text-yellow-400',
    PENDING_PAYMENT: 'text-yellow-400',
    IN_PROGRESS: 'text-blue-400',
    PHASE_1: 'text-blue-400',
    PHASE_2: 'text-purple-400',
    PASSED: 'text-green-400',
    FUNDED: 'text-green-400',
    COMPLETED: 'text-green-400',
    PAID: 'text-green-400',
    FAILED: 'text-red-400',
    REFUNDED: 'text-orange-400',
    CANCELLED: 'text-gray-400',
    OPEN: 'text-blue-400',
    RESOLVED: 'text-green-400',
    CLOSED: 'text-gray-400',
  };
  return colors[status] ?? 'text-gray-400';
}

export function getStatusBgColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    PENDING_PAYMENT: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    IN_PROGRESS: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    PHASE_1: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    PHASE_2: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
    PASSED: 'bg-green-400/10 text-green-400 border-green-400/20',
    FUNDED: 'bg-green-400/10 text-green-400 border-green-400/20',
    COMPLETED: 'bg-green-400/10 text-green-400 border-green-400/20',
    PAID: 'bg-green-400/10 text-green-400 border-green-400/20',
    FAILED: 'bg-red-400/10 text-red-400 border-red-400/20',
    REFUNDED: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
    CANCELLED: 'bg-gray-400/10 text-gray-400 border-gray-400/20',
    OPEN: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    RESOLVED: 'bg-green-400/10 text-green-400 border-green-400/20',
    CLOSED: 'bg-gray-400/10 text-gray-400 border-gray-400/20',
  };
  return colors[status] ?? 'bg-gray-400/10 text-gray-400 border-gray-400/20';
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
