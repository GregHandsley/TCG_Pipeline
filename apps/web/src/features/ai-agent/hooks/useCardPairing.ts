import { useState, useEffect } from 'react';
import { CardPair, CardStatus } from './types';

export function useCardPairing() {
  const [files, setFiles] = useState<File[]>([]);
  const [cardPairs, setCardPairs] = useState<CardPair[]>([]);
  const [cardStatuses, setCardStatuses] = useState<Record<number, CardStatus>>({});
  const [drawCards, setDrawCards] = useState<Array<{pairIndex: number, cardType: 'front' | 'back', file: File}>>([]);

  // Simple pairing mechanism - assumes files are uploaded in pairs (front, back, front, back, ...)
  const createPairsFromFiles = () => {
    const pairs: CardPair[] = [];
    for (let i = 0; i < files.length; i += 2) {
      if (i + 1 < files.length) {
        pairs.push({
          id: `pair_${i}`,
          front: files[i],
          back: files[i + 1],
          name: `Card ${Math.floor(i / 2) + 1}`
        });
      }
    }
    setCardPairs(pairs);
  };

  // Auto-create pairs when files change
  useEffect(() => {
    if (files.length > 0 && files.length % 2 === 0) {
      createPairsFromFiles();
    }
  }, [files]);

  const addFiles = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setCardStatuses(prev => {
      const newStatuses = { ...prev };
      delete newStatuses[index];
      return newStatuses;
    });
  };

  const clearAll = () => {
    setFiles([]);
    setCardPairs([]);
    setCardStatuses({});
    setDrawCards([]);
  };

  const moveCardBetweenPairs = (fromPairIndex: number, fromCardType: 'front' | 'back', toPairIndex: number, toCardType: 'front' | 'back') => {
    setCardPairs(prev => {
      const newPairs = [...prev];
      const fromPair = newPairs[fromPairIndex];
      const toPair = newPairs[toPairIndex];
      
      // Handle case where fromPair doesn't exist (moving from draw pile)
      if (!toPair) return prev;
      
      let sourceFile: File | null = null;
      
      if (fromPair) {
        // Normal case: moving between existing pairs
        sourceFile = fromCardType === 'front' ? fromPair.front : fromPair.back;
        
        if (!sourceFile) return prev;
        
        // Clear the source position
        if (fromCardType === 'front') {
          fromPair.front = null;
        } else {
          fromPair.back = null;
        }
      } else {
        // Special case: moving from draw pile (fromPair doesn't exist)
        // The sourceFile will be provided by the drag and drop logic
        // We just need to handle the target placement
        sourceFile = null; // Will be set by the drag and drop logic
      }
      
      // Move the source file to target position
      if (toCardType === 'front') {
        toPair.front = sourceFile;
      } else {
        toPair.back = sourceFile;
      }
      
      return newPairs;
    });
  };

  const initializeCardStatuses = (pairs: CardPair[]) => {
    const initialStatuses: Record<number, CardStatus> = {};
    pairs.forEach((_, index) => {
      initialStatuses[index] = { status: 'pending' };
    });
    setCardStatuses(initialStatuses);
  };

  const updateCardStatus = (index: number, status: CardStatus) => {
    setCardStatuses(prev => ({
      ...prev,
      [index]: status
    }));
  };

  const removeCardFromPair = (pairIndex: number, cardType: 'front' | 'back') => {
    setCardPairs(prev => {
      const newPairs = [...prev];
      const pair = newPairs[pairIndex];
      if (!pair) return prev;
      
      if (cardType === 'front') {
        newPairs[pairIndex] = { ...pair, front: null };
      } else {
        newPairs[pairIndex] = { ...pair, back: null };
      }
      
      // Check if both cards are now null/empty
      const updatedPair = newPairs[pairIndex];
      if (!updatedPair.front && !updatedPair.back) {
        // Remove the entire pair if both cards are empty
        newPairs.splice(pairIndex, 1);
        
        // Update card statuses to reflect the removed pair
        setCardStatuses(prevStatuses => {
          const newStatuses = { ...prevStatuses };
          // Remove the deleted pair's status
          delete newStatuses[pairIndex];
          // Shift down all subsequent statuses
          const shiftedStatuses: Record<number, CardStatus> = {};
          Object.keys(newStatuses).forEach(key => {
            const index = parseInt(key);
            if (index > pairIndex) {
              shiftedStatuses[index - 1] = newStatuses[index];
            } else {
              shiftedStatuses[index] = newStatuses[index];
            }
          });
          return shiftedStatuses;
        });
      }
      
      return newPairs;
    });
  };

  const moveCardFromDrawToPair = (file: File, targetPairIndex: number, targetCardType: 'front' | 'back') => {
    console.log('moveCardFromDrawToPair called with:', { fileName: file.name, fileType: file.type, targetPairIndex, targetCardType });
    setCardPairs(prev => {
      const newPairs = [...prev];
      const targetPair = newPairs[targetPairIndex];
      
      if (!targetPair) {
        console.log('Target pair not found at index:', targetPairIndex);
        return prev;
      }
      
      // Get the current file in the target position (if any)
      const currentFile = targetCardType === 'front' ? targetPair.front : targetPair.back;
      
      // Set the new file in the target position
      if (targetCardType === 'front') {
        newPairs[targetPairIndex] = { ...targetPair, front: file };
        console.log('Set front file:', file.name, 'Previous file:', currentFile?.name || 'none');
      } else {
        newPairs[targetPairIndex] = { ...targetPair, back: file };
        console.log('Set back file:', file.name, 'Previous file:', currentFile?.name || 'none');
      }
      
      console.log('Updated pairs:', newPairs.map((p, i) => ({
        index: i,
        front: p.front?.name || 'null',
        back: p.back?.name || 'null'
      })));
      
      return newPairs;
    });
  };

  const addCardToDraw = (pairIndex: number, cardType: 'front' | 'back', file: File) => {
    console.log('Adding card to draw:', { 
      pairIndex, 
      cardType, 
      fileName: file.name, 
      fileType: file.type, 
      fileSize: file.size,
      fileConstructor: file.constructor.name
    });
    
    // Validate the file object
    if (!file || !file.name || !file.type) {
      console.error('Invalid file object:', file);
      return;
    }
    
    setDrawCards(prev => {
      const newDrawCards = [...prev, { pairIndex, cardType, file }];
      console.log('Updated draw cards:', newDrawCards.map((card, index) => ({
        index,
        fileName: card.file.name,
        fileType: card.file.type,
        fileSize: card.file.size
      })));
      return newDrawCards;
    });
  };

  const removeCardFromDraw = (drawIndex: number) => {
    console.log('Removing card from draw:', drawIndex);
    setDrawCards(prev => prev.filter((_, index) => index !== drawIndex));
  };

  const clearDrawCards = () => {
    console.log('Clearing all draw cards');
    setDrawCards([]);
  };

  const updateCardSlot = (pairIndex: number, cardType: 'front' | 'back', file: File) => {
    console.log('Updating card slot:', { pairIndex, cardType, fileName: file.name });
    setCardPairs(prev => {
      const newPairs = [...prev];
      const pair = newPairs[pairIndex];
      if (pair) {
        if (cardType === 'front') {
          newPairs[pairIndex] = { ...pair, front: file };
        } else {
          newPairs[pairIndex] = { ...pair, back: file };
        }
      }
      return newPairs;
    });
  };

  return {
    files,
    cardPairs,
    cardStatuses,
    drawCards,
    addFiles,
    removeFile,
    removeCardFromPair,
    moveCardFromDrawToPair,
    addCardToDraw,
    removeCardFromDraw,
    clearDrawCards,
    updateCardSlot,
    clearAll,
    initializeCardStatuses,
    updateCardStatus,
    setCardStatuses,
    moveCardBetweenPairs
  };
}
