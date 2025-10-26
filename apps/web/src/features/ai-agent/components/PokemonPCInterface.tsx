import React from 'react';
import { CardPair, CardStatus } from '../types';
import { ProfessorOak } from './ProfessorOak';
import { CardStatusIndicator } from './CardStatusIndicator';

interface PokemonPCInterfaceProps {
  files: File[];
  cardPairs: CardPair[];
  cardStatuses: Record<number, CardStatus>;
  isProcessing: boolean;
  currentStep: string;
  thoughtCount: number;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onClearAll: () => void;
}

export function PokemonPCInterface({
  files,
  cardPairs,
  cardStatuses,
  isProcessing,
  currentStep,
  thoughtCount,
  onFileSelect,
  onDrop,
  onDragOver,
  onDragEnter,
  onClearAll
}: PokemonPCInterfaceProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="pokemon-ui">
      {/* Professor Oak */}
      <ProfessorOak 
        isProcessing={isProcessing}
        currentStep={currentStep}
        thoughtCount={thoughtCount}
      />

      {/* PC Interface */}
      <div className="pc-panel">
        {/* PC Tabs */}
        <div style={{ marginBottom: '16px' }}>
          <div className="pc-tab active">PKMN DATA</div>
          <div className="pc-tab">PARTY POKEMON</div>
          <div className="pc-tab">BOX</div>
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
          {/* Left Panel - Pokémon Data */}
          <div className="pc-panel" style={{ padding: '12px' }}>
            <div style={{ 
              background: 'var(--pokemon-light-blue)', 
              border: '2px solid var(--pokemon-blue)',
              borderRadius: '4px',
              padding: '12px',
              textAlign: 'center',
              marginBottom: '12px'
            }}>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>🃏</div>
              <div style={{ fontSize: '10px', color: 'var(--pokemon-dark-blue)' }}>
                POKÉMON CARD
              </div>
            </div>
            
            <div style={{ 
              background: 'var(--pokemon-dark-blue)', 
              color: 'var(--pokemon-white)',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '9px',
              lineHeight: '1.4'
            }}>
              <div>NAME: CARD DATA</div>
              <div>TYPE: TRADING CARD</div>
              <div>LEVEL: ANALYSIS</div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', background: 'var(--pokemon-blue)', borderRadius: '2px' }}></div>
                <div style={{ width: '8px', height: '8px', background: 'var(--pokemon-purple)', borderRadius: '2px' }}></div>
                <div style={{ width: '8px', height: '8px', background: 'var(--pokemon-orange)', borderRadius: '2px' }}></div>
                <div style={{ width: '8px', height: '8px', background: 'var(--pokemon-white)', borderRadius: '2px' }}></div>
                <div style={{ fontSize: '8px', marginLeft: '4px' }}>❤️</div>
              </div>
            </div>
          </div>

          {/* Right Panel - Party Pokémon / Box */}
          <div className="pc-panel" style={{ padding: '12px' }}>
            {/* Box Header */}
            <div style={{ 
              background: 'var(--pokemon-light-blue)', 
              border: '2px solid var(--pokemon-blue)',
              borderRadius: '4px',
              padding: '8px',
              marginBottom: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '10px', color: 'var(--pokemon-dark-blue)' }}>
                BOX {Math.ceil(cardPairs.length / 6) || 1}
              </div>
              <div className="pc-button" style={{ fontSize: '8px', padding: '4px 8px' }}>
                CLOSE BOX
              </div>
            </div>

            {/* Pokémon Storage Grid */}
            <div className="pc-grid pc-grid-6">
              {Array.from({ length: 30 }, (_, index) => {
                const pairIndex = Math.floor(index / 2);
                const isFront = index % 2 === 0;
                const pair = cardPairs[pairIndex];
                const file = isFront ? pair?.front : pair?.back;
                const status = cardStatuses[pairIndex]?.status || 'pending';

                return (
                  <div 
                    key={index}
                    className={`pokemon-slot ${file ? 'occupied' : ''} ${status}`}
                    onClick={() => !file && fileInputRef.current?.click()}
                    style={{ position: 'relative' }}
                  >
                    {file ? (
                      <>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Card ${pairIndex + 1} ${isFront ? 'Front' : 'Back'}`}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            borderRadius: '2px'
                          }}
                        />
                        <CardStatusIndicator 
                          status={status} 
                          progress={cardStatuses[pairIndex]?.progress}
                        />
                      </>
                    ) : (
                      <div style={{ fontSize: '12px', opacity: 0.5 }}>
                        {isFront ? '📷' : '📷'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Upload Instructions */}
            {files.length === 0 && (
              <div style={{ 
                marginTop: '12px', 
                padding: '8px', 
                background: 'var(--pc-highlight)', 
                border: '1px solid var(--pc-border)',
                borderRadius: '4px',
                fontSize: '8px',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '4px' }}>📋 UPLOAD INSTRUCTIONS</div>
                <div>UPLOAD EVEN NUMBER OF IMAGES</div>
                <div>ORDER: FRONT, BACK, FRONT, BACK...</div>
              </div>
            )}

            {files.length > 0 && files.length % 2 !== 0 && (
              <div style={{ 
                marginTop: '12px', 
                padding: '8px', 
                background: '#FFCDD2', 
                border: '1px solid var(--pokemon-red)',
                borderRadius: '4px',
                fontSize: '8px',
                textAlign: 'center',
                color: 'var(--pokemon-dark-red)'
              }}>
                ⚠️ INCOMPLETE PAIR - NEED EVEN NUMBER
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          marginTop: '16px', 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center' 
        }}>
          <button
            className="pc-button primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            📁 SELECT CARDS
          </button>
          
          {cardPairs.length > 0 && (
            <button
              className="pc-button danger"
              onClick={onClearAll}
              disabled={isProcessing}
            >
              🗑️ CLEAR ALL
            </button>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={onFileSelect}
          style={{ display: 'none' }}
          disabled={isProcessing}
        />

        {/* Drag and Drop Overlay */}
        <div
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDrop={onDrop}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(74, 144, 226, 0.1)',
            border: '2px dashed var(--pokemon-blue)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: 'var(--pokemon-blue)',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
            zIndex: 10
          }}
          className="drag-overlay"
        >
          📸 DROP POKÉMON CARDS HERE
        </div>
      </div>
    </div>
  );
}
