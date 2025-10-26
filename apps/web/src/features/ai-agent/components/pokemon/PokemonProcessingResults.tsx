import React from 'react';
import { BatchResults } from '../../types';

interface PokemonProcessingResultsProps {
  results: BatchResults | null;
}

export function PokemonProcessingResults({ results }: PokemonProcessingResultsProps) {
  if (!results) return null;

  return (
    <div className="pc-panel">
      <div style={{ marginBottom: '16px' }}>
        <div className="pc-tab active">RESEARCH RESULTS</div>
        <div className="pc-tab">POKÉDEX ENTRIES</div>
        <div className="pc-tab">MARKET ANALYSIS</div>
      </div>
      
      {/* Summary Stats */}
      <div style={{ 
        background: 'var(--pokemon-light-green)', 
        border: '2px solid var(--pokemon-green)',
        borderRadius: '4px',
        padding: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '10px', color: 'var(--pokemon-dark-green)', marginBottom: '8px' }}>
          📊 RESEARCH SUMMARY
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '8px' }}>
          <div>
            <div style={{ color: 'var(--pokemon-dark-green)' }}>TOTAL CARDS</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{results.summary.total_cards}</div>
          </div>
          <div>
            <div style={{ color: 'var(--pokemon-dark-green)' }}>SUCCESS RATE</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{results.summary.success_rate}</div>
          </div>
          <div>
            <div style={{ color: 'var(--pokemon-dark-green)' }}>READY FOR MARKET</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{results.summary.ready_for_ebay}</div>
          </div>
        </div>
      </div>

      {/* Card Results Grid */}
      <div className="pc-grid pc-grid-3">
        {results.results.map((result, index) => (
          <div key={index} className="pc-panel" style={{ padding: '8px' }}>
            {/* Card Header */}
            <div style={{ 
              background: 'var(--pokemon-dark-blue)', 
              color: 'var(--pokemon-white)',
              padding: '6px',
              borderRadius: '3px',
              marginBottom: '8px',
              fontSize: '8px',
              textAlign: 'center'
            }}>
              CARD #{index + 1}: {result.results.identification?.best?.name || 'UNKNOWN'}
            </div>
            
            {/* Card Images */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '8px' }}>
              {result.results.orientation_corrected && (
                <div>
                  <div style={{ fontSize: '6px', color: 'var(--pokemon-blue)', marginBottom: '2px' }}>
                    🔄 ORIENTED
                  </div>
                  <img 
                    src={`data:image/png;base64,${result.results.orientation_corrected}`} 
                    alt="Orientation corrected" 
                    style={{ 
                      width: '100%', 
                      height: '60px', 
                      objectFit: 'cover', 
                      borderRadius: '2px',
                      border: '1px solid var(--pokemon-blue)'
                    }}
                  />
                </div>
              )}
              
              {result.results.background_removed && (
                <div>
                  <div style={{ fontSize: '6px', color: 'var(--pokemon-green)', marginBottom: '2px' }}>
                    ✂️ CROPPED
                  </div>
                  <img 
                    src={`data:image/png;base64,${result.results.background_removed}`} 
                    alt="Background removed" 
                    style={{ 
                      width: '100%', 
                      height: '60px', 
                      objectFit: 'cover', 
                      borderRadius: '2px',
                      border: '1px solid var(--pokemon-green)'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Card Data */}
            <div style={{ fontSize: '7px', lineHeight: '1.2' }}>
              {result.results.identification && (
                <div style={{ marginBottom: '4px' }}>
                  <div style={{ color: 'var(--pokemon-blue)' }}>🔍 IDENTIFICATION</div>
                  <div>NAME: {result.results.identification.best?.name}</div>
                  <div>SET: {result.results.identification.best?.set}</div>
                  <div>CONFIDENCE: {Math.round((result.results.identification.confidence || 0) * 100)}%</div>
                </div>
              )}

              {result.results.grade?.records?.[0]?.grades && (
                <div style={{ marginBottom: '4px' }}>
                  <div style={{ color: 'var(--pokemon-yellow)' }}>📊 GRADE</div>
                  <div>OVERALL: {result.results.grade.records[0].grades.final}/10</div>
                  <div>CONDITION: {result.results.grade.records[0].grades.condition}</div>
                </div>
              )}

              {result.results.listing_description && (
                <div style={{ marginBottom: '4px' }}>
                  <div style={{ color: 'var(--pokemon-green)' }}>📝 MARKET LISTING</div>
                  <div style={{ fontSize: '6px', lineHeight: '1.1' }}>
                    {result.results.listing_description.title}
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div style={{ color: 'var(--pokemon-red)' }}>
                  <div>❌ ERRORS:</div>
                  {result.errors.map((error, i) => (
                    <div key={i} style={{ fontSize: '6px' }}>• {error}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
