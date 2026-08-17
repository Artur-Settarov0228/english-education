import React, { useState, useEffect } from 'react';
import { 
  BookMarked, Plus, Trophy, Mic, Send, RefreshCw, 
  CheckCircle, Clock, FileText, Upload, Sparkles, 
  HelpCircle, Award, Volume2, Calendar, AlertCircle
} from 'lucide-react';
import { taskService, lessonService } from '../services/api';
import QuizRunner from '../components/QuizRunner';
import DragDropMatching from '../components/DragDropMatching';

export default function TasksPage({ currentUser }) {
  const [activeTab, setActiveTab] = useState('homework'); // 'homework', 'quizzes', 'leaderboard', 'vocabulary'
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);

  // Homework Submission Modal
  const [activeTaskForSubmission, setActiveTaskForSubmission] = useState(null);
  const [textResponse, setTextResponse] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Active Quiz for Runner
  const [activeQuizTask, setActiveQuizTask] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedTasks, fetchedGroups] = await Promise.all([
        taskService.getTasks(),
        lessonService.getGroups()
      ]);

      const tList = Array.isArray(fetchedTasks) ? fetchedTasks : [];
      const gList = Array.isArray(fetchedGroups) ? fetchedGroups : [];

      setTasks(tList);
      setGroups(gList);
      if (gList.length > 0 && !selectedGroup) {
        setSelectedGroup(gList[0].id);
      }

      // Fetch submissions and grades for current student
      if (currentUser?.id) {
        try {
          const [subRes, gradesRes] = await Promise.all([
            taskService.getSubmissions(null, currentUser.id),
            taskService.getGrades(currentUser.id)
          ]);
          setSubmissions(Array.isArray(subRes) ? subRes : []);
          setGrades(Array.isArray(gradesRes) ? gradesRes : []);
        } catch (e) {
          console.log("Submissions/Grades error", e);
        }
      }
    } catch (err) {
      console.error("Tasks fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  useEffect(() => {
    if (selectedGroup) {
      taskService.getLeaderboard(selectedGroup)
        .then(res => setLeaderboard(Array.isArray(res) ? res : []))
        .catch(() => setLeaderboard([]));
    }
  }, [selectedGroup]);

  const handleOpenQuiz = async (task) => {
    setActiveQuizTask(task);
    setLoadingQuestions(true);
    try {
      const qRes = await taskService.getQuizQuestions(task.id);
      setQuizQuestions(Array.isArray(qRes) ? qRes : []);
    } catch (e) {
      console.error("Questions error", e);
      setQuizQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleOpenSubmitModal = (task) => {
    setActiveTaskForSubmission(task);
    setTextResponse('');
    setSubmissionFile(null);
  };

  const handleSendHomework = async (e) => {
    e.preventDefault();
    if (!activeTaskForSubmission) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('task', activeTaskForSubmission.id);
      if (currentUser?.id) {
        formData.append('student', currentUser.id);
      }
      if (textResponse) {
        formData.append('text_response', textResponse);
      }
      if (submissionFile) {
        formData.append('file_attachment', submissionFile);
      }

      await taskService.submitHomework(formData);
      alert("Topshiriq javobi muvaffaqiyatli yuborildi!");
      setActiveTaskForSubmission(null);
      fetchData();
    } catch (err) {
      alert("Yuborishda xatolik: " + JSON.stringify(err.response?.data || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const homeworkTasks = tasks.filter(t => t.task_type === 'homework' || t.task_type === 'exam');
  const quizTasks = tasks.filter(t => t.task_type === 'quiz');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
            Topshiriqlar, Testlar va Reyting
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Uy vazifalarini topshiring, testlarni yeching va guruh reytingida yuqori o'rinlarni egallang
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${activeTab === 'homework' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('homework'); setActiveQuizTask(null); }}
          >
            <BookMarked size={16} />
            <span>Uy Vazifalari ({homeworkTasks.length})</span>
          </button>

          <button 
            className={`btn ${activeTab === 'quizzes' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('quizzes'); }}
          >
            <HelpCircle size={16} />
            <span>Testlar ({quizTasks.length})</span>
          </button>

          <button 
            className={`btn ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('leaderboard'); setActiveQuizTask(null); }}
          >
            <Trophy size={16} />
            <span>Reyting (Leaderboard)</span>
          </button>

          <button 
            className={`btn ${activeTab === 'vocabulary' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('vocabulary'); setActiveQuizTask(null); }}
          >
            <Sparkles size={16} />
            <span>Lug'at Mashqi</span>
          </button>

          <button className="btn btn-secondary" onClick={fetchData} title="Yangilash">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tab 1: Homework Tasks */}
      {activeTab === 'homework' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>Topshiriqlar yuklanmoqda...</div>
        ) : homeworkTasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
            Hozircha faol uy vazifalari mavjud emas.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {homeworkTasks.map((task) => {
              const mySubmission = submissions.find(s => s.task === task.id);
              const myGrade = grades.find(g => g.task === task.id);

              return (
                <div 
                  key={task.id} 
                  className="card" 
                  style={{ 
                    padding: '24px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    border: myGrade ? '1px solid #bbf7d0' : mySubmission ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span className="badge badge-active" style={{ textTransform: 'uppercase' }}>
                        {task.skill_type || 'General'}
                      </span>
                      {myGrade ? (
                        <span className="badge badge-active" style={{ background: '#dcfce7', color: '#15803d', fontWeight: '800' }}>
                          Baholandi: {myGrade.score} / {task.max_score}
                        </span>
                      ) : mySubmission ? (
                        <span className="badge badge-hold">Kutilmoqda</span>
                      ) : (
                        <span className="badge badge-hold" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                          Topshirilmagan
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                      {task.title}
                    </h3>

                    <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
                      {task.description || "Topshiriq bo'yicha qo'shimcha tavsif kiritilmagan."}
                    </p>

                    {task.due_date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#d97706', marginBottom: '16px' }}>
                        <Clock size={14} />
                        <span>Muddati: {new Date(task.due_date).toLocaleString()}</span>
                      </div>
                    )}

                    {/* Teacher feedback if graded */}
                    {myGrade && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#166534', marginBottom: '4px' }}>
                          O'qituvchi Fikri:
                        </div>
                        <div style={{ fontSize: '13px', color: '#15803d' }}>
                          {myGrade.teacher_feedback || "Ajoyib natija!"}
                        </div>
                        {myGrade.audio_feedback && (
                          <div style={{ marginTop: '8px' }}>
                            <audio controls src={myGrade.audio_feedback} style={{ width: '100%', height: '32px' }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    {myGrade ? (
                      <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} disabled>
                        <CheckCircle size={16} color="#16a34a" />
                        <span>Muvaffaqiyatli Baholangan</span>
                      </button>
                    ) : (
                      <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => handleOpenSubmitModal(task)}
                      >
                        <Send size={16} />
                        <span>{mySubmission ? "Javobni Yangilash" : "Javob Yuborish"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Tab 2: Quizzes */}
      {activeTab === 'quizzes' && (
        activeQuizTask ? (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setActiveQuizTask(null)}>
                ← Barcha Testlarga Qaytish
              </button>
            </div>
            {loadingQuestions ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Savollar yuklanmoqda...</div>
            ) : (
              <QuizRunner 
                task={activeQuizTask} 
                questions={quizQuestions} 
                currentUser={currentUser}
                onQuizCompleted={fetchData}
              />
            )}
          </div>
        ) : (
          loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>Testlar yuklanmoqda...</div>
          ) : quizTasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
              Hozircha testlar mavjud emas.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {quizTasks.map((task) => (
                <div key={task.id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span className="badge badge-active">{task.skill_type || 'Grammar'}</span>
                      <span className="badge badge-hold">Max: {task.max_score} pts</span>
                    </div>

                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                      {task.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                      {task.description || "Variantli test savollari. Javoblaringiz darhol tekshiriladi."}
                    </p>
                  </div>

                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleOpenQuiz(task)}
                  >
                    <HelpCircle size={16} />
                    <span>Testni Boshlash</span>
                  </button>
                </div>
              ))}
            </div>
          )
        )
      )}

      {/* Tab 3: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                Guruh Peshqadamlar Reytingi
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Topshiriq va testlardan to'plangan eng yuqori ballar
              </p>
            </div>

            <select 
              className="form-select"
              style={{ width: 'auto', minWidth: '200px' }}
              value={selectedGroup} 
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          {leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Ushbu guruh bo'yicha baholar reytingi hali shakllanmagan.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>O'rin</th>
                  <th>O'quvchi F.I.SH</th>
                  <th>Guruh</th>
                  <th>Umumiy Ball</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, idx) => (
                  <tr 
                    key={row.student_id || idx}
                    style={{ background: row.student_id === currentUser?.id ? '#eff6ff' : 'transparent' }}
                  >
                    <td style={{ fontWeight: '800', color: idx === 0 ? '#eab308' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#2563eb', fontSize: '16px' }}>
                      {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${row.rank || idx + 1}`}
                    </td>
                    <td style={{ fontWeight: '700' }}>
                      {row.full_name || row.username} {row.student_id === currentUser?.id && <span className="badge badge-active" style={{ marginLeft: '6px' }}>Siz</span>}
                    </td>
                    <td style={{ color: '#64748b' }}>{row.group_name || 'Guruh'}</td>
                    <td style={{ fontWeight: '800', color: '#2563eb' }}>{row.total_score} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 4: Vocabulary Matching */}
      {activeTab === 'vocabulary' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <DragDropMatching />
        </div>
      )}

      {/* Submit Homework Modal */}
      {activeTaskForSubmission && (
        <div className="modal-overlay" onClick={() => setActiveTaskForSubmission(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '17px', fontWeight: '800' }}>Topshiriq Javobini Yuborish</h3>
            </div>
            <form onSubmit={handleSendHomework}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>{activeTaskForSubmission.title}</strong>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                    {activeTaskForSubmission.description || 'Topshiriq matni'}
                  </p>
                </div>

                <div className="form-group">
                  <label>Yozma Javobingiz (Text response)</label>
                  <textarea 
                    className="form-textarea"
                    rows={4}
                    placeholder="Javobingizni shu yerga yozing..."
                    value={textResponse}
                    onChange={(e) => setTextResponse(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Ilova Fayli (PDF, Audio yozuv yoki Rasm)</label>
                  <input 
                    type="file" 
                    className="form-input"
                    onChange={(e) => setSubmissionFile(e.target.files[0])}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Maksimal hajm: 10MB</span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTaskForSubmission(null)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <Send size={16} />
                  <span>{submitting ? "Yuborilmoqda..." : "Yuborish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
