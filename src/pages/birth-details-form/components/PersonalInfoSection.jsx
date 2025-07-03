import React from 'react';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const PersonalInfoSection = ({ formData, errors, onChange }) => {
  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-soft">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon name="User" size={20} className="text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-semibold text-text-primary">
            Personal Information
          </h3>
          <p className="text-sm text-text-secondary font-caption">
            Enter your basic details for chart generation
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-text-primary mb-2">
            Full Name <span className="text-error">*</span>
          </label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={onChange}
            required
            className={`${errors.fullName ? 'border-error focus:border-error' : ''}`}
          />
          {errors.fullName && (
            <div className="flex items-center space-x-2 mt-2">
              <Icon name="AlertCircle" size={14} className="text-error" />
              <span className="text-sm text-error font-caption">{errors.fullName}</span>
            </div>
          )}
          <p className="text-xs text-text-muted mt-1 font-caption">
            This will appear on your generated kundli report
          </p>
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-text-primary mb-2">
            Gender <span className="text-error">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['Male', 'Female'].map((gender) => (
              <label
                key={gender}
                className={`
                  flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-celestial
                  ${formData.gender === gender.toLowerCase()
                    ? 'border-primary bg-primary/5 text-primary' :'border-border hover:border-primary/50 text-text-secondary'
                  }
                `}
              >
                <input
                  type="radio"
                  name="gender"
                  value={gender.toLowerCase()}
                  checked={formData.gender === gender.toLowerCase()}
                  onChange={onChange}
                  className="sr-only"
                />
                <Icon 
                  name={gender === 'Male' ? 'User' : 'UserCheck'} 
                  size={16} 
                  className="mr-2" 
                />
                <span className="font-medium">{gender}</span>
              </label>
            ))}
          </div>
          {errors.gender && (
            <div className="flex items-center space-x-2 mt-2">
              <Icon name="AlertCircle" size={14} className="text-error" />
              <span className="text-sm text-error font-caption">{errors.gender}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoSection;