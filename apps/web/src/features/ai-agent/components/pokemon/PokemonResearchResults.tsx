import React from 'react';
import { ImageModal } from '../ui/ImageModal';
import { BatchResults } from '../../types';

interface PokemonResearchResultsProps {
  results: BatchResults | null;
  isVisible: boolean;
  onClose?: () => void;
}

export function PokemonResearchResults({ results, isVisible, onClose }: PokemonResearchResultsProps) {
  const [enlargedImage, setEnlargedImage] = React.useState<string | null>(null);
  if (!results || !isVisible) return null;

  return (
    <div className="pc-panel" style={{ marginTop: '16px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '12px', color: 'var(--pokemon-dark-green)', fontWeight: 'bold' }}>
          📋 PROFESSOR OAK'S RESEARCH REPORT
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="pc-button"
            style={{ fontSize: '8px', padding: '4px 8px' }}
          >
            ✕ CLOSE
          </button>
        )}
      </div>

      {/* Professor Oak Summary */}
      <div style={{
        background: 'var(--pokemon-light-green)',
        border: '2px solid var(--pokemon-green)',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '8px' 
        }}>
          <div style={{ fontSize: '20px', marginRight: '8px' }}>👨‍🔬</div>
          <div style={{ fontSize: '10px', color: 'var(--pokemon-dark-green)', fontWeight: 'bold' }}>
            RESEARCH SUMMARY
          </div>
        </div>
        <div style={{ fontSize: '9px', color: 'var(--pc-text)', lineHeight: '1.4' }}>
          "Excellent work! I've completed my analysis of all {results.summary.total_cards} card{results.summary.total_cards !== 1 ? 's' : ''}. 
          The success rate was {results.summary.success_rate}, and {results.summary.ready_for_ebay} card{results.summary.ready_for_ebay !== 1 ? 's' : ''} 
          {results.summary.ready_for_ebay === 1 ? ' is' : ' are'} ready for the market!"
        </div>
      </div>

      {/* Detailed Results */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '12px' 
      }}>
        {results.results.map((result, index) => (
          <div
            key={index}
            style={{
              background: 'var(--pc-panel-bg)',
              border: '2px solid var(--pc-border)',
              borderRadius: '6px',
              padding: '12px',
              boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.3), inset -1px -1px 0 rgba(0,0,0,0.3)'
            }}
          >
            {/* Card Header */}
            <div style={{ 
              fontSize: '10px', 
              color: 'var(--pokemon-dark-blue)', 
              fontWeight: 'bold',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              CARD #{index + 1}: {result.results.identification?.best?.name || 'UNKNOWN POKÉMON'}
            </div>

            {/* Processed Images */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '8px', 
              marginBottom: '12px' 
            }}>
              {result.results.orientation_corrected && (
                <div>
                  <div style={{ fontSize: '7px', color: 'var(--pokemon-blue)', marginBottom: '2px', textAlign: 'center' }}>
                    🔄 ORIENTED
                  </div>
                  <img 
                    src={`data:image/png;base64,${result.results.orientation_corrected}`} 
                    alt="Orientation corrected" 
                    style={{ 
                      width: '100%', 
                      height: '80px', 
                      objectFit: 'cover', 
                      borderRadius: '3px',
                      border: '1px solid var(--pokemon-blue)'
                    }}
                  />
                </div>
              )}
              
              {result.results.background_removed && (
                <div>
                  <div style={{ fontSize: '7px', color: 'var(--pokemon-green)', marginBottom: '2px', textAlign: 'center' }}>
                    ✂️ CROPPED
                  </div>
                  <img 
                    src={`data:image/png;base64,${result.results.background_removed}`} 
                    alt="Background removed" 
                    style={{ 
                      width: '100%', 
                      height: '80px', 
                      objectFit: 'cover', 
                      borderRadius: '3px',
                      border: '1px solid var(--pokemon-green)'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Analysis Results */}
            <div style={{ fontSize: '8px', lineHeight: '1.3' }}>
              {/* Identification */}
              {result.results.identification && (
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ color: 'var(--pokemon-blue)', fontWeight: 'bold', marginBottom: '2px' }}>
                    🔍 IDENTIFICATION
                  </div>
                  <div style={{ color: 'var(--pc-text)' }}>
                    <div>Name: {result.results.identification.best?.name}</div>
                    <div>Set: {result.results.identification.best?.set}</div>
                  </div>
                </div>
              )}

              {/* Grade */}
              {result.results.grade?.records?.[0]?.grades && (
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ color: 'var(--pokemon-yellow)', fontWeight: 'bold', marginBottom: '2px' }}>
                    📊 CONDITION ASSESSMENT
                  </div>
                  <div style={{ color: 'var(--pc-text)' }}>
                    <div>Overall Condition: {result.results.grade.records[0].grades.condition}</div>
                    <div style={{ fontSize: '6px', color: 'var(--pc-text)', opacity: 0.7, marginTop: '2px' }}>
                      (Average of front and back card condition assessment)
                    </div>
                  </div>
                  {/* Grading Images from AI */}
                  {result.results.grade.records[0]._full_url_card && (
                    <div style={{ marginTop: '4px' }}>
                      <div style={{ fontSize: '6px', color: 'var(--pokemon-blue)', marginBottom: '2px' }}>
                        🔬 AI Grading Analysis Image:
                      </div>
                      <img
                        src={result.results.grade.records[0]._full_url_card}
                        alt="AI Grading Analysis"
                        style={{
                          width: '100%',
                          maxWidth: '200px',
                          border: '1px solid var(--pc-border)',
                          borderRadius: '4px',
                          marginTop: '2px',
                          cursor: 'pointer'
                        }}
                        onClick={() => setEnlargedImage(result.results.grade.records[0]._full_url_card || null)}
                        onError={(e) => {
                          // If full URL fails, try exact URL
                          if (result.results.grade?.records?.[0]?._exact_url_card) {
                            (e.target as HTMLImageElement).src = result.results.grade.records[0]._exact_url_card;
                          } else {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }
                        }}
                      />
                    </div>
                  )}
                  {result.results.grade.records[0]._exact_url_card && !result.results.grade.records[0]._full_url_card && (
                    <div style={{ marginTop: '4px' }}>
                      <div style={{ fontSize: '6px', color: 'var(--pokemon-blue)', marginBottom: '2px' }}>
                        🔬 AI Grading Analysis Image:
                      </div>
                      <img
                        src={result.results.grade.records[0]._exact_url_card}
                        alt="AI Grading Analysis"
                        style={{
                          width: '100%',
                          maxWidth: '200px',
                          border: '1px solid var(--pc-border)',
                          borderRadius: '4px',
                          marginTop: '2px',
                          cursor: 'pointer'
                        }}
                        onClick={() => setEnlargedImage(result.results.grade.records[0]._exact_url_card || null)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Listing */}
              {result.results.listing_description && (
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ color: 'var(--pokemon-green)', fontWeight: 'bold', marginBottom: '2px' }}>
                    📝 MARKET LISTING
                  </div>
                  <div style={{ color: 'var(--pc-text)' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                      {result.results.listing_description.title}
                    </div>
                    <div style={{ fontSize: '7px', lineHeight: '1.2', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                      {result.results.listing_description.description}
                    </div>
                  </div>
                </div>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div style={{ color: 'var(--pokemon-red)' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>⚠️ ISSUES FOUND</div>
                  {result.errors.map((error, i) => (
                    <div key={i} style={{ fontSize: '7px' }}>• {error}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Professor Oak Comment */}
            <div style={{
              marginTop: '8px',
              padding: '6px',
              background: 'var(--pc-highlight)',
              border: '1px solid var(--pokemon-blue)',
              borderRadius: '3px',
              fontSize: '7px',
              color: 'var(--pokemon-dark-blue)',
              fontStyle: 'italic',
              textAlign: 'center'
            }}>
              "This card shows excellent potential for collectors!"
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ 
        marginTop: '16px', 
        display: 'flex', 
        gap: '8px', 
        justifyContent: 'center' 
      }}>
        <button className="pc-button primary" style={{ fontSize: '9px', padding: '8px 16px' }}>
          📋 EXPORT REPORT
        </button>
        <button className="pc-button" style={{ fontSize: '9px', padding: '8px 16px' }}>
          📧 SHARE RESULTS
        </button>
      </div>
      
      {/* Image Modal */}
      <ImageModal
        imageUrl={enlargedImage}
        alt="AI Grading Analysis (Enlarged)"
        onClose={() => setEnlargedImage(null)}
      />
    </div>
  );
}
