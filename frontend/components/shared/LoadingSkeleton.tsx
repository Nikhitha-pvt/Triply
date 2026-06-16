import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'list' | 'itinerary' | 'fullpage';
  count?: number;
}

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`bg-slate-200 rounded animate-pulse ${className ?? ''}`}
      style={{
        background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.8s ease infinite',
      }}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <SkeletonBox className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBox className="h-4 w-3/4 rounded" />
          <SkeletonBox className="h-3 w-1/2 rounded" />
        </div>
      </div>
      <SkeletonBox className="h-3 w-full rounded" />
      <SkeletonBox className="h-3 w-5/6 rounded" />
      <div className="flex gap-2 pt-2">
        <SkeletonBox className="h-6 w-16 rounded-full" />
        <SkeletonBox className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
      <SkeletonBox className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="h-4 w-1/2 rounded" />
        <SkeletonBox className="h-3 w-3/4 rounded" />
      </div>
      <SkeletonBox className="w-20 h-8 rounded-lg flex-shrink-0" />
    </div>
  );
}

function ItinerarySkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header skeleton */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-20 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonBox className="h-6 w-56 rounded" />
            <SkeletonBox className="h-3 w-40 rounded" />
          </div>
          <div className="flex gap-2">
            <SkeletonBox className="w-9 h-9 rounded-lg" />
            <SkeletonBox className="w-9 h-9 rounded-lg" />
          </div>
        </div>
        {/* Tab bar */}
        <div className="max-w-4xl mx-auto flex gap-6 mt-4">
          {[80, 96, 72, 88, 64, 76, 88].map((w, i) => (
            <SkeletonBox key={i} className={`h-3 w-${w} rounded`} />
          ))}
        </div>
      </div>
      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100">
              <SkeletonBox className="h-3 w-16 rounded mb-2" />
              <SkeletonBox className="h-7 w-20 rounded" />
            </div>
          ))}
        </div>
        {[1, 2, 3].map(i => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function FullPageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-teal-400 mx-auto flex items-center justify-center animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
          </svg>
        </div>
        <div className="space-y-2">
          <SkeletonBox className="h-5 w-48 rounded mx-auto" />
          <SkeletonBox className="h-3 w-32 rounded mx-auto" />
        </div>
      </div>
    </div>
  );
}

export default function LoadingSkeleton({ type = 'card', count = 3 }: LoadingSkeletonProps) {
  if (type === 'itinerary') return <ItinerarySkeleton />;
  if (type === 'fullpage') return <FullPageSkeleton />;

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) =>
        type === 'list' ? <ListSkeleton key={i} /> : <CardSkeleton key={i} />
      )}
    </div>
  );
}
