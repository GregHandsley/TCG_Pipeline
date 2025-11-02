import React, { useEffect, useMemo } from 'react';
import { CardPair, CardStatus, ProcessingResult } from '../../types';
import { CardStatusIndicator } from './CardStatusIndicator';

interface CardPairProps {
  pair: CardPair;
  index: number;
  status: CardStatus;
  result: ProcessingResult | undefined;
  isProcessing: boolean;
  isDragOver: boolean;
  dragOverTarget?: {pairIndex: number, cardType: 'front' | 'back'} | null;
  onCardClick?: (pairIndex: number) => void;
  onDeleteCard?: (pairIndex: number, cardType: 'front' | 'back') => void;
  onUploadToSlot?: (pairIndex: number, cardType: 'front' | 'back') => void;
  onDragStart: (e: React.DragEvent, pairIndex: number, cardType: 'front' | 'back') => void;
  onDragOver: (e: React.DragEvent, targetPairIndex: number, targetCardType: 'front' | 'back') => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetPairIndex: number, targetCardType: 'front' | 'back') => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export function CardPairComponent({
  pair,
  index,
  status,
  result,
  isProcessing,
  isDragOver,
  dragOverTarget,
  onCardClick,
  onDeleteCard,
  onUploadToSlot,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd
}: CardPairProps) {
  // Debug logging
  useEffect(() => {
    console.log(`CardPair ${index} updated:`, {
      front: pair.front ? `${pair.front.name} (${pair.front.type})` : 'null',
      back: pair.back ? `${pair.back.name} (${pair.back.type})` : 'null',
      status: status,
      identifiedName: status?.identifiedName,
      resultName: result?.results?.identification?.best?.name
    });
  }, [pair.front, pair.back, index, status, result]);

  // Store processed images for front and back separately
  const [frontProcessedImage, setFrontProcessedImage] = React.useState<string | null>(null);
  const [backProcessedImage, setBackProcessedImage] = React.useState<string | null>(null);
  
  // Store identified name in component state to force re-render
  const [identifiedName, setIdentifiedName] = React.useState<string | null>(null);

  // Update processed images when status changes
  useEffect(() => {
    if (status?.imageUpdate?.imageBase64) {
      console.log(`🖼️ Image update for pair ${index}:`, {
        cardType: status.imageUpdate.cardType,
        imageType: status.imageUpdate.imageType,
        hasImageData: !!status.imageUpdate.imageBase64,
        imageLength: status.imageUpdate.imageBase64.length
      });
      const imageDataUrl = `data:image/png;base64,${status.imageUpdate.imageBase64}`;
      if (status.imageUpdate.cardType === 'front') {
        console.log(`✅ Updating front image for pair ${index}`);
        setFrontProcessedImage(imageDataUrl);
      } else if (status.imageUpdate.cardType === 'back') {
        console.log(`✅ Updating back image for pair ${index}`);
        setBackProcessedImage(imageDataUrl);
      }
    }
  }, [status?.imageUpdate?.imageBase64, status?.imageUpdate?.cardType, index]);
  
  // Update identified name when status changes
  useEffect(() => {
    console.log(`🔍 CardPair ${index} - status.identifiedName: "${status?.identifiedName}", local identifiedName: "${identifiedName}"`);
    if (status?.identifiedName && status.identifiedName !== identifiedName) {
      console.log(`✨ Setting identified name for pair ${index}: "${status.identifiedName}"`);
      setIdentifiedName(status.identifiedName);
    }
  }, [status?.identifiedName, index, identifiedName]);

  // Memoize blob URLs for original files
  const frontOriginalUrl = useMemo(() => {
    return pair.front ? URL.createObjectURL(pair.front) : null;
  }, [pair.front]);

  const backOriginalUrl = useMemo(() => {
    return pair.back ? URL.createObjectURL(pair.back) : null;
  }, [pair.back]);

  // Get image URLs - prioritize processed images over originals
  const frontImageUrl = frontProcessedImage || frontOriginalUrl;
  const backImageUrl = backProcessedImage || backOriginalUrl;

  // Cleanup URLs when component unmounts (only for Blob URLs, not base64)
  useEffect(() => {
    return () => {
      // Only revoke Object URLs, not base64 data URLs
      if (frontOriginalUrl) {
        URL.revokeObjectURL(frontOriginalUrl);
      }
      if (backOriginalUrl) {
        URL.revokeObjectURL(backOriginalUrl);
      }
    };
  }, [frontOriginalUrl, backOriginalUrl]);

  return (
    <div
      style={{
        background: 'var(--pc-panel-bg)',
        border: `3px solid ${isDragOver ? 'var(--pokemon-blue)' : 'var(--pc-border)'}`,
        borderRadius: '12px',
        padding: '8px',
        transition: 'all 0.3s ease',
        position: 'relative',
        boxShadow: isDragOver 
          ? '0 8px 32px rgba(74, 144, 226, 0.4)' 
          : '0 4px 16px rgba(0,0,0,0.1)',
        transform: isDragOver ? 'scale(1.02)' : 'scale(1)'
      }}
    >
      {/* Status Indicator */}
      <div style={{ marginBottom: '8px' }}>
        <CardStatusIndicator status={status.status} progress={status.progress} />
      </div>
      
      {/* Card Pair - FRONT AND BACK SIDE BY SIDE */}
      <div style={{ 
        display: 'flex', 
        gap: '3px', 
        marginBottom: '8px',
        alignItems: 'flex-start'
      }}>
        {/* Front Card */}
        <div style={{ position: 'relative', flex: '1' }}>
          <div style={{ 
            fontSize: '12px', 
            color: 'var(--pokemon-blue)', 
            marginBottom: '8px',
            textAlign: 'center',
            fontWeight: 'bold',
            width: '100%',
            display: 'block',
            whiteSpace: 'pre'
          }}>
            FRONT{'\n'}CARD
          </div>
          <div
            draggable={!isProcessing}
            onDragStart={(e) => onDragStart(e, index, 'front')}
            onDragOver={(e) => onDragOver(e, index, 'front')}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, index, 'front')}
            onDragEnd={onDragEnd}
            onClick={() => onCardClick?.(index)}
            style={{
              aspectRatio: '3/4',
              background: 'var(--pc-border)',
              borderRadius: '8px',
              overflow: 'hidden',
              border: `3px solid ${
                dragOverTarget?.pairIndex === index && dragOverTarget?.cardType === 'front' 
                  ? 'var(--pokemon-blue)' 
                  : 'var(--pc-border)'
              }`,
              maxHeight: '140px',
              cursor: isProcessing ? 'default' : 'grab',
              transition: 'all 0.3s ease',
              position: 'relative',
              boxShadow: dragOverTarget?.pairIndex === index && dragOverTarget?.cardType === 'front'
                ? '0 8px 32px rgba(74, 144, 226, 0.6)' 
                : '0 4px 12px rgba(74, 144, 226, 0.2)',
              transform: dragOverTarget?.pairIndex === index && dragOverTarget?.cardType === 'front'
                ? 'scale(1.05)' 
                : 'scale(1)',
              opacity: 1,
              filter: 'none'
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.borderColor = 'var(--pokemon-blue)';
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(74, 144, 226, 0.4)';
                // Show delete button
                const deleteBtn = e.currentTarget.querySelector('[data-delete-button="front"]') as HTMLElement;
                if (deleteBtn) {
                  deleteBtn.style.opacity = '1';
                  deleteBtn.style.pointerEvents = 'auto';
                }
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--pc-border)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.2)';
                // Hide delete button
                const deleteBtn = e.currentTarget.querySelector('[data-delete-button="front"]') as HTMLElement;
                if (deleteBtn) {
                  deleteBtn.style.opacity = '0';
                  deleteBtn.style.pointerEvents = 'none';
                }
            }}
          >
            {pair.front ? (
              <img
                src={frontImageUrl}
                alt="Front"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 1,
                  filter: 'none'
                }}
                onLoad={() => console.log('Front image loaded for pair', index)}
                onError={() => console.log('Front image failed to load for pair', index)}
              />
            ) : (
              <div 
                onClick={() => onUploadToSlot?.(index, 'front')}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  color: 'var(--pokemon-gray)',
                  background: 'var(--pc-border)',
                  cursor: isProcessing ? 'default' : 'pointer',
                  transition: 'all 0.3s ease',
                  border: '2px dashed var(--pokemon-gray)',
                  borderRadius: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.background = 'var(--pokemon-light-blue)';
                    e.currentTarget.style.color = 'var(--pokemon-blue)';
                    e.currentTarget.style.borderColor = 'var(--pokemon-blue)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--pc-border)';
                  e.currentTarget.style.color = 'var(--pokemon-gray)';
                  e.currentTarget.style.borderColor = 'var(--pokemon-gray)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title={isProcessing ? 'Processing...' : 'Click to upload front card'}
              >
                <div style={{
                  fontSize: '10px',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}>
                  CLICK TO UPLOAD
                </div>
              </div>
            )}
            {/* Drag Indicator */}
            {!isProcessing && pair.front && (
              <div style={{
                position: 'absolute',
                top: '6px',
                left: '6px',
                background: 'rgba(74, 144, 226, 0.9)',
                color: 'white',
                fontSize: '10px',
                padding: '4px 8px',
                borderRadius: '4px',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                DRAG
              </div>
            )}
            {/* Delete Button */}
            {pair.front && !isProcessing && (
              <button
                data-delete-button="front"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCard?.(index, 'front');
                }}
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '24px',
                height: '24px',
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(20px)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                transition: 'all 0.2s ease',
                zIndex: 10,
                opacity: 0,
                pointerEvents: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.85)';
                e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.65)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
              }}
              title="Delete front card"
            >
              ×
            </button>
            )}
          </div>
        </div>

        {/* Back Card */}
        <div style={{ position: 'relative', flex: '1' }}>
          <div style={{ 
            fontSize: '12px', 
            color: 'var(--pokemon-green)', 
            marginBottom: '8px',
            textAlign: 'center',
            fontWeight: 'bold',
            width: '100%',
            display: 'block',
            whiteSpace: 'pre'
          }}>
            BACK{'\n'}CARD
          </div>
          <div
            draggable={!isProcessing}
            onDragStart={(e) => onDragStart(e, index, 'back')}
            onDragOver={(e) => onDragOver(e, index, 'back')}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, index, 'back')}
            onDragEnd={onDragEnd}
            onClick={() => onCardClick?.(index)}
            style={{
              aspectRatio: '3/4',
              background: 'var(--pc-border)',
              borderRadius: '8px',
              overflow: 'hidden',
              border: `3px solid ${
                dragOverTarget?.pairIndex === index && dragOverTarget?.cardType === 'back' 
                  ? 'var(--pokemon-green)' 
                  : 'var(--pc-border)'
              }`,
              maxHeight: '140px',
              cursor: isProcessing ? 'default' : 'grab',
              transition: 'all 0.3s ease',
              position: 'relative',
              boxShadow: dragOverTarget?.pairIndex === index && dragOverTarget?.cardType === 'back'
                ? '0 8px 32px rgba(76, 175, 80, 0.6)' 
                : '0 4px 12px rgba(76, 175, 80, 0.2)',
              transform: dragOverTarget?.pairIndex === index && dragOverTarget?.cardType === 'back'
                ? 'scale(1.05)' 
                : 'scale(1)',
              opacity: 1,
              filter: 'none'
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.borderColor = 'var(--pokemon-green)';
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
                // Show delete button
                const deleteBtn = e.currentTarget.querySelector('[data-delete-button="back"]') as HTMLElement;
                if (deleteBtn) {
                  deleteBtn.style.opacity = '1';
                  deleteBtn.style.pointerEvents = 'auto';
                }
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--pc-border)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.2)';
                // Hide delete button
                const deleteBtn = e.currentTarget.querySelector('[data-delete-button="back"]') as HTMLElement;
                if (deleteBtn) {
                  deleteBtn.style.opacity = '0';
                  deleteBtn.style.pointerEvents = 'none';
                }
            }}
          >
            {pair.back ? (
              <img
                src={backImageUrl}
                alt="Back"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 1,
                  filter: 'none'
                }}
                onLoad={() => console.log('Back image loaded for pair', index)}
                onError={() => console.log('Back image failed to load for pair', index)}
              />
            ) : (
              <div 
                onClick={() => onUploadToSlot?.(index, 'back')}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  color: 'var(--pokemon-gray)',
                  background: 'var(--pc-border)',
                  cursor: isProcessing ? 'default' : 'pointer',
                  transition: 'all 0.3s ease',
                  border: '2px dashed var(--pokemon-gray)',
                  borderRadius: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.background = 'var(--pokemon-light-green)';
                    e.currentTarget.style.color = 'var(--pokemon-green)';
                    e.currentTarget.style.borderColor = 'var(--pokemon-green)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--pc-border)';
                  e.currentTarget.style.color = 'var(--pokemon-gray)';
                  e.currentTarget.style.borderColor = 'var(--pokemon-gray)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title={isProcessing ? 'Processing...' : 'Click to upload back card'}
              >
                <div style={{
                  fontSize: '10px',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}>
                  CLICK TO UPLOAD
                </div>
              </div>
            )}
            {/* Drag Indicator */}
            {!isProcessing && pair.back && (
              <div style={{
                position: 'absolute',
                top: '6px',
                left: '6px',
                background: 'rgba(76, 175, 80, 0.9)',
                color: 'white',
                fontSize: '10px',
                padding: '4px 8px',
                borderRadius: '4px',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                DRAG
              </div>
            )}
            {/* Delete Button */}
            {pair.back && !isProcessing && (
              <button
                data-delete-button="back"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCard?.(index, 'back');
                }}
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '24px',
                  height: '24px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(20px)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  transition: 'all 0.2s ease',
                  zIndex: 10,
                  opacity: 0,
                  pointerEvents: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.85)';
                  e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.65)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
                }}
              title="Delete back card"
            >
              ×
            </button>
            )}
          </div>
        </div>
      </div>

      {/* Card Info - Always visible */}
      <div style={{ 
        background: 'rgba(74, 144, 226, 0.1)',
        padding: '8px',
        borderRadius: '8px',
        border: '2px solid rgba(74, 144, 226, 0.2)',
        minHeight: '40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '6px'
      }}>
        {/* Card Name - Always visible, updates in real-time */}
        <div 
          style={{ 
            fontWeight: 'bold', 
            color: identifiedName ? 'var(--pokemon-green)' : 'var(--pokemon-dark-blue)', 
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            visibility: 'visible',
            opacity: 1,
            width: '100%',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
          }}
          title={`Result: ${result?.results.identification?.best?.name || 'none'}, Status: ${identifiedName || 'none'}, Pair: ${pair.name || 'none'}`}
        >
          {(() => {
            const displayName = result?.results.identification?.best?.name || identifiedName || pair.name || `CARD ${index + 1}`;
            console.log(`🏷️ CardPair ${index} displaying: "${displayName}" (result: ${result?.results.identification?.best?.name}, identifiedName: ${identifiedName}, pair.name: ${pair.name})`);
            return displayName;
          })()}
        </div>
        
        {result?.results.identification && result.results.identification.best?.set && (
          <div style={{ color: 'var(--pokemon-blue)', fontSize: '10px' }}>
            Set: {result.results.identification.best.set}
          </div>
        )}
        
        {result?.results.grade?.records?.[0]?.grades && (
          <div style={{ color: 'var(--pokemon-yellow)', fontSize: '10px' }}>
            Condition: {result.results.grade.records[0].grades.condition}
          </div>
        )}
        
        {result?.results.listing_description && (
          <div style={{ color: 'var(--pokemon-green)', fontSize: '10px' }}>
            Ready
          </div>
        )}
      </div>

      {/* Professor Oak Comment */}
      {status.status === 'completed' && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          background: 'var(--pokemon-light-green)',
          border: '2px solid var(--pokemon-green)',
          borderRadius: '6px',
          fontSize: '10px',
          color: 'var(--pokemon-dark-green)',
          fontStyle: 'italic',
          textAlign: 'center',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          "Analysis complete!"
        </div>
      )}
    </div>
  );
}
