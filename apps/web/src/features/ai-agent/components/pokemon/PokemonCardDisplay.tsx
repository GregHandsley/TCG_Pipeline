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
      boxShadow: '0 4px 16px rgba(74, 144, 226, 0.15)',
      border: '3px solid var(--pokemon-blue)'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '12px',
        background: 'linear-gradient(to right, rgba(74, 144, 226, 0.1), rgba(74, 144, 226, 0.05))',
        borderRadius: '6px',
        border: '2px solid rgba(74, 144, 226, 0.2)'
      }}>
        <div style={{ fontSize: '14px', color: 'var(--pokemon-dark-blue)', fontWeight: 'bold' }}>
          RESEARCH SPECIMENS ({cardPairs.length})
        </div>
        <div style={{ fontSize: '9px', color: 'var(--pc-text)' }}>
          {isProcessing ? 'Analysis in progress...' : 'Drag cards to rearrange • Click for details'}
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