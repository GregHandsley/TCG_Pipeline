import React, { useEffect } from 'react';
import { ProcessingOptions } from './types';
import { useCardPairing } from './hooks/useCardPairing';
import { useAIProcessing } from './hooks/useAIProcessing';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FileUpload } from './components/FileUpload';
import { ProcessingOptionsComponent } from './components/ProcessingOptions';
import { ProcessButton } from './components/ProcessButton';
import { CardsGrid } from './components/CardsGrid';
import { ProcessingResults } from './components/ProcessingResults';
import { AIActivityPanel } from './components/AIActivityPanel';

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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🤖 AI Card Processor</h1>
        <p className="text-gray-600">Batch process multiple cards with intelligent AI analysis</p>
      </div>

      <FileUpload
        files={files}
        cardPairs={cardPairs}
        cardStatuses={cardStatuses}
        isProcessing={isProcessing}
        onFileSelect={handleFileSelect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onClearAll={handleClearAll}
      />

      <ProcessingOptionsComponent
        options={options}
        isProcessing={isProcessing}
        onOptionChange={handleOptionChange}
      />

      <ProcessButton
        files={files}
        isProcessing={isProcessing}
        onStartProcessing={handleStartProcessing}
        onStopProcessing={stopProcessing}
      />

      <CardsGrid
        files={files}
        cardStatuses={cardStatuses}
        results={results}
        isProcessing={isProcessing}
        onFileRemove={removeFile}
      />

      {results && <ProcessingResults results={results} />}

      <AIActivityPanel
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