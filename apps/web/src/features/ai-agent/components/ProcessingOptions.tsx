import React from 'react';
import { ProcessingOptions } from '../types';

interface ProcessingOptionsProps {
  options: ProcessingOptions;
  isProcessing: boolean;
  onOptionChange: (option: keyof ProcessingOptions) => void;
}

export function ProcessingOptionsComponent({ options, isProcessing, onOptionChange }: ProcessingOptionsProps) {
  const optionLabels = {
    remove_background: '✂️ CROP CARD',
    identify: '🔍 IDENTIFY',
    grade: '📊 GRADE',
    enhance: '✨ ENHANCE',
    generate_description: '📝 LISTING'
  };

  return (
    <div>
      <div style={{ 
        fontSize: '12px', 
        color: 'var(--pokemon-dark-blue)', 
        marginBottom: '12px',
        textAlign: 'center',
        fontWeight: 'bold'
      }}>
        🔬 RESEARCH OPTIONS
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
        {Object.entries(options).map(([key, value]) => (
          <label key={key} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.6 : 1,
            fontSize: '8px',
            padding: '6px',
            background: value ? 'var(--pokemon-light-green)' : 'var(--pc-panel-bg)',
            border: `2px solid ${value ? 'var(--pokemon-green)' : 'var(--pc-border)'}`,
            borderRadius: '4px',
            transition: 'all 0.2s ease'
          }}>
            <input
              type="checkbox"
              checked={value}
              onChange={() => onOptionChange(key as keyof ProcessingOptions)}
              disabled={isProcessing}
              style={{ 
                width: '12px', 
                height: '12px',
                accentColor: 'var(--pokemon-green)'
              }}
            />
            <span style={{ 
              color: value ? 'var(--pokemon-dark-green)' : 'var(--pc-text)',
              fontWeight: 'bold'
            }}>
              {optionLabels[key as keyof ProcessingOptions]}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
