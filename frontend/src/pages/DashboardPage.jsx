import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, Video, BookMarked, Trophy, Star, Award, 
  Clock, CheckCircle, AlertCircle, Calendar, RefreshCw,
  Sparkles, ArrowRight, PlayCircle, ShieldCheck, Flame, Check, 
  CreditCard, UserCheck, TrendingUp, DollarSign
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { userService, lessonService, taskService, paymentService } from '../services/api';
import CertificateModal from '../components/CertificateModal';

export default function DashboardPage({ currentUser }) {
  const [loading, setLoading] = useState(true);
  
  // Determine role
  const userRole = currentUser?.role || localStorage.getItem('user_role') || 'student';
  const isAdminOrManager = userRole === 'admin' || userRole === 'manager' || localStorage.getItem('is_superuser') === 'true';

  // --- ADMIN STATS STATE ---
  const [adminStats, setAdminStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    activeCourses: 0,
    totalRevenue: 0
  });
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [proficiencyData, setProficiencyData] = useState([]);

  // --- STUDENT STATS STATE ---
  const [studentStats, setStudentStats] = useState({
    enrolledGroups: 0,
    completedLessons: 0,
    pendingTasks: 0,
    totalPoints: 0,
    attendanceRate: 96
  });
  const [myGroups, setMyGroups] = useState([]);
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [showCertificate, setShowCertificate] = useState(false);

  // Student Daily Goals State
  const [dailyGoals, setDailyGoals] = useState(() => {
    const saved = localStorage.getItem('student_daily_goals');
    return saved ? JSON.parse(saved) : {
      watchLesson: true,
      practiceFlashcards: false,
      submitQuiz: false
    };
  });

  const toggleGoal = (key) => {
    const updated = { ...dailyGoals, [key]: !dailyGoals[key] };
    setDailyGoals(updated);
    localStorage.setItem('student_daily_goals', JSON.stringify(updated));
  };

  const completedGoalsCount = Object.values(dailyGoals).filter(Boolean).length;
  const dailyProgress = Math.round((completedGoalsCount / 3) * 100);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAdminOrManager) {
        // --- FETCH ADMIN DATA ---
        const [studentsRes, teachersRes, coursesRes, paymentsRes] = await Promise.all([
          userService.getUsers('student'),
          userService.getUsers('teacher'),
          lessonService.getCourses(),
          paymentService.getPayments()
        ]);

        const students = Array.isArray(studentsRes) ? studentsRes : [];
        const teachers = Array.isArray(teachersRes) ? teachersRes : [];
        const courses = Array.isArray(coursesRes) ? coursesRes : [];
        const payments = Array.isArray(paymentsRes) ? paymentsRes : [];

        const revenue = payments
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

        setAdminStats({
          totalStudents: students.length,
          totalTeachers: teachers.length,
          activeCourses: courses.length,
          totalRevenue: revenue
        });

        // Calculate Enrollment Trend
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthCounts = {};
        students.forEach(s => {
          if (s.date_joined) {
            const d = new Date(s.date_joined);
            const m = monthNames[d.getMonth()];
            monthCounts[m] = (monthCounts[m] || 0) + 1;
          }
        });

        const trend = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const m = monthNames[d.getMonth()];
          trend.push({ month: m, count: monthCounts[m] || 0 });
        }
        setEnrollmentData(trend);

        // Course Levels Distribution
        const levels = {};
        courses.forEach(c => {
          const lvl = c.level ? c.level.toUpperCase() : 'A1';
          levels[lvl] = (levels[lvl] || 0) + 1;
        });

        const colors = ['#2563eb', '#38bdf8', '#f59e0b', '#10b981', '#8b5cf6'];
        const prof = Object.keys(levels).map((l, i) => ({
          name: l,
          value: levels[l],
          color: colors[i % colors.length]
        }));
        setProficiencyData(prof.length > 0 ? prof : [{ name: 'A1', value: 1, color: '#2563eb' }]);

      } else {
        // --- FETCH STUDENT DATA ---
        const [groupsRes, coursesRes, lessonsRes, tasksRes] = await Promise.all([
          lessonService.getGroups(),
          lessonService.getCourses(),
          lessonService.getLessons(),
          taskService.getTasks()
        ]);

        const groups = Array.isArray(groupsRes) ? groupsRes : [];
        const lessons = Array.isArray(lessonsRes) ? lessonsRes : [];
        const tasks = Array.isArray(tasksRes) ? tasksRes : [];

        setMyGroups(groups);
        setUpcomingLessons(lessons.slice(0, 4));

        let totalScore = 0;
        if (currentUser?.id) {
          try {
            const gradesRes = await taskService.getGrades(currentUser.id);
            const grades = Array.isArray(gradesRes) ? gradesRes : [];
            totalScore = grades.reduce((acc, curr) => acc + (parseFloat(curr.score) || 0), 0);
          } catch (e) {
            console.log("Grades error", e);
          }
        }

        setStudentStats({
          enrolledGroups: groups.length,
          completedLessons: lessons.length,
          pendingTasks: tasks.length,
          totalPoints: Math.round(totalScore),
          attendanceRate: 96
        });
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser, userRole]);

  // ==========================================
  // 1. ADMIN & MANAGER DASHBOARD VIEW
  // ==========================================
  if (isAdminOrManager) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Admin Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              Boshqaruv Paneli (Admin Dashboard)
            </h2>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              O'quv markazi real-vaqt statistikasi va umumiy ko'rsatkichlari
            </span>
          </div>

          <button className="btn btn-secondary" onClick={fetchData} title="Yangilash">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Yangilash</span>
          </button>
        </div>

        {/* 4 Key Admin Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
          
          <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Jami O'quvchilar</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{adminStats.totalStudents} nafar</div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>O'qituvchilar</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{adminStats.totalTeachers} nafar</div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Mavjud Kurslar</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{adminStats.activeCourses} ta</div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fefce8', color: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Jami Tushum</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                {adminStats.totalRevenue.toLocaleString()} UZS
              </div>
            </div>
          </div>

        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          
          {/* Chart 1: Enrollment Growth Trend */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#2563eb" />
              <span>O'quvchilar Qabul Trendi (Oylar kesimida)</span>
            </h3>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={enrollmentData}>
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Courses Level Distribution */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="#16a34a" />
              <span>Kurslar Darajalar Bo'yicha Taqsimoti</span>
            </h3>
            <div style={{ width: '100%', height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={proficiencyData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {proficiencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
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

  // ==========================================
  // 2. STUDENT DASHBOARD VIEW (LEARNING PORTAL)
  // ==========================================
  const studentName = currentUser?.first_name 
    ? `${currentUser.first_name} ${currentUser.last_name || ''}`
    : currentUser?.username || "O'quvchi";

  return (
    <div className="student-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Student Hero Welcome Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
          borderRadius: '16px',
          padding: '28px 32px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
            <Sparkles size={14} color="#fde047" />
            <span>O'quvchi Portali</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            Xush kelibsiz, {studentName}! 👋
          </h1>
          <p style={{ fontSize: '14px', color: '#e0e7ff', margin: 0, lineHeight: 1.6 }}>
            Bugungi kunlik maqsadlaringizni bajaring, video darslarni tomosha qiling va o'qish zanjirini davom ettiring!
          </p>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
          {/* Streak Flame Badge */}
          <div style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)', padding: '12px 18px', borderRadius: '12px', textAlign: 'center', color: '#ffffff', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              <Flame size={14} fill="#ffffff" /> Streak
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900' }}>3 Kun 🔥</div>
          </div>

          {/* Points Card */}
          <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 18px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#bfdbfe', fontWeight: '700', textTransform: 'uppercase' }}>To'plangan Ball</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#fef08a' }}>{studentStats.totalPoints} pts</div>
          </div>

          {/* Certificate Button */}
          <button
            onClick={() => setShowCertificate(true)}
            className="btn"
            style={{ background: '#fef08a', color: '#854d0e', border: 'none', borderRadius: '12px', padding: '12px 16px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(254, 240, 138, 0.3)' }}
          >
            <Award size={16} />
            <span>Sertifikat</span>
          </button>
        </div>
      </div>

      {/* 2. Daily Goals Tracker Card */}
      <div className="card" style={{ padding: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #bfdbfe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Flame size={20} color="#ea580c" fill="#ea580c" />
              <span>Bugungi Kunlik Maqsadlar ({completedGoalsCount}/3)</span>
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Har kuni dars qiling va streak olovingizni so'ndirmang!</span>
          </div>

          <div style={{ fontSize: '14px', fontWeight: '800', color: '#2563eb' }}>
            {dailyProgress}% bajarildi
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden', marginBottom: '18px' }}>
          <div 
            style={{ 
              height: '100%', 
              background: dailyProgress === 100 ? '#16a34a' : 'linear-gradient(90deg, #ea580c, #2563eb)', 
              width: `${dailyProgress}%`, 
              transition: 'width 0.3s ease' 
            }} 
          />
        </div>

        {/* Goal Items Checklist */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          
          <div 
            onClick={() => toggleGoal('watchLesson')}
            style={{ 
              padding: '12px 16px', 
              borderRadius: '10px', 
              border: dailyGoals.watchLesson ? '1px solid #bbf7d0' : '1px solid #e2e8f0', 
              background: dailyGoals.watchLesson ? '#f0fdf4' : '#ffffff',
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: dailyGoals.watchLesson ? '#16a34a' : '#e2e8f0', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {dailyGoals.watchLesson && <Check size={14} />}
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: dailyGoals.watchLesson ? '#166534' : '#334155', textDecoration: dailyGoals.watchLesson ? 'line-through' : 'none' }}>
              🎥 1 ta video dars ko'rish
            </span>
          </div>

          <div 
            onClick={() => toggleGoal('practiceFlashcards')}
            style={{ 
              padding: '12px 16px', 
              borderRadius: '10px', 
              border: dailyGoals.practiceFlashcards ? '1px solid #bbf7d0' : '1px solid #e2e8f0', 
              background: dailyGoals.practiceFlashcards ? '#f0fdf4' : '#ffffff',
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: dailyGoals.practiceFlashcards ? '#16a34a' : '#e2e8f0', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {dailyGoals.practiceFlashcards && <Check size={14} />}
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: dailyGoals.practiceFlashcards ? '#166534' : '#334155', textDecoration: dailyGoals.practiceFlashcards ? 'line-through' : 'none' }}>
              📇 10 ta fleshkarta yodlash
            </span>
          </div>

          <div 
            onClick={() => toggleGoal('submitQuiz')}
            style={{ 
              padding: '12px 16px', 
              borderRadius: '10px', 
              border: dailyGoals.submitQuiz ? '1px solid #bbf7d0' : '1px solid #e2e8f0', 
              background: dailyGoals.submitQuiz ? '#f0fdf4' : '#ffffff',
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: dailyGoals.submitQuiz ? '#16a34a' : '#e2e8f0', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {dailyGoals.submitQuiz && <Check size={14} />}
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: dailyGoals.submitQuiz ? '#166534' : '#334155', textDecoration: dailyGoals.submitQuiz ? 'line-through' : 'none' }}>
              📝 1 ta test yoki vazifa ishlash
            </span>
          </div>

        </div>
      </div>

      {/* 3. Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        
        {/* Card 1: My Groups */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Guruhlarim</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{studentStats.enrolledGroups} ta</div>
          </div>
        </div>

        {/* Card 2: Lessons */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Video size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Darslar & Videolar</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{studentStats.completedLessons} ta</div>
          </div>
        </div>

        {/* Card 3: Tasks */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookMarked size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Topshiriq & Testlar</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{studentStats.pendingTasks} ta</div>
          </div>
        </div>

        {/* Card 4: Attendance */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Davomat Ko'rsatkichi</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{studentStats.attendanceRate}%</div>
          </div>
        </div>

      </div>

      {/* 4. Main Sections Layout (2 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Left Column: My Groups & Schedule */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="#2563eb" />
              <span>Mening Faol Guruhlarim</span>
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Jadval & O'qituvchi</span>
          </div>

          {myGroups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontSize: '14px' }}>
              Hozircha biriktirilgan guruhlar mavjud emas.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {myGroups.map((group) => (
                <div 
                  key={group.id} 
                  style={{ 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '12px', 
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f8fafc'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>{group.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748b' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} /> {group.schedule || 'Har kuni'}
                      </span>
                    </div>
                  </div>
                  <span className="badge badge-active">Faol</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Upcoming Lessons & Videos */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={18} color="#16a34a" />
              <span>So'nggi Darslar & Videolar</span>
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Video darslar</span>
          </div>

          {upcomingLessons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontSize: '14px' }}>
              Hozircha darslar ro'yxati mavjud emas.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingLessons.map((lesson) => (
                <div 
                  key={lesson.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    background: '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PlayCircle size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{lesson.topic}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{lesson.date} • {lesson.group_name || 'Guruh'}</div>
                    </div>
                  </div>

                  {lesson.youtube_video_id || lesson.youtube_url ? (
                    <span className="badge badge-active" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Video size={12} /> Video Mavjud
                    </span>
                  ) : (
                    <span className="badge badge-hold">Rejalashtirilgan</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Certificate Modal */}
      {showCertificate && (
        <CertificateModal 
          currentUser={currentUser} 
          onClose={() => setShowCertificate(false)} 
        />
      )}

    </div>
  );
}
