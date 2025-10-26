import React from 'react';

interface PokemonErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
  errorType?: 'error' | 'warning' | 'empty' | 'loading';
}

export function PokemonErrorState({ 
  title, 
  message, 
  onRetry, 
  showRetry = true, 
  errorType = 'error' 
}: PokemonErrorStateProps) {
  const getErrorIcon = () => {
    switch (errorType) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'empty': return '📭';
      case 'loading': return '⏳';
      default: return '❌';
    }
  };

  const getErrorColor = () => {
    switch (errorType) {
      case 'error': return 'var(--pokemon-red)';
      case 'warning': return 'var(--pokemon-yellow)';
      case 'empty': return 'var(--pokemon-gray)';
      case 'loading': return 'var(--pokemon-blue)';
      default: return 'var(--pokemon-red)';
    }
  };

  const errorColor = getErrorColor();

  return (
    <div className="pc-panel" style={{ 
      textAlign: 'center', 
      padding: '32px',
      background: 'var(--pc-panel-bg)',
      border: `3px solid ${errorColor}`,
      borderRadius: '8px'
    }}>
      {/* Error Icon */}
      <div style={{ 
        fontSize: '48px', 
        marginBottom: '16px',
        color: errorColor
      }}>
        {getErrorIcon()}
      </div>

      {/* Professor Oak Quote */}
      <div style={{ 
        fontSize: '10px', 
        color: 'var(--pokemon-dark-blue)', 
        marginBottom: '12px',
        fontStyle: 'italic'
      }}>
        "Oh my! It seems we've encountered a problem..."
      </div>

      {/* Error Title */}
      <div style={{ 
        fontSize: '12px', 
        color: errorColor, 
        marginBottom: '8px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }}>
        {title}
      </div>

      {/* Error Message */}
      <div style={{ 
        fontSize: '9px', 
        color: 'var(--pc-text)', 
        marginBottom: '16px',
        lineHeight: '1.4',
        maxWidth: '300px',
        margin: '0 auto 16px'
      }}>
        {message}
      </div>

      {/* Retry Button */}
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="pc-button"
          style={{ 
            fontSize: '9px',
            padding: '8px 16px',
            background: errorColor,
            borderColor: errorColor === 'var(--pokemon-red)' ? 'var(--pokemon-dark-red)' : 
                        errorColor === 'var(--pokemon-yellow)' ? 'var(--pokemon-dark-yellow)' :
                        errorColor === 'var(--pokemon-blue)' ? 'var(--pokemon-dark-blue)' : 'var(--pokemon-dark-gray)'
          }}
        >
          🔄 TRY AGAIN
        </button>
      )}

      {/* Professor Oak Advice */}
      <div style={{ 
        fontSize: '8px', 
        color: 'var(--pokemon-dark-green)', 
        marginTop: '12px',
        fontStyle: 'italic'
      }}>
        Professor Oak suggests checking your connection and trying again!
      </div>
    </div>
  );
}
