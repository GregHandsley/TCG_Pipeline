import React from 'react';

interface PokemonEmptyStateProps {
  onUpload?: () => void;
  title?: string;
  message?: string;
}

export function PokemonEmptyState({ 
  onUpload, 
  title = "No Pokémon Cards Found",
  message = "Upload some cards to start Professor Oak's research!"
}: PokemonEmptyStateProps) {
  return (
    <div className="pc-panel" style={{ 
      textAlign: 'center', 
      padding: '32px',
      background: 'var(--pc-panel-bg)',
      border: '3px solid var(--pokemon-gray)',
      borderRadius: '8px'
    }}>
      {/* Empty State Icon */}
      <div style={{ 
        fontSize: '48px', 
        marginBottom: '16px',
        color: 'var(--pokemon-gray)'
      }}>
        📭
      </div>

      {/* Professor Oak Quote */}
      <div style={{ 
        fontSize: '10px', 
        color: 'var(--pokemon-dark-blue)', 
        marginBottom: '12px',
        fontStyle: 'italic'
      }}>
        "I'm ready to analyze your Pokémon cards!"
      </div>

      {/* Empty State Title */}
      <div style={{ 
        fontSize: '12px', 
        color: 'var(--pokemon-dark-gray)', 
        marginBottom: '8px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }}>
        {title}
      </div>

      {/* Empty State Message */}
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

      {/* Upload Button */}
      {onUpload && (
        <button
          onClick={onUpload}
          className="pc-button primary"
          style={{ 
            fontSize: '9px',
            padding: '8px 16px'
          }}
        >
          📁 SELECT POKÉMON CARDS
        </button>
      )}

      {/* Instructions */}
      <div style={{ 
        fontSize: '8px', 
        color: 'var(--pokemon-dark-green)', 
        marginTop: '12px',
        lineHeight: '1.3'
      }}>
        <div>• Upload an even number of images</div>
        <div>• Order: Front, Back, Front, Back...</div>
        <div>• Professor Oak will analyze each pair</div>
      </div>

      {/* Professor Oak Encouragement */}
      <div style={{ 
        fontSize: '8px', 
        color: 'var(--pokemon-dark-blue)', 
        marginTop: '12px',
        fontStyle: 'italic'
      }}>
        "Let's discover what Pokémon cards you have!"
      </div>
    </div>
  );
}
