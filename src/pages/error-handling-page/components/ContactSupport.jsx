import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ContactSupport = ({ errorContext, onSubmit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    description: '',
    includeErrorDetails: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const supportData = {
        ...formData,
        errorContext: formData.includeErrorDetails ? errorContext : null,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onSubmit) {
        onSubmit(supportData);
      }
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        description: '',
        includeErrorDetails: true
      });
      setIsExpanded(false);
      
    } catch (error) {
      console.error('Error submitting support request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const supportOptions = [
    {
      icon: 'Mail',
      title: 'Email Support',
      description: 'Get detailed help via email',
      action: 'Send Email',
      onClick: () => setIsExpanded(true)
    },
    {
      icon: 'MessageCircle',
      title: 'Live Chat',
      description: 'Chat with our support team',
      action: 'Start Chat',
      onClick: () => console.log('Start live chat')
    },
    {
      icon: 'Phone',
      title: 'Phone Support',
      description: 'Speak directly with an expert',
      action: 'Call Now',
      onClick: () => console.log('Initiate phone call')
    },
    {
      icon: 'BookOpen',
      title: 'Help Center',
      description: 'Browse our knowledge base',
      action: 'Visit Help',
      onClick: () => console.log('Open help center')
    }
  ];

  return (
    <div className="bg-surface rounded-lg border border-border shadow-soft">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-heading font-semibold text-text-primary flex items-center space-x-2">
          <Icon name="Headphones" size={20} className="text-primary" />
          <span>Contact Support</span>
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          Our team is here to help you resolve any issues
        </p>
      </div>
      
      {!isExpanded ? (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supportOptions.map((option, index) => (
              <div
                key={index}
                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-celestial cursor-pointer hover-scale"
                onClick={option.onClick}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon name={option.icon} size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-text-primary mb-1">
                      {option.title}
                    </h4>
                    <p className="text-sm text-text-secondary mb-3">
                      {option.description}
                    </p>
                    <Button
                      variant="ghost"
                      size="xs"
                      iconName="ArrowRight"
                      iconPosition="right"
                    >
                      {option.action}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Your Name *
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email Address *
              </label>
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Subject *
            </label>
            <Input
              type="text"
              placeholder="Brief description of your issue"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Describe Your Issue *
            </label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-celestial resize-vertical min-h-[100px]"
              placeholder="Please provide as much detail as possible about the issue you're experiencing..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Input
              type="checkbox"
              checked={formData.includeErrorDetails}
              onChange={(e) => handleInputChange('includeErrorDetails', e.target.checked)}
              className="w-4 h-4"
            />
            <label className="text-sm text-text-secondary">
              Include error details and system information to help us diagnose the issue
            </label>
          </div>
          
          {formData.includeErrorDetails && errorContext && (
            <div className="bg-surface-secondary rounded-md p-3">
              <h5 className="text-sm font-medium text-text-primary mb-2">
                Error Details (will be included):
              </h5>
              <div className="text-xs text-text-muted font-mono">
                <div>Error Type: {errorContext.type}</div>
                <div>Page: {errorContext.page}</div>
                <div>Timestamp: {new Date(errorContext.timestamp).toLocaleString()}</div>
              </div>
            </div>
          )}
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              iconName="Send"
              iconPosition="right"
              disabled={!formData.name || !formData.email || !formData.subject || !formData.description}
            >
              {isSubmitting ? 'Sending...' : 'Send Support Request'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsExpanded(false)}
              iconName="X"
              iconPosition="left"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ContactSupport;