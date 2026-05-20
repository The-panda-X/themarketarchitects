'use client';

import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

// Table Root
interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={cn('w-full overflow-x-auto no-scrollbar', className)}>
      <table className="w-full">{children}</table>
    </div>
  );
}

// Table Header
export function TableHeader({ children, className }: TableProps) {
  return (
    <thead
      className={cn('border-b border-white/[0.06]', className)}
    >
      {children}
    </thead>
  );
}

// Table Body
export function TableBody({ children, className }: TableProps) {
  return <tbody className={cn('divide-y divide-white/[0.04]', className)}>{children}</tbody>;
}

// Table Row
interface TableRowProps extends TableProps {
  onClick?: () => void;
  hoverable?: boolean;
}

export function TableRow({ children, className, onClick, hoverable = true }: TableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition-colors duration-150',
        hoverable && 'hover:bg-white/[0.02]',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </tr>
  );
}

// Table Head Cell
interface TableHeadProps {
  children?: React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
  align?: 'left' | 'center' | 'right';
}

export function TableHead({
  children,
  className,
  sortable,
  sortDirection,
  onSort,
  align = 'left',
}: TableHeadProps) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        sortable && 'cursor-pointer select-none hover:text-text-secondary',
        className
      )}
      onClick={sortable ? onSort : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && (
          <span className="inline-flex flex-col">
            {sortDirection === 'asc' ? (
              <ChevronUp className="h-3.5 w-3.5 text-accent-primary" />
            ) : sortDirection === 'desc' ? (
              <ChevronDown className="h-3.5 w-3.5 text-accent-primary" />
            ) : (
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
            )}
          </span>
        )}
      </span>
    </th>
  );
}

// Table Data Cell
interface TableCellProps {
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  mono?: boolean;
}

export function TableCell({ children, className, align = 'left', mono }: TableCellProps) {
  return (
    <td
      className={cn(
        'px-4 py-3 text-sm text-text-secondary whitespace-nowrap',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        mono && 'font-mono',
        className
      )}
    >
      {children}
    </td>
  );
}

// Empty state
interface TableEmptyProps {
  message?: string;
  colSpan: number;
}

export function TableEmpty({ message = 'No data found', colSpan }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-text-tertiary text-sm">
        {message}
      </td>
    </tr>
  );
}

// Pagination
interface TablePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function TablePagination({
  page,
  totalPages,
  onPageChange,
  className,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className={cn('flex items-center justify-between pt-4', className)}>
      <p className="text-xs text-text-tertiary">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-2.5 py-1.5 text-xs rounded-lg text-text-secondary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Prev
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1.5 text-text-tertiary text-xs">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'min-w-[32px] h-8 text-xs rounded-lg transition-colors',
                p === page
                  ? 'bg-accent-primary text-white'
                  : 'text-text-secondary hover:bg-white/5'
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-2.5 py-1.5 text-xs rounded-lg text-text-secondary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
