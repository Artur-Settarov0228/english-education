import React, { useState, useEffect } from 'react';
import { 
  BookMarked, Plus, Trophy, Mic, Send, RefreshCw, 
  CheckCircle, Clock, FileText, Upload, Sparkles, 
  HelpCircle, Award, Volume2, Calendar, AlertCircle, 
  Layers, Check, UserCheck, Star, Trash2
} from 'lucide-react';
import { taskService, lessonService, userService } from '../services/api';
import QuizRunner from '../components/QuizRunner';
import DragDropMatching from '../components/DragDropMatching';
import FlashcardsRunner from '../components/FlashcardsRunner';

export default function TasksPage({ currentUser }) {
  const [activeTab, setActiveTab] = useState('homework'); // 'homework', 'quizzes', 'grading', 'leaderboard', 'flashcards', 'vocabulary'
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);

  // Role check
  const userRole = currentUser?.role || localStorage.getItem('user_role') || 'student';
  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin' || userRole === 'manager' || localStorage.getItem('is_superuser') === 'true';

  // Homework Submission Modal (Student)
  const [activeTaskForSubmission, setActiveTaskForSubmission] = useState(null);
  const [textResponse, setTextResponse] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Active Quiz for Runner (Student)
  const [activeQuizTask, setActiveQuizTask] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Teacher Modals: Create Task
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    group: '',
    title: '',
    description: '',
    task_type: 'homework',
    max_score: 100,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [savingTask, setSavingTask] = useState(false);

  // Teacher Modals: Grade Submission
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeScore, setGradeScore] = useState(100);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

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
        setNewTask(prev => ({ ...prev, group: gList[0].id }));
      }

      if (isTeacherOrAdmin) {
        const [allSubs, studentsRes] = await Promise.all([
          taskService.getSubmissions(),
          userService.getUsers('student')
        ]);
        setSubmissions(Array.isArray(allSubs) ? allSubs : []);
        setStudents(Array.isArray(studentsRes) ? studentsRes : []);
      } else if (currentUser?.id) {
        const [subRes, gradesRes] = await Promise.all([
          taskService.getSubmissions(null, currentUser.id),
          taskService.getGrades(currentUser.id)
        ]);
        setSubmissions(Array.isArray(subRes) ? subRes : []);
        setGrades(Array.isArray(gradesRes) ? gradesRes : []);
      }
    } catch (err) {
      console.error("Tasks fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser, isTeacherOrAdmin]);

  useEffect(() => {
    if (selectedGroup) {
      taskService.getLeaderboard(selectedGroup)
        .then(res => setLeaderboard(Array.isArray(res) ? res : []))
        .catch(() => setLeaderboard([]));
    }
  }, [selectedGroup]);

  // Handle Create Task (Teacher/Admin)
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.group) {
      alert("Iltimos, guruh va vazifa sarlavhasini kiriting!");
      return;
    }

    setSavingTask(true);
    try {
      await taskService.createTask(newTask);
      alert("Yangi topshiriq muvaffaqiyatli yaratildi!");
      setShowCreateTaskModal(false);
      setNewTask({
        group: groups[0]?.id || '',
        title: '',
        description: '',
        task_type: 'homework',
        max_score: 100,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      fetchData();
    } catch (err) {
      alert("Vazifa yaratishda xatolik: " + JSON.stringify(err.response?.data || err.message));
    } finally {
      setSavingTask(false);
    }
  };

  // Handle Grade Submission (Teacher/Admin)
  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    setSavingGrade(true);
    try {
      await taskService.createGrade({
        submission: gradingSubmission.id,
        score: gradeScore,
        feedback_text: gradeFeedback
      });
      alert("Baho va fikr muvaffaqiyatli saqlandi!");
      setGradingSubmission(null);
      fetchData();
    } catch (err) {
      alert("Baholashda xatolik: " + JSON.stringify(err.response?.data || err.message));
    } finally {
      setSavingGrade(false);
    }
  };

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
            Vazifalar, Testlar va Reyting
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {isTeacherOrAdmin 
              ? "O'quvchilarga topshiriq va testlar berish hamda javoblarni baholash"
              : "Uy vazifalarini topshiring, testlarni yeching va reytingda yuqorilang"}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isTeacherOrAdmin && (
            <button className="btn btn-primary" onClick={() => setShowCreateTaskModal(true)}>
              <Plus size={16} />
              <span>Yangi Vazifa / Test Qo'shish</span>
            </button>
          )}

          <button className="btn btn-secondary" onClick={fetchData} title="Yangilash">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
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

        {isTeacherOrAdmin && (
          <button 
            className={`btn ${activeTab === 'grading' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('grading'); setActiveQuizTask(null); }}
          >
            <UserCheck size={16} />
            <span>Topshirilgan Javoblar ({submissions.length})</span>
          </button>
        )}

        <button 
          className={`btn ${activeTab === 'flashcards' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('flashcards'); setActiveQuizTask(null); }}
        >
          <Sparkles size={16} />
          <span>Fleshkartalar (Audio 🔊)</span>
        </button>

        <button 
          className={`btn ${activeTab === 'vocabulary' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('vocabulary'); setActiveQuizTask(null); }}
        >
          <Layers size={16} />
          <span>Lug'at Mashqi</span>
        </button>

        <button 
          className={`btn ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('leaderboard'); setActiveQuizTask(null); }}
        >
          <Trophy size={16} />
          <span>Reyting (Leaderboard)</span>
        </button>
      </div>

      {/* Tab 1: Homework Tasks */}
      {activeTab === 'homework' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Vazifalar yuklanmoqda...</div>
        ) : homeworkTasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <BookMarked size={40} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>Hozircha uy vazifalari mavjud emas</h3>
            {isTeacherOrAdmin && <p style={{ fontSize: '13px', margin: 0 }}>Yuqoridagi <strong>"Yangi Vazifa Qo'shish"</strong> tugmasi orqali vazifa yarating.</p>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {homeworkTasks.map((task) => {
              const mySubmission = submissions.find(s => s.task === task.id);
              const isSubmitted = Boolean(mySubmission);

              return (
                <div key={task.id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span className="badge badge-active">{task.group_name || 'Guruh'}</span>
                      {isSubmitted ? (
                        <span className="badge badge-active" style={{ background: '#dcfce7', color: '#166534' }}>Topshirilgan ✓</span>
                      ) : (
                        <span className="badge badge-hold">Kutilmoqda</span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                      {task.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
                      {task.description || "Ushbu topshiriqni o'z vaqtida bajarib topshiring."}
                    </p>

                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', marginBottom: '18px' }}>
                      <span>Maksimal Ball: <strong>{task.max_score} pts</strong></span>
                      <span>Muddati: <strong>{task.deadline || 'Cheksiz'}</strong></span>
                    </div>
                  </div>

                  <div>
                    {!isTeacherOrAdmin && (
                      <button 
                        className={`btn ${isSubmitted ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => handleOpenSubmitModal(task)}
                      >
                        <Upload size={16} />
                        <span>{isSubmitted ? "Javobni Qayta Yuborish" : "Javobni Topshirish"}</span>
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
            <button className="btn btn-secondary" onClick={() => setActiveQuizTask(null)} style={{ marginBottom: '16px' }}>
              ← Barcha Testlarga Qaytish
            </button>
            <QuizRunner 
              task={activeQuizTask} 
              questions={quizQuestions} 
              loading={loadingQuestions}
              currentUser={currentUser}
              onFinish={() => { setActiveQuizTask(null); fetchData(); }}
            />
          </div>
        ) : (
          loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Testlar yuklanmoqda...</div>
          ) : quizTasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
              <HelpCircle size={40} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Hozircha faol testlar yo'q</h3>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {quizTasks.map((task) => (
                <div key={task.id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span className="badge badge-active" style={{ marginBottom: '12px' }}>{task.group_name}</span>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>{task.title}</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>{task.description || "Savollarga to'g'ri javob bering va ball to'plang."}</p>
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleOpenQuiz(task)}>
                    <HelpCircle size={16} />
                    <span>Testni Boshlash</span>
                  </button>
                </div>
              ))}
            </div>
          )
        )
      )}

      {/* Tab 3: Teacher Grading View */}
      {activeTab === 'grading' && isTeacherOrAdmin && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>O'quvchilar Topshirgan Javoblar Ro'yxati</h3>
          </div>
          {submissions.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>Hozircha topshirilgan javoblar yo'q.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>O'quvchi</th>
                  <th>Topshiriq</th>
                  <th>Javob Matni</th>
                  <th>Fayl / Ovoz</th>
                  <th>Sana</th>
                  <th>Amal</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td>#{sub.id}</td>
                    <td><strong>{sub.student_name || `Student #${sub.student}`}</strong></td>
                    <td>{sub.task_title || `Task #${sub.task}`}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sub.text_response || '-'}
                    </td>
                    <td>
                      {sub.file_attachment ? (
                        <a href={sub.file_attachment} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Faylni Ko'rish</a>
                      ) : '-'}
                    </td>
                    <td>{sub.submitted_at?.split('T')[0] || 'N/A'}</td>
                    <td>
                      <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => { setGradingSubmission(sub); setGradeScore(100); }}>
                        <Star size={14} />
                        <span>Baholash</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 4: Flashcards */}
      {activeTab === 'flashcards' && (
        <FlashcardsRunner currentUser={currentUser} />
      )}

      {/* Tab 5: Vocabulary Matching */}
      {activeTab === 'vocabulary' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <DragDropMatching currentUser={currentUser} />
        </div>
      )}

      {/* Tab 6: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Guruh Reytingi</h3>
            <select className="form-select" style={{ width: 'auto' }} value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          {leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Hozircha reyting ma'lumotlari shakllanmagan.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {leaderboard.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: index === 0 ? '#fefce8' : '#f8fafc', border: index === 0 ? '1px solid #fef08a' : '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: index === 0 ? '#eab308' : '#e2e8f0', color: index === 0 ? '#fff' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px' }}>
                      {index + 1}
                    </div>
                    <strong>{item.student__username || item.student__first_name}</strong>
                  </div>
                  <span style={{ fontWeight: '800', color: '#2563eb' }}>{Math.round(item.total_score || 0)} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Teacher Modal: Create Task */}
      {showCreateTaskModal && (
        <div className="modal-overlay" onClick={() => setShowCreateTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Yangi Topshiriq / Test Yaratish</h3>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Guruh *</label>
                  <select className="form-select" required value={newTask.group} onChange={(e) => setNewTask({ ...newTask, group: e.target.value })}>
                    <option value="">-- Guruhni tanlang --</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Topshiriq Turi</label>
                  <select className="form-select" value={newTask.task_type} onChange={(e) => setNewTask({ ...newTask, task_type: e.target.value })}>
                    <option value="homework">Uy Vazifasi (Homework)</option>
                    <option value="quiz">Test (Quiz)</option>
                    <option value="exam">Imtihon (Exam)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Sarlavha (Title) *</label>
                  <input type="text" className="form-input" required placeholder="Masalan: Essay on Future Goals" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Tavsif / Savol matni</label>
                  <textarea className="form-input" rows={3} placeholder="Topshiriq yo'riqnomasi..." value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Maksimal Ball</label>
                    <input type="number" className="form-input" value={newTask.max_score} onChange={(e) => setNewTask({ ...newTask, max_score: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Muddati (Deadline)</label>
                    <input type="date" className="form-input" value={newTask.deadline} onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateTaskModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" disabled={savingTask}>{savingTask ? "Saqlanmoqda..." : "Topshiriqni Saqlash"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Modal: Grade Submission */}
      {gradingSubmission && (
        <div className="modal-overlay" onClick={() => setGradingSubmission(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>O'quvchi Javobini Baholash</h3>
            </div>
            <form onSubmit={handleSaveGrade}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                  <div><strong>O'quvchi:</strong> {gradingSubmission.student_name}</div>
                  <div><strong>Topshiriq:</strong> {gradingSubmission.task_title}</div>
                  <div style={{ marginTop: '8px' }}><strong>Javob:</strong> {gradingSubmission.text_response || 'Fayl biriktirilgan'}</div>
                </div>

                <div className="form-group">
                  <label>Qo'yiladigan Ball (Maks. 100)</label>
                  <input type="number" className="form-input" required max={100} min={0} value={gradeScore} onChange={(e) => setGradeScore(e.target.value)} />
                </div>

                <div className="form-group">
                  <label>Ustoz Fikri / Izohi (Feedback)</label>
                  <textarea className="form-input" rows={3} placeholder="Ajoyib natija! Grammatika bo'yicha tavsiyalar..." value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setGradingSubmission(null)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" disabled={savingGrade}>{savingGrade ? "Saqlanmoqda..." : "Bahoni Tasdiqlash"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Modal: Submit Homework */}
      {activeTaskForSubmission && (
        <div className="modal-overlay" onClick={() => setActiveTaskForSubmission(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Vazifa Javobini Topshirish</h3>
            </div>
            <form onSubmit={handleSendHomework}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 4px 0' }}>{activeTaskForSubmission.title}</h4>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{activeTaskForSubmission.description}</p>
                </div>

                <div className="form-group">
                  <label>Matnli Javob (Essay / Matn)</label>
                  <textarea className="form-input" rows={4} placeholder="Javobingizni bu yerga yozing..." value={textResponse} onChange={(e) => setTextResponse(e.target.value)} />
                </div>

                <div className="form-group">
                  <label>Fayl biriktirish (PDF, Word, Audio yoki Rasm)</label>
                  <input type="file" className="form-input" onChange={(e) => setSubmissionFile(e.target.files[0])} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTaskForSubmission(null)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <Send size={16} />
                  <span>{submitting ? "Yuborilmoqda..." : "Javobni Yuborish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
