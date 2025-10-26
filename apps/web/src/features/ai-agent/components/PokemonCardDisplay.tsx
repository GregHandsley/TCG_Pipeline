import React from 'react';
import { CardPair, CardStatus, ProcessingResult } from '../types';
import { CardStatusIndicator } from './CardStatusIndicator';

interface PokemonCardDisplayProps {
  cardPairs: CardPair[];
  cardStatuses: Record<number, CardStatus>;
  results: ProcessingResult[] | null;
  isProcessing: boolean;
  onCardClick?: (pairIndex: number) => void;
}

export function PokemonCardDisplay({ 
  cardPairs, 
  cardStatuses, 
  results, 
  isProcessing,
  onCardClick 
}: PokemonCardDisplayProps) {
  if (cardPairs.length === 0) {
    return (
      <div className="pc-panel" style={{ textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--pokemon-gray)' }}>
          📭
        </div>
        <div style={{ fontSize: '12px', color: 'var(--pokemon-dark-gray)', marginBottom: '8px' }}>
          NO POKÉMON CARDS IN LAB
        </div>
        <div style={{ fontSize: '9px', color: 'var(--pc-text)' }}>
          Professor Oak is waiting for cards to analyze...
        </div>
      </div>
    );
  }

  return (
    <div className="pc-panel">
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '12px', color: 'var(--pokemon-dark-blue)', fontWeight: 'bold' }}>
          🔬 RESEARCH SPECIMENS ({cardPairs.length})
        </div>
        <div style={{ fontSize: '8px', color: 'var(--pc-text)' }}>
          Click cards for detailed analysis
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '12px' 
      }}>
        {cardPairs.map((pair, index) => {
          const status = cardStatuses[index]?.status || 'pending';
          const result = results?.find(r => r.card_index === index);
          
          return (
            <div
              key={pair.id}
              onClick={() => onCardClick?.(index)}
              style={{
                background: 'var(--pc-panel-bg)',
                border: '2px solid var(--pc-border)',
                borderRadius: '6px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.3), inset -1px -1px 0 rgba(0,0,0,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--pokemon-blue)';
                e.currentTarget.style.background = 'var(--pc-highlight)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--pc-border)';
                e.currentTarget.style.background = 'var(--pc-panel-bg)';
              }}
            >
              {/* Status Indicator */}
              <CardStatusIndicator status={status} progress={cardStatuses[index]?.progress} />
              
              {/* Card Images */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '8px', 
                marginBottom: '8px' 
              }}>
                {/* Front Card */}
                <div style={{ position: 'relative' }}>
                  <div style={{ 
                    fontSize: '8px', 
                    color: 'var(--pokemon-blue)', 
                    marginBottom: '4px',
                    textAlign: 'center'
                  }}>
                    FRONT
                  </div>
                  <div style={{
                    aspectRatio: '3/4',
                    background: 'var(--pc-border)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: '1px solid var(--pc-border)'
                  }}>
                    {pair.front ? (
                      <img
                        src={URL.createObjectURL(pair.front)}
                        alt="Front"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        color: 'var(--pokemon-gray)'
                      }}>
                        📷
                      </div>
                    )}
                  </div>
                </div>

                {/* Back Card */}
                <div style={{ position: 'relative' }}>
                  <div style={{ 
                    fontSize: '8px', 
                    color: 'var(--pokemon-green)', 
                    marginBottom: '4px',
                    textAlign: 'center'
                  }}>
                    BACK
                  </div>
                  <div style={{
                    aspectRatio: '3/4',
                    background: 'var(--pc-border)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: '1px solid var(--pc-border)'
                  }}>
                    {pair.back ? (
                      <img
                        src={URL.createObjectURL(pair.back)}
                        alt="Back"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        color: 'var(--pokemon-gray)'
                      }}>
                        📷
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Info */}
              <div style={{ fontSize: '8px', lineHeight: '1.3' }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: 'var(--pc-text)', 
                  marginBottom: '4px',
                  textAlign: 'center'
                }}>
                  {pair.name || `CARD PAIR ${index + 1}`}
                </div>
                
                {result?.results.identification && (
                  <div style={{ marginBottom: '2px' }}>
                    <span style={{ color: 'var(--pokemon-blue)' }}>🔍 </span>
                    <span style={{ color: 'var(--pc-text)' }}>
                      {result.results.identification.best?.name || 'Unknown'}
                    </span>
                  </div>
                )}
                
                {result?.results.grade?.records?.[0]?.grades && (
                  <div style={{ marginBottom: '2px' }}>
                    <span style={{ color: 'var(--pokemon-yellow)' }}>📊 </span>
                    <span style={{ color: 'var(--pc-text)' }}>
                      Grade: {result.results.grade.records[0].grades.final}/10
                    </span>
                  </div>
                )}
                
                {result?.results.listing_description && (
                  <div style={{ marginBottom: '2px' }}>
                    <span style={{ color: 'var(--pokemon-green)' }}>📝 </span>
                    <span style={{ color: 'var(--pc-text)' }}>
                      Listing Ready
                    </span>
                  </div>
                )}
                
                {result?.errors && result.errors.length > 0 && (
                  <div style={{ color: 'var(--pokemon-red)', fontSize: '7px' }}>
                    ⚠️ {result.errors[0]}
                  </div>
                )}
              </div>

              {/* Professor Oak Comment */}
              {status === 'completed' && (
                <div style={{
                  marginTop: '8px',
                  padding: '4px',
                  background: 'var(--pokemon-light-green)',
                  border: '1px solid var(--pokemon-green)',
                  borderRadius: '3px',
                  fontSize: '7px',
                  color: 'var(--pokemon-dark-green)',
                  fontStyle: 'italic',
                  textAlign: 'center'
                }}>
                  "Excellent specimen! Analysis complete."
                </div>
              )}
              
              {status === 'processing' && (
                <div style={{
                  marginTop: '8px',
                  padding: '4px',
                  background: 'var(--pokemon-light-blue)',
                  border: '1px solid var(--pokemon-blue)',
                  borderRadius: '3px',
                  fontSize: '7px',
                  color: 'var(--pokemon-dark-blue)',
                  fontStyle: 'italic',
                  textAlign: 'center'
                }}>
                  "Examining this card carefully..."
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
