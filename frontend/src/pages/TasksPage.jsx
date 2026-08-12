import React, { useState, useEffect } from 'react';
import { BookMarked, Plus, Trophy, Mic, Send, RefreshCw } from 'lucide-react';
import { taskService, lessonService } from '../services/api';

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedGroupForLeaderboard, setSelectedGroupForLeaderboard] = useState('');

  const [newTask, setNewTask] = useState({
    group: '',
    title: '',
    description: '',
    task_type: 'homework',
    skill_type: 'grammar',
    max_score: 100
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetchedTasks = await taskService.getTasks();
      setTasks(Array.isArray(fetchedTasks) ? fetchedTasks : []);

      const fetchedGroups = await lessonService.getGroups();
      setGroups(Array.isArray(fetchedGroups) ? fetchedGroups : []);
      if (fetchedGroups.length > 0 && !selectedGroupForLeaderboard) {
        setSelectedGroupForLeaderboard(fetchedGroups[0].id);
      }
    } catch (err) {
      console.error("Tasks fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedGroupForLeaderboard) {
      taskService.getLeaderboard(selectedGroupForLeaderboard)
        .then(res => setLeaderboard(Array.isArray(res) ? res : []))
        .catch(() => setLeaderboard([]));
    }
  }, [selectedGroupForLeaderboard]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await taskService.createTask(newTask);
      setShowTaskModal(false);
      setNewTask({ group: '', title: '', description: '', task_type: 'homework', skill_type: 'grammar', max_score: 100 });
      fetchData();
    } catch (err) {
      alert("Topshiriq yaratishda xatolik: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Tasks, Quizzes & Leaderboard</h2>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Backend API: `/Tasks/tasks/`, `/Tasks/grades/ratings/`</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setShowTaskModal(true)}>
            <Plus size={16} />
            <span>Yangi Topshiriq Yaratish</span>
          </button>

          <button 
            className={`btn ${activeTab === 'tasks' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('tasks')}
          >
            <BookMarked size={16} />
            <span>Topshiriqlar</span>
          </button>

          <button 
            className={`btn ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            <Trophy size={16} />
            <span>Leaderboard Reytingi</span>
          </button>
        </div>
      </div>

      {activeTab === 'tasks' ? (
        loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Topshiriqlar yuklanmoqda...</div>
        ) : tasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Hali ma'lumotlar bazasida topshiriqlar yo'q.<br />
            Yuqoridagi <strong>"Yangi Topshiriq Yaratish"</strong> tugmasini bosing!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {tasks.map((task) => (
              <div key={task.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="badge badge-active">{task.skill_type || 'General'}</span>
                  <span className="badge badge-hold">{task.task_type}</span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>{task.title}</h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>{task.description || 'Tavsif kiritilmagan'}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb' }}>Max score: {task.max_score}</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>ID: #{task.id}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Guruh Peshqadamlar Reytingi</h3>
            <select 
              className="select-filter"
              value={selectedGroupForLeaderboard} 
              onChange={(e) => setSelectedGroupForLeaderboard(e.target.value)}
            >
              <option value="">-- Guruhni tanlang --</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          {leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
              Ushbu guruh bo'yicha baholangan o'quvchilar reytingi hali yo'q.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>O'rin</th>
                  <th>O'quvchi F.I.SH</th>
                  <th>Umumiy Ball</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row) => (
                  <tr key={row.student_id}>
                    <td style={{ fontWeight: '800', color: '#2563eb' }}>#{row.rank}</td>
                    <td style={{ fontWeight: '700' }}>{row.full_name} (@{row.username})</td>
                    <td style={{ fontWeight: '800' }}>{row.total_score} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal: Create Task */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Yangi Topshiriq Yaratish</h3>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Guruh *</label>
                  <select className="form-select" required value={newTask.group} onChange={(e) => setNewTask({ ...newTask, group: e.target.value })}>
                    <option value="">-- Guruhni tanlang --</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Sarlavha/Mavzu *</label>
                  <input type="text" className="form-input" required value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Tavsif</label>
                  <textarea className="form-textarea" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Topshiriq Turi</label>
                  <select className="form-select" value={newTask.task_type} onChange={(e) => setNewTask({ ...newTask, task_type: e.target.value })}>
                    <option value="homework">Uy vazifasi</option>
                    <option value="quiz">Kichik test</option>
                    <option value="exam">Imtihon</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Ko'nikma Turi</label>
                  <select className="form-select" value={newTask.skill_type} onChange={(e) => setNewTask({ ...newTask, skill_type: e.target.value })}>
                    <option value="grammar">Grammar</option>
                    <option value="reading">Reading</option>
                    <option value="writing">Writing</option>
                    <option value="listening">Listening</option>
                    <option value="speaking">Speaking</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Maximal Ball</label>
                  <input type="number" className="form-input" value={newTask.max_score} onChange={(e) => setNewTask({ ...newTask, max_score: e.target.value })} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
