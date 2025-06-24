import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import { CameraDetails, ValidationErrors, CompatibilityType } from '../types';

interface CameraEditFormProps {
  initialDetails?: CameraDetails;
  onSave: (details: CameraDetails) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Form component for editing camera details
 */
export const CameraEditForm: React.FC<CameraEditFormProps> = ({
  initialDetails,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CameraDetails>({
    modelName: '',
    manufacturer: '',
    minimumFirmware: '',
    notes: '',
    resolutionMp: 0,
    channelCount: 1,
    integrationType: 'ONVIF-S',
    ...initialDetails
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (initialDetails) {
      setFormData({ ...initialDetails });
    }
  }, [initialDetails]);

  /**
   * Validates form data and returns any errors
   */
  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    if (!formData.modelName.trim()) {
      newErrors.modelName = 'Model name is required';
    }

    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    }

    if (!formData.integrationType) {
      newErrors.integrationType = 'Integration type is required';
    }

    if (formData.resolutionMp < 0) {
      newErrors.resolutionMp = 'Resolution must be a positive number';
    }

    if (formData.channelCount < 1) {
      newErrors.channelCount = 'Channel count must be at least 1';
    }

    // Validate firmware version format (basic check)
    if (formData.minimumFirmware && !/^[\d\w\.\-]+$/.test(formData.minimumFirmware)) {
      newErrors.minimumFirmware = 'Invalid firmware version format';
    }

    return newErrors;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSave(formData);
    }
  };

  /**
   * Handles input changes with validation
   */
  const handleInputChange = (field: keyof CameraDetails, value: string | number | CompatibilityType) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Renders form field with error handling
   */
  const renderField = (
    label: string,
    field: keyof CameraDetails,
    type: 'text' | 'number' | 'textarea' | 'select' = 'text',
    placeholder?: string,
    required = false,
    options?: { value: string; label: string }[]
  ) => {
    const hasError = !!errors[field];
    const value = formData[field];

    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {type === 'textarea' ? (
          <textarea
            value={value as string}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            rows={3}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              dark:bg-gray-700 dark:border-gray-600 dark:text-white
              ${hasError 
                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
              }
            `}
            disabled={isLoading}
          />
        ) : type === 'select' ? (
          <select
            value={value as string}
            onChange={(e) => handleInputChange(field, e.target.value as CompatibilityType)}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              dark:bg-gray-700 dark:border-gray-600 dark:text-white
              ${hasError 
                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
              }
            `}
            disabled={isLoading}
          >
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => handleInputChange(
              field, 
              type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
            )}
            placeholder={placeholder}
            min={type === 'number' ? 0 : undefined}
            step={type === 'number' && field === 'resolutionMp' ? 0.1 : 1}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              dark:bg-gray-700 dark:border-gray-600 dark:text-white
              ${hasError 
                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
              }
            `}
            disabled={isLoading}
          />
        )}
        
        {hasError && (
          <div className="flex items-center space-x-1 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{errors[field]}</span>
          </div>
        )}
      </div>
    );
  };

  const integrationTypeOptions = [
    { value: 'ONVIF-S', label: 'ONVIF-S' },
    { value: 'RTSP', label: 'RTSP' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Edit Camera Details
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {renderField('Model Name', 'modelName', 'text', 'e.g., P3707-PE', true)}
          {renderField('Manufacturer', 'manufacturer', 'text', 'e.g., Axis Communications', true)}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {renderField('Integration Type', 'integrationType', 'select', undefined, true, integrationTypeOptions)}
          {renderField('Resolution (MP)', 'resolutionMp', 'number', '2.0')}
          {renderField('Channel Count', 'channelCount', 'number', '1')}
        </div>

        {renderField('Minimum Firmware Version', 'minimumFirmware', 'text', 'e.g., 10.12.0')}
        {renderField('Notes', 'notes', 'textarea', 'Additional compatibility notes or requirements')}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
          >
            <X className="w-4 h-4 inline mr-2" />
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};