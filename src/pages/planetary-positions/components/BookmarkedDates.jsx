import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BookmarkedDates = ({ bookmarks, onLoadBookmark, onClearBookmarks }) => {
  const formatBookmarkDate = (date) => {
    const bookmarkDate = new Date(date);
    return bookmarkDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatBookmarkTime = (time) => {
    const [hours, minutes] = time.split(':');
    const timeObj = new Date();
    timeObj.setHours(parseInt(hours), parseInt(minutes));
    
    return timeObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const bookmarkTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - bookmarkTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return bookmarkTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Bookmarked Dates</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearBookmarks}
          iconName="Trash2"
          className="text-xs h-6 text-error hover:text-error"
        >
          Clear
        </Button>
      </div>

      <div className="space-y-2">
        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="bg-background border border-border rounded-lg p-3 cursor-pointer hover:border-primary/30 transition-celestial group"
            onClick={() => onLoadBookmark(bookmark)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Date & Time */}
                <div className="flex items-center space-x-2 mb-1">
                  <Icon name="Calendar" size={12} className="text-text-muted" />
                  <span className="text-sm font-medium text-text-primary">
                    {formatBookmarkDate(bookmark.date)}
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatBookmarkTime(bookmark.time)}
                  </span>
                </div>
                
                {/* Location */}
                <div className="flex items-center space-x-2 mb-1">
                  <Icon name="MapPin" size={12} className="text-text-muted" />
                  <span className="text-xs text-text-secondary truncate">
                    {bookmark.location.city}, {bookmark.location.country}
                  </span>
                </div>
                
                {/* Saved timestamp */}
                <div className="text-xs text-text-muted">
                  Saved {getRelativeTime(bookmark.timestamp)}
                </div>
              </div>
              
              {/* Load indicator */}
              <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Icon name="ArrowRight" size={14} className="text-primary" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {bookmarks.length === 0 && (
        <div className="text-center py-4">
          <Icon name="Bookmark" size={24} className="text-text-muted mx-auto mb-2" />
          <p className="text-xs text-text-muted">
            No bookmarked dates yet
          </p>
          <p className="text-xs text-text-muted">
            Save date & location combinations for quick access
          </p>
        </div>
      )}

      {/* Bookmark limit indicator */}
      {bookmarks.length > 0 && (
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>{bookmarks.length}/5 bookmarks</span>
            <div className="flex items-center space-x-1">
              <Icon name="Info" size={10} />
              <span>Max 5 saved</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmarkedDates;
