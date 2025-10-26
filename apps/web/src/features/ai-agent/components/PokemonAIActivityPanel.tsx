import React from 'react';
import { AgentThought } from '../types';

interface PokemonAIActivityPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  thoughtLog: AgentThought[];
  currentStep: string;
  isProcessing: boolean;
}

const getStepColor = (step: string) => {
  switch (step) {
    case 'start': return 'var(--pokemon-blue)';
    case 'planning': return 'var(--pokemon-purple)';
    case 'processing': return 'var(--pokemon-blue)';
    case 'step': return 'var(--pokemon-indigo)';
    case 'success': return 'var(--pokemon-green)';
    case 'error': return 'var(--pokemon-red)';
    case 'complete': return 'var(--pokemon-green)';
    default: return 'var(--pokemon-gray)';
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
    default: return '📝';
  }
};

export function PokemonAIActivityPanel({ 
  isOpen, 
  onToggle, 
  thoughtLog, 
  currentStep, 
  isProcessing 
}: PokemonAIActivityPanelProps) {
  const newThoughtsCount = thoughtLog.filter(t => Date.now() - t.timestamp < 10000).length;
  
  return (
    <div className="pokemon-ai-panel" style={{ display: isOpen ? 'block' : 'none' }}>
      <div className="pokemon-ai-header">
        <div className="pokemon-ai-title">
          👨‍🔬 PROF. OAK RESEARCH NOTES
          {newThoughtsCount > 0 && ` (${newThoughtsCount})`}
        </div>
        <button className="pokemon-ai-close" onClick={onToggle}>
          ✕
        </button>
      </div>
      
      <div className="pokemon-ai-content">
        {currentStep && (
          <div style={{ 
            marginBottom: '8px', 
            padding: '6px', 
            background: 'var(--pokemon-light-blue)', 
            border: '1px solid var(--pokemon-blue)',
            borderRadius: '3px',
            fontSize: '8px',
            color: 'var(--pokemon-dark-blue)',
            textAlign: 'center'
          }}>
            🔬 {currentStep}
          </div>
        )}
        
        {thoughtLog.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            fontSize: '8px', 
            color: 'var(--pokemon-gray)',
            padding: '16px'
          }}>
            NO RESEARCH NOTES YET...
          </div>
        ) : (
          thoughtLog.slice(-8).map((thought, index) => (
            <div key={index} className="pokemon-ai-thought">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '4px',
                fontSize: '8px',
                color: getStepColor(thought.step)
              }}>
                <span style={{ marginRight: '4px' }}>
                  {getStepIcon(thought.step)}
                </span>
                <span>
                  {(() => {
                    try {
                      const date = new Date(thought.timestamp);
                      return isNaN(date.getTime()) ? 'Just now' : date.toLocaleTimeString();
                    } catch {
                      return 'Just now';
                    }
                  })()}
                </span>
              </div>
              <div style={{ fontSize: '8px', lineHeight: '1.3' }}>
                {thought.thought}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
