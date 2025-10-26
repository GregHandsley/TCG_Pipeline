import React, { useEffect } from 'react';
import { ProcessingOptions } from './types';
import { useCardPairing } from './hooks/useCardPairing';
import { useAIProcessing } from './hooks/useAIProcessing';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PokemonPCInterface } from './components/PokemonPCInterface';
import { ProcessingOptionsComponent } from './components/ProcessingOptions';
import { ProcessButton } from './components/ProcessButton';
import { PokemonProcessingResults } from './components/PokemonProcessingResults';
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
    setCardStatuses
  } = useCardPairing();

  const {
    isProcessing,
    results,
    thoughtLog,
    currentStep,
    isActivityPanelOpen,
    setIsActivityPanelOpen,
    startProcessing,
    stopProcessing,
    clearResults
  } = useAIProcessing();

  const [options, setOptions] = React.useState<ProcessingOptions>({
    remove_background: true,
    identify: true,
    grade: true,
    enhance: false,
    generate_description: true
  });

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

  return (
    <div className="pokemon-ui">
      <PokemonPCInterface
        files={files}
        cardPairs={cardPairs}
        cardStatuses={cardStatuses}
        isProcessing={isProcessing}
        currentStep={currentStep}
        thoughtCount={thoughtLog.length}
        onFileSelect={handleFileSelect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onClearAll={handleClearAll}
      />

      <div className="pc-panel">
        <ProcessingOptionsComponent
          options={options}
          isProcessing={isProcessing}
          onOptionChange={handleOptionChange}
        />
      </div>

      <div className="pc-panel">
        <ProcessButton
          files={files}
          isProcessing={isProcessing}
          onStartProcessing={handleStartProcessing}
          onStopProcessing={stopProcessing}
        />
      </div>

      {results && <PokemonProcessingResults results={results} />}

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