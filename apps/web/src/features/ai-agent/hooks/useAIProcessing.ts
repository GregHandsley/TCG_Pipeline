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
      
      // Track which card pair is currently being processed (shared across all messages)
      let currentPairIndex: number | null = null;
      
      eventSource.onmessage = (event) => {
        console.log('EventSource message received:', event.data);
        try {
          const thought = JSON.parse(event.data);
          console.log('Parsed thought:', thought);
          
          // Log metadata specifically for identification
          if (thought.pair_index !== undefined || thought.card_name) {
            console.log(`🔍 METADATA FOUND: pair_index=${thought.pair_index}, card_name=${thought.card_name}`);
          }
          
          // Debug: Check for image updates
          if (thought.image_update) {
            console.log('🖼️ Found image_update in thought:', {
              pair_index: thought.image_update.pair_index,
              card_type: thought.image_update.card_type,
              image_type: thought.image_update.image_type,
              hasImageData: !!thought.image_update.image_base64
            });
          }
          
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
            
            // Handle image updates for real-time preview
            if (thought.image_update) {
              const { pair_index, card_type, image_base64, image_type } = thought.image_update;
              console.log('📸 Image update received:', { pair_index, card_type, image_type });
              updateCardStatus(pair_index, {
                imageUpdate: {
                  cardType: card_type,
                  imageBase64: image_base64,
                  imageType: image_type
                }
              });
            }
            
            // Track which card pair is currently being processed from thoughts that mention it
            if (thought.thought) {
              const cardMatch = thought.thought.match(/Card (?:pair )?(\d+)/);
              if (cardMatch) {
                currentPairIndex = parseInt(cardMatch[1]) - 1;
                console.log(`📍 Tracking pair index: ${currentPairIndex} from thought: "${thought.thought}"`);
              }
            }
            
            // Check if thought has identification metadata (pair_index + card_name)
            // This is the most reliable way to detect identified cards
            if (thought.pair_index !== undefined && thought.card_name) {
              const cardIndex = thought.pair_index;
              const cardName = thought.card_name;
              console.log(`🆔 Card identified via METADATA: "${cardName}" for pair ${cardIndex}`);
              console.log(`📤 Calling updateCardStatus with identifiedName: "${cardName}"`);
              updateCardStatus(cardIndex, {
                identifiedName: cardName
              });
              console.log(`✅ updateCardStatus called successfully via METADATA`);
            } 
            // Fallback: Try to extract card name from thought text (for backward compatibility)
            else if (thought.thought) {
              console.log(`🔍 Checking thought for card identification: "${thought.thought}"`);
              let cardName = null;
              
              // Pattern 1: "Aha! I believe this is a {name}!" or "I believe this is a {name}!"
              // This matches after _make_thought_friendly transforms it
              const pattern1 = thought.thought.match(/(?:Aha!\s*)?I believe this is a\s+([^!]+?)!/i);
              if (pattern1) {
                cardName = pattern1[1].trim();
                console.log(`🔍 Pattern 1 (I believe) matched: "${cardName}" from "${thought.thought}"`);
              }
              
              // Pattern 2: "What an interesting find! This {name} looks great!"
              if (!cardName) {
                const pattern2 = thought.thought.match(/What an interesting find!\s+This\s+([^!.]+?)\s+looks great!/i);
                if (pattern2) {
                  cardName = pattern2[1].trim();
                  console.log(`🔍 Pattern 2 (interesting find) matched: "${cardName}" from "${thought.thought}"`);
                }
              }
              
              // Pattern 3: "Identified as {name}"
              if (!cardName) {
                const pattern3 = thought.thought.match(/Identified as\s+([^(]+?)(?:\s*\(|,|\.|!|$)/i);
                if (pattern3) {
                  cardName = pattern3[1].trim();
                  console.log(`🔍 Pattern 3 (identified as) matched: "${cardName}" from "${thought.thought}"`);
                }
              }
              
              if (cardName) {
                // Try to get pair index from the current thought first
                let cardIndex = null;
                const cardMatch = thought.thought.match(/Card (?:pair )?(\d+)/);
                if (cardMatch) {
                  cardIndex = parseInt(cardMatch[1]) - 1;
                  console.log(`📌 Found pair index ${cardIndex} in thought message`);
                } else if (currentPairIndex !== null) {
                  // Fall back to the currently tracked pair index
                  cardIndex = currentPairIndex;
                  console.log(`📌 Using tracked pair index ${cardIndex}`);
                }
                
                if (cardIndex !== null) {
                  console.log(`🆔 Card identified in real-time: "${cardName}" for pair ${cardIndex}`);
                  console.log(`📤 Calling updateCardStatus with identifiedName: "${cardName}"`);
                  updateCardStatus(cardIndex, {
                    identifiedName: cardName
                  });
                  console.log(`✅ updateCardStatus called successfully`);
                } else {
                  console.warn(`⚠️ Could not determine pair index for identified card: "${cardName}"`);
                }
              } else {
                console.log(`🔍 No card name extracted from thought: "${thought.thought}"`);
              }
            }
            
            // Update card status based on thought content
            if (thought.thought && (thought.thought.includes('Card pair') || thought.thought.includes('Card 1:') || thought.thought.includes('Card 2:'))) {
              // Match "Card pair X" or "Card X"
              const cardMatch = thought.thought.match(/Card (?:pair )?(\d+)/);
              if (cardMatch) {
                const cardIndex = parseInt(cardMatch[1]) - 1;
                currentPairIndex = cardIndex; // Update tracked pair index
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
        
        // EventSource.CONNECTING = 0, EventSource.OPEN = 1, EventSource.CLOSED = 2
        if (eventSource.readyState === EventSource.CLOSED) {
          // Connection was closed - could be normal completion or error
          console.log('EventSource connection closed');
          
          // Check if we're still processing - if so, it might be an error
          if (isProcessing) {
            setCurrentStep('Connection closed - checking status...');
            
            // Try to check if processing completed by fetching results
            fetch(`http://localhost:8000/ai/batch/results/${session_id}`)
              .then(response => {
                if (response.ok) {
                  return response.json();
                }
                throw new Error('Results not ready');
              })
              .then(data => {
                if (data.results) {
                  setResults(data.results);
                  setCurrentStep('Complete');
                  setIsProcessing(false);
                  updateCardStatus(-1, { status: 'completed' });
                } else {
                  setCurrentStep('Connection closed - please check if processing completed');
                  setIsProcessing(false);
                }
              })
              .catch(() => {
                // Retry connection once if still processing
                if (isProcessing && !(window as any).retryAttempted) {
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
                        (window as any).retryAttempted = false;
                      };
                    }
                  }, 2000);
                } else {
                  setCurrentStep('Connection failed - please try again');
                  setIsProcessing(false);
                }
              });
          }
        } else if (eventSource.readyState === EventSource.CONNECTING) {
          // Still connecting - this is normal, just wait
          console.log('EventSource still connecting...');
        } else {
          // Other error state
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
