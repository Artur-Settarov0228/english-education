import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreHorizontal, Trash2, ShieldCheck, UserCheck, AlertCircle, RefreshCw, Edit } from 'lucide-react';
import QuickViewDrawer from '../components/QuickViewDrawer';
import { userService } from '../services/api';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [levelFilter, setLevelFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [telegramStatus, setTelegramStatus] = useState(null);
  
  const [newStudent, setNewStudent] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'student'
  });

  const [editingStudent, setEditingStudent] = useState(null);
  const [editPassword, setEditPassword] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await userService.getUsers(''); // fetch ALL users
      setStudents(Array.isArray(data) ? data : []);
      if (data && data.length > 0 && !selectedStudent) {
        setSelectedStudent(data[0]);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Serverga ulanishda xatolik yuz berdi. Backend ishga tushganini va JWT token mavjudligini tekshiring.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent?.id) {
      userService.checkTelegramStatus(selectedStudent.id)
        .then((res) => setTelegramStatus(res))
        .catch(() => setTelegramStatus(null));
    }
  }, [selectedStudent]);

  const filteredStudents = students.filter((s) => {
    // 1. Role Filter (sartirovka)
    if (levelFilter !== 'All' && s.role !== levelFilter) {
      return false;
    }
    // 2. Search query filter
    const fullName = `${s.first_name || ''} ${s.last_name || ''} ${s.username || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                          (s.phone_number && s.phone_number.includes(searchQuery));
    return matchesSearch;
  });

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await userService.createUser(newStudent);
      setShowAddModal(false);
      setNewStudent({ username: '', password: '', first_name: '', last_name: '', phone_number: '', role: 'student' });
      fetchStudents();
    } catch (err) {
      alert('Yaratishda xatolik: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: editingStudent.username,
        first_name: editingStudent.first_name,
        last_name: editingStudent.last_name,
        phone_number: editingStudent.phone_number,
        role: editingStudent.role
      };
      
      // Faqat kiritilgan bo'lsa parolni yangilaymiz
      if (editPassword) {
        payload.password = editPassword;
      }
      
      await userService.updateUser(editingStudent.id, payload);
      setShowEditModal(false);
      setEditingStudent(null);
      setEditPassword('');
      fetchStudents();
    } catch (err) {
      alert("Tahrirlashda xatolik: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  const openEditModal = (student, e) => {
    e.stopPropagation();
    setEditingStudent(student);
    setEditPassword('');
    setShowEditModal(true);
  };

  const handleDeleteStudent = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Haqiqatdan ham ushbu foydalanuvchini o'chirmoqchimisiz?")) {
      try {
        await userService.deleteUser(id);
        if (selectedStudent?.id === id) setSelectedStudent(null);
        fetchStudents();
      } catch (err) {
        alert("O'chirishda xatolik: " + JSON.stringify(err.response?.data || err.message));
      }
    }
  };

  const currentUserRole = localStorage.getItem('user_role') || 'student';

  return (
    <div style={{ position: 'relative' }}>
      {/* Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>User Management (Real DB)</h2>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Barcha foydalanuvchilar bevosita Django REST API (`/User/users/`) dan yuklanadi.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchStudents} title="Yangilash">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Yangilash</span>
          </button>

          {(currentUserRole === 'admin' || currentUserRole === 'manager') && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} />
              <span>Yangi Foydalanuvchi Qo'shish</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '14px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px' }}>
          <AlertCircle size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          {errorMsg}
        </div>
      )}

      {/* Table Toolbar */}
      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-filters">
            <select className="select-filter" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
              <option value="All">Barcha Rollar / Darajalar</option>
              {currentUserRole === 'admin' && <option value="admin">Admin</option>}
              {currentUserRole === 'admin' && <option value="manager">Manager</option>}
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div className="search-box" style={{ width: '260px' }}>
            <Search size={16} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="F.I.SH yoki Telefon raqam..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Foydalanuvchilar ma'lumotlar bazasidan yuklanmoqda...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Hozircha ma'lumotlar topilmadi.<br />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}><input type="checkbox" /></th>
                  <th>Username & Ism</th>
                  <th>Telefon Raqami</th>
                  <th>Rol</th>
                  <th>Guruh va Ustoz</th>
                  <th>Telegram Holati</th>
                  <th>Yaratilgan Vaqti</th>
                  <th style={{ width: '100px' }}>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const isSelected = selectedStudent?.id === student.id;
                  const displayName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.username;
                  return (
                    <tr 
                      key={student.id} 
                      onClick={() => setSelectedStudent(student)}
                      style={{ cursor: 'pointer', background: isSelected ? '#f1f5f9' : 'transparent' }}
                    >
                      <td onClick={(e) => e.stopPropagation()}><input type="checkbox" /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#e0f2fe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                            {student.username ? student.username.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700' }}>{displayName}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>@{student.username}</div>
                          </div>
                        </div>
                      </td>
                      <td>{student.phone_number || 'Kiritilmagan'}</td>
                      <td><span className="badge badge-active">{student.role}</span></td>
                      <td>
                        {student.groups_info && student.groups_info.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {student.groups_info.map((g, idx) => (
                              <div key={idx} style={{ fontSize: '12px', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontWeight: '600', color: '#334155' }}>{g.group_name}</span>
                                {g.teacher_name && <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Ustoz: {g.teacher_name}</span>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td>
                        {telegramStatus && selectedStudent?.id === student.id && telegramStatus.status === 'success' ? (
                          <span className="badge badge-active"><ShieldCheck size={12} style={{ marginRight: '4px' }} /> Telegram Ulangan</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Kutilmoqda</span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {student.date_joined ? new Date(student.date_joined).toLocaleDateString() : 'N/A'}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {student.role !== 'admin' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn btn-secondary icon-btn" 
                              style={{ padding: '4px', color: '#3b82f6', border: 'none', background: 'transparent' }}
                              onClick={(e) => openEditModal(student, e)}
                              title="Tahrirlash / Parolni o'zgartirish"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              className="btn btn-secondary icon-btn" 
                              style={{ padding: '4px', color: '#ef4444', border: 'none', background: 'transparent' }}
                              onClick={(e) => handleDeleteStudent(student.id, e)}
                              title="O'chirish"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick View Drawer */}
      {selectedStudent && (
        <QuickViewDrawer 
          student={{
            full_name: `${selectedStudent.first_name || ''} ${selectedStudent.last_name || ''}`.trim() || selectedStudent.username,
            avatar: selectedStudent.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
            recentLessons: [
              { title: `ID: ${selectedStudent.id} | Phone: ${selectedStudent.phone_number || 'N/A'}`, time: 'DB Record', status: 'completed' },
              { title: telegramStatus?.status === 'success' ? `Telegram ID: ${telegramStatus.telegram_id}` : 'Telegram ulangan emas', time: 'Signal Status', status: telegramStatus?.status === 'success' ? 'completed' : 'pending' }
            ]
          }} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}

      {/* Add Student Modal Form */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Yangi Foydalanuvchi Qo'shish</h3>
            </div>
            <form onSubmit={handleAddStudent}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Rol (Daraja) *</label>
                  <select 
                    className="form-select"
                    value={newStudent.role}
                    onChange={(e) => setNewStudent({ ...newStudent, role: e.target.value })}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    {currentUserRole === 'admin' && (
                      <option value="manager">Manager</option>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label>Username *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required
                    value={newStudent.username}
                    onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Parol (Password) *</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    required
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Ismi (First Name)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newStudent.first_name}
                    onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Familiyasi (Last Name)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newStudent.last_name}
                    onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Telefon Raqam (+998...)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="+998901234567"
                    value={newStudent.phone_number}
                    onChange={(e) => setNewStudent({ ...newStudent, phone_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal Form */}
      {showEditModal && editingStudent && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Tahrirlash: @{editingStudent.username}</h3>
            </div>
            <form onSubmit={handleUpdateStudent}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Login (Username) *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required
                    value={editingStudent.username}
                    onChange={(e) => setEditingStudent({ ...editingStudent, username: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Yangi Parol (ixtiyoriy)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Parolni almashtirish uchun kiriting"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                  />
                  <small style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    Agar parol esdan chiqqan bo'lsa, shu yerdan yangilab berishingiz mumkin.
                  </small>
                </div>
                
                <div className="form-group">
                  <label>Rol (Daraja)</label>
                  <select 
                    className="form-select"
                    value={editingStudent.role}
                    onChange={(e) => setEditingStudent({ ...editingStudent, role: e.target.value })}
                    disabled={currentUserRole !== 'admin' && editingStudent.role === 'admin'}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    {currentUserRole === 'admin' && <option value="manager">Manager</option>}
                    {currentUserRole === 'admin' && <option value="admin">Admin</option>}
                  </select>
                </div>

                <div className="form-group">
                  <label>Ismi</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingStudent.first_name || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, first_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Familiyasi</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingStudent.last_name || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, last_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Telefon Raqam</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="+998901234567"
                    value={editingStudent.phone_number || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, phone_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
