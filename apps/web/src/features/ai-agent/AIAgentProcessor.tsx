import React, { useEffect, useState } from 'react';
import { ProcessingOptions } from './types';
import { useCardPairing } from './hooks/useCardPairing';
import { useAIProcessing } from './hooks/useAIProcessing';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProfessorOakDialogue } from './components/ProfessorOakDialogue';
import { PokemonCardDisplay } from './components/PokemonCardDisplay';
import { ProcessingOptionsComponent } from './components/ProcessingOptions';
import { ProcessButton } from './components/ProcessButton';
import { PokemonResearchResults } from './components/PokemonResearchResults';
import { PokemonAIActivityPanel } from './components/PokemonAIActivityPanel';
import './styles/pokemon-ui.css';

function AIAgentProcessor() {
  const {
    files,
    cardPairs,
    cardStatuses,
    addFiles,
    removeFile,
    clearAll,
    initializeCardStatuses,
    updateCardStatus,
    setCardStatuses,
    moveCardBetweenPairs
  } = useCardPairing() as any;

  const {
    isProcessing,
    results,
    thoughtLog,
    currentStep,
    isActivityPanelOpen,
    setIsActivityPanelOpen,
    startProcessing,
    stopProcessing,
    clearResults,
    error,
    clearError
  } = useAIProcessing() as any;

  const [options, setOptions] = React.useState<ProcessingOptions>({
    remove_background: true,
    identify: true,
    grade: true,
    enhance: false,
    generate_description: true
  });

  const [showResults, setShowResults] = useState(false);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if ((window as any).processingTimeoutId) {
        clearTimeout((window as any).processingTimeoutId);
      }
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      addFiles(newFiles);
    }
  };

  const handleOptionChange = (option: keyof ProcessingOptions) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  };

  const handleStartProcessing = async () => {
    initializeCardStatuses(cardPairs);
    await startProcessing(cardPairs, options, updateCardStatus);
  };

  const handleClearAll = () => {
    clearAll();
    clearResults();
  };

  const handleDeleteCard = (pairIndex: number, cardType: 'front' | 'back') => {
    if (isProcessing) return;
    
    const pair = cardPairs[pairIndex];
    if (!pair) return;

    if (cardType === 'front' && pair.front) {
      removeFile(files.indexOf(pair.front));
    } else if (cardType === 'back' && pair.back) {
      removeFile(files.indexOf(pair.back));
    }
  };

  const handleMoveCard = (fromPairIndex: number, fromCardType: 'front' | 'back', toPairIndex: number, toCardType: 'front' | 'back') => {
    if (isProcessing) return;
    
    if (moveCardBetweenPairs) {
      moveCardBetweenPairs(fromPairIndex, fromCardType, toPairIndex, toCardType);
    }
  };

  const handleMoveFromDraw = (drawIndex: number, targetPairIndex: number, targetCardType: 'front' | 'back') => {
    if (isProcessing) return;
    
    // This will be handled by the PokemonCardDisplay component's internal state
    // The component manages its own draw pile and handles the movement
  };

  // Determine dialogue state
  const getDialogueState = () => {
    if (error) return 'error';
    if (isProcessing) return 'processing';
    if (results) return 'completed';
    if (files.length > 0) return 'uploading';
    return 'empty';
  };

  return (
    <div className="pokemon-ui">
      {/* Professor Oak Dialogue */}
      <ProfessorOakDialogue
        state={getDialogueState()}
        cardCount={cardPairs.length}
        currentStep={currentStep}
        errorMessage={error || undefined}
      />

      {/* Card Display */}
      <PokemonCardDisplay
        cardPairs={cardPairs}
        cardStatuses={cardStatuses}
        results={results?.results || null}
        isProcessing={isProcessing}
        onCardClick={(index) => {
          if (results) {
            setShowResults(true);
          }
        }}
        onDeleteCard={handleDeleteCard}
        onMoveCard={handleMoveCard}
      />

      {/* File Upload */}
      <div className="pc-panel">
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--pokemon-dark-blue)', marginBottom: '12px' }}>
            📁 UPLOAD POKÉMON CARDS
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              className="pc-button primary"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files) {
                    const newFiles = Array.from(target.files);
                    addFiles(newFiles);
                  }
                };
                input.click();
              }}
              disabled={isProcessing}
            >
              📁 SELECT CARDS
            </button>
            {files.length > 0 && (
              <button
                className="pc-button danger"
                onClick={handleClearAll}
                disabled={isProcessing}
              >
                🗑️ CLEAR ALL
              </button>
            )}
          </div>
          {files.length > 0 && (
            <div style={{ 
              marginTop: '8px', 
              fontSize: '8px', 
              color: 'var(--pokemon-green)' 
            }}>
              {files.length} card{files.length !== 1 ? 's' : ''} ready for analysis
            </div>
          )}
        </div>
      </div>

      {/* Processing Options */}
      <div className="pc-panel">
        <ProcessingOptionsComponent
          options={options}
          isProcessing={isProcessing}
          onOptionChange={handleOptionChange}
        />
      </div>

      {/* Process Button */}
      <div className="pc-panel">
        <ProcessButton
          files={files}
          isProcessing={isProcessing}
          onStartProcessing={handleStartProcessing}
          onStopProcessing={stopProcessing}
        />
      </div>

      {/* Results Panel */}
      {results && (
        <PokemonResearchResults
          results={results}
          isVisible={showResults}
          onClose={() => setShowResults(false)}
        />
      )}

      {/* AI Activity Panel */}
      <PokemonAIActivityPanel
        isOpen={isActivityPanelOpen}
        onToggle={() => setIsActivityPanelOpen(!isActivityPanelOpen)}
        thoughtLog={thoughtLog}
        currentStep={currentStep}
        isProcessing={isProcessing}
      />
    </div>
  );
}

// Wrap the main component with error boundary
export default function AIAgentProcessorWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AIAgentProcessor />
    </ErrorBoundary>
  );
}