import React from 'react';

const LoadingShimmer = () => {
  return (
    <div className="space-y-8">
      {/* Chart Loading Shimmer */}
      <div className="bg-surface border border-border rounded-xl shadow-strong overflow-hidden">
        {/* Header Shimmer */}
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-text-muted/20 rounded-full animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-5 bg-text-muted/20 rounded animate-pulse w-32"></div>
                <div className="h-3 bg-text-muted/20 rounded animate-pulse w-48"></div>
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="h-6 bg-text-muted/20 rounded-full animate-pulse w-16"></div>
              <div className="h-6 bg-text-muted/20 rounded-full animate-pulse w-16"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-text-muted/20 rounded animate-pulse"></div>
              <div className="h-4 bg-text-muted/20 rounded animate-pulse w-40"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-text-muted/20 rounded animate-pulse"></div>
              <div className="h-4 bg-text-muted/20 rounded animate-pulse w-36"></div>
            </div>
          </div>
        </div>

        {/* Chart Content Shimmer */}
        <div className="p-6">
          <div className="aspect-square max-w-2xl mx-auto bg-text-muted/10 rounded-lg animate-pulse flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-text-muted/20 rounded-full mx-auto animate-pulse"></div>
              <div className="h-4 bg-text-muted/20 rounded animate-pulse w-48 mx-auto"></div>
              <div className="h-3 bg-text-muted/20 rounded animate-pulse w-32 mx-auto"></div>
            </div>
          </div>
        </div>

        {/* Footer Shimmer */}
        <div className="border-t border-border bg-surface-secondary p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-3 bg-text-muted/20 rounded animate-pulse w-32"></div>
              <div className="h-3 bg-text-muted/20 rounded animate-pulse w-36"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-7 bg-text-muted/20 rounded animate-pulse w-20"></div>
              <div className="h-7 bg-text-muted/20 rounded animate-pulse w-16"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Loading Shimmer */}
      <div className="bg-surface border border-border rounded-xl shadow-strong overflow-hidden">
        {/* Table Header Shimmer */}
        <div className="bg-gradient-to-r from-accent/5 to-primary/5 border-b border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-text-muted/20 rounded-full animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-5 bg-text-muted/20 rounded animate-pulse w-36"></div>
                <div className="h-3 bg-text-muted/20 rounded animate-pulse w-52"></div>
              </div>
            </div>
            <div className="h-7 bg-text-muted/20 rounded animate-pulse w-24"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-text-muted/20 rounded animate-pulse"></div>
              <div className="h-4 bg-text-muted/20 rounded animate-pulse w-40"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-text-muted/20 rounded animate-pulse"></div>
              <div className="h-4 bg-text-muted/20 rounded animate-pulse w-36"></div>
            </div>
          </div>
        </div>

        {/* Table Content Shimmer */}
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Table Header Row */}
            <div className="bg-surface-secondary border-b border-border p-4">
              <div className="grid grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-4 bg-text-muted/20 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            
            {/* Table Rows */}
            {Array.from({ length: 9 }).map((_, rowIndex) => (
              <div key={rowIndex} className="border-b border-border p-4">
                <div className="grid grid-cols-6 gap-4 items-center">
                  {/* Planet column with symbol */}
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-text-muted/20 rounded-full animate-pulse"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-text-muted/20 rounded animate-pulse w-16"></div>
                      <div className="h-3 bg-text-muted/20 rounded animate-pulse w-20"></div>
                    </div>
                  </div>
                  
                  {/* Other columns */}
                  {Array.from({ length: 5 }).map((_, colIndex) => (
                    <div key={colIndex} className="h-4 bg-text-muted/20 rounded animate-pulse w-full"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table Footer Shimmer */}
        <div className="border-t border-border bg-surface-secondary p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-3 bg-text-muted/20 rounded animate-pulse w-24"></div>
              <div className="h-3 bg-text-muted/20 rounded animate-pulse w-32"></div>
            </div>
            <div className="h-7 bg-text-muted/20 rounded animate-pulse w-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingShimmer;
