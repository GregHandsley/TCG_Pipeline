import React from 'react';
import { ProcessingOptions } from '../../types';

interface ProcessingOptionsProps {
  options: ProcessingOptions;
  isProcessing: boolean;
  onOptionChange: (option: keyof ProcessingOptions) => void;
}

export function ProcessingOptionsComponent({ options, isProcessing, onOptionChange }: ProcessingOptionsProps) {
  const optionLabels = {
    remove_background: 'CROP CARD',
    identify: 'IDENTIFY',
    grade: 'GRADE',
    enhance: 'ENHANCE',
    generate_description: 'LISTING'
  };

  // Description requires identification and grading
  const descriptionRequires = ['identify', 'grade'] as const;
  const isDescriptionEnabled = options.generate_description;
  const canDisableIdentify = !isDescriptionEnabled || !options.generate_description;
  const canDisableGrade = !isDescriptionEnabled || !options.generate_description;

  const handleOptionChange = (key: keyof ProcessingOptions) => {
    // Parent component handles dependencies automatically
    onOptionChange(key);
  };

  const getOptionStyle = (key: keyof ProcessingOptions, value: boolean) => {
    const isRequired = isDescriptionEnabled && descriptionRequires.includes(key as any);
    // Don't disable if it's required - it should always be enabled when Listing is enabled
    const isDisabled = isProcessing;
    
    return {
      display: 'flex' as const,
      alignItems: 'center' as const,
      gap: '6px',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isProcessing ? 0.6 : (isRequired && !value ? 0.4 : 1),
      fontSize: '8px',
      padding: '6px',
      background: value ? 'var(--pokemon-light-green)' : (isRequired ? 'rgba(255, 193, 7, 0.2)' : 'var(--pc-panel-bg)'),
      border: `2px solid ${value ? 'var(--pokemon-green)' : (isRequired ? 'var(--pokemon-yellow)' : 'var(--pc-border)')}`,
      borderRadius: '4px',
      transition: 'all 0.2s ease',
      position: 'relative' as const
    };
  };

  return (
    <div>
      <div style={{ 
        fontSize: '11px', 
        color: '#5D4037',
        marginBottom: '12px',
        textAlign: 'center',
        fontWeight: 'bold',
        padding: '6px',
        background: '#D7CCC8',
        border: '2px solid #8B7355',
        boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.3), inset -1px -1px 0 rgba(0,0,0,0.2)'
      }}>
        RESEARCH OPTIONS
      </div>
      {isDescriptionEnabled && (
        <div style={{
          fontSize: '8px',
          color: 'var(--pokemon-blue)',
          textAlign: 'center',
          marginBottom: '10px',
          padding: '8px',
          background: 'rgba(74, 144, 226, 0.08)',
          borderRadius: '4px',
          border: '1px solid rgba(74, 144, 226, 0.2)',
          lineHeight: '1.4'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Note:</div>
          Enabling Listing automatically enables Identify & Grade
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
        {Object.entries(options).map(([key, value]) => {
          const optionKey = key as keyof ProcessingOptions;
          const isRequired = isDescriptionEnabled && descriptionRequires.includes(optionKey as any);
          const isDisabled = isProcessing || (isRequired && !value);
          
          return (
            <label key={key} style={getOptionStyle(optionKey, value)}>
              <input
                type="checkbox"
                checked={value}
                onChange={() => handleOptionChange(optionKey)}
                disabled={isDisabled}
                style={{ 
                  width: '12px', 
                  height: '12px',
                  accentColor: 'var(--pokemon-green)'
                }}
              />
              <span style={{ 
                color: value ? 'var(--pokemon-dark-green)' : 'var(--pc-text)',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {optionLabels[optionKey]}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
