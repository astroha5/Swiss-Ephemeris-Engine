import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';


const TroubleshootingPanel = ({ errorType }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const troubleshootingData = {
    upload: {
      title: "Upload Issues",
      sections: [
        {
          id: 'file-requirements',
          title: 'File Requirements',
          icon: 'FileImage',
          content: [
            'Supported formats: JPG, PNG, PDF (max 10MB)',
            'Image resolution: minimum 800x600 pixels',
            'Clear, well-lit photos work best',
            'Avoid blurry or rotated images'
          ]
        },
        {
          id: 'common-issues',
          title: 'Common Upload Problems',
          icon: 'AlertTriangle',
          content: [
            'File too large: Compress image or use PDF',
            'Unsupported format: Convert to JPG or PNG',
            'Poor image quality: Retake photo with better lighting',
            'Network timeout: Check internet connection'
          ]
        },
        {
          id: 'tips',
          title: 'Best Practices',
          icon: 'Lightbulb',
          content: [
            'Use good lighting when photographing kundli',
            'Keep the kundli flat and straight',
            'Ensure all text is clearly visible',
            'Remove any shadows or glare'
          ]
        }
      ]
    },
    processing: {
      title: "Chart Generation Issues",
      sections: [
        {
          id: 'data-validation',
          title: 'Birth Data Validation',
          icon: 'CheckCircle',
          content: [
            'Verify birth date is in correct format',
            'Ensure birth time is accurate (24-hour format)',
            'Check location spelling and selection',
            'Confirm time zone is correctly set'
          ]
        },
        {
          id: 'ai-processing',
          title: 'AI Analysis Problems',
          icon: 'Brain',
          content: [
            'Complex charts may take longer to process',
            'Rare planetary positions might need manual review',
            'Try refreshing if processing seems stuck',
            'Contact support for persistent issues'
          ]
        }
      ]
    },
    network: {
      title: "Connection Issues",
      sections: [
        {
          id: 'connectivity',
          title: 'Network Troubleshooting',
          icon: 'Wifi',
          content: [
            'Check your internet connection',
            'Try refreshing the page',
            'Disable VPN if using one',
            'Clear browser cache and cookies'
          ]
        },
        {
          id: 'browser-issues',
          title: 'Browser Compatibility',
          icon: 'Globe',
          content: [
            'Use latest version of Chrome, Firefox, or Safari',
            'Enable JavaScript in browser settings',
            'Disable ad blockers temporarily',
            'Try incognito/private browsing mode'
          ]
        }
      ]
    },
    system: {
      title: "System Issues",
      sections: [
        {
          id: 'general-troubleshooting',
          title: 'General Solutions',
          icon: 'Settings',
          content: [
            'Refresh the page and try again',
            'Clear browser cache and cookies',
            'Try using a different browser',
            'Check if the issue persists on mobile'
          ]
        },
        {
          id: 'data-recovery',
          title: 'Data Recovery',
          icon: 'Database',
          content: [
            'Your progress is automatically saved',
            'Use session recovery if available',
            'Form data persists across page refreshes',
            'Contact support for data restoration'
          ]
        }
      ]
    }
  };

  const currentData = troubleshootingData[errorType] || troubleshootingData.system;

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="bg-surface rounded-lg border border-border shadow-soft">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-heading font-semibold text-text-primary flex items-center space-x-2">
          <Icon name="HelpCircle" size={20} className="text-primary" />
          <span>{currentData.title} - Troubleshooting Guide</span>
        </h3>
      </div>
      
      <div className="divide-y divide-border">
        {currentData.sections.map((section) => (
          <div key={section.id} className="p-4">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between text-left hover:bg-surface-secondary rounded-md p-2 -m-2 transition-celestial"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name={section.icon} size={16} className="text-primary" />
                </div>
                <span className="font-medium text-text-primary">{section.title}</span>
              </div>
              <Icon 
                name={expandedSection === section.id ? "ChevronUp" : "ChevronDown"} 
                size={16} 
                className="text-text-muted"
              />
            </button>
            
            {expandedSection === section.id && (
              <div className="mt-4 ml-11 space-y-2 animate-slide-down">
                {section.content.map((item, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Icon name="ArrowRight" size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-text-secondary">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="p-4 bg-surface-secondary rounded-b-lg">
        <div className="flex items-center space-x-2 text-sm text-text-muted">
          <Icon name="Info" size={14} />
          <span>Still having issues? Contact our support team for personalized help.</span>
        </div>
      </div>
    </div>
  );
};

export default TroubleshootingPanel;