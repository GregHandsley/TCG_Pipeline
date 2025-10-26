import React from 'react';
import { BatchResults } from '../types';

interface ProcessingResultsProps {
  results: BatchResults;
}

export function ProcessingResults({ results }: ProcessingResultsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Processing Results</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.results.map((result, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              Card {index + 1}: {result.results.identification?.best?.name || 'Unknown'}
            </h3>
            
            {/* Orientation Corrected Image */}
            {result.results.orientation_corrected && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">🔄 Orientation Corrected</h4>
                <img 
                  src={`data:image/png;base64,${result.results.orientation_corrected}`} 
                  alt="Orientation corrected" 
                  className="w-full h-32 object-cover rounded border border-blue-300"
                />
              </div>
            )}

            {/* Background Removed Image */}
            {result.results.background_removed && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-800 mb-2">✂️ Background Removed</h4>
                <img 
                  src={`data:image/png;base64,${result.results.background_removed}`} 
                  alt="Background removed" 
                  className="w-full h-32 object-cover rounded border border-gray-300"
                />
              </div>
            )}

            {/* Identification */}
            {result.results.identification && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-800 mb-1">🔍 Identification</h4>
                <div className="text-sm text-gray-600">
                  <div>Name: {result.results.identification.best?.name}</div>
                  <div>Set: {result.results.identification.best?.set}</div>
                  <div>Confidence: {Math.round((result.results.identification.confidence || 0) * 100)}%</div>
                </div>
              </div>
            )}

            {/* Grade */}
            {result.results.grade?.records?.[0]?.grades && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-800 mb-1">📊 Grade</h4>
                <div className="text-sm text-gray-600">
                  <div>Overall: {result.results.grade.records[0].grades.final}/10</div>
                  <div>Condition: {result.results.grade.records[0].grades.condition}</div>
                </div>
              </div>
            )}

            {/* eBay Listing */}
            {result.results.listing_description && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-800 mb-1">📝 eBay Listing</h4>
                <div className="text-sm text-gray-600">
                  <div className="font-medium">{result.results.listing_description.title}</div>
                  <div className="mt-1 text-xs">{result.results.listing_description.description?.substring(0, 100)}...</div>
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="text-sm text-red-600">
                <div className="font-medium">Errors:</div>
                {result.errors.map((error, i) => (
                  <div key={i}>• {error}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
