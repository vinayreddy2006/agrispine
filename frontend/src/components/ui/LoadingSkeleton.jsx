import React from 'react';

/**
 * Base Skeleton block
 */
export const Skeleton = ({ className = '', rounded = 'rounded-lg' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-slate-700/60 ${rounded} ${className}`} />
);

/**
 * Card Skeleton - for equipment listings, crop cards, schemes
 */
export const CardSkeleton = ({ count = 1 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <div 
        key={i} 
        className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700/60 shadow-xs flex flex-col justify-between"
      >
        <div className="space-y-3">
          <Skeleton className="w-full h-44 rounded-xl" />
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="pt-4 mt-2 border-t border-gray-100 dark:border-slate-700/40 flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Stat / Metric Card Skeleton - for dashboard quick metrics
 */
export const StatCardSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div 
        key={i} 
        className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700/60 shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="w-12 h-5 rounded-full" />
        </div>
        <Skeleton className="w-20 h-7" />
        <Skeleton className="w-28 h-4" />
      </div>
    ))}
  </div>
);

/**
 * Post Skeleton - for Community feed
 */
export const PostSkeleton = ({ count = 2 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div 
        key={i} 
        className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700/60 shadow-xs space-y-4"
      >
        <div className="flex items-center space-x-3">
          <Skeleton className="w-11 h-11 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <Skeleton className="w-full h-56 rounded-xl" />
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700/40">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Table Row Skeleton - for Workgroups, Orders, Price Tables
 */
export const TableRowSkeleton = ({ rows = 4, cols = 4 }) => (
  <div className="w-full space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div 
        key={i} 
        className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700/60 flex items-center justify-between gap-4"
      >
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton 
            key={j} 
            className={`h-4 ${j === 0 ? 'w-1/3' : j === cols - 1 ? 'w-20' : 'w-1/5'}`} 
          />
        ))}
      </div>
    ))}
  </div>
);

/**
 * List Item Skeleton - for notifications, compact listings
 */
export const ListSkeleton = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div 
        key={i} 
        className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-gray-100 dark:border-slate-700/60 flex items-center gap-3"
      >
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full shrink-0" />
      </div>
    ))}
  </div>
);

/**
 * Calendar Month Skeleton - for rental machinery schedule
 */
export const CalendarSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/60 space-y-4">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-6 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={`head-${i}`} className="h-5 w-full" />
      ))}
      {Array.from({ length: 28 }).map((_, i) => (
        <Skeleton key={`cell-${i}`} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  </div>
);

export default {
  Skeleton,
  CardSkeleton,
  StatCardSkeleton,
  PostSkeleton,
  TableRowSkeleton,
  ListSkeleton,
  CalendarSkeleton,
};

