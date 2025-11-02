import React from 'react';
import { CardPair, CardStatus, ProcessingResult } from '../../types';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { CardPairComponent } from '../cards/CardPairComponent';
import { DrawPile } from '../cards/DrawPile';

interface PokemonCardDisplayProps {
  cardPairs: CardPair[];
  cardStatuses: Record<number, CardStatus>;
  drawCards: Array<{pairIndex: number, cardType: 'front' | 'back', file: File}>;
  results: ProcessingResult[] | null;
  isProcessing: boolean;
  onCardClick?: (pairIndex: number) => void;
  onDeleteCard?: (pairIndex: number, cardType: 'front' | 'back') => void;
  onMoveCard?: (fromPairIndex: number, fromCardType: 'front' | 'back', toPairIndex: number, toCardType: 'front' | 'back') => void;
  onMoveCardFromDraw?: (file: File, targetPairIndex: number, targetCardType: 'front' | 'back') => void;
  onAddCardToDraw?: (pairIndex: number, cardType: 'front' | 'back', file: File) => void;
  onRemoveCardFromDraw?: (drawIndex: number) => void;
  onUploadToSlot?: (pairIndex: number, cardType: 'front' | 'back') => void;
}

export function PokemonCardDisplay({ 
  cardPairs, 
  cardStatuses, 
  drawCards,
  results, 
  isProcessing,
  onCardClick,
  onDeleteCard,
  onMoveCard,
  onMoveCardFromDraw,
  onAddCardToDraw,
  onRemoveCardFromDraw,
  onUploadToSlot
}: PokemonCardDisplayProps) {
  const {
    draggedCard,
    dragOverTarget,
    handleDragStart,
    handleDrawCardDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  } = useDragAndDrop({ 
    cardPairs, 
    drawCards,
    isProcessing, 
    onMoveCard, 
    onMoveCardFromDraw,
    onAddCardToDraw,
    onRemoveCardFromDraw
  });

  if (cardPairs.length === 0 && drawCards.length === 0) {
    return (
      <div className="pc-panel" style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--pokemon-gray)' }}>
          📭
        </div>
        <div style={{ fontSize: '14px', color: 'var(--pokemon-dark-gray)', marginBottom: '8px' }}>
          NO POKÉMON CARDS IN LAB
        </div>
        <div style={{ fontSize: '10px', color: 'var(--pc-text)' }}>
          Professor Oak is waiting for cards to analyze...
        </div>
      </div>
    );
  }

  return (
    <div className="pc-panel" style={{
      background: '#D8E8F8',
      border: '4px solid #4A90E2',
      boxShadow: 'inset 3px 3px 0 rgba(255,255,255,0.5), inset -3px -3px 0 rgba(0,0,0,0.2), 4px 4px 0 rgba(0,0,0,0.3)'
    }}>
      {/* Header - PC Box Style */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        padding: '8px 12px',
        background: '#4A90E2',
        border: '3px solid #2E5B8A',
        boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: 'bold', textShadow: '1px 1px 0 rgba(0,0,0,0.5)' }}>
          BOX 1 ({cardPairs.length}/30)
        </div>
        <div style={{ fontSize: '8px', color: '#E8F4FD' }}>
          {isProcessing ? 'ANALYZING...' : 'DRAG TO ORGANIZE'}
        </div>
      </div>

      {/* Cards Layout - FIXED WIDTH GRID SYSTEM */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '12px',
        justifyContent: 'start',
        marginBottom: drawCards.length > 0 ? '24px' : '0'
      }}>
        {cardPairs.map((pair, index) => {
          const status = cardStatuses[index] || { status: 'pending', progress: 0 };
          const result = results?.find(r => r.card_index === index);
          const isDragOver = dragOverTarget?.pairIndex === index;
          
          return (
            <CardPairComponent
              key={pair.id}
              pair={pair}
              index={index}
              status={status}
              result={result}
              isProcessing={isProcessing}
              isDragOver={isDragOver}
              dragOverTarget={dragOverTarget}
              onCardClick={onCardClick}
              onDeleteCard={onDeleteCard}
              onUploadToSlot={onUploadToSlot}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          );
        })}
      </div>

      {/* Draw Area */}
      <DrawPile
        drawCards={drawCards}
        isProcessing={isProcessing}
        onDragStart={handleDrawCardDragStart}
        onDelete={onRemoveCardFromDraw}
        onDragEnd={handleDragEnd}
        dragOverTarget={dragOverTarget}
      />
    </div>
  );
}