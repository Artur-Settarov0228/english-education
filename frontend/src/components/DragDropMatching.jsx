import React, { useState, useEffect } from 'react';
import { Check, Sparkles, RefreshCw, Trophy, Star, Award, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';

const VOCAB_SETS = [
  {
    id: 'general',
    title: 'A1-A2 Asosiy So\'zlar & Tarjimalari',
    pairs: [
      { id: 1, word: 'Achieve', match: 'Erishmoq' },
      { id: 2, word: 'Knowledge', match: 'Bilim' },
      { id: 3, word: 'Opportunity', match: 'Imkoniyat' },
      { id: 4, word: 'Improve', match: 'Rivojlantirmoq' },
      { id: 5, word: 'Confident', match: 'O\'ziga ishongan' }
    ]
  },
  {
    id: 'synonyms',
    title: 'Ingliz tili Sinonimlar (B1-B2)',
    pairs: [
      { id: 1, word: 'Accurate', match: 'Precise (Aniq)' },
      { id: 2, word: 'Brief', match: 'Short (Qisqa)' },
      { id: 3, word: 'Huge', match: 'Enormous (Ulkan)' },
      { id: 4, word: 'Difficult', match: 'Challenging (Qiyin)' },
      { id: 5, word: 'Quickly', match: 'Rapidly (Tezda)' }
    ]
  },
  {
    id: 'phrasal',
    title: 'Phrasal Verbs (Iborali fe\'llar)',
    pairs: [
      { id: 1, word: 'Give up', match: 'Taslim bo\'lmoq' },
      { id: 2, word: 'Look for', match: 'Qidirmoq' },
      { id: 3, word: 'Carry on', match: 'Davom ettirmoq' },
      { id: 4, word: 'Find out', match: 'Bilib olmoq' },
      { id: 5, word: 'Turn on', match: 'Yoqmoq' }
    ]
  }
];

export default function DragDropMatching() {
  const [selectedSetIndex, setSelectedSetIndex] = useState(0);
  const currentSet = VOCAB_SETS[selectedSetIndex];

  const [selectedWord, setSelectedWord] = useState(null);
  const [matches, setMatches] = useState({}); // { wordId: matchText }
  const [shuffledTargets, setShuffledTargets] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize or reset puzzle
  useEffect(() => {
    setMatches({});
    setSelectedWord(null);
    setIsCompleted(false);

    // Shuffle targets randomly
    const targets = [...currentSet.pairs.map(p => p.match)].sort(() => Math.random() - 0.5);
    setShuffledTargets(targets);
  }, [selectedSetIndex]);

  const handleWordClick = (pair) => {
    if (matches[pair.id]) return; // already solved
    setSelectedWord(pair);
  };

  const handleTargetClick = (targetText) => {
    if (!selectedWord) return;

    if (selectedWord.match === targetText) {
      // Correct match!
      const newMatches = { ...matches, [selectedWord.id]: targetText };
      setMatches(newMatches);
      setSelectedWord(null);

      // Check if all matched
      if (Object.keys(newMatches).length === currentSet.pairs.length) {
        setIsCompleted(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } else {
      // Incorrect match animation / feedback
      alert(`Xato! "${selectedWord.word}" so'zining to'g'ri jufti bu emas. Qayta urinib ko'ring.`);
    }
  };

  const solvedCount = Object.keys(matches).length;
  const progress = Math.round((solvedCount / currentSet.pairs.length) * 100);

  return (
    <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Exercise Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
            <Sparkles size={14} />
            <span>Lug'at & So'z Boyligi O'yini</span>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            {currentSet.title}
          </h3>
        </div>

        {/* Set Selector */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {VOCAB_SETS.map((set, idx) => (
            <button
              key={set.id}
              onClick={() => setSelectedSetIndex(idx)}
              className={`btn ${selectedSetIndex === idx ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Mavzu {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
          <span>Moslashtirildi: {solvedCount} / {currentSet.pairs.length}</span>
          <span style={{ color: '#2563eb' }}>{progress}%</span>
        </div>
        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              background: progress === 100 ? '#16a34a' : '#2563eb', 
              width: `${progress}%`,
              transition: 'all 0.3s ease'
            }} 
          />
        </div>
      </div>

      {/* Instructions */}
      <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', color: '#64748b' }}>
        👉 <strong>Qoidasi:</strong> Chap ustundagi so'zni tanlang va unga mos keluvchi o'ng ustundagi ma'noni bosing!
      </div>

      {/* Matching Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Column: English Words */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
            Inglizcha So'zlar:
          </div>
          {currentSet.pairs.map((p) => {
            const isSolved = Boolean(matches[p.id]);
            const isSelected = selectedWord?.id === p.id;

            return (
              <button
                key={p.id}
                onClick={() => handleWordClick(p)}
                disabled={isSolved}
                style={{
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: isSolved 
                    ? '2px solid #bbf7d0' 
                    : isSelected 
                    ? '2px solid #2563eb' 
                    : '1px solid #cbd5e1',
                  background: isSolved 
                    ? '#f0fdf4' 
                    : isSelected 
                    ? '#eff6ff' 
                    : '#ffffff',
                  color: isSolved ? '#15803d' : '#0f172a',
                  fontWeight: '700',
                  fontSize: '14px',
                  textAlign: 'left',
                  cursor: isSolved ? 'default' : 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 0 0 3px rgba(37,99,235,0.2)' : 'none'
                }}
              >
                <span>{p.word}</span>
                {isSolved && <Check size={16} color="#16a34a" />}
              </button>
            );
          })}
        </div>

        {/* Right Column: Uzbek/Synonym Targets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
            Mos Ma'nosi / Tarjimasi:
          </div>
          {shuffledTargets.map((target, idx) => {
            const isMatched = Object.values(matches).includes(target);

            return (
              <button
                key={idx}
                onClick={() => handleTargetClick(target)}
                disabled={isMatched}
                style={{
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: isMatched ? '2px solid #bbf7d0' : '1px dashed #94a3b8',
                  background: isMatched ? '#f0fdf4' : '#ffffff',
                  color: isMatched ? '#15803d' : '#334155',
                  fontWeight: '700',
                  fontSize: '14px',
                  textAlign: 'left',
                  cursor: isMatched ? 'default' : selectedWord ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{target}</span>
                {isMatched && <Check size={16} color="#16a34a" />}
              </button>
            );
          })}
        </div>

      </div>

      {/* Completion Banner */}
      {isCompleted && (
        <div style={{ textAlign: 'center', padding: '20px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
          <Trophy size={36} color="#16a34a" style={{ margin: '0 auto 8px auto' }} />
          <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#166534', margin: '0 0 4px 0' }}>
            Barakalla! Barcha so'zlar to'g'ri topildi! 🎉
          </h4>
          <p style={{ fontSize: '13px', color: '#15803d', margin: '0 0 14px 0' }}>
            Siz ushbu bosqichdagi barcha so'zlarni muvaffaqiyatli o'zlashtirdingiz.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => {
              if (selectedSetIndex < VOCAB_SETS.length - 1) {
                setSelectedSetIndex(prev => prev + 1);
              } else {
                setSelectedSetIndex(0);
              }
            }}
          >
            <RefreshCw size={16} />
            <span>Keyingi bosqichga o'tish</span>
          </button>
        </div>
      )}

    </div>
  );
}
