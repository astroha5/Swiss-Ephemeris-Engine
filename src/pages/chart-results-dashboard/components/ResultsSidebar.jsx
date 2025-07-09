import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const ResultsSidebar = ({ activeSection, onSectionChange, isMobile = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewedSections, setViewedSections] = useState(new Set(['overview']));

  const sections = [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'Eye',
      description: 'Chart summary and key insights'
    },
    {
      id: 'lagna-chart',
      label: 'Lagna Chart',
      icon: 'Circle',
      description: 'Birth chart (D1) visualization'
    },
    {
      id: 'navamsa-chart',
      label: 'Navamsa Chart',
      icon: 'Hexagon',
      description: 'Navamsa chart (D9) visualization'
    },
    {
      id: 'planetary-positions',
      label: 'Planetary Positions',
      icon: 'Globe',
      description: 'Detailed planetary data table'
    },
    {
      id: 'dasha-periods',
      label: 'Dasha Periods',
      icon: 'Clock',
      description: 'Vimshottari dasha timeline'
    },
    {
      id: 'ai-interpretation',
      label: 'AI Interpretation',
      icon: 'Sparkles',
      description: 'Comprehensive life analysis'
    },
    {
      id: 'remedies',
      label: 'Remedies',
      icon: 'Shield',
      description: 'Suggested remedial measures'
    },
    {
      id: 'export-options',
      label: 'Export & Share',
      icon: 'Download',
      description: 'Download PDF and sharing options'
    }
  ];

  const handleSectionClick = (sectionId) => {
    onSectionChange(sectionId);
    
    // Track viewed sections
    setViewedSections(prev => new Set([...prev, sectionId]));
    
    // Scroll to section on mobile
    if (isMobile) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  if (isMobile) {
    return (
      <div className="sticky top-32 z-50 bg-surface/95 backdrop-blur-sm border-b border-border shadow-soft">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section.id)}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-celestial
                  ${activeSection === section.id
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'text-text-secondary hover:text-primary hover:bg-primary/5'
                  }
                `}
              >
                <Icon name={section.icon} size={16} />
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      sticky top-32 h-fit bg-surface rounded-xl border border-border shadow-soft transition-all duration-300
      ${isCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-light">
        {!isCollapsed && (
          <h3 className="font-heading font-semibold text-text-primary">
            Chart Sections
          </h3>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-text-muted hover:text-text-primary transition-celestial"
        >
          <Icon name={isCollapsed ? 'ChevronRight' : 'ChevronLeft'} size={16} />
        </button>
      </div>

      {/* Navigation Items */}
      <div className="p-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => handleSectionClick(section.id)}
            className={`
              w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-celestial group
              ${activeSection === section.id
                ? 'bg-primary text-primary-foreground shadow-soft'
                : 'text-text-secondary hover:text-primary hover:bg-primary/5'
              }
            `}
            title={isCollapsed ? section.label : ''}
          >
            <Icon 
              name={section.icon} 
              size={20} 
              className={`flex-shrink-0 ${
                activeSection === section.id ? 'text-primary-foreground' : 'text-current'
              }`}
            />
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {section.label}
                </div>
                <div className={`
                  text-xs truncate font-caption
                  ${activeSection === section.id 
                    ? 'text-primary-foreground/80' 
                    : 'text-text-muted group-hover:text-text-secondary'
                  }
                `}>
                  {section.description}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Progress Indicator */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border-light">
          <div className="flex items-center justify-between text-sm text-text-muted mb-2">
            <span className="font-caption">Sections Viewed</span>
            <span className="font-mono">{viewedSections.size}/{sections.length}</span>
          </div>
          <div className="w-full bg-border-light rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(viewedSections.size / sections.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border-light space-y-2">
          <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-celestial">
            <Icon name="Download" size={16} />
            <span>Download PDF</span>
          </button>
          <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-celestial">
            <Icon name="Share" size={16} />
            <span>Share Results</span>
          </button>
          <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-celestial">
            <Icon name="Bookmark" size={16} />
            <span>Save Chart</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ResultsSidebar;