import React from 'react';
import { CardStatus } from '../types';
import { CardTile } from './CardTile';

interface CardsGridProps {
  files: File[];
  cardStatuses: Record<number, CardStatus>;
  results?: any;
  isProcessing: boolean;
  onFileRemove: (index: number) => void;
}

export function CardsGrid({ files, cardStatuses, results, isProcessing, onFileRemove }: CardsGridProps) {
  if (files.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Cards ({files.length})
        </h2>
        {isProcessing && (
          <div className="text-sm text-gray-600">
            {Object.values(cardStatuses).filter(s => s.status === 'completed').length} / {files.length} completed
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {files.map((file, index) => (
          <CardTile
            key={index}
            file={file}
            index={index}
            status={cardStatuses[index]?.status || 'pending'}
            progress={cardStatuses[index]?.progress}
            result={results?.results[index]}
            onRemove={() => onFileRemove(index)}
          />
        ))}
      </div>
    </div>
  );
}
