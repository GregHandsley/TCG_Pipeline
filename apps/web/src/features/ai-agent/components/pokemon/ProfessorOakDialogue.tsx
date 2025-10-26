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
      background: 'var(--pc-panel-bg)',
      border: '3px solid var(--pokemon-blue)',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      boxShadow: 'inset 2px 2px 0 var(--pc-highlight), inset -2px -2px 0 var(--pc-shadow), 4px 4px 0 var(--pc-shadow)'
    }}>
      {/* Professor Oak Avatar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: 'var(--pokemon-green)',
          border: '2px solid var(--pokemon-dark-green)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          marginRight: '12px',
          boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.3)'
        }}>
          👨‍🔬
        </div>
        <div>
          <div style={{
            fontSize: '12px',
            color: 'var(--pokemon-dark-green)',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}>
            PROFESSOR OAK
          </div>
          <div style={{
            fontSize: '8px',
            color: 'var(--pc-text)',
            opacity: 0.8
          }}>
            POKÉMON RESEARCH LAB
          </div>
        </div>
      </div>

      {/* Dialogue */}
      <div style={{
        background: 'var(--pc-highlight)',
        border: '2px solid var(--pokemon-blue)',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '8px'
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
