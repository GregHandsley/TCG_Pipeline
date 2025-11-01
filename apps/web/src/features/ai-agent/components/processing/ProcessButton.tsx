import React from 'react';

interface ProcessButtonProps {
  cardPairs: Array<{ front?: File; back?: File }>;
  isProcessing: boolean;
  onStartProcessing: () => void;
  onStopProcessing: () => void;
}

export function ProcessButton({ cardPairs, isProcessing, onStartProcessing, onStopProcessing }: ProcessButtonProps) {
  // Count pairs that have both front and back
  const validPairsCount = cardPairs.filter(p => p.front && p.back).length;
  
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={onStartProcessing}
          disabled={validPairsCount === 0 || isProcessing}
          className="pc-button primary"
          style={{ 
            fontSize: '10px',
            padding: '12px 24px',
            minWidth: '160px'
          }}
        >
          {isProcessing ? `🔬 ANALYZING ${validPairsCount} CARD${validPairsCount !== 1 ? 'S' : ''}...` : `🚀 START RESEARCH (${validPairsCount} CARD${validPairsCount !== 1 ? 'S' : ''})`}
        </button>
        
        {isProcessing && (
          <button
            onClick={onStopProcessing}
            className="pc-button danger"
            style={{ 
              fontSize: '10px',
              padding: '12px 24px',
              minWidth: '120px'
            }}
          >
            ⏹️ STOP RESEARCH
          </button>
        )}
      </div>
    </div>
  );
}
