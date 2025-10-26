import { useState, useEffect } from 'react';
import { CardPair, CardStatus } from './types';

export function useCardPairing() {
  const [files, setFiles] = useState<File[]>([]);
  const [cardPairs, setCardPairs] = useState<CardPair[]>([]);
  const [cardStatuses, setCardStatuses] = useState<Record<number, CardStatus>>({});

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

  return {
    files,
    cardPairs,
    cardStatuses,
    addFiles,
    removeFile,
    clearAll,
    initializeCardStatuses,
    updateCardStatus,
    setCardStatuses
  };
}
