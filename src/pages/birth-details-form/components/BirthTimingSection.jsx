import React from 'react';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const BirthTimingSection = ({ formData, errors, onChange }) => {
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    onChange({
      target: {
        name: 'birthDate',
        value: dateValue
      }
    });
  };

  const handleTimeChange = (e) => {
    const timeValue = e.target.value;
    onChange({
      target: {
        name: 'birthTime',
        value: timeValue
      }
    });
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-soft">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
          <Icon name="Clock" size={20} className="text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-semibold text-text-primary">
            Birth Timing
          </h3>
          <p className="text-sm text-text-secondary font-caption">
            Precise timing is crucial for accurate chart calculations
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-text-primary mb-2">
            Date of Birth <span className="text-error">*</span>
          </label>
          <div className="relative">
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              value={formatDateForInput(formData.birthDate)}
              onChange={handleDateChange}
              required
              max={new Date().toISOString().split('T')[0]}
              className={`${errors.birthDate ? 'border-error focus:border-error' : ''}`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Icon name="Calendar" size={16} className="text-text-muted" />
            </div>
          </div>
          {errors.birthDate && (
            <div className="flex items-center space-x-2 mt-2">
              <Icon name="AlertCircle" size={14} className="text-error" />
              <span className="text-sm text-error font-caption">{errors.birthDate}</span>
            </div>
          )}
          <p className="text-xs text-text-muted mt-1 font-caption">
            Format: DD/MM/YYYY (as per Indian standard)
          </p>
        </div>

        <div>
          <label htmlFor="birthTime" className="block text-sm font-medium text-text-primary mb-2">
            Time of Birth <span className="text-error">*</span>
          </label>
          <div className="relative">
            <Input
              id="birthTime"
              name="birthTime"
              type="time"
              value={formData.birthTime}
              onChange={handleTimeChange}
              required
              className={`${errors.birthTime ? 'border-error focus:border-error' : ''}`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Icon name="Clock" size={16} className="text-text-muted" />
            </div>
          </div>
          {errors.birthTime && (
            <div className="flex items-center space-x-2 mt-2">
              <Icon name="AlertCircle" size={14} className="text-error" />
              <span className="text-sm text-error font-caption">{errors.birthTime}</span>
            </div>
          )}
          <p className="text-xs text-text-muted mt-1 font-caption">
            Use 24-hour format (HH:MM). If unknown, use approximate time
          </p>
        </div>

        <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Icon name="Info" size={16} className="text-warning mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-warning mb-1">
                Timing Accuracy Tips
              </h4>
              <ul className="text-xs text-text-secondary space-y-1 font-caption">
                <li>• Check your birth certificate for exact time</li>
                <li>• Hospital records are most accurate</li>
                <li>• Even approximate time can provide valuable insights</li>
                <li>• Time zone will be auto-detected from location</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BirthTimingSection;