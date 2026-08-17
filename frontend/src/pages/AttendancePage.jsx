import React, { useState, useEffect } from 'react';
import { CalendarCheck, Send, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';
import { userService, lessonService } from '../services/api';

export default function AttendancePage({ currentUser }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  
  const [groupStudents, setGroupStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);

  // Fetch groups on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const groupsData = await lessonService.getGroups();
        const myGroups = currentUser?.role === 'teacher' 
          ? groupsData.filter(g => g.teacher === currentUser?.id) 
          : groupsData;
        setGroups(myGroups);
      } catch (err) {
        console.error("Gruppalarni olishda xatolik:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [currentUser]);

  // When group changes, fetch its students and lessons
  useEffect(() => {
    if (!selectedGroupId) {
      setGroupStudents([]);
      setLessons([]);
      setSelectedLessonId('');
      return;
    }
    
    const fetchGroupData = async () => {
      setStudentsLoading(true);
      try {
        const [studentsData, lessonsData] = await Promise.all([
          lessonService.getGroupStudents(selectedGroupId),
          lessonService.getLessons(selectedGroupId)
        ]);
        setGroupStudents(Array.isArray(studentsData) ? studentsData : []);
        setLessons(Array.isArray(lessonsData) ? lessonsData : []);
        if (lessonsData.length > 0) {
          setSelectedLessonId(lessonsData[0].id);
        } else {
          setSelectedLessonId('');
        }
      } catch (err) {
        console.error("Guruh ma'lumotlarini olishda xatolik:", err);
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchGroupData();
  }, [selectedGroupId]);

  // When lesson changes, fetch existing attendance
  useEffect(() => {
    if (!selectedLessonId) {
      setAttendanceRecords({});
      return;
    }
    
    const fetchLessonAttendance = async () => {
      try {
        const attData = await lessonService.getAttendance(selectedLessonId);
        const newRecords = {};
        if (Array.isArray(attData)) {
          attData.forEach(record => {
            newRecords[record.student] = record.status;
          });
        }
        setAttendanceRecords(newRecords);
      } catch(err) {
        console.error("Davomatni olishda xatolik:", err);
      }
    };
    fetchLessonAttendance();
  }, [selectedLessonId]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords({ ...attendanceRecords, [studentId]: status });
  };

  const handleSaveAttendance = async () => {
    if (!selectedLessonId) {
      alert("Iltimos, avval darsni tanlang!");
      return;
    }

    try {
      for (const student of groupStudents) {
        const status = attendanceRecords[student.id] || 'present';
        await lessonService.saveAttendance({
          lesson: selectedLessonId,
          student: student.id,
          status: status
        });
      }
      setNotificationSent(true);
      setTimeout(() => setNotificationSent(false), 5000);
    } catch (err) {
      alert("Davomat saqlashda xatolik: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Davomat Boshqaruvi</h2>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Django Signal &rarr; Celery &rarr; Ota-onalar Telegram botiga avtomatik xabar beradi.
          </span>
        </div>

        <button className="btn btn-primary" onClick={handleSaveAttendance} disabled={!selectedLessonId}>
          <Send size={16} />
          <span>Davomatni Saqlash & Telegram Signal Yuborish</span>
        </button>
      </div>

      {notificationSent && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '14px 20px', borderRadius: '10px', marginBottom: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={20} />
          <span>Davomat saqlandi! Django Signal orqali Celery vazifasi ota-onalarga asinxron Telegram xabar yubordi.</span>
        </div>
      )}

      {/* Select Group & Lesson Toolbar */}
      <div className="card" style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="form-group" style={{ marginBottom: '0' }}>
          <label>Guruhni Tanlang *</label>
          <select 
            className="form-select"
            value={selectedGroupId} 
            onChange={(e) => setSelectedGroupId(e.target.value)}
          >
            <option value="">-- Guruhni tanlang --</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '0' }}>
          <label>Darsni Tanlang *</label>
          <select 
            className="form-select"
            value={selectedLessonId} 
            onChange={(e) => setSelectedLessonId(e.target.value)}
            disabled={!selectedGroupId}
          >
            <option value="">-- Darsni tanlang --</option>
            {lessons.map(l => (
              <option key={l.id} value={l.id}>{l.topic} ({l.date})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        {loading || studentsLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '12px' }} />
            <div>Ma'lumotlar yuklanmoqda...</div>
          </div>
        ) : !selectedGroupId ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Avval yuqoridan guruhni tanlang.
          </div>
        ) : groupStudents.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Bu guruhda o'quvchilar mavjud emas.
          </div>
        ) : !selectedLessonId ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Bu guruh uchun darslar mavjud emas. Davomat qila olmaysiz.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>O'quvchi F.I.SH</th>
                <th>Status (Keldi / Kechikdi / Kelmadi)</th>
              </tr>
            </thead>
            <tbody>
              {groupStudents.map((student) => {
                const currentStatus = attendanceRecords[student.id] || 'present';
                return (
                  <tr key={student.id}>
                    <td>
                      <div style={{ fontWeight: '700' }}>
                        {student.full_name || student.username}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {student.id}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className={`btn ${currentStatus === 'present' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => handleStatusChange(student.id, 'present')}
                        >
                          <CheckCircle2 size={14} /> Keldi
                        </button>
                        <button 
                          className={`btn ${currentStatus === 'late' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '6px 12px', fontSize: '12px', background: currentStatus === 'late' ? '#f59e0b' : '' }}
                          onClick={() => handleStatusChange(student.id, 'late')}
                        >
                          <Clock size={14} /> Kechikdi
                        </button>
                        <button 
                          className={`btn ${currentStatus === 'absent' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '6px 12px', fontSize: '12px', background: currentStatus === 'absent' ? '#ef4444' : '' }}
                          onClick={() => handleStatusChange(student.id, 'absent')}
                        >
                          <XCircle size={14} /> Kelmadi
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
