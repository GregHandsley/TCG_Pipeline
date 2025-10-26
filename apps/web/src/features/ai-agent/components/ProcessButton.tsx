import React from 'react';

interface ProcessButtonProps {
  files: File[];
  isProcessing: boolean;
  onStartProcessing: () => void;
  onStopProcessing: () => void;
}

export function ProcessButton({ files, isProcessing, onStartProcessing, onStopProcessing }: ProcessButtonProps) {
  return (
    <div className="text-center">
      <div className="flex gap-3 justify-center">
        <button
          onClick={onStartProcessing}
          disabled={files.length === 0 || isProcessing}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? `Processing ${files.length} Cards...` : `Process ${files.length} Card${files.length !== 1 ? 's' : ''}`}
        </button>
        
        {isProcessing && (
          <button
            onClick={onStopProcessing}
            className="px-8 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
          >
            Stop Processing
          </button>
        )}
      </div>
    </div>
  );
}
