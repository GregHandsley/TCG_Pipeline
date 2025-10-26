import React from 'react';
import { CardStatus } from '../types';

interface CardStatusIndicatorProps {
  status: string;
  progress?: number;
}

export function CardStatusIndicator({ status, progress }: CardStatusIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending': return 'border-gray-300 bg-gray-50';
      case 'processing': return 'border-blue-300 bg-blue-50';
      case 'completed': return 'border-green-300 bg-green-50';
      case 'error': return 'border-red-300 bg-red-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className={`absolute top-2 right-2 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${getStatusColor()}`}>
      {status === 'processing' && progress ? (
        <div className="relative w-6 h-6">
          <div className="absolute inset-0 rounded-full border-2 border-blue-200"></div>
          <div 
            className="absolute inset-0 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"
            style={{ transform: `rotate(${progress * 3.6}deg)` }}
          ></div>
        </div>
      ) : (
        getStatusIcon()
      )}
    </div>
  );
}
