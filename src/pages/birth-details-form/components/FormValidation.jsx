import React from 'react';
import Icon from '../../../components/AppIcon';

const FormValidation = ({ errors, isValid, formData }) => {
  const validationRules = [
    {
      field: 'fullName',
      label: 'Full Name',
      isValid: formData.fullName && formData.fullName.trim().length >= 2,
      message: 'Name must be at least 2 characters long'
    },
    {
      field: 'gender',
      label: 'Gender',
      isValid: formData.gender && ['male', 'female'].includes(formData.gender),
      message: 'Please select your gender'
    },
    {
      field: 'birthDate',
      label: 'Birth Date',
      isValid: formData.birthDate && new Date(formData.birthDate) <= new Date(),
      message: 'Please enter a valid birth date'
    },
    {
      field: 'birthTime',
      label: 'Birth Time',
      isValid: formData.birthTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.birthTime),
      message: 'Please enter time in HH:MM format'
    },
    {
      field: 'birthLocation',
      label: 'Birth Location',
      isValid: formData.birthLocation && formData.birthLocation.trim().length >= 3,
      message: 'Please enter your birth location'
    }
  ];

  const completedFields = validationRules.filter(rule => rule.isValid).length;
  const totalFields = validationRules.length;
  const progressPercentage = (completedFields / totalFields) * 100;

  if (Object.keys(errors).length === 0 && completedFields === 0) {
    return null;
  }

  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-soft">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
          <Icon name="CheckSquare" size={20} className="text-info" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-semibold text-text-primary">
            Form Validation
          </h3>
          <p className="text-sm text-text-secondary font-caption">
            {completedFields}/{totalFields} fields completed
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-text-primary">Progress</span>
          <span className="text-sm text-text-secondary font-caption">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-border rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Validation Checklist */}
      <div className="space-y-3">
        {validationRules.map((rule) => (
          <div key={rule.field} className="flex items-center space-x-3">
            <div className={`
              w-5 h-5 rounded-full flex items-center justify-center transition-celestial
              ${rule.isValid 
                ? 'bg-success text-success-foreground' 
                : errors[rule.field] 
                ? 'bg-error text-error-foreground' 
                : 'bg-border text-text-muted'
              }
            `}>
              {rule.isValid ? (
                <Icon name="Check" size={12} />
              ) : errors[rule.field] ? (
                <Icon name="X" size={12} />
              ) : (
                <Icon name="Circle" size={8} />
              )}
            </div>
            <div className="flex-1">
              <span className={`
                text-sm font-medium transition-celestial
                ${rule.isValid 
                  ? 'text-success' 
                  : errors[rule.field] 
                  ? 'text-error' :'text-text-muted'
                }
              `}>
                {rule.label}
              </span>
              {errors[rule.field] && (
                <p className="text-xs text-error font-caption mt-1">
                  {errors[rule.field]}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Overall Status */}
      <div className={`
        mt-6 p-4 rounded-lg border transition-celestial
        ${isValid 
          ? 'bg-success/5 border-success/20' :'bg-warning/5 border-warning/20'
        }
      `}>
        <div className="flex items-center space-x-3">
          <Icon 
            name={isValid ? "CheckCircle" : "AlertTriangle"} 
            size={16} 
            className={isValid ? "text-success" : "text-warning"} 
          />
          <div>
            <p className={`
              text-sm font-medium 
              ${isValid ? 'text-success' : 'text-warning'}
            `}>
              {isValid 
                ? 'Form is ready for submission!' 
                : 'Please complete all required fields'
              }
            </p>
            <p className="text-xs text-text-muted font-caption mt-1">
              {isValid 
                ? 'All information has been validated and is ready for chart generation.' 
                : 'Fill in the missing information to proceed with chart generation.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormValidation;