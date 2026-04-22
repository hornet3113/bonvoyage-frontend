"use client";

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      <div className="w-full h-28 bg-gray-200" />
      <div className="p-2.5 space-y-2">
        <div className="h-2 bg-gray-200 rounded w-1/2" />
        <div className="h-2.5 bg-gray-200 rounded w-3/4" />
        <div className="h-2 bg-gray-200 rounded w-full" />
        <div className="h-2 bg-gray-200 rounded w-2/3" />
        <div className="h-2 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

export function SkeletonFlightRow() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 animate-pulse">
      <div className="flex items-center gap-4">
        {/* Airline */}
        <div className="w-24 flex-shrink-0 space-y-1.5">
          <div className="h-2.5 bg-gray-200 rounded w-20" />
          <div className="h-2 bg-gray-200 rounded w-14" />
        </div>

        {/* Route */}
        <div className="flex-1 flex items-center gap-3">
          <div className="space-y-1 text-right">
            <div className="h-5 bg-gray-200 rounded w-14 ml-auto" />
            <div className="h-2 bg-gray-200 rounded w-10 ml-auto" />
          </div>
          <div className="flex-1 flex flex-col items-center gap-1.5">
            <div className="h-2 bg-gray-200 rounded w-16" />
            <div className="h-px w-full bg-gray-200" />
          </div>
          <div className="space-y-1">
            <div className="h-5 bg-gray-200 rounded w-14" />
            <div className="h-2 bg-gray-200 rounded w-10" />
          </div>
        </div>

        {/* Price */}
        <div className="flex-shrink-0 space-y-1.5 text-right">
          <div className="h-5 bg-gray-200 rounded w-20 ml-auto" />
          <div className="h-2 bg-gray-200 rounded w-14 ml-auto" />
        </div>
      </div>
    </div>
  );
}
