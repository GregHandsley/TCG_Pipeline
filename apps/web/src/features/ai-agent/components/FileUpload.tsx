import React, { useRef } from 'react';
import { CardPair } from '../types';
import { CardStatusIndicator } from './CardStatusIndicator';

interface FileUploadProps {
  files: File[];
  cardPairs: CardPair[];
  cardStatuses: Record<number, { status: string; progress?: number }>;
  isProcessing: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onClearAll: () => void;
}

export function FileUpload({
  files,
  cardPairs,
  cardStatuses,
  isProcessing,
  onFileSelect,
  onDrop,
  onDragOver,
  onDragEnter,
  onClearAll
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* Drag & Drop Upload Zone */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Cards</h2>
        
        <div
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            cardPairs.length > 0 
              ? 'border-gray-300 bg-gray-50' 
              : 'border-blue-300 bg-blue-50 hover:bg-blue-100'
          }`}
        >
          <div className="space-y-4">
            <div className="text-4xl">📸</div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                {files.length > 0 ? `${files.length} card${files.length !== 1 ? 's' : ''} ready` : 'Drop your card images here'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to browse files
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Browse Files
              </button>
              
              {cardPairs.length > 0 && (
                <button
                  onClick={onClearAll}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={onFileSelect}
          className="hidden"
          disabled={isProcessing}
        />
      </div>

      {/* Card Pairs Status */}
      {cardPairs.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-green-800 mb-2">🃏 Card Pairs Ready ({cardPairs.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cardPairs.map((pair, index) => (
              <div key={pair.id} className="bg-white rounded-lg p-3 border border-green-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-green-700">{pair.name}</span>
                  <CardStatusIndicator 
                    status={cardStatuses[index]?.status || 'pending'}
                    progress={cardStatuses[index]?.progress}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <div className="text-xs text-blue-600 mb-1">Front</div>
                    <div className="aspect-square bg-gray-100 rounded overflow-hidden">
                      <img
                        src={URL.createObjectURL(pair.front!)}
                        alt="Front"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-green-600 mb-1">Back</div>
                    <div className="aspect-square bg-gray-100 rounded overflow-hidden">
                      <img
                        src={URL.createObjectURL(pair.back!)}
                        alt="Back"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Upload Instructions */}
      {files.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-blue-800 mb-2">📋 Upload Instructions</h3>
          <p className="text-blue-700">
            Upload an <strong>even number</strong> of images in this order: <strong>Front, Back, Front, Back...</strong>
          </p>
          <p className="text-blue-600 text-sm mt-2">
            The system will automatically pair them together for processing.
          </p>
        </div>
      )}
      
      {files.length > 0 && files.length % 2 !== 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">⚠️ Incomplete Pair</h3>
          <p className="text-yellow-700">
            You have {files.length} image(s). Please upload an even number of images to create complete pairs.
          </p>
        </div>
      )}
    </>
  );
}
