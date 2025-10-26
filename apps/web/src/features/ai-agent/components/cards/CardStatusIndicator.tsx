import React from 'react';
import { CardStatus } from '../types';

interface CardStatusIndicatorProps {
  status: string;
  progress?: number;
}

export function CardStatusIndicator({ status, progress }: CardStatusIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  const getStatusStyle = () => {
    switch (status) {
      case 'pending': 
        return { 
          background: 'var(--pokemon-gray)', 
          borderColor: 'var(--pokemon-dark-gray)',
          color: 'var(--pokemon-white)'
        };
      case 'processing': 
        return { 
          background: 'var(--pokemon-blue)', 
          borderColor: 'var(--pokemon-dark-blue)',
          color: 'var(--pokemon-white)'
        };
      case 'completed': 
        return { 
          background: 'var(--pokemon-green)', 
          borderColor: 'var(--pokemon-dark-green)',
          color: 'var(--pokemon-white)'
        };
      case 'error': 
        return { 
          background: 'var(--pokemon-red)', 
          borderColor: 'var(--pokemon-dark-red)',
          color: 'var(--pokemon-white)'
        };
      default: 
        return { 
          background: 'var(--pokemon-gray)', 
          borderColor: 'var(--pokemon-dark-gray)',
          color: 'var(--pokemon-white)'
        };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <div 
      className="pokemon-status"
      style={{
        ...statusStyle,
        position: 'absolute',
        top: '4px',
        right: '4px',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        border: `1px solid ${statusStyle.borderColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '8px',
        fontWeight: 'bold',
        boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.3), inset -1px -1px 0 rgba(0,0,0,0.3)'
      }}
    >
      {status === 'processing' && progress ? (
        <div style={{ 
          position: 'relative', 
          width: '12px', 
          height: '12px',
          animation: 'pokemon-spin 1s linear infinite'
        }}>
          <div style={{ 
            position: 'absolute', 
            inset: '0', 
            borderRadius: '50%', 
            border: '1px solid rgba(255,255,255,0.3)' 
          }}></div>
          <div style={{ 
            position: 'absolute', 
            inset: '0', 
            borderRadius: '50%', 
            border: '1px solid var(--pokemon-white)', 
            borderTopColor: 'transparent',
            transform: `rotate(${progress * 3.6}deg)`
          }}></div>
        </div>
      ) : (
        getStatusIcon()
      )}
    </div>
  );
}
