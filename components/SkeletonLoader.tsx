import React from 'react';

// Single Table Row Skeleton
export const TableRowSkeleton: React.FC = () => (
  <tr className="animate-pulse border-b border-k5-sand/10 dark:border-white/5">
    <td className="px-6 py-6">
      <div className="h-4 w-4 rounded bg-k5-sand/20 dark:bg-white/10" />
    </td>
    <td className="px-4 py-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-k5-sand/20 dark:bg-white/10" />
        <div className="h-4 w-32 rounded bg-k5-sand/20 dark:bg-white/10" />
      </div>
    </td>
    <td className="px-8 py-6">
      <div className="h-4 w-24 rounded bg-k5-sand/20 dark:bg-white/10" />
    </td>
    <td className="px-8 py-6">
      <div className="h-4 w-20 rounded bg-k5-sand/20 dark:bg-white/10" />
    </td>
    <td className="px-8 py-6">
      <div className="h-4 w-16 rounded bg-k5-sand/20 dark:bg-white/10" />
    </td>
    <td className="px-8 py-6">
      <div className="h-4 w-24 rounded bg-k5-sand/20 dark:bg-white/10" />
    </td>
    <td className="px-8 py-6">
      <div className="h-6 w-20 rounded-full bg-k5-sand/20 dark:bg-white/10" />
    </td>
    <td className="px-8 py-6 text-right">
      <div className="ml-auto h-8 w-16 rounded-lg bg-k5-sand/20 dark:bg-white/10" />
    </td>
  </tr>
);

// Stats Card Skeleton
export const StatsCardSkeleton: React.FC = () => (
  <div className="animate-pulse rounded-2xl border border-k5-deepBlue/5 bg-gradient-to-br from-white to-k5-sand/5 p-6 shadow-sm dark:border-white/5 dark:from-k5-deepBlue dark:to-k5-deepBlue/80">
    <div className="mb-3 h-3 w-32 rounded bg-k5-sand/20 dark:bg-white/10" />
    <div className="mb-2 h-8 w-24 rounded bg-k5-sand/20 dark:bg-white/10" />
    <div className="h-2 w-20 rounded bg-k5-sand/20 dark:bg-white/10" />
  </div>
);

// Chart/Analytics Skeleton
export const ChartSkeleton: React.FC = () => (
  <div className="animate-pulse rounded-2xl border border-k5-deepBlue/5 bg-gradient-to-br from-white to-k5-sand/5 p-8 shadow-sm dark:border-white/10 dark:from-k5-deepBlue dark:to-k5-deepBlue/80">
    <div className="mb-6 h-3 w-48 rounded bg-k5-sand/20 dark:bg-white/10" />
    <div className="h-72 rounded-xl bg-k5-sand/10 dark:bg-white/5" />
  </div>
);

// Table Skeleton - Multiple Rows
interface TableSkeletonProps {
  rows?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <TableRowSkeleton key={i} />
    ))}
  </>
);
