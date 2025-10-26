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
  const [draggedCard, setDraggedCard] = useState<{pairIndex: number, cardType: 'front' | 'back', isFromDraw?: boolean, drawIndex?: number} | null>(null);
  const [drawCards, setDrawCards] = useState<Array<{pairIndex: number, cardType: 'front' | 'back', file: File}>>([]);
  const [dragOverTarget, setDragOverTarget] = useState<{pairIndex: number, cardType: 'front' | 'back'} | null>(null);

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
    
    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    dragImage.style.border = '3px solid var(--pokemon-blue)';
    dragImage.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleDrawCardDragStart = (e: React.DragEvent, drawIndex: number) => {
    if (isProcessing) return;
    const drawCard = drawCards[drawIndex];
    if (!drawCard) return;
    
    setDraggedCard({ pairIndex: drawCard.pairIndex, cardType: drawCard.cardType, isFromDraw: true, drawIndex });
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    dragImage.style.border = '3px solid var(--pokemon-yellow)';
    dragImage.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, targetPairIndex: number, targetCardType: 'front' | 'back') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget({ pairIndex: targetPairIndex, cardType: targetCardType });
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetPairIndex: number, targetCardType: 'front' | 'back') => {
    e.preventDefault();
    if (!draggedCard || isProcessing) return;

    const { pairIndex: fromPairIndex, cardType: fromCardType, isFromDraw, drawIndex } = draggedCard;
    
    // If dropping on the same card, do nothing
    if (!isFromDraw && fromPairIndex === targetPairIndex && fromCardType === targetCardType) {
      setDraggedCard(null);
      setDragOverTarget(null);
      return;
    }

    if (isFromDraw && drawIndex !== undefined) {
      // Moving from draw pile to a card pair
      const drawCard = drawCards[drawIndex];
      if (!drawCard) return;

      // Get the target file (if any) to move to draw
      const targetPair = cardPairs[targetPairIndex];
      const targetFile = targetCardType === 'front' ? targetPair.front : targetPair.back;

      // Move the draw card to the target position
      if (onMoveCard) {
        onMoveCard(drawCard.pairIndex, drawCard.cardType, targetPairIndex, targetCardType);
      }

      // If there was a card in the target position, move it to draw
      if (targetFile) {
        setDrawCards(prev => [...prev, { pairIndex: targetPairIndex, cardType: targetCardType, file: targetFile }]);
      }

      // Remove the moved card from draw
      setDrawCards(prev => prev.filter((_, index) => index !== drawIndex));
    } else {
      // Moving between card pairs
      const sourcePair = cardPairs[fromPairIndex];
      const sourceFile = fromCardType === 'front' ? sourcePair.front : sourcePair.back;
      
      if (!sourceFile) {
        setDraggedCard(null);
        setDragOverTarget(null);
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
    }

    setDraggedCard(null);
    setDragOverTarget(null);
  };

  const handleDeleteFromDraw = (drawIndex: number) => {
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

      {/* Cards Grid - More compact layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '16px',
        marginBottom: drawCards.length > 0 ? '20px' : '0'
      }}>
        {cardPairs.map((pair, index) => {
          const status = cardStatuses[index]?.status || 'pending';
          const result = results?.find(r => r.card_index === index);
          const isDragOver = dragOverTarget?.pairIndex === index;
          
          return (
            <div
              key={pair.id}
              style={{
                background: 'var(--pc-panel-bg)',
                border: `2px solid ${isDragOver ? 'var(--pokemon-blue)' : 'var(--pc-border)'}`,
                borderRadius: '6px',
                padding: '12px',
                transition: 'all 0.3s ease',
                position: 'relative',
                boxShadow: isDragOver 
                  ? 'inset 2px 2px 0 var(--pc-highlight), inset -2px -2px 0 var(--pc-shadow), 0 0 15px rgba(74, 144, 226, 0.3)' 
                  : 'inset 2px 2px 0 var(--pc-highlight), inset -2px -2px 0 var(--pc-shadow), 2px 2px 0 var(--pc-shadow)'
              }}
            >
              {/* Status Indicator */}
              <CardStatusIndicator status={status} progress={cardStatuses[index]?.progress} />
              
              {/* Card Images - More compact */}
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
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    FRONT
                  </div>
                  <div
                    draggable={!isProcessing}
                    onDragStart={(e) => handleDragStart(e, index, 'front')}
                    onDragOver={(e) => handleDragOver(e, index, 'front')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index, 'front')}
                    onClick={() => onCardClick?.(index)}
                    style={{
                      aspectRatio: '3/4',
                      background: 'var(--pc-border)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: `2px solid ${dragOverTarget?.pairIndex === index && dragOverTarget?.cardType === 'front' ? 'var(--pokemon-blue)' : 'var(--pc-border)'}`,
                      maxHeight: '100px',
                      cursor: isProcessing ? 'default' : 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isProcessing) {
                        e.currentTarget.style.borderColor = 'var(--pokemon-blue)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 3px 8px rgba(74, 144, 226, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = dragOverTarget?.pairIndex === index && dragOverTarget?.cardType === 'front' ? 'var(--pokemon-blue)' : 'var(--pc-border)';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
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
                        fontSize: '18px',
                        color: 'var(--pokemon-gray)',
                        background: 'linear-gradient(135deg, var(--pc-border) 0%, var(--pc-panel-bg) 100%)'
                      }}>
                        📷
                      </div>
                    )}
                    {/* Drag Indicator */}
                    {!isProcessing && pair.front && (
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        left: '2px',
                        background: 'rgba(74, 144, 226, 0.8)',
                        color: 'white',
                        fontSize: '7px',
                        padding: '1px 3px',
                        borderRadius: '2px',
                        fontWeight: 'bold'
                      }}>
                        DRAG
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
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.background = '#FF6B6B';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.background = 'var(--pokemon-red)';
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Back Card */}
                <div style={{ position: 'relative' }}>
                  <div style={{ 
                    fontSize: '8px', 
                    color: 'var(--pokemon-green)', 
                    marginBottom: '4px',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    BACK
                  </div>
                  <div
                    draggable={!isProcessing}
                    onDragStart={(e) => handleDragStart(e, index, 'back')}
                    onDragOver={(e) => handleDragOver(e, index, 'back')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index, 'back')}
                    onClick={() => onCardClick?.(index)}
                    style={{
                      aspectRatio: '3/4',
                      background: 'var(--pc-border)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: `2px solid ${dragOverTarget?.pairIndex === index && dragOverTarget?.cardType === 'back' ? 'var(--pokemon-green)' : 'var(--pc-border)'}`,
                      maxHeight: '100px',
                      cursor: isProcessing ? 'default' : 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isProcessing) {
                        e.currentTarget.style.borderColor = 'var(--pokemon-green)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 3px 8px rgba(76, 175, 80, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = dragOverTarget?.pairIndex === index && dragOverTarget?.cardType === 'back' ? 'var(--pokemon-green)' : 'var(--pc-border)';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
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
                        fontSize: '18px',
                        color: 'var(--pokemon-gray)',
                        background: 'linear-gradient(135deg, var(--pc-border) 0%, var(--pc-panel-bg) 100%)'
                      }}>
                        📷
                      </div>
                    )}
                    {/* Drag Indicator */}
                    {!isProcessing && pair.back && (
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        left: '2px',
                        background: 'rgba(76, 175, 80, 0.8)',
                        color: 'white',
                        fontSize: '7px',
                        padding: '1px 3px',
                        borderRadius: '2px',
                        fontWeight: 'bold'
                      }}>
                        DRAG
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
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.background = '#FF6B6B';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.background = 'var(--pokemon-red)';
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Card Info - More compact */}
              <div style={{ fontSize: '7px', lineHeight: '1.2', textAlign: 'center' }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: 'var(--pc-text)', 
                  marginBottom: '2px',
                  fontSize: '8px'
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

              {/* Professor Oak Comment - More compact */}
              {status === 'completed' && (
                <div style={{
                  marginTop: '4px',
                  padding: '2px',
                  background: 'var(--pokemon-light-green)',
                  border: '1px solid var(--pokemon-green)',
                  borderRadius: '3px',
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

      {/* Draw Area - More compact */}
      {drawCards.length > 0 && (
        <div style={{
          background: 'var(--pokemon-light-yellow)',
          border: '2px solid var(--pokemon-yellow)',
          borderRadius: '6px',
          padding: '12px',
          boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.3), 2px 2px 0 var(--pc-shadow)'
        }}>
          <div style={{ 
            fontSize: '10px', 
            color: 'var(--pokemon-dark-yellow)', 
            fontWeight: 'bold',
            marginBottom: '6px',
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
            Drag cards back to pairs or delete them
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', 
            gap: '6px' 
          }}>
            {drawCards.map((drawCard, index) => (
              <div
                key={index}
                draggable={!isProcessing}
                onDragStart={(e) => handleDrawCardDragStart(e, index)}
                style={{
                  position: 'relative',
                  aspectRatio: '3/4',
                  background: 'var(--pc-border)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  border: '2px solid var(--pokemon-yellow)',
                  maxHeight: '80px',
                  cursor: isProcessing ? 'default' : 'grab',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 3px 6px rgba(255, 193, 7, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
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
                {/* Drag Indicator */}
                {!isProcessing && (
                  <div style={{
                    position: 'absolute',
                    top: '1px',
                    left: '1px',
                    background: 'rgba(255, 193, 7, 0.8)',
                    color: 'white',
                    fontSize: '5px',
                    padding: '1px 2px',
                    borderRadius: '2px',
                    fontWeight: 'bold'
                  }}>
                    DRAG
                  </div>
                )}
                <button
                  onClick={() => handleDeleteFromDraw(index)}
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
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
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
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