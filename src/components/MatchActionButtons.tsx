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
        className="p-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 shadow-sm hover:shadow-md"
        title="Approve Match"
      >
        <CheckCircle className="w-4 h-4" />
      </button>
      
      <button
        onClick={onDecline}
        disabled={isLoading}
        className="p-2 bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 shadow-sm hover:shadow-md"
        title="Decline Match"
      >
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
};