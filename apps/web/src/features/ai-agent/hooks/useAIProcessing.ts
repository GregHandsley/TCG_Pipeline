import { useState, useRef } from 'react';
import { AgentThought, BatchResults, ProcessingOptions, CardPair } from '../types';

export function useAIProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BatchResults | null>(null);
  const [thoughtLog, setThoughtLog] = useState<AgentThought[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [isActivityPanelOpen, setIsActivityPanelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startProcessing = async (cardPairs: CardPair[], options: ProcessingOptions, updateCardStatus: (index: number, status: any) => void) => {
    if (cardPairs.length === 0) {
      alert('Please upload an even number of images (front and back pairs)');
      return;
    }

    try {
      setIsProcessing(true);
      setResults(null);
      setThoughtLog([]);
      setCurrentStep('Initializing AI Agent...');
      setError(null); // Clear any previous errors
      
      // Reset retry flag for new processing session
      (window as any).retryAttempted = false;
      
      const formData = new FormData();
      
      // Add files as pairs (front, back, front, back, ...)
      cardPairs.forEach(pair => {
        if (pair.front) formData.append('files', pair.front);
        if (pair.back) formData.append('files', pair.back);
      });
      
      formData.append('remove_background', options.remove_background.toString());
      formData.append('identify', options.identify.toString());
      formData.append('grade', options.grade.toString());
      formData.append('enhance', options.enhance.toString());
      formData.append('generate_description', options.generate_description.toString());

      setCurrentStep('Starting background processing...');

      // Start async processing
      const startResponse = await fetch('/ai/batch/process-async', {
        method: 'POST',
        body: formData
      });

      if (!startResponse.ok) {
        const errorText = await startResponse.text();
        console.error('Start processing failed:', errorText);
        throw new Error(`Failed to start processing: ${startResponse.statusText}`);
      }

      const responseData = await startResponse.json();
      const { session_id } = responseData;
      setCurrentStep('Streaming AI Agent thoughts...');
      
      // Start streaming thoughts - use direct API URL since EventSource doesn't work well with Vite proxy
      const eventSource = new EventSource(`http://localhost:8000/ai/agent/stream/${session_id}`);
      
      eventSource.onopen = () => {
        console.log('EventSource connection opened successfully');
        console.log('EventSource URL:', eventSource.url);
      };
      
      eventSource.onmessage = (event) => {
        console.log('EventSource message received:', event.data);
        try {
          const thought = JSON.parse(event.data);
          console.log('Parsed thought:', thought);
          
          // Validate thought object
          if (!thought || typeof thought !== 'object') {
            console.warn('Invalid thought object received:', thought);
            return;
          }
          
          if (thought.type === 'complete') {
            console.log('Processing complete, closing EventSource');
            setCurrentStep('Complete');
            eventSource.close();
            setIsProcessing(false);
            
            // Update all card statuses to completed
            updateCardStatus(-1, { status: 'completed' }); // -1 means update all
            
            // Get final results
            fetch(`/ai/batch/results/${session_id}`)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
              })
              .then(data => {
                if (data.results) {
                  setResults(data.results);
                } else {
                  console.error('No results in response:', data);
                  setCurrentStep('No results received');
                  setIsProcessing(false);
                }
              })
              .catch(error => {
                console.error('Error fetching final results:', error);
                setCurrentStep('Error fetching results');
                setIsProcessing(false);
              });
          } else {
            // Add new thought to the log
            setThoughtLog(prev => [...prev, thought]);
            
            // Update current step with the latest thought
            if (thought.thought) {
              setCurrentStep(thought.thought);
            }
            
            // Update card status based on thought content
            if (thought.thought && (thought.thought.includes('Card 1:') || thought.thought.includes('Card 2:'))) {
              const cardMatch = thought.thought.match(/Card (\d+):/);
              if (cardMatch) {
                const cardIndex = parseInt(cardMatch[1]) - 1;
                updateCardStatus(cardIndex, { 
                  status: 'processing',
                  progress: thought.step === 'success' ? 100 : 50
                });
              }
            }
          }
        } catch (error) {
          console.error('Error parsing thought:', error);
          console.error('Raw event data:', event.data);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        console.log('EventSource readyState:', eventSource.readyState);
        console.log('EventSource URL:', eventSource.url);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          setCurrentStep('Connection closed - processing may have completed');
          setIsProcessing(false);
        } else {
          setCurrentStep('Connection error - retrying...');
          eventSource.close();
          
          // Retry connection after 2 seconds (only once to avoid infinite loop)
          if (!(window as any).retryAttempted) {
            (window as any).retryAttempted = true;
            setTimeout(() => {
              if (isProcessing) {
                console.log('Retrying EventSource connection...');
                const retryEventSource = new EventSource(`http://localhost:8000/ai/agent/stream/${session_id}`);
                retryEventSource.onmessage = eventSource.onmessage;
                retryEventSource.onerror = (retryError) => {
                  console.error('Retry EventSource error:', retryError);
                  retryEventSource.close();
                  setCurrentStep('Connection failed - please try again');
                  setIsProcessing(false);
                };
                retryEventSource.onopen = () => {
                  console.log('Retry EventSource connection opened');
                  (window as any).retryAttempted = false; // Reset for future retries
                };
              }
            }, 2000);
          } else {
            setCurrentStep('Connection failed - please try again');
            setIsProcessing(false);
          }
        }
      };
      
      // Clean up after 60 seconds
      const timeoutId = setTimeout(() => {
        eventSource.close();
        if (isProcessing) {
          setCurrentStep('Timeout - processing took too long');
          setIsProcessing(false);
        }
      }, 60000);
      
      // Store timeout ID for potential cleanup
      (window as any).processingTimeoutId = timeoutId;
      
    } catch (error) {
      console.error('Processing error:', error);
      setError(`Failed to start research: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setCurrentStep('Error occurred');
      setIsProcessing(false);
    }
  };

  const stopProcessing = () => {
    setIsProcessing(false);
    setCurrentStep('Stopped by user');
    if ((window as any).processingTimeoutId) {
      clearTimeout((window as any).processingTimeoutId);
    }
  };

  const clearResults = () => {
    setResults(null);
    setThoughtLog([]);
    setCurrentStep('');
  };

  const clearError = () => {
    setError(null);
  };

  return {
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
  } as const;
}
