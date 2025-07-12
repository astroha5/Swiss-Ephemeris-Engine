import React from 'react';

const LoadingShimmer = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Chart Loading */}
      <div className="bg-surface rounded-xl border border-border shadow-soft">
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
            <div className="w-48 h-6 bg-gray-300 rounded"></div>
          </div>
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-24 h-8 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
        <div className="p-6">
          <div className="w-full h-64 bg-gray-300 rounded"></div>
        </div>
      </div>

      {/* Table Loading */}
      <div className="bg-surface rounded-xl border border-border shadow-soft">
        <div className="p-6">
          <div className="w-64 h-6 bg-gray-300 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex space-x-4">
                <div className="w-20 h-4 bg-gray-300 rounded"></div>
                <div className="w-24 h-4 bg-gray-300 rounded"></div>
                <div className="w-20 h-4 bg-gray-300 rounded"></div>
                <div className="w-32 h-4 bg-gray-300 rounded"></div>
                <div className="w-16 h-4 bg-gray-300 rounded"></div>
                <div className="w-16 h-4 bg-gray-300 rounded"></div>
                <div className="w-20 h-4 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Interpretation Loading */}
      <div className="bg-surface rounded-xl border border-border shadow-soft">
        <div className="p-6">
          <div className="w-48 h-6 bg-gray-300 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="w-32 h-5 bg-gray-300 rounded"></div>
                <div className="w-full h-4 bg-gray-300 rounded"></div>
                <div className="w-3/4 h-4 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingShimmer;
