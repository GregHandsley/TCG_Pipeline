import React, { useState, useEffect } from 'react';

// Simple Badge component
function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        ok
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {children}
    </span>
  );
}

interface ProcessingOptions {
  remove_background: boolean;
  identify: boolean;
  grade: boolean;
  enhance: boolean;
  generate_description: boolean;
}

interface AgentThought {
  step: string;
  thought: string;
  timestamp: number;
}

interface ProcessingResult {
  card_index: number;
  steps_completed: string[];
  results: {
    background_removed?: string; // base64 image
    identification?: {
      best?: {
        name?: string;
        full_name?: string;
        set?: string;
        number?: string;
        rarity?: string;
        language?: string;
        edition?: string;
      };
      confidence?: number;
      needsManualReview?: boolean;
    };
    grade?: {
      records?: Array<{
        _full_url_card?: string;
        _exact_url_card?: string;
        grades?: {
          corners?: number;
          edges?: number;
          surface?: number;
          centering?: number;
          final?: number;
          condition?: string;
        };
      }>;
    };
    listing_description?: {
      title?: string;
      description?: string;
    };
  };
  errors: string[];
  agent_thoughts: AgentThought[];
}

interface BatchResults {
  results: ProcessingResult[];
  summary: {
    total_cards: number;
    successful: number;
    failed: number;
    success_rate: string;
    steps_completed: Record<string, number>;
    ready_for_ebay: number;
    needs_manual_review: number;
  };
  thought_log: AgentThought[];
  processing_plan: any;
}

