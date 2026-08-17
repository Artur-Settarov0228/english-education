import React, { useState, useEffect } from 'react';
import { 
  Volume2, RotateCw, CheckCircle, RefreshCw, 
  ArrowLeft, ArrowRight, Sparkles, Trophy, Layers, Check, X, Plus, Trash2, BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { taskService, lessonService } from '../services/api';

const DEFAULT_FLASHCARDS = [
  {
    id: 1,
    word: 'Resilience',
    phonetic: '/rɪˈzɪl.jəns/',
    partOfSpeech: 'noun',
    translation: 'Chidamlilik, matonat',
    example: 'Her resilience helped her overcome every obstacle in her career.'
  },
  {
    id: 2,
    word: 'Comprehend',
    phonetic: '/ˌkɒm.prɪˈhend/',
    partOfSpeech: 'verb',
    translation: 'Tushunmoq, anglab yetmoq',
    example: 'He could not comprehend why the project had failed.'
  },
  {
    id: 3,
    word: 'Eloquent',
    phonetic: '/ˈel.ə.kwənt/',
    partOfSpeech: 'adjective',
    translation: 'Fasoratli, notiq, chiroyli so\'zlovchi',
    example: 'She gave an eloquent speech at the international conference.'
  },
  {
    id: 4,
    word: 'Inevitable',
    phonetic: '/ɪnˈev.ɪ.tə.bəl/',
    partOfSpeech: 'adjective',
    translation: 'Muqarrar, qochib bo\'lmas',
    example: 'Change is an inevitable part of learning and growth.'
  },
  {
    id: 5,
    word: 'Perseverance',
    phonetic: '/ˌpɜː.sɪˈvɪə.rəns/',
    partOfSpeech: 'noun',
    translation: 'Qat\'iyat, sabr-toqat',
    example: 'Through hard work and perseverance, he mastered English.'
  }
];

export default function FlashcardsRunner({ currentUser }) {
  const [cards, setCards] = useState(DEFAULT_FLASHCARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState([]);
  const [reviewIds, setReviewIds] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [vocabSets, setVocabSets] = useState([]);
  const [selectedSetId, setSelectedSetId] = useState('default');
  const [groups, setGroups] = useState([]);

  // Teacher detection
  const userRole = currentUser?.role || localStorage.getItem('user_role') || 'student';
  const isTeacher = userRole === 'teacher' || userRole === 'admin' || userRole === 'manager' || localStorage.getItem('is_superuser') === 'true';

  // Teacher Add Flashcard Set Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [newWords, setNewWords] = useState([
    { word: '', translation: '', phonetic: '', partOfSpeech: 'noun', example: '' },
    { word: '', translation: '', phonetic: '', partOfSpeech: 'verb', example: '' },
    { word: '', translation: '', phonetic: '', partOfSpeech: 'adjective', example: '' }
  ]);
  const [savingSet, setSavingSet] = useState(false);

  const fetchVocabData = async () => {
    try {
      const [setsRes, groupsRes] = await Promise.all([
        taskService.getVocabularySets(),
        lessonService.getGroups()
      ]);
      const sList = Array.isArray(setsRes) ? setsRes : [];
      const gList = Array.isArray(groupsRes) ? groupsRes : [];
      setVocabSets(sList);
      setGroups(gList);
      if (gList.length > 0 && !newGroup) {
        setNewGroup(gList[0].id);
      }
    } catch (e) {
      console.log("Error loading vocab sets", e);
    }
  };

  useEffect(() => {
    fetchVocabData();
  }, []);

  const handleSetChange = (setId) => {
    setSelectedSetId(setId);
    setIsFlipped(false);
    setCurrentIndex(0);
    setMasteredIds([]);
    setReviewIds([]);
    setIsFinished(false);

    if (setId === 'default') {
      setCards(DEFAULT_FLASHCARDS);
    } else {
      const chosen = vocabSets.find(s => String(s.id) === String(setId));
      if (chosen && chosen.words && chosen.words.length > 0) {
        const transformed = chosen.words.map((w, idx) => ({
          id: w.id || idx,
          word: w.word,
          phonetic: w.phonetic || `/${w.word.toLowerCase()}/`,
          partOfSpeech: w.part_of_speech || 'vocabulary',
          translation: w.translation,
          example: w.example || `Example with "${w.word}": Practice this in daily conversations.`
        }));
        setCards(transformed);
      } else {
        setCards(DEFAULT_FLASHCARDS);
      }
    }
  };

  const handleAddWordRow = () => {
    setNewWords([
      ...newWords,
      { word: '', translation: '', phonetic: '', partOfSpeech: 'noun', example: '' }
    ]);
  };

  const handleRemoveWordRow = (index) => {
    if (newWords.length <= 1) return;
    setNewWords(newWords.filter((_, i) => i !== index));
  };

  const handleWordChange = (index, field, value) => {
    const updated = [...newWords];
    updated[index][field] = value;
    setNewWords(updated);
  };

  const handleSaveFlashcardSet = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert("Iltimos, to'plam nomini kiriting!");
      return;
    }

    const validWords = newWords.filter(w => w.word.trim() && w.translation.trim());
    if (validWords.length === 0) {
      alert("Kamida 1 ta to'liq so'z va tarjimasini kiriting!");
      return;
    }

    setSavingSet(true);
    try {
      // 1. Create VocabularySet
      const createdSet = await taskService.createVocabularySet({
        title: newTitle,
        group: newGroup || null
      });

      // 2. Create VocabularyWords
      for (const w of validWords) {
        await taskService.createVocabularyWord({
          vocab_set: createdSet.id,
          word: w.word.trim(),
          translation: w.translation.trim(),
          phonetic: w.phonetic.trim() || `/${w.word.trim().toLowerCase()}/`,
          part_of_speech: w.partOfSpeech || 'noun',
          example: w.example.trim() || `Example with "${w.word.trim()}": Essential vocabulary.`
        });
      }

      alert("Yangi fleshkarta to'plami muvaffaqiyatli saqlandi!");
      setShowAddModal(false);
      setNewTitle('');
      setNewWords([
        { word: '', translation: '', phonetic: '', partOfSpeech: 'noun', example: '' },
        { word: '', translation: '', phonetic: '', partOfSpeech: 'verb', example: '' }
      ]);
      await fetchVocabData();
      handleSetChange(createdSet.id);
    } catch (err) {
      alert("Saqlashda xatolik: " + JSON.stringify(err.response?.data || err.message));
    } finally {
      setSavingSet(false);
    }
  };

  const currentCard = cards[currentIndex] || cards[0];

  // Text to Speech Pronunciation
  const speakWord = (e, text) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Brauzeringiz ovozli talaffuzni qo'llab-quvvatlamaydi.");
    }
  };

  const handleCardDecision = (isMastered) => {
    setIsFlipped(false);
    const cardId = currentCard.id;

    if (isMastered) {
      if (!masteredIds.includes(cardId)) setMasteredIds([...masteredIds, cardId]);
    } else {
      if (!reviewIds.includes(cardId)) setReviewIds([...reviewIds, cardId]);
    }

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const restartDeck = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredIds([]);
    setReviewIds([]);
    setIsFinished(false);
  };

  const progressPercent = Math.round(((currentIndex + (isFinished ? 1 : 0)) / cards.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px', margin: '0 auto' }}>
      
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
            <Sparkles size={14} />
            <span>Ovozli Fleshkartalar (Flashcards)</span>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Interaktiv So'z Yodlash
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {isTeacher && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ padding: '8px 14px', fontSize: '13px' }}>
              <Plus size={16} />
              <span>Yangi Fleshkarta Qo'shish</span>
            </button>
          )}

          <select 
            className="form-select"
            style={{ width: 'auto', minWidth: '180px', padding: '8px 12px', fontSize: '13px' }}
            value={selectedSetId}
            onChange={(e) => handleSetChange(e.target.value)}
          >
            <option value="default">Tanlangan B2 So'zlar</option>
            {vocabSets.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>
          <span>Karta {Math.min(currentIndex + 1, cards.length)} / {cards.length}</span>
          <span style={{ color: '#2563eb' }}>{progressPercent}%</span>
        </div>
        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              background: 'linear-gradient(90deg, #2563eb, #38bdf8)', 
              width: `${progressPercent}%`, 
              transition: 'width 0.3s ease' 
            }} 
          />
        </div>
      </div>

      {/* Finished Summary Screen */}
      {isFinished ? (
        <div className="card" style={{ padding: '40px 32px', textAlign: 'center', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Trophy size={32} />
          </div>

          <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            To'plam Yakunlandi! 🎉
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
            Siz ushbu to'plamdagi barcha so'zlarni muvaffaqiyatli takrorlab chiqdingiz.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '28px' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 24px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#166534', fontWeight: '700' }}>O'zlashtirildi</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#16a34a' }}>{masteredIds.length} ta</div>
            </div>
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '12px 24px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '700' }}>Takrorlash kerak</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#d97706' }}>{reviewIds.length} ta</div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={restartDeck} style={{ padding: '10px 24px' }}>
            <RefreshCw size={16} />
            <span>Qayta Boshlash</span>
          </button>
        </div>
      ) : (
        /* Flashcard 3D Card */
        <div style={{ perspective: '1000px' }}>
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              minHeight: '280px',
              borderRadius: '16px',
              padding: '32px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              transition: 'transform 0.5s ease, box-shadow 0.2s',
              transformStyle: 'preserve-3d',
              background: isFlipped 
                ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' 
                : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              color: isFlipped ? '#ffffff' : '#0f172a',
              border: isFlipped ? '1px solid #3b82f6' : '1px solid #e2e8f0',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)'
            }}
          >
            {/* Top info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span 
                style={{ 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  textTransform: 'uppercase',
                  padding: '4px 10px', 
                  borderRadius: '6px',
                  background: isFlipped ? 'rgba(255,255,255,0.2)' : '#eff6ff',
                  color: isFlipped ? '#ffffff' : '#2563eb'
                }}
              >
                {currentCard.partOfSpeech || 'vocabulary'}
              </span>

              <button 
                onClick={(e) => speakWord(e, currentCard.word)}
                style={{
                  background: isFlipped ? 'rgba(255,255,255,0.2)' : '#eff6ff',
                  border: 'none',
                  color: isFlipped ? '#ffffff' : '#2563eb',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Talaffuzni eshitish"
              >
                <Volume2 size={18} />
              </button>
            </div>

            {/* Main Content (Front or Back) */}
            {!isFlipped ? (
              /* Front Side (English Word) */
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                  {currentCard.word}
                </h2>
                <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600' }}>
                  {currentCard.phonetic}
                </div>
              </div>
            ) : (
              /* Back Side (Uzbek Translation & Example) */
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '13px', color: '#93c5fd', fontWeight: '600', marginBottom: '4px' }}>
                  O'zbekcha Tarjimasi:
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#fef08a', marginBottom: '14px' }}>
                  {currentCard.translation}
                </h3>
                <div style={{ fontSize: '13px', color: '#e0e7ff', lineHeight: 1.5, background: 'rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '8px' }}>
                  💬 "{currentCard.example}"
                </div>
              </div>
            )}

            {/* Flip prompt footer */}
            <div style={{ textAlign: 'center', fontSize: '12px', color: isFlipped ? '#bfdbfe' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <RotateCw size={14} />
              <span>{isFlipped ? "Oldi tomoniga o'tish uchun bosing" : "Tarjimasini ko'rish uchun kartani bosing"}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '14px', marginTop: '18px' }}>
            <button
              onClick={() => handleCardDecision(false)}
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: 'center', padding: '12px', borderColor: '#fde68a', color: '#d97706' }}
            >
              <RefreshCw size={16} />
              <span>Takrorlash kerak</span>
            </button>

            <button
              onClick={() => handleCardDecision(true)}
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '12px', background: '#16a34a', borderColor: '#16a34a' }}
            >
              <Check size={16} />
              <span>Bilaman (O'zlashtirdim)</span>
            </button>
          </div>
        </div>
      )}

      {/* Teacher Modal: Add New Flashcard Deck */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Yangi Fleshkarta To'plami Qo'shish</h3>
            </div>
            
            <form onSubmit={handleSaveFlashcardSet} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div className="form-group">
                  <label>To'plam Nomi (Title) *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="Masalan: IELTS Advanced Adjectives yoki Unit 3 Flashcards" 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>Guruh (ixtiyoriy)</label>
                  <select 
                    className="form-select" 
                    value={newGroup} 
                    onChange={(e) => setNewGroup(e.target.value)}
                  >
                    <option value="">-- Barcha Guruhlar Uchun --</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>

                {/* Words list */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontWeight: '700', fontSize: '13px' }}>So'zlar va Tarjimalar ({newWords.length} ta)</label>
                    <button type="button" className="btn btn-secondary" onClick={handleAddWordRow} style={{ padding: '4px 10px', fontSize: '12px' }}>
                      <Plus size={14} /> <span>+ So'z qo'shish</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {newWords.map((item, index) => (
                      <div key={index} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>#{index + 1}-so'z</span>
                          {newWords.length > 1 && (
                            <button type="button" onClick={() => handleRemoveWordRow(index)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            required 
                            placeholder="Inglizcha so'z (e.g. Tenacious)" 
                            value={item.word} 
                            onChange={(e) => handleWordChange(index, 'word', e.target.value)} 
                          />
                          <input 
                            type="text" 
                            className="form-input" 
                            required 
                            placeholder="O'zbekcha tarjimasi (e.g. Qat'iyatli)" 
                            value={item.translation} 
                            onChange={(e) => handleWordChange(index, 'translation', e.target.value)} 
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Transkripsiya (ixtiyoriy)" 
                            value={item.phonetic} 
                            onChange={(e) => handleWordChange(index, 'phonetic', e.target.value)} 
                          />
                          <select 
                            className="form-select" 
                            value={item.partOfSpeech} 
                            onChange={(e) => handleWordChange(index, 'partOfSpeech', e.target.value)}
                          >
                            <option value="noun">Noun (Ot)</option>
                            <option value="verb">Verb (Fe'l)</option>
                            <option value="adjective">Adjective (Sifat)</option>
                            <option value="adverb">Adverb (Ravish)</option>
                          </select>
                        </div>

                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Misol gap (e.g. He is tenacious in his work.)" 
                          value={item.example} 
                          onChange={(e) => handleWordChange(index, 'example', e.target.value)} 
                        />
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
                  <span>{savingSet ? "Saqlanmoqda..." : "To'plamni Saqlash"}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
