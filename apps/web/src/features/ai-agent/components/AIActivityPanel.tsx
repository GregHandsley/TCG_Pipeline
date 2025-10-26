import React from 'react';
import { AgentThought } from '../types';

interface AIActivityPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  thoughtLog: AgentThought[];
  currentStep: string;
  isProcessing: boolean;
}

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

export function AIActivityPanel({ isOpen, onToggle, thoughtLog, currentStep, isProcessing }: AIActivityPanelProps) {
  const newThoughtsCount = thoughtLog.filter(t => Date.now() - t.timestamp < 10000).length;
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={onToggle}
        className={`mb-2 px-4 py-2 rounded-lg shadow-lg transition-all ${
          isProcessing 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'bg-gray-600 text-white hover:bg-gray-700'
        }`}
      >
        🤖 AI Activity {newThoughtsCount > 0 && `(${newThoughtsCount})`}
      </button>
      
      {isOpen && (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-96 overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">AI Agent Thoughts</h3>
              <button onClick={onToggle} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            {currentStep && (
              <p className="text-sm text-gray-600 mt-1">{currentStep}</p>
            )}
          </div>
          <div className="p-3 max-h-64 overflow-y-auto space-y-2">
            {thoughtLog.length === 0 ? (
              <p className="text-gray-500 text-sm">No activity yet...</p>
            ) : (
              thoughtLog.slice(-10).map((thought, index) => (
                <div key={index} className="text-sm">
                  <span className="text-gray-500">
                    {(() => {
                      try {
                        const date = new Date(thought.timestamp);
                        return isNaN(date.getTime()) ? 'Just now' : date.toLocaleTimeString();
                      } catch {
                        return 'Just now';
                      }
                    })()}
                  </span>
                  <span className={`ml-2 ${getStepColor(thought.step)}`}>
                    {thought.thought}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
