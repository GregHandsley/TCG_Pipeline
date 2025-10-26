import React from 'react';

interface ProcessButtonProps {
  files: File[];
  isProcessing: boolean;
  onStartProcessing: () => void;
  onStopProcessing: () => void;
}

export function ProcessButton({ files, isProcessing, onStartProcessing, onStopProcessing }: ProcessButtonProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={onStartProcessing}
          disabled={files.length === 0 || isProcessing}
          className="pc-button primary"
          style={{ 
            fontSize: '10px',
            padding: '12px 24px',
            minWidth: '160px'
          }}
        >
          {isProcessing ? `🔬 ANALYZING ${files.length} CARDS...` : `🚀 START RESEARCH (${files.length} CARD${files.length !== 1 ? 'S' : ''})`}
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
