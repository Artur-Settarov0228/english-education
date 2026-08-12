import React, { useState, useEffect } from 'react';
import { CalendarCheck, Send, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';
import { userService, lessonService } from '../services/api';

export default function AttendancePage() {
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [notificationSent, setNotificationSent] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetchedStudents = await userService.getUsers('student');
      setStudents(Array.isArray(fetchedStudents) ? fetchedStudents : []);

      const fetchedLessons = await lessonService.getLessons();
      setLessons(Array.isArray(fetchedLessons) ? fetchedLessons : []);
      
      if (fetchedLessons.length > 0 && !selectedLessonId) {
        setSelectedLessonId(fetchedLessons[0].id);
      }
    } catch (err) {
      console.error("Attendance data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords({ ...attendanceRecords, [studentId]: status });
  };

  const handleSaveAttendance = async () => {
    if (!selectedLessonId) {
      alert("Iltimos, avval darsni tanlang!");
      return;
    }

    try {
      for (const student of students) {
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

        <button className="btn btn-primary" onClick={handleSaveAttendance}>
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

      {/* Select Lesson Toolbar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="form-group" style={{ marginBottom: '0' }}>
          <label>Darsni Tanlang *</label>
          <select 
            className="form-select"
            value={selectedLessonId} 
            onChange={(e) => setSelectedLessonId(e.target.value)}
          >
            <option value="">-- Darsni tanlang --</option>
            {lessons.map(l => (
              <option key={l.id} value={l.id}>{l.topic} ({l.date})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Ma'lumotlar yuklanmoqda...</div>
        ) : students.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Hali o'quvchilar mavjud emas. Avval Students bo'limida o'quvchi qo'shing!
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
              {students.map((student) => {
                const currentStatus = attendanceRecords[student.id] || 'present';
                return (
                  <tr key={student.id}>
                    <td>
                      <div style={{ fontWeight: '700' }}>
                        {student.first_name || student.username} {student.last_name || ''}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{student.phone_number || `@${student.username}`}</div>
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
