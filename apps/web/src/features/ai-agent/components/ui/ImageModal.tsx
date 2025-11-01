import React from 'react';

interface ImageModalProps {
  imageUrl: string | null;
  alt: string;
  onClose: () => void;
}

export function ImageModal({ imageUrl, alt, onClose }: ImageModalProps) {
  if (!imageUrl) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-40px',
            right: 0,
            background: 'rgba(255, 255, 255, 0.8)',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: '16px',
            cursor: 'pointer',
            color: '#000',
            fontWeight: 'bold'
          }}
        >
          ✕ Close
        </button>
        <img
          src={imageUrl}
          alt={alt}
          style={{
            maxWidth: '100%',
            maxHeight: '90vh',
            objectFit: 'contain',
            borderRadius: '4px'
          }}
        />
      </div>
    </div>
  );
}

