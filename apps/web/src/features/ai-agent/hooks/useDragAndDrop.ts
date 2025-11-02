import { useState } from 'react';
import { CardPair } from '../types';

interface UseDragAndDropProps {
  cardPairs: CardPair[];
  drawCards: Array<{pairIndex: number, cardType: 'front' | 'back', file: File}>;
  isProcessing: boolean;
  onMoveCard?: (fromPairIndex: number, fromCardType: 'front' | 'back', toPairIndex: number, toCardType: 'front' | 'back') => void;
  onMoveCardFromDraw?: (file: File, targetPairIndex: number, targetCardType: 'front' | 'back') => void;
  onAddCardToDraw?: (pairIndex: number, cardType: 'front' | 'back', file: File) => void;
  onRemoveCardFromDraw?: (drawIndex: number) => void;
}

export function useDragAndDrop({ cardPairs, drawCards, isProcessing, onMoveCard, onMoveCardFromDraw, onAddCardToDraw, onRemoveCardFromDraw }: UseDragAndDropProps) {
  const [draggedCard, setDraggedCard] = useState<{
    pairIndex: number, 
    cardType: 'front' | 'back', 
    file: File,
    isFromDraw?: boolean, 
    drawIndex?: number
  } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{pairIndex: number, cardType: 'front' | 'back'} | null>(null);

  const handleDragStart = (e: React.DragEvent, pairIndex: number, cardType: 'front' | 'back') => {
    if (isProcessing) return;
    
    const pair = cardPairs[pairIndex];
    const file = cardType === 'front' ? pair.front : pair.back;
    if (!file) return;
    
    console.log('Drag start:', { pairIndex, cardType, fileName: file.name });
    setDraggedCard({ pairIndex, cardType, file });
    e.dataTransfer.effectAllowed = 'move';
    
    // DON'T modify the original element's opacity - keep it at full opacity
    // Only apply visual effects to the drag image clone
    
    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    dragImage.style.border = '3px solid var(--pokemon-blue)';
    dragImage.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-9999px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
  };

  const handleDrawCardDragStart = (e: React.DragEvent, drawIndex: number) => {
    if (isProcessing) return;
    const drawCard = drawCards[drawIndex];
    if (!drawCard) return;
    
    console.log('Draw card drag start:', { drawIndex, fileName: drawCard.file.name });
    setDraggedCard({ 
      pairIndex: drawCard.pairIndex, 
      cardType: drawCard.cardType, 
      file: drawCard.file,
      isFromDraw: true, 
      drawIndex 
    });
    e.dataTransfer.effectAllowed = 'move';
    
    // DON'T modify the original element's opacity - keep it at full opacity
    // Only apply visual effects to the drag image clone
    
    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    dragImage.style.border = '3px solid var(--pokemon-yellow)';
    dragImage.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-9999px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
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

    const { pairIndex: fromPairIndex, cardType: fromCardType, file, isFromDraw, drawIndex } = draggedCard;
    
    console.log('Drop event:', { 
      fromPairIndex, 
      fromCardType, 
      targetPairIndex, 
      targetCardType, 
      isFromDraw, 
      drawIndex 
    });
    
    // If dropping on the same card, do nothing
    if (!isFromDraw && fromPairIndex === targetPairIndex && fromCardType === targetCardType) {
      console.log('Dropping on same card, ignoring');
      setDraggedCard(null);
      setDragOverTarget(null);
      return;
    }

    if (isFromDraw && drawIndex !== undefined) {
      // Moving from draw pile to a card pair
      console.log('Moving from draw pile to pair');
      const targetPair = cardPairs[targetPairIndex];
      const targetFile = targetCardType === 'front' ? targetPair.front : targetPair.back;

      // Use the new function to move card from draw to pair
      if (onMoveCardFromDraw) {
        console.log('Calling onMoveCardFromDraw with file:', file.name, 'type:', file.type);
        onMoveCardFromDraw(file, targetPairIndex, targetCardType);
      }

      // If there was a card in the target position, move it to draw
      if (targetFile) {
        console.log('Moving displaced card to draw');
        if (onAddCardToDraw) {
          onAddCardToDraw(targetPairIndex, targetCardType, targetFile);
        }
      }

      // Remove the moved card from draw
      console.log('Removing card from draw');
      if (onRemoveCardFromDraw) {
        onRemoveCardFromDraw(drawIndex);
      }
    } else {
      // Moving between card pairs
      console.log('Moving between card pairs');
      const targetPair = cardPairs[targetPairIndex];
      const targetFile = targetCardType === 'front' ? targetPair.front : targetPair.back;

      // Move the card
      if (onMoveCard) {
        console.log('Calling onMoveCard for pair-to-pair');
        onMoveCard(fromPairIndex, fromCardType, targetPairIndex, targetCardType);
      }

      // If there was a card in the target position, move it to draw
      if (targetFile) {
        console.log('Moving displaced card to draw');
        if (onAddCardToDraw) {
          onAddCardToDraw(targetPairIndex, targetCardType, targetFile);
        }
      }
    }

    setDraggedCard(null);
    setDragOverTarget(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Since we're not modifying the original element anymore, 
    // we just need to clear the drag state
    setDraggedCard(null);
    setDragOverTarget(null);
  };

  return {
    draggedCard,
    dragOverTarget,
    handleDragStart,
    handleDrawCardDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  };
}
