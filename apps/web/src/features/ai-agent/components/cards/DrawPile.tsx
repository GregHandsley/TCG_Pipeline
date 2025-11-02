import React, { useEffect, useMemo } from 'react';

interface DrawPileProps {
  drawCards: Array<{pairIndex: number, cardType: 'front' | 'back', file: File}>;
  isProcessing: boolean;
  onDragStart: (e: React.DragEvent, drawIndex: number) => void;
  onDelete: (drawIndex: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  dragOverTarget?: {pairIndex: number, cardType: 'front' | 'back'} | null;
}

export function DrawPile({ drawCards, isProcessing, onDragStart, onDelete, onDragEnd, dragOverTarget }: DrawPileProps) {
  if (drawCards.length === 0) return null;

  // Debug logging
  useEffect(() => {
    console.log('DrawPile updated with cards:', drawCards.map((card, index) => ({
      index,
      fileName: card.file.name,
      fileType: card.file.type,
      fileSize: card.file.size,
      pairIndex: card.pairIndex,
      cardType: card.cardType
    })));
  }, [drawCards]);

  return (
    <div style={{
      background: 'var(--pokemon-light-yellow)',
      border: '3px solid var(--pokemon-yellow)',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 6px 20px rgba(255, 193, 7, 0.3)',
      position: 'relative'
    }}>
      <div style={{ 
        fontSize: '14px', 
        color: 'var(--pokemon-dark-yellow)', 
        fontWeight: 'bold',
        marginBottom: '12px',
        textAlign: 'center',
        textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
      }}>
        DRAW PILE ({drawCards.length})
      </div>
      <div style={{ 
        fontSize: '10px', 
        color: 'var(--pc-text)', 
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        Drag cards back to pairs or delete them
      </div>
      <div style={{ 
        display: 'flex', 
        gap: '16px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {drawCards.map((drawCard, index) => (
          <DrawCard
            key={index}
            drawCard={drawCard}
            index={index}
            isProcessing={isProcessing}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

// Individual draw card component with proper URL management
function DrawCard({ 
  drawCard, 
  index, 
  isProcessing, 
  onDragStart, 
  onDragEnd, 
  onDelete 
}: {
  drawCard: {pairIndex: number, cardType: 'front' | 'back', file: File};
  index: number;
  isProcessing: boolean;
  onDragStart: (e: React.DragEvent, drawIndex: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDelete: (drawIndex: number) => void;
}) {
  // Memoize URL to prevent recreation
  const imageUrl = useMemo(() => {
    console.log('Creating URL for draw card:', drawCard.file.name, 'type:', drawCard.file.type, 'size:', drawCard.file.size);
    return URL.createObjectURL(drawCard.file);
  }, [drawCard.file]);

  // Cleanup URL when component unmounts
  useEffect(() => {
    return () => {
      console.log('Cleaning up URL for draw card:', drawCard.file.name);
      URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl, drawCard.file.name]);

  return (
    <div
      draggable={!isProcessing}
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnd={onDragEnd}
      style={{
        position: 'relative',
        width: '120px',
        height: '160px',
        background: 'var(--pc-border)',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '3px solid var(--pokemon-yellow)',
        cursor: isProcessing ? 'default' : 'grab',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 8px rgba(255, 193, 7, 0.3)',
        opacity: 1,
        filter: 'none'
      }}
      onMouseEnter={(e) => {
        if (!isProcessing) {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 193, 7, 0.5)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(255, 193, 7, 0.3)';
      }}
    >
      <img
        src={imageUrl}
        alt={`Draw card ${index + 1}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 1,
          filter: 'none'
        }}
        onLoad={() => console.log('Draw card image loaded successfully:', drawCard.file.name)}
        onError={(e) => {
          console.error('Draw card image failed to load:', drawCard.file.name, 'Error:', e);
          // Show a fallback or error state
          e.currentTarget.style.display = 'none';
        }}
      />
      {/* Drag Indicator */}
      {!isProcessing && (
        <div style={{
          position: 'absolute',
          top: '3px',
          left: '3px',
          background: 'rgba(255, 193, 7, 0.9)',
          color: 'white',
          fontSize: '8px',
          padding: '2px 4px',
          borderRadius: '3px',
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          DRAG
        </div>
      )}
      <button
        onClick={() => onDelete(index)}
        style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          width: '24px',
          height: '24px',
          background: 'var(--pokemon-red)',
          border: '2px solid var(--pokemon-dark-red)',
          borderRadius: '6px',
          color: 'white',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
          transition: 'all 0.2s ease',
          zIndex: 10
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.background = '#FF6B6B';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = 'var(--pokemon-red)';
        }}
        title="Delete card from draw pile"
      >
        ×
      </button>
    </div>
  );
}
