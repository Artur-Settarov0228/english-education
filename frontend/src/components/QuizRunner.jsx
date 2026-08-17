import React, { useState } from 'react';
import { Award, Trophy, Star, CheckCircle, ArrowRight, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { taskService } from '../services/api';

export default function QuizRunner({ task, questions = [], currentUser, onQuizCompleted }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionId: 'A' }
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  if (!questions || questions.length === 0) {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
        <AlertCircle size={32} color="#f59e0b" style={{ margin: '0 auto 12px auto' }} />
        <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
          Test savollari topilmadi
        </h4>
        <p style={{ fontSize: '13px', margin: 0 }}>
          Ushbu test uchun hozircha o'qituvchi tomonidan savollar biriktirilmagan.
        </p>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const handleSelectOption = (optionKey) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQ.id]: optionKey
    });
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    try {
      // Calculate score locally or submit to backend
      let correctCount = 0;
      questions.forEach(q => {
        if (selectedAnswers[q.id] && selectedAnswers[q.id].toUpperCase() === (q.correct_option || '').toUpperCase()) {
          correctCount++;
        }
      });

      const maxScore = task?.max_score || 100;
      const score = Math.round((correctCount / totalQuestions) * maxScore);

      // Try sending to backend submission
      try {
        const formData = new FormData();
        formData.append('task', task.id);
        if (currentUser?.id) {
          formData.append('student', currentUser.id);
        }
        formData.append('selected_answers', JSON.stringify(selectedAnswers));
        await taskService.submitHomework(formData);
      } catch (err) {
        console.log("Quiz submission note:", err);
      }

      setResult({
        totalQuestions,
        correctCount,
        score,
        maxScore,
        passed: score >= 60
      });

      if (score >= 80) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }

      if (onQuizCompleted) {
        onQuizCompleted();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="card" style={{ padding: '36px', textAlign: 'center', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' }}>
        <div 
          style={{ 
            width: '72px', 
            height: '72px', 
            borderRadius: '50%', 
            background: result.score >= 80 ? 'linear-gradient(135deg, #fef08a, #eab308)' : '#dbeafe', 
            color: result.score >= 80 ? '#ffffff' : '#2563eb',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 6px 16px rgba(37,99,235,0.2)'
          }}
        >
          {result.score >= 80 ? <Trophy size={36} /> : <CheckCircle size={36} />}
        </div>

        <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
          {result.score >= 80 ? "Ajoyib Natija! 🎉" : "Test Yakunlandi!"}
        </h3>

        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
          Siz {result.totalQuestions} ta savoldan {result.correctCount} tasiga to'g'ri javob berdingiz.
        </p>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 24px', borderRadius: '12px', marginBottom: '24px' }}>
          <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: '700' }}>To'plangan Ball:</span>
          <span style={{ fontSize: '24px', color: '#2563eb', fontWeight: '800' }}>{result.score} / {result.maxScore}</span>
        </div>

        {result.score === result.maxScore && (
          <div style={{ padding: '12px', background: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px', marginBottom: '20px', color: '#854d0e', fontSize: '13px', fontWeight: '700' }}>
            ⭐ Sizga "Grammar Guru" yutug'i va nishoni taqdim etildi!
          </div>
        )}

        <div>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setResult(null);
              setCurrentQuestionIndex(0);
              setSelectedAnswers({});
            }}
          >
            <RefreshCw size={16} />
            <span>Qayta topshirish</span>
          </button>
        </div>
      </div>
    );
  }

  const options = [
    { key: 'A', text: currentQ.option_a },
    { key: 'B', text: currentQ.option_b },
    { key: 'C', text: currentQ.option_c },
    { key: 'D', text: currentQ.option_d },
  ].filter(o => o.text);

  const selectedForCurrent = selectedAnswers[currentQ.id];

  return (
    <div className="card" style={{ padding: '28px' }}>
      
      {/* Progress & Question Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb' }}>
          Savol {currentQuestionIndex + 1} / {totalQuestions}
        </span>
        <span className="badge badge-active">{task?.skill_type || 'Grammar'}</span>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '24px' }}>
        <div 
          style={{ 
            height: '100%', 
            background: '#2563eb', 
            width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
            transition: 'width 0.3s ease'
          }} 
        />
      </div>

      {/* Question Text */}
      <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', marginBottom: '20px', lineHeight: 1.5 }}>
        {currentQ.question_text}
      </h4>

      {/* Options List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
        {options.map((opt) => {
          const isSelected = selectedForCurrent === opt.key;
          return (
            <div
              key={opt.key}
              onClick={() => handleSelectOption(opt.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 18px',
                borderRadius: '12px',
                border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                background: isSelected ? '#eff6ff' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div 
                style={{ 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '50%', 
                  background: isSelected ? '#2563eb' : '#f1f5f9', 
                  color: isSelected ? '#ffffff' : '#64748b',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '13px'
                }}
              >
                {opt.key}
              </div>
              <span style={{ fontSize: '15px', fontWeight: isSelected ? '700' : '500', color: isSelected ? '#1e40af' : '#334155' }}>
                {opt.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Nav buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '18px' }}>
        <button
          className="btn btn-secondary"
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
          style={{ visibility: currentQuestionIndex === 0 ? 'hidden' : 'visible' }}
        >
          <ArrowLeft size={16} />
          <span>Oldingi</span>
        </button>

        {isLastQuestion ? (
          <button
            className="btn btn-primary"
            disabled={submitting}
            onClick={handleSubmitQuiz}
            style={{ padding: '10px 24px', fontWeight: '700' }}
          >
            <span>{submitting ? 'Tekshirilmoqda...' : 'Testni Yakunlash'}</span>
            <CheckCircle size={16} />
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
          >
            <span>Keyingi</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>

    </div>
  );
}
