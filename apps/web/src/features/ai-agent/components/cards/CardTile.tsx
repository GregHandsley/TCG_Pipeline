import React, { useState, useEffect } from 'react';
import { ProcessingResult } from '../types';
import { CardStatusIndicator } from './CardStatusIndicator';

interface CardTileProps {
  file: File;
  index: number;
  status: string;
  progress?: number;
  result?: ProcessingResult;
  onRemove: () => void;
}

export function CardTile({ file, index, status, progress, result, onRemove }: CardTileProps) {
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  const getCardImage = () => {
    if (result?.results.orientation_corrected) {
      return `data:image/png;base64,${result.results.orientation_corrected}`;
    }
    if (result?.results.background_removed) {
      return `data:image/png;base64,${result.results.background_removed}`;
    }
    return imagePreview;
  };

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <CardStatusIndicator status={status} progress={progress} />
      
      <div className="aspect-[3/4] bg-gray-100">
        <img 
          src={getCardImage()} 
          alt={`Card ${index + 1}`}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-800 truncate">
            {result?.results.identification?.best?.name || `Card ${index + 1}`}
          </h3>
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500 text-sm"
            disabled={status === 'processing'}
          >
            ✕
          </button>
        </div>
        
        {result?.results.identification && (
          <div className="space-y-1 text-xs text-gray-600">
            <div>Confidence: {Math.round((result.results.identification.confidence || 0) * 100)}%</div>
            {result.results.grade?.records?.[0]?.grades && (
              <div>Grade: {result.results.grade.records[0].grades.final}/10</div>
            )}
          </div>
        )}
        
        {status === 'error' && result?.errors && (
          <div className="text-xs text-red-600 mt-1">
            {result.errors[0]}
          </div>
        )}
      </div>
    </div>
  );
}
