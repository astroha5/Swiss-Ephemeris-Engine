import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const UploadInstructions = () => {
  const instructions = [
    {
      icon: 'Camera',
      title: 'Clear Image Quality',
      description: 'Ensure your kundli is well-lit and all text is clearly visible',
      tip: 'Use natural lighting and avoid shadows'
    },
    {
      icon: 'Square',
      title: 'Complete Chart Visible',
      description: 'Make sure the entire chart fits within the frame',
      tip: 'Include all 12 houses and planetary positions'
    },
    {
      icon: 'Compass',
      title: 'North Indian Style',
      description: 'Our AI works best with North Indian style kundlis',
      tip: 'Diamond-shaped charts with houses arranged clockwise'
    },
    {
      icon: 'FileText',
      title: 'Multiple Formats',
      description: 'Upload images (JPG, PNG) or PDF documents',
      tip: 'Maximum file size: 10MB'
    }
  ];

  const chartStyles = [
    {
      name: 'North Indian',
      description: 'Diamond-shaped, houses arranged clockwise',
      supported: true,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop'
    },
    {
      name: 'South Indian',
      description: 'Square format with fixed house positions',
      supported: false,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Instructions */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Icon name="BookOpen" size={24} className="text-primary" />
          <h3 className="text-lg font-heading font-semibold text-text-primary">
            Upload Guidelines
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {instructions.map((instruction, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-surface-secondary rounded-lg">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon name={instruction.icon} size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-text-primary mb-1">
                  {instruction.title}
                </h4>
                <p className="text-xs text-text-secondary mb-1">
                  {instruction.description}
                </p>
                <p className="text-xs text-text-muted font-caption">
                  {instruction.tip}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supported Chart Styles */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Icon name="Layout" size={24} className="text-primary" />
          <h3 className="text-lg font-heading font-semibold text-text-primary">
            Supported Chart Styles
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {chartStyles.map((style, index) => (
            <div 
              key={index} 
              className={`
                p-4 rounded-lg border-2 transition-celestial
                ${style.supported 
                  ? 'border-success/20 bg-success/5' :'border-border bg-surface-secondary opacity-60'
                }
              `}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-border-light">
                  <Image
                    src={style.image}
                    alt={`${style.name} chart style`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-text-primary">
                      {style.name}
                    </h4>
                    {style.supported ? (
                      <Icon name="CheckCircle" size={16} className="text-success" />
                    ) : (
                      <Icon name="Clock" size={16} className="text-text-muted" />
                    )}
                  </div>
                  <p className="text-xs text-text-secondary">
                    {style.description}
                  </p>
                </div>
              </div>
              
              <div className={`
                text-xs font-medium
                ${style.supported ? 'text-success' : 'text-text-muted'}
              `}>
                {style.supported ? 'Fully Supported' : 'Coming Soon'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Common Issues */}
      <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Icon name="AlertTriangle" size={20} className="text-warning mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-text-primary mb-2">
              Common Upload Issues
            </h4>
            <ul className="text-xs text-text-secondary space-y-1 font-caption">
              <li>• Blurry or low-resolution images</li>
              <li>• Partial chart visibility or cropped edges</li>
              <li>• Poor lighting causing shadows or glare</li>
              <li>• Handwritten charts with unclear text</li>
              <li>• Non-standard chart formats or layouts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadInstructions;