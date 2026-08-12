import React, { useState } from 'react';
import { Award, Trophy, Star, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function QuizRunner({ quizData }) {
  const [selectedOption, setSelectedOption] = useState(0); // Default first option selected matching screenshot
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (idx) => {
    setSelectedOption(idx);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const options = quizData?.options || ['English', 'Conaton', 'Canidates', 'Rendenghies'];

  return (
    <div className="card" style={{ padding: '24px', position: 'relative' }}>
      <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
        {quizData?.question || 'Which is one multiple choice reading text?'}
      </h4>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '60%' }}>
          {options.map((opt, idx) => (
            <label 
              key={idx} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color: selectedOption === idx ? '#2563eb' : '#475569'
              }}
            >
              <input 
                type="radio" 
                name="quiz-option" 
                checked={selectedOption === idx}
                onChange={() => handleSelect(idx)}
                style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
              />
              <span>{opt}</span>
            </label>
          ))}

          <button 
            onClick={handleSubmit} 
            className="btn btn-primary" 
            style={{ width: 'fit-content', marginTop: '12px' }}
          >
            {submitted ? 'Verified ✓' : 'Submit Answer'}
          </button>
        </div>

        {/* Gamification Badges Icons matching Image 2 bottom right */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #fef08a, #eab308)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)',
              border: '3px solid #ffffff'
            }}
            title="Grammar Guru Badge"
          >
            <Star size={32} color="#ffffff" fill="#ffffff" />
          </div>

          <div 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #60a5fa, #2563eb)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              border: '3px solid #ffffff'
            }}
            title="Streak Hero Badge"
          >
            <Trophy size={32} color="#ffffff" fill="#ffffff" />
          </div>
        </div>
      </div>
    </div>
  );
}
