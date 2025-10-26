import React from 'react';

interface PokemonLoadingStateProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export function PokemonLoadingState({ 
  message = "Professor Oak is analyzing your cards...", 
  showProgress = false,
  progress = 0 
}: PokemonLoadingStateProps) {
  return (
    <div className="pc-panel" style={{ 
      textAlign: 'center', 
      padding: '32px',
      background: 'var(--pc-panel-bg)',
      border: '3px solid var(--pokemon-blue)',
      borderRadius: '8px'
    }}>
      {/* Professor Oak Avatar */}
      <div style={{ 
        fontSize: '48px', 
        marginBottom: '16px'
      }}>
        👨‍🔬
      </div>

      {/* Loading Animation */}
      <div style={{ 
        marginBottom: '16px',
        position: 'relative',
        width: '60px',
        height: '60px',
        margin: '0 auto 16px'
      }}>
        <div style={{
          position: 'absolute',
          inset: '0',
          borderRadius: '50%',
          border: '4px solid var(--pokemon-light-blue)',
          borderTopColor: 'var(--pokemon-blue)',
          animation: 'pokemon-spin 1s linear infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          inset: '8px',
          borderRadius: '50%',
          border: '2px solid var(--pokemon-light-green)',
          borderTopColor: 'var(--pokemon-green)',
          animation: 'pokemon-spin 1.5s linear infinite reverse'
        }}></div>
      </div>

      {/* Loading Message */}
      <div style={{ 
        fontSize: '10px', 
        color: 'var(--pokemon-dark-blue)', 
        marginBottom: '8px',
        fontWeight: 'bold'
      }}>
        {message}
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div style={{ 
          width: '200px', 
          height: '8px', 
          background: 'var(--pc-border)', 
          borderRadius: '4px',
          margin: '0 auto 12px',
          overflow: 'hidden',
          border: '1px solid var(--pc-border)'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--pokemon-blue), var(--pokemon-green))',
            borderRadius: '3px',
            transition: 'width 0.3s ease',
            boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.3)'
          }}></div>
        </div>
      )}

      {/* Professor Oak Quote */}
      <div style={{ 
        fontSize: '8px', 
        color: 'var(--pokemon-dark-green)', 
        fontStyle: 'italic',
        marginTop: '12px'
      }}>
        "Please be patient while I examine your Pokémon cards..."
      </div>

      {/* Loading Dots Animation */}
      <div style={{ 
        fontSize: '16px', 
        color: 'var(--pokemon-blue)', 
        marginTop: '8px',
        animation: 'pokemon-pulse 1.5s ease-in-out infinite'
      }}>
        ⋯
      </div>
    </div>
  );
}
