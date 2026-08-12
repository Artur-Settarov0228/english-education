import React, { useState } from 'react';
import { Check } from 'lucide-react';

export default function DragDropMatching({ exerciseData }) {
  const [selectedTag, setSelectedTag] = useState(null);
  const [matches, setMatches] = useState({
    rainx: 'good',
    develop: 'civatrity',
    anverstry: ''
  });

  const handlePairClick = (word) => {
    if (selectedTag) {
      setMatches({ ...matches, [selectedTag]: word });
      setSelectedTag(null);
    }
  };

  return (
    <div className="card" style={{ padding: '20px' }}>
      <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>
        {exerciseData?.title || 'Short drop matching exercise'}
      </h4>
      
      {/* Progress Bar matching Image 2 */}
      <div className="progress-bar-container" style={{ marginBottom: '16px' }}>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${exerciseData?.progress || 100}%` }} />
        </div>
        <span className="progress-label">{exerciseData?.progress || 100}%</span>
      </div>

      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
        Drag-and-drop vocabulary
      </div>

      <div className="exercise-grid">
        <div className="matching-box">
          {Object.keys(matches).map((word) => (
            <div 
              key={word}
              className="draggable-tag"
              onClick={() => setSelectedTag(word)}
              style={{
                borderColor: selectedTag === word ? '#2563eb' : '#86efac',
                boxShadow: selectedTag === word ? '0 0 0 2px rgba(37,99,235,0.2)' : 'none'
              }}
            >
              {word} {matches[word] && <Check size={14} style={{ marginLeft: '6px' }} />}
            </div>
          ))}
        </div>

        <div className="matching-box">
          {['good', 'civatrity', 'select target'].map((target, idx) => (
            <div 
              key={idx} 
              className="drop-target"
              onClick={() => handlePairClick(target)}
            >
              {target}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
