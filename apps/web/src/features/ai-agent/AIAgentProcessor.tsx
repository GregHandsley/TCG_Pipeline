import React, { useEffect, useState } from 'react';
import { ProcessingOptions } from './types';
import { useCardPairing } from './hooks/useCardPairing';
import { useAIProcessing } from './hooks/useAIProcessing';
import { ErrorBoundary } from './components/ui';
import { ProfessorOakDialogue, PokemonCardDisplay, PokemonResearchResults, PokemonAIActivityPanel } from './components/pokemon';
import { ProcessingOptions as ProcessingOptionsComponent, ProcessButton } from './components/processing';
import './styles/pokemon-ui.css';

function AIAgentProcessor() {
  const {
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
    updateCardSlot,
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
  const [showPokemonRun, setShowPokemonRun] = useState(false);

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
    setOptions(prev => {
      const newOptions = { ...prev, [option]: !prev[option] };
      
      // If enabling description, ensure identify and grade are also enabled
      if (option === 'generate_description' && newOptions.generate_description) {
        newOptions.identify = true;
        newOptions.grade = true;
      }
      
      // If disabling identify or grade while description is enabled, also disable description
      if ((option === 'identify' || option === 'grade') && !newOptions[option] && prev.generate_description) {
        newOptions.generate_description = false;
      }
      
      return newOptions;
    });
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
    
    // Use the new removeCardFromPair function which works directly with cardPairs
    // This prevents the index shifting issue that was causing random deletions
    removeCardFromPair(pairIndex, cardType);
  };

  const handleUploadToSlot = (pairIndex: number, cardType: 'front' | 'back') => {
    console.log('Upload to slot requested:', { pairIndex, cardType });
    
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      if (files && files.length > 0) {
        const file = files[0];
        console.log('File selected for slot:', { fileName: file.name, fileType: file.type, pairIndex, cardType });
        
        // Update the specific slot with the new file
        updateCardSlot(pairIndex, cardType, file);
      }
    };
    
    // Trigger the file input
    input.click();
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
    <div className="pokemon-ui" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Running Pokémon Animation */}
      {showPokemonRun && (
        <div style={{
          position: 'fixed',
          bottom: '20%',
          left: '-100px',
          fontSize: '64px',
          zIndex: 9999,
          animation: 'pokemonRun 2.5s linear, pokemonBounce 0.3s ease-in-out infinite',
          imageRendering: 'pixelated',
          filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.3))'
        }}>
          {['🐉', '⚡', '🔥', '💧', '🌿', '❄️'][Math.floor(Math.random() * 6)]}
        </div>
      )}
      <style>{`
        @keyframes pokemonRun {
          0% { 
            left: -100px;
          }
          100% { 
            left: calc(100vw + 100px);
          }
        }
        @keyframes pokemonBounce {
          0%, 100% { 
            transform: translateY(0) scaleX(1.1) scaleY(0.9);
          }
          50% { 
            transform: translateY(-15px) scaleX(0.9) scaleY(1.1);
          }
        }
      `}</style>
      {/* Page Header - Retro PC Monitor Style */}
      <div style={{
        background: '#2C2C2C',
        border: '6px solid #1A1A1A',
        borderRadius: '4px',
        padding: '6px',
        marginBottom: '24px',
        boxShadow: 'inset 0 0 0 2px #3A3A3A, 0 6px 0 #0A0A0A',
        position: 'relative'
      }}>
        {/* Monitor Screen */}
        <div style={{
          background: 'linear-gradient(180deg, #4A90E2 0%, #2E5B8A 100%)',
          border: '3px solid #1A3A5A',
          padding: '20px',
          position: 'relative',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}>
          {/* Scan Lines Effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
            pointerEvents: 'none',
            zIndex: 1
          }}></div>
          {/* Content */}
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
            <div style={{
              fontSize: '18px',
              color: '#FFFFFF',
              fontWeight: 'bold',
              marginBottom: '8px',
              textShadow: '2px 2px 0 #1A3A5A, -1px -1px 0 rgba(255,255,255,0.3)',
              letterSpacing: '1px'
            }}>
              BILL'S PC
            </div>
            <div style={{
              fontSize: '8px',
              color: '#C8E0F0',
              letterSpacing: '1px',
              marginBottom: '4px'
            }}>
              POKÉMON CARD STORAGE SYSTEM
            </div>
            <button
              onClick={() => {
                setShowPokemonRun(true);
                setTimeout(() => setShowPokemonRun(false), 3000);
              }}
              style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.2)',
                border: '2px solid rgba(255,255,255,0.4)',
                padding: '4px 12px',
                fontSize: '8px',
                color: '#FFFFFF',
                marginTop: '4px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.1s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
              }}
            >
              PRESS START
            </button>
          </div>
        </div>
        {/* Monitor Stand */}
        <div style={{
          background: '#3A3A3A',
          height: '8px',
          margin: '4px auto 0',
          width: '60%',
          border: '2px solid #2A2A2A',
          borderTop: 'none'
        }}></div>
      </div>

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
          drawCards={drawCards}
          results={results?.results || null}
          isProcessing={isProcessing}
          onCardClick={(index) => {
            if (results) {
              setShowResults(true);
            }
          }}
          onDeleteCard={handleDeleteCard}
          onMoveCard={handleMoveCard}
          onMoveCardFromDraw={moveCardFromDrawToPair}
          onAddCardToDraw={addCardToDraw}
          onRemoveCardFromDraw={removeCardFromDraw}
          onUploadToSlot={handleUploadToSlot}
        />

      {/* File Upload */}
      <div className="pc-panel">
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--pokemon-dark-blue)', marginBottom: '12px' }}>
            UPLOAD POKÉMON CARDS
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
              SELECT CARDS
            </button>
            {files.length > 0 && (
              <button
                className="pc-button danger"
                onClick={handleClearAll}
                disabled={isProcessing}
              >
                CLEAR ALL
              </button>
            )}
          </div>
          {cardPairs.length > 0 && (
            <div style={{ 
              marginTop: '8px', 
              fontSize: '8px', 
              color: 'var(--pokemon-green)' 
            }}>
              {cardPairs.length} card pair{cardPairs.length !== 1 ? 's' : ''} ready for analysis
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
          cardPairs={cardPairs}
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