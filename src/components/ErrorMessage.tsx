import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onClose: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClose }) => {
  return (
    <div className="fixed top-4 right-4 max-w-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg z-50 animate-slide-in-from-right">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
        <div className="flex-grow">
          <h4 className="text-red-800 dark:text-red-200 font-medium">Error</h4>
          <p className="text-red-700 dark:text-red-300 text-sm mt-1">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300 transition-colors duration-200"
          aria-label="Close error message"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};