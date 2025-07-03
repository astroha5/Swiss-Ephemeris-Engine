import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ErrorBreadcrumb = ({ errorSource, previousPath, onNavigateBack }) => {
  const navigate = useNavigate();

  const getSourceInfo = () => {
    switch (errorSource) {
      case 'form-submission':
        return {
          icon: 'FileText',
          title: 'Birth Details Form',
          description: 'Error occurred while processing birth details',
          backPath: '/birth-details-form',
          backLabel: 'Back to Form'
        };
      case 'upload-processing':
        return {
          icon: 'Upload',
          title: 'Kundli Upload',
          description: 'Error occurred during file upload or processing',
          backPath: '/kundli-upload',
          backLabel: 'Back to Upload'
        };
      case 'chart-generation':
        return {
          icon: 'BarChart3',
          title: 'Chart Generation',
          description: 'Error occurred while generating astrological chart',
          backPath: '/birth-details-form',
          backLabel: 'Retry Generation'
        };
      case 'results-display':
        return {
          icon: 'Eye',
          title: 'Results Display',
          description: 'Error occurred while displaying chart results',
          backPath: '/chart-results-dashboard',
          backLabel: 'Back to Results'
        };
      default:
        return {
          icon: 'AlertCircle',
          title: 'System Error',
          description: 'An unexpected error occurred',
          backPath: '/home-landing-page',
          backLabel: 'Back to Home'
        };
    }
  };

  const sourceInfo = getSourceInfo();

  const handleNavigateBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      navigate(sourceInfo.backPath);
    }
  };

  const breadcrumbItems = [
    { label: 'Home', path: '/home-landing-page', icon: 'Home' },
    { label: sourceInfo.title, path: sourceInfo.backPath, icon: sourceInfo.icon },
    { label: 'Error', path: '/error-handling-page', icon: 'AlertTriangle', current: true }
  ];

  return (
    <div className="bg-surface rounded-lg border border-border shadow-soft mb-6">
      <div className="p-4">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm mb-4">
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={item.path}>
              {index > 0 && (
                <Icon name="ChevronRight" size={14} className="text-text-muted" />
              )}
              <button
                onClick={() => !item.current && navigate(item.path)}
                className={`
                  flex items-center space-x-1 px-2 py-1 rounded transition-celestial
                  ${item.current
                    ? 'text-error bg-error/10 cursor-default' :'text-text-muted hover:text-primary hover:bg-primary/5'
                  }
                `}
                disabled={item.current}
              >
                <Icon name={item.icon} size={14} />
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </nav>

        {/* Error Source Information */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Icon name={sourceInfo.icon} size={24} className="text-error" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-1">
              Error in {sourceInfo.title}
            </h3>
            <p className="text-text-secondary mb-4">
              {sourceInfo.description}
            </p>
            
            {previousPath && (
              <div className="bg-surface-secondary rounded-md p-3 mb-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Icon name="MapPin" size={14} className="text-text-muted" />
                  <span className="text-text-muted">Previous location:</span>
                  <span className="text-text-primary font-medium">
                    {previousPath.replace('/', '').replace('-', ' ')}
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={handleNavigateBack}
                iconName="ArrowLeft"
                iconPosition="left"
                size="sm"
              >
                {sourceInfo.backLabel}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => navigate('/home-landing-page')}
                iconName="Home"
                iconPosition="left"
                size="sm"
              >
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorBreadcrumb;