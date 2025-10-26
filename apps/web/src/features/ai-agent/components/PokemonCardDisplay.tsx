import React, { useState } from 'react';
import { CardPair, CardStatus, ProcessingResult } from '../types';
import { CardStatusIndicator } from './CardStatusIndicator';

interface PokemonCardDisplayProps {
  cardPairs: CardPair[];
  cardStatuses: Record<number, CardStatus>;
  results: ProcessingResult[] | null;
  isProcessing: boolean;
  onCardClick?: (pairIndex: number) => void;
  onDeleteCard?: (pairIndex: number, cardType: 'front' | 'back') => void;
  onMoveCard?: (fromPairIndex: number, fromCardType: 'front' | 'back', toPairIndex: number, toCardType: 'front' | 'back') => void;
}

export function PokemonCardDisplay({ 
  cardPairs, 
  cardStatuses, 
  results, 
  isProcessing,
  onCardClick,
  onDeleteCard,
  onMoveCard
}: PokemonCardDisplayProps) {
  const [draggedCard, setDraggedCard] = useState<{pairIndex: number, cardType: 'front' | 'back'} | null>(null);
  const [drawCards, setDrawCards] = useState<Array<{pairIndex: number, cardType: 'front' | 'back', file: File}>>([]);

  if (cardPairs.length === 0 && drawCards.length === 0) {
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

  const handleDragStart = (e: React.DragEvent, pairIndex: number, cardType: 'front' | 'back') => {
    if (isProcessing) return;
    setDraggedCard({ pairIndex, cardType });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPairIndex: number, targetCardType: 'front' | 'back') => {
    e.preventDefault();
    if (!draggedCard || isProcessing) return;

    const { pairIndex: fromPairIndex, cardType: fromCardType } = draggedCard;
    
    // If dropping on the same card, do nothing
    if (fromPairIndex === targetPairIndex && fromCardType === targetCardType) {
      setDraggedCard(null);
      return;
    }

    // Get the file being moved
    const sourcePair = cardPairs[fromPairIndex];
    const sourceFile = fromCardType === 'front' ? sourcePair.front : sourcePair.back;
    
    if (!sourceFile) {
      setDraggedCard(null);
      return;
    }

    // Get the target file (if any)
    const targetPair = cardPairs[targetPairIndex];
    const targetFile = targetCardType === 'front' ? targetPair.front : targetPair.back;

    // Move the card
    if (onMoveCard) {
      onMoveCard(fromPairIndex, fromCardType, targetPairIndex, targetCardType);
    }

    // If there was a card in the target position, move it to draw
    if (targetFile) {
      setDrawCards(prev => [...prev, { pairIndex: targetPairIndex, cardType: targetCardType, file: targetFile }]);
    }

    setDraggedCard(null);
  };

  const handleDeleteFromDraw = (drawIndex: number) => {
    setDrawCards(prev => prev.filter((_, index) => index !== drawIndex));
  };

  const handleMoveFromDraw = (drawIndex: number, targetPairIndex: number, targetCardType: 'front' | 'back') => {
    const drawCard = drawCards[drawIndex];
    if (!drawCard) return;

    // Move the card from draw to target position
    if (onMoveCard) {
      onMoveCard(drawCard.pairIndex, drawCard.cardType, targetPairIndex, targetCardType);
    }

    // Remove from draw
    setDrawCards(prev => prev.filter((_, index) => index !== drawIndex));
  };

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
          {isProcessing ? 'Analysis in progress...' : 'Drag cards to rearrange • Click for details'}
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '12px',
        marginBottom: drawCards.length > 0 ? '16px' : '0'
      }}>
        {cardPairs.map((pair, index) => {
          const status = cardStatuses[index]?.status || 'pending';
          const result = results?.find(r => r.card_index === index);
          
          return (
            <div
              key={pair.id}
              style={{
                background: 'var(--pc-panel-bg)',
                border: '2px solid var(--pc-border)',
                borderRadius: '6px',
                padding: '8px',
                transition: 'all 0.2s ease',
                position: 'relative',
                boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.3), inset -1px -1px 0 rgba(0,0,0,0.3)'
              }}
            >
              {/* Status Indicator */}
              <CardStatusIndicator status={status} progress={cardStatuses[index]?.progress} />
              
              {/* Card Images */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '6px', 
                marginBottom: '6px' 
              }}>
                {/* Front Card */}
                <div style={{ position: 'relative' }}>
                  <div style={{ 
                    fontSize: '7px', 
                    color: 'var(--pokemon-blue)', 
                    marginBottom: '2px',
                    textAlign: 'center'
                  }}>
                    FRONT
                  </div>
                  <div
                    draggable={!isProcessing}
                    onDragStart={(e) => handleDragStart(e, index, 'front')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index, 'front')}
                    onClick={() => onCardClick?.(index)}
                    style={{
                      aspectRatio: '3/4',
                      background: 'var(--pc-border)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      border: '1px solid var(--pc-border)',
                      maxHeight: '80px',
                      cursor: isProcessing ? 'default' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isProcessing) {
                        e.currentTarget.style.borderColor = 'var(--pokemon-blue)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--pc-border)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
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
                        fontSize: '12px',
                        color: 'var(--pokemon-gray)'
                      }}>
                        📷
                      </div>
                    )}
                  </div>
                  {/* Delete Button */}
                  {pair.front && !isProcessing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCard?.(index, 'front');
                      }}
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '16px',
                        height: '16px',
                        background: 'var(--pokemon-red)',
                        border: '1px solid var(--pokemon-dark-red)',
                        borderRadius: '50%',
                        color: 'white',
                        fontSize: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Back Card */}
                <div style={{ position: 'relative' }}>
                  <div style={{ 
                    fontSize: '7px', 
                    color: 'var(--pokemon-green)', 
                    marginBottom: '2px',
                    textAlign: 'center'
                  }}>
                    BACK
                  </div>
                  <div
                    draggable={!isProcessing}
                    onDragStart={(e) => handleDragStart(e, index, 'back')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index, 'back')}
                    onClick={() => onCardClick?.(index)}
                    style={{
                      aspectRatio: '3/4',
                      background: 'var(--pc-border)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      border: '1px solid var(--pc-border)',
                      maxHeight: '80px',
                      cursor: isProcessing ? 'default' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isProcessing) {
                        e.currentTarget.style.borderColor = 'var(--pokemon-green)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--pc-border)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
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
                        fontSize: '12px',
                        color: 'var(--pokemon-gray)'
                      }}>
                        📷
                      </div>
                    )}
                  </div>
                  {/* Delete Button */}
                  {pair.back && !isProcessing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCard?.(index, 'back');
                      }}
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '16px',
                        height: '16px',
                        background: 'var(--pokemon-red)',
                        border: '1px solid var(--pokemon-dark-red)',
                        borderRadius: '50%',
                        color: 'white',
                        fontSize: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Card Info */}
              <div style={{ fontSize: '7px', lineHeight: '1.2', textAlign: 'center' }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: 'var(--pc-text)', 
                  marginBottom: '2px'
                }}>
                  {pair.name || `PAIR ${index + 1}`}
                </div>
                
                {result?.results.identification && (
                  <div style={{ color: 'var(--pokemon-blue)', marginBottom: '1px' }}>
                    🔍 {result.results.identification.best?.name || 'Unknown'}
                  </div>
                )}
                
                {result?.results.grade?.records?.[0]?.grades && (
                  <div style={{ color: 'var(--pokemon-yellow)', marginBottom: '1px' }}>
                    📊 Grade: {result.results.grade.records[0].grades.final}/10
                  </div>
                )}
                
                {result?.results.listing_description && (
                  <div style={{ color: 'var(--pokemon-green)', marginBottom: '1px' }}>
                    📝 Ready
                  </div>
                )}
              </div>

              {/* Professor Oak Comment */}
              {status === 'completed' && (
                <div style={{
                  marginTop: '4px',
                  padding: '2px',
                  background: 'var(--pokemon-light-green)',
                  border: '1px solid var(--pokemon-green)',
                  borderRadius: '2px',
                  fontSize: '6px',
                  color: 'var(--pokemon-dark-green)',
                  fontStyle: 'italic',
                  textAlign: 'center'
                }}>
                  "Analysis complete!"
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Draw Area */}
      {drawCards.length > 0 && (
        <div style={{
          background: 'var(--pokemon-light-yellow)',
          border: '2px solid var(--pokemon-yellow)',
          borderRadius: '6px',
          padding: '12px'
        }}>
          <div style={{ 
            fontSize: '10px', 
            color: 'var(--pokemon-dark-yellow)', 
            fontWeight: 'bold',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            🎴 DRAW PILE ({drawCards.length})
          </div>
          <div style={{ 
            fontSize: '8px', 
            color: 'var(--pc-text)', 
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            Cards replaced during rearrangement
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', 
            gap: '6px' 
          }}>
            {drawCards.map((drawCard, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  aspectRatio: '3/4',
                  background: 'var(--pc-border)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  border: '1px solid var(--pc-border)',
                  maxHeight: '60px'
                }}
              >
                <img
                  src={URL.createObjectURL(drawCard.file)}
                  alt={`Draw card ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <button
                  onClick={() => handleDeleteFromDraw(index)}
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '14px',
                    height: '14px',
                    background: 'var(--pokemon-red)',
                    border: '1px solid var(--pokemon-dark-red)',
                    borderRadius: '50%',
                    color: 'white',
                    fontSize: '7px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}