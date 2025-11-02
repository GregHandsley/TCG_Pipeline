import React from 'react';

interface ProfessorOakDialogueProps {
  state: 'welcome' | 'uploading' | 'processing' | 'completed' | 'error' | 'empty';
  cardCount?: number;
  currentStep?: string;
  errorMessage?: string;
}

export function ProfessorOakDialogue({ 
  state, 
  cardCount = 0, 
  currentStep, 
  errorMessage 
}: ProfessorOakDialogueProps) {
  const getDialogue = () => {
    switch (state) {
      case 'welcome':
        return {
          greeting: "Hello there! Welcome to the world of Pokémon!",
          message: "I'm Professor Oak, and I'm here to help you analyze your Pokémon cards. This is my research laboratory where we can examine cards, identify them, and assess their condition.",
          action: "Please upload some Pokémon cards to begin our research!"
        };
      
      case 'uploading':
        return {
          greeting: "Excellent! I can see you've brought some cards!",
          message: `I'm preparing to analyze ${cardCount} card${cardCount !== 1 ? 's' : ''}. Let me set up my research equipment.`,
          action: "Once you're ready, I'll begin my examination!"
        };
      
      case 'processing':
        return {
          greeting: "Perfect! Let me examine these cards carefully...",
          message: currentStep || "I'm using my advanced research methods to analyze each card. This includes background removal, identification, grading, and creating detailed descriptions.",
          action: "Please be patient while I conduct my research!"
        };
      
      case 'completed':
        return {
          greeting: "Wonderful! My research is complete!",
          message: `I've successfully analyzed all ${cardCount} card${cardCount !== 1 ? 's' : ''}. Each card has been identified, graded, and I've prepared detailed descriptions for potential buyers.`,
          action: "You can now review my findings below!"
        };
      
      case 'error':
        return {
          greeting: "Oh my! It seems we've encountered a problem...",
          message: errorMessage || "Something went wrong during my research. This sometimes happens when the equipment needs adjustment.",
          action: "Let's try again! I'm confident we can get this working."
        };
      
      case 'empty':
        return {
          greeting: "Hello there! I'm Professor Oak!",
          message: "I'm ready to help you analyze your Pokémon cards! My research laboratory is equipped with the latest technology for card identification and grading.",
          action: "Please upload some cards so we can begin our research together!"
        };
      
      default:
        return {
          greeting: "Hello there!",
          message: "I'm Professor Oak, ready to help with your Pokémon card research!",
          action: "Let's get started!"
        };
    }
  };

  const dialogue = getDialogue();

  return (
    <div style={{
      background: '#E8F5E9',
      border: '4px solid #4CAF50',
      padding: '16px',
      marginBottom: '16px',
      boxShadow: 'inset 3px 3px 0 rgba(255,255,255,0.4), inset -3px -3px 0 rgba(0,0,0,0.2), 4px 4px 0 rgba(0,0,0,0.2)'
    }}>
      {/* Professor Oak Header - Retro Game Style */}
      <div style={{
        marginBottom: '14px',
        padding: '8px',
        background: '#4CAF50',
        border: '3px solid #2E7D32',
        boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.3)'
      }}>
        <div style={{
          fontSize: '11px',
          color: '#FFFFFF',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          textShadow: '1px 1px 0 rgba(0,0,0,0.5)'
        }}>
          PROFESSOR OAK
        </div>
        <div style={{
          fontSize: '8px',
          color: '#E8F4FD'
        }}>
          POKÉMON RESEARCH LAB
        </div>
      </div>

      {/* Dialogue - Retro Text Box */}
      <div style={{
        background: '#FFFFFF',
        border: '3px solid #2E7D32',
        padding: '12px',
        marginBottom: '8px',
        boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.1)'
      }}>
        <div style={{
          fontSize: '10px',
          color: 'var(--pokemon-dark-blue)',
          fontWeight: 'bold',
          marginBottom: '6px'
        }}>
          "{dialogue.greeting}"
        </div>
        <div style={{
          fontSize: '9px',
          color: 'var(--pc-text)',
          lineHeight: '1.4',
          marginBottom: '6px'
        }}>
          {dialogue.message}
        </div>
        <div style={{
          fontSize: '8px',
          color: 'var(--pokemon-dark-green)',
          fontStyle: 'italic'
        }}>
          {dialogue.action}
        </div>
      </div>

      {/* Status Indicator */}
      {state === 'processing' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '8px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid var(--pokemon-light-blue)',
            borderTopColor: 'var(--pokemon-blue)',
            borderRadius: '50%',
            animation: 'pokemon-spin 1s linear infinite',
            marginRight: '8px'
          }}></div>
          <div style={{
            fontSize: '8px',
            color: 'var(--pokemon-blue)',
            fontWeight: 'bold'
          }}>
            RESEARCH IN PROGRESS...
          </div>
        </div>
      )}
    </div>
  );
}