export default function AIAgentProcessor() {
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState<ProcessingOptions>({
    remove_background: true,
    identify: true,
    grade: true,
    enhance: false,
    generate_description: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [results, setResults] = useState<BatchResults | null>(null);
  const [thoughtLog, setThoughtLog] = useState<AgentThought[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleOptionChange = (option: keyof ProcessingOptions) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const startProcessing = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setResults(null);
    setThoughtLog([]);
    setCurrentStep('Initializing AI Agent...');

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
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
        throw new Error(`Failed to start processing: ${startResponse.statusText}`);
      }

      const { session_id } = await startResponse.json();
      setCurrentStep('Streaming AI Agent thoughts...');
      
      // Start streaming thoughts
      const eventSource = new EventSource(`/ai/agent/stream/${session_id}`);
      
      eventSource.onmessage = (event) => {
        try {
          const thought = JSON.parse(event.data);
          
          if (thought.type === 'complete') {
            setCurrentStep('Complete');
            eventSource.close();
            setIsProcessing(false);
            
            // Get final results
            fetch(`/ai/batch/results/${session_id}`)
              .then(response => response.json())
              .then(data => {
                setResults(data.results);
              })
              .catch(error => {
                console.error('Error fetching final results:', error);
              });
          } else {
            // Add new thought to the log
            setThoughtLog(prev => [...prev, thought]);
          }
        } catch (error) {
          console.error('Error parsing thought:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();
        setCurrentStep('Error occurred');
        setIsProcessing(false);
      };
      
      // Clean up after 60 seconds
      setTimeout(() => {
        eventSource.close();
        if (isProcessing) {
          setCurrentStep('Timeout - processing took too long');
          setIsProcessing(false);
        }
      }, 60000);
      
    } catch (error) {
      console.error('Processing error:', error);
      setCurrentStep('Error occurred');
      setIsProcessing(false);
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'start': return '🚀';
      case 'planning': return '🧠';
      case 'processing': return '⚙️';
      case 'step': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      case 'complete': return '🎉';
      default: return '🤖';
    }
  };

  const getStepColor = (step: string) => {
    switch (step) {
      case 'start': return 'text-blue-600';
      case 'planning': return 'text-purple-600';
      case 'processing': return 'text-blue-600';
      case 'step': return 'text-indigo-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'complete': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-ink mb-2">🤖 AI Agent Processor</h1>
        <p className="text-muted">Intelligent batch processing with real-time thought process</p>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold text-ink mb-4">Upload Cards</h2>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="w-full p-3 border border-border rounded-lg"
          disabled={isProcessing}
        />
        {files.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-muted">Selected {files.length} files:</p>
            <ul className="text-sm text-ink">
              {files.map((file, i) => (
                <li key={i}>• {file.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Processing Options */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold text-ink mb-4">Processing Options</h2>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(options).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={value}
                onChange={() => handleOptionChange(key as keyof ProcessingOptions)}
                className="rounded border-border"
                disabled={isProcessing}
              />
              <span className="text-ink capitalize">
                {key.replace('_', ' ')} {key === 'remove_background' && '(Required)'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Process Button */}
      <div className="text-center">
        <button
          onClick={startProcessing}
          disabled={files.length === 0 || isProcessing}
          className="px-8 py-3 bg-brand text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Start AI Processing'}
        </button>
      </div>

      {/* Real-time Thought Process */}
      {(isProcessing || thoughtLog.length > 0) && (
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-ink">🤖 AI Agent Thoughts</h2>
            {isProcessing && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
                <span className="text-sm text-brand font-medium">Processing...</span>
              </div>
            )}
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4">
            {thoughtLog.map((thought, i) => (
              <div key={i} className="flex items-start space-x-3 bg-white rounded-lg p-3 border border-gray-200">
                <span className="text-2xl flex-shrink-0">{getStepIcon(thought.step)}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${getStepColor(thought.step)} mb-1`}>
                    {thought.step.toUpperCase()}
                  </div>
                  <div className="text-ink text-sm">{thought.thought}</div>
                  <div className="text-xs text-muted mt-1">
                    {new Date(thought.timestamp * 1000).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isProcessing && currentStep && (
              <div className="flex items-start space-x-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
                <span className="text-2xl flex-shrink-0">⏳</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-600">CURRENT</div>
                  <div className="text-blue-900">{currentStep}</div>
                </div>
              </div>
            )}
            
            {!isProcessing && thoughtLog.length === 0 && (
              <div className="text-center text-muted py-4">
                No thoughts yet. Start processing to see the AI Agent's decision-making process.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-xl font-semibold text-ink mb-4">📊 Processing Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-ink">{results.summary.total_cards}</div>
                <div className="text-sm text-muted">Total Cards</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.summary.successful}</div>
                <div className="text-sm text-muted">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{results.summary.failed}</div>
                <div className="text-sm text-muted">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand">{results.summary.success_rate}</div>
                <div className="text-sm text-muted">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Individual Results */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-xl font-semibold text-ink mb-4">📋 Card Results</h2>
            <div className="space-y-6">
              {results.results.map((result, i) => (
                <div key={i} className="border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-ink">Card {result.card_index + 1}</h3>
                    <Badge ok={result.errors.length === 0}>
                      {result.errors.length === 0 ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted mb-4">
                    Steps completed: {result.steps_completed.join(', ') || 'None'}
                  </div>
                  
                  {result.errors.length > 0 && (
                    <div className="text-sm text-red-600 mb-4">
                      Errors: {result.errors.join(', ')}
                    </div>
                  )}

                  {/* eBay Listing Results */}
                  {result.results.listing_description && (
                    <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="text-lg font-semibold text-green-800 mb-3">🛒 eBay Listing</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-green-700">Title:</label>
                          <p className="text-green-900 font-medium">{result.results.listing_description.title}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-green-700">Description:</label>
                          <div className="text-green-900 whitespace-pre-wrap text-sm bg-white p-3 rounded border">
                            {result.results.listing_description.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card Identification */}
                  {result.results.identification && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-lg font-semibold text-blue-800 mb-3">🔍 Card Identification</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-blue-700">Name:</label>
                          <p className="text-blue-900 font-medium">{result.results.identification.best?.name || 'Unknown'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-blue-700">Set:</label>
                          <p className="text-blue-900">{result.results.identification.best?.set || 'Unknown'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-blue-700">Number:</label>
                          <p className="text-blue-900">#{result.results.identification.best?.number || '?'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-blue-700">Confidence:</label>
                          <p className="text-blue-900">{(result.results.identification.confidence || 0) * 100}%</p>
                        </div>
                        {result.results.identification.best?.rarity && (
                          <div>
                            <label className="text-sm font-medium text-blue-700">Rarity:</label>
                            <p className="text-blue-900">{result.results.identification.best.rarity}</p>
                          </div>
                        )}
                        {result.results.identification.needsManualReview && (
                          <div className="col-span-2">
                            <Badge ok={false}>Needs Manual Review</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Grading Results */}
                  {result.results.grade && (
                    <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="text-lg font-semibold text-purple-800 mb-3">📊 Card Grading</h4>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {result.results.grade.records?.[0]?.grades && (
                          <>
                            <div>
                              <label className="text-sm font-medium text-purple-700">Corners:</label>
                              <p className="text-purple-900 font-medium">{result.results.grade.records[0].grades.corners || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-purple-700">Edges:</label>
                              <p className="text-purple-900 font-medium">{result.results.grade.records[0].grades.edges || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-purple-700">Surface:</label>
                              <p className="text-purple-900 font-medium">{result.results.grade.records[0].grades.surface || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-purple-700">Centering:</label>
                              <p className="text-purple-900 font-medium">{result.results.grade.records[0].grades.centering || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-purple-700">Final Grade:</label>
                              <p className="text-purple-900 font-bold text-lg">{result.results.grade.records[0].grades.final || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-purple-700">Condition:</label>
                              <p className="text-purple-900 font-medium">{result.results.grade.records[0].grades.condition || 'N/A'}</p>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Grading Images */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.results.grade.records?.[0]?._exact_url_card && (
                          <div>
                            <label className="text-sm font-medium text-purple-700 mb-2 block">Cropped Card (AI Isolated):</label>
                            <img 
                              src={result.results.grade.records[0]._exact_url_card} 
                              alt="Cropped card" 
                              className="w-full h-auto rounded border border-purple-300 hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        )}
                        {result.results.grade.records?.[0]?._full_url_card && (
                          <div>
                            <label className="text-sm font-medium text-purple-700 mb-2 block">Graded Card (With Analysis):</label>
                            <img 
                              src={result.results.grade.records[0]._full_url_card} 
                              alt="Graded card with analysis" 
                              className="w-full h-auto rounded border border-purple-300 hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Background Removed Image */}
                  {result.results.background_removed && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">✂️ Background Removed</h4>
                      <img 
                        src={`data:image/png;base64,${result.results.background_removed}`} 
                        alt="Card with background removed" 
                        className="w-full max-w-md h-auto rounded border border-gray-300 hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
