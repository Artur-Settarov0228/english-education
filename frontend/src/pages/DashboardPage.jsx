import React, { useState, useEffect } from 'react';
import { Users, BookOpen, CheckCircle, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { userService, lessonService } from '../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    completedLessons: 0,
    overallProgress: 100
  });

  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const students = await userService.getUsers('student');
      const courses = await lessonService.getCourses();
      const lessons = await lessonService.getLessons();

      setStats({
        totalStudents: Array.isArray(students) ? students.length : 0,
        activeCourses: Array.isArray(courses) ? courses.length : 0,
        completedLessons: Array.isArray(lessons) ? lessons.length : 0,
        overallProgress: 100
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const dummyEnrollmentTrend = [
    { month: 'Jan', count: 0 },
    { month: 'Feb', count: 2 },
    { month: 'Mar', count: 5 },
    { month: 'Way', count: 8 },
    { month: 'Thu', count: stats.totalStudents || 10 }
  ];

  const dummyProficiency = [
    { name: 'A1', value: 40, color: '#2563eb' },
    { name: 'A2', value: 35, color: '#38bdf8' },
    { name: 'B1', value: 25, color: '#f59e0b' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Dashboard</h2>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Real-time backend ma'lumotlar bazasi statistikasi</span>
        </div>

        <button className="btn btn-secondary" onClick={fetchDashboardData}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Yangilash</span>
        </button>
      </div>

      {/* Top 4 Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-title">Jami O'quvchilar</div>
            <div className="stat-value">{stats.totalStudents}</div>
          </div>
          <div className="stat-icon-wrapper"><Users size={22} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-title">Faol Kurslar</div>
            <div className="stat-value">{stats.activeCourses}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0ea5e9' }}><BookOpen size={22} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-title">Yaratilgan Darslar</div>
            <div className="stat-value">{stats.completedLessons}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#dcfce7', color: '#16a34a' }}><CheckCircle size={22} /></div>
        </div>

        <div className="stat-card">
          <div style={{ width: '100%' }}>
            <div className="stat-title">Umumiy O'zlashtirish</div>
            <div className="progress-bar-container" style={{ marginTop: '8px' }}>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${stats.overallProgress}%` }} />
              </div>
              <span className="progress-label">{stats.overallProgress}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>O'quvchilar Qabul Dynamic Grafigi</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dummyEnrollmentTrend}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Til Darajalari Taqsimoti</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dummyProficiency} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {dummyProficiency.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
