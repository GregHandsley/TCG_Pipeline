import React from 'react';
import { ProcessingOptions } from '../types';

interface ProcessingOptionsProps {
  options: ProcessingOptions;
  isProcessing: boolean;
  onOptionChange: (option: keyof ProcessingOptions) => void;
}

export function ProcessingOptionsComponent({ options, isProcessing, onOptionChange }: ProcessingOptionsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Processing Options</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(options).map(([key, value]) => (
          <label key={key} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={() => onOptionChange(key as keyof ProcessingOptions)}
              disabled={isProcessing}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 capitalize">
              {key.replace('_', ' ')}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
