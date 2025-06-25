import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface MatchActionButtonsProps {
  onApprove: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

/**
 * Action buttons for potential match approval/decline
 */
export const MatchActionButtons: React.FC<MatchActionButtonsProps> = ({
  onApprove,
  onDecline,
  isLoading = false
}) => {
  return (
    <div className="flex space-x-2">
      <button
        onClick={onApprove}
        disabled={isLoading}
        className="p-2 text-green-600 dark:text-green-500 hover:text-green-700 dark:hover-text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors duration-200 shadow-sm hover:shadow-md"
        title="Approve Match"
      >
        <CheckCircle className="w-4 h-4" />
      </button>
      
      <button
        onClick={onDecline}
        disabled={isLoading}
        className="p-2 text-red-600 dark:text-red-500 hover:text-red-700 dark:hover-text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200 shadow-sm hover:shadow-md"
        title="Decline Match"
      >
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
};