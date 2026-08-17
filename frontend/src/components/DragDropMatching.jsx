import React, { useState, useEffect } from 'react';
import { 
  Check, Sparkles, RefreshCw, Trophy, Plus, 
  Trash2, X, BookOpen, Layers, CheckCircle2, AlertCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { taskService, lessonService } from '../services/api';

const DEFAULT_SETS = [
  {
    id: 'default-1',
    title: 'A1-A2 Asosiy So\'zlar & Tarjimalari',
    words: [
      { id: 1, word: 'Achieve', translation: 'Erishmoq' },
      { id: 2, word: 'Knowledge', translation: 'Bilim' },
      { id: 3, word: 'Opportunity', translation: 'Imkoniyat' },
      { id: 4, word: 'Improve', translation: 'Rivojlantirmoq' },
      { id: 5, word: 'Confident', translation: 'O\'ziga ishongan' }
    ]
  },
  {
    id: 'default-2',
    title: 'Ingliz tili Sinonimlar (B1-B2)',
    words: [
      { id: 1, word: 'Accurate', translation: 'Precise (Aniq)' },
      { id: 2, word: 'Brief', translation: 'Short (Qisqa)' },
      { id: 3, word: 'Huge', translation: 'Enormous (Ulkan)' },
      { id: 4, word: 'Difficult', translation: 'Challenging (Qiyin)' },
      { id: 5, word: 'Quickly', translation: 'Rapidly (Tezda)' }
    ]
  },
  {
    id: 'default-3',
    title: 'Phrasal Verbs (Iborali fe\'llar)',
    words: [
      { id: 1, word: 'Give up', translation: 'Taslim bo\'lmoq' },
      { id: 2, word: 'Look for', translation: 'Qidirmoq' },
      { id: 3, word: 'Carry on', translation: 'Davom ettirmoq' },
      { id: 4, word: 'Find out', translation: 'Bilib olmoq' },
      { id: 5, word: 'Turn on', translation: 'Yoqmoq' }
    ]
  }
];

export default function DragDropMatching({ currentUser }) {
  const [vocabSets, setVocabSets] = useState([]);
  const [selectedSetIndex, setSelectedSetIndex] = useState(0);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Puzzle State
  const [selectedWord, setSelectedWord] = useState(null);
  const [matches, setMatches] = useState({}); // { wordId: translationText }
  const [shuffledTargets, setShuffledTargets] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Teacher Modal: Add Vocabulary Set
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSetGroup, setNewSetGroup] = useState('');
  const [newSetTitle, setNewSetTitle] = useState('');
  const [newSetPairs, setNewSetPairs] = useState([
    { word: '', translation: '' },
    { word: '', translation: '' },
    { word: '', translation: '' },
    { word: '', translation: '' }
  ]);
  const [savingSet, setSavingSet] = useState(false);

  const fetchSetsAndGroups = async () => {
    setLoading(true);
    try {
      const [setsRes, groupsRes] = await Promise.all([
        taskService.getVocabularySets(),
        lessonService.getGroups()
      ]);

      const fetchedSets = Array.isArray(setsRes) ? setsRes : [];
      const fetchedGroups = Array.isArray(groupsRes) ? groupsRes : [];

      setGroups(fetchedGroups);
      if (fetchedGroups.length > 0 && !newSetGroup) {
        setNewSetGroup(fetchedGroups[0].id);
      }

      // Combine backend sets with defaults
      const combined = [...fetchedSets, ...DEFAULT_SETS];
      setVocabSets(combined);
    } catch (err) {
      console.error("Vocabulary sets fetch error:", err);
      setVocabSets(DEFAULT_SETS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetsAndGroups();
  }, []);

  const currentSet = vocabSets[selectedSetIndex] || DEFAULT_SETS[0];
  const wordPairs = currentSet?.words || [];

  // Reset puzzle when set changes
  useEffect(() => {
    setMatches({});
    setSelectedWord(null);
    setIsCompleted(false);

    if (wordPairs.length > 0) {
      const targets = [...wordPairs.map(p => p.translation)].sort(() => Math.random() - 0.5);
      setShuffledTargets(targets);
    } else {
      setShuffledTargets([]);
    }
  }, [selectedSetIndex, vocabSets]);

  const handleWordClick = (pair) => {
    if (matches[pair.id || pair.word]) return; // already solved
    setSelectedWord(pair);
  };

  const handleTargetClick = (targetText) => {
    if (!selectedWord) return;

    if (selectedWord.translation === targetText) {
      // Correct match!
      const key = selectedWord.id || selectedWord.word;
      const newMatches = { ...matches, [key]: targetText };
      setMatches(newMatches);
      setSelectedWord(null);

      // Check if all pairs matched
      if (Object.keys(newMatches).length === wordPairs.length) {
        setIsCompleted(true);
        confetti({
          particleCount: 120,
          spread: 75,
          origin: { y: 0.6 }
        });
      }
    } else {
      // Error feedback
      alert(`Xato! "${selectedWord.word}" so'zining to'g'ri jufti bu emas. Qayta urinib ko'ring.`);
    }
  };

  // Add pair row in modal
  const handleAddPairRow = () => {
    setNewSetPairs([...newSetPairs, { word: '', translation: '' }]);
  };

  // Remove pair row in modal
  const handleRemovePairRow = (index) => {
    if (newSetPairs.length <= 2) return;
    setNewSetPairs(newSetPairs.filter((_, i) => i !== index));
  };

  // Save new vocabulary set
  const handleSaveVocabularySet = async (e) => {
    e.preventDefault();
    if (!newSetTitle || !newSetGroup) {
      alert("Iltimos, guruh va to'plam nomini kiriting!");
      return;
    }

    const validPairs = newSetPairs.filter(p => p.word.trim() && p.translation.trim());
    if (validPairs.length < 2) {
      alert("Kamida 2 ta so'z juftligi kiritilishi kerak!");
      return;
    }

    setSavingSet(true);
    try {
      // 1. Create Set
      const createdSet = await taskService.createVocabularySet({
        group: newSetGroup,
        title: newSetTitle
      });

      // 2. Create individual words
      for (const pair of validPairs) {
        await taskService.createVocabularyWord({
          vocab_set: createdSet.id,
          word: pair.word.trim(),
          translation: pair.translation.trim()
        });
      }

      alert("Yangi lug'at to'plami muvaffaqiyatli qo'shildi!");
      setShowAddModal(false);
      setNewSetTitle('');
      setNewSetPairs([
        { word: '', translation: '' },
        { word: '', translation: '' },
        { word: '', translation: '' },
        { word: '', translation: '' }
      ]);
      await fetchSetsAndGroups();
      setSelectedSetIndex(0);
    } catch (err) {
      alert("Saqlashda xatolik: " + JSON.stringify(err.response?.data || err.message));
    } finally {
      setSavingSet(false);
    }
  };

  const solvedCount = Object.keys(matches).length;
  const progress = wordPairs.length > 0 ? Math.round((solvedCount / wordPairs.length) * 100) : 0;

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

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {(currentUser?.role === 'teacher' || currentUser?.role === 'admin' || currentUser?.is_superuser) && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
              style={{ padding: '6px 14px', fontSize: '13px' }}
            >
              <Plus size={16} />
              <span>Yangi To'plam Qo'shish (Teacher)</span>
            </button>
          )}

          <button className="btn btn-secondary" onClick={fetchSetsAndGroups} title="Yangilash">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Set Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {vocabSets.map((set, idx) => (
          <button
            key={set.id || idx}
            onClick={() => setSelectedSetIndex(idx)}
            className={`btn ${selectedSetIndex === idx ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
          >
            {set.title ? (set.title.length > 25 ? set.title.slice(0, 25) + '...' : set.title) : `To'plam ${idx + 1}`}
          </button>
        ))}
      </div>

      {/* Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
          <span>Moslashtirildi: {solvedCount} / {wordPairs.length}</span>
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
      {wordPairs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Ushbu to'plamda hali so'zlar kiritilmagan.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* Left Column: English Words */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
              Inglizcha So'zlar:
            </div>
            {wordPairs.map((p, idx) => {
              const key = p.id || p.word;
              const isSolved = Boolean(matches[key]);
              const isSelected = (selectedWord?.id && selectedWord?.id === p.id) || selectedWord?.word === p.word;

              return (
                <button
                  key={key || idx}
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
      )}

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
              if (selectedSetIndex < vocabSets.length - 1) {
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

      {/* Modal: Teacher Adds Vocabulary Set */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '17px', fontWeight: '800' }}>Yangi Lug'at To'plami Qo'shish (Teacher)</h3>
            </div>
            <form onSubmit={handleSaveVocabularySet}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
                
                <div className="form-group">
                  <label>Guruh *</label>
                  <select 
                    className="form-select" 
                    required 
                    value={newSetGroup} 
                    onChange={(e) => setNewSetGroup(e.target.value)}
                  >
                    <option value="">-- Guruhni tanlang --</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>To'plam / Mavzu Nomi * (Masalan: Unit 4 - Technology Words)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="Mavzu nomini kiriting..." 
                    value={newSetTitle} 
                    onChange={(e) => setNewSetTitle(e.target.value)} 
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontWeight: '700', fontSize: '13px' }}>So'zlar va ularning tarjimalari:</label>
                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={handleAddPairRow}>
                      <Plus size={14} />
                      <span>Qator qo'shish</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {newSetPairs.map((pair, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', width: '20px' }}>#{idx + 1}</span>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Inglizcha so'z" 
                          value={pair.word} 
                          onChange={(e) => {
                            const updated = [...newSetPairs];
                            updated[idx].word = e.target.value;
                            setNewSetPairs(updated);
                          }} 
                        />
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Tarjimasi / Sinonimi" 
                          value={pair.translation} 
                          onChange={(e) => {
                            const updated = [...newSetPairs];
                            updated[idx].translation = e.target.value;
                            setNewSetPairs(updated);
                          }} 
                        />
                        {newSetPairs.length > 2 && (
                          <button 
                            type="button" 
                            onClick={() => handleRemovePairRow(idx)}
                            style={{ background: '#fee2e2', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingSet}>
                  <span>{savingSet ? "Saqlanmoqda..." : "Saqlash va E'lon Qilish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
