import React from 'react';

interface ProfessorOakProps {
  isProcessing: boolean;
  currentStep: string;
  thoughtCount: number;
}

export function ProfessorOak({ isProcessing, currentStep, thoughtCount }: ProfessorOakProps) {
  return (
    <div className="professor-oak">
      <div className="professor-oak-avatar">
        👨‍🔬
      </div>
      <div className="professor-oak-name">PROFESSOR OAK</div>
      <div className="professor-oak-title">POKÉMON RESEARCH LAB</div>
      
      {isProcessing && (
        <div style={{ marginTop: '12px', fontSize: '9px', color: 'var(--pokemon-blue)' }}>
          🔬 ANALYZING POKÉMON CARDS...
        </div>
      )}
      
      {currentStep && (
        <div style={{ marginTop: '8px', fontSize: '8px', color: 'var(--pc-text)', opacity: 0.8 }}>
          {currentStep}
        </div>
      )}
      
      {thoughtCount > 0 && (
        <div style={{ marginTop: '8px', fontSize: '8px', color: 'var(--pokemon-green)' }}>
          💭 {thoughtCount} RESEARCH NOTES
        </div>
      )}
    </div>
  );
}
