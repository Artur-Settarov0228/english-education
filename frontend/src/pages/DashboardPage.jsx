import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Video, BookMarked, Trophy, Star, Award, 
  Clock, CheckCircle, AlertCircle, Calendar, RefreshCw,
  Sparkles, ArrowRight, PlayCircle, ShieldCheck
} from 'lucide-react';
import { userService, lessonService, taskService, paymentService } from '../services/api';

export default function DashboardPage({ currentUser }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    enrolledGroups: 0,
    completedLessons: 0,
    pendingTasks: 0,
    totalPoints: 0,
    attendanceRate: 100
  });

  const [myGroups, setMyGroups] = useState([]);
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [myBadges, setMyBadges] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);

  const isStudent = !currentUser?.role || currentUser?.role === 'student';

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      // 1. Fetch groups & courses
      const [groupsRes, coursesRes, lessonsRes, tasksRes] = await Promise.all([
        lessonService.getGroups(),
        lessonService.getCourses(),
        lessonService.getLessons(),
        taskService.getTasks()
      ]);

      const groups = Array.isArray(groupsRes) ? groupsRes : [];
      const courses = Array.isArray(coursesRes) ? coursesRes : [];
      const lessons = Array.isArray(lessonsRes) ? lessonsRes : [];
      const tasks = Array.isArray(tasksRes) ? tasksRes : [];

      setMyGroups(groups);
      setUpcomingLessons(lessons.slice(0, 4));
      setPendingTasks(tasks.slice(0, 4));

      // 2. Fetch badges & grades if student id is available
      let badgesList = [];
      let totalScore = 0;
      if (currentUser?.id) {
        try {
          const badgesRes = await taskService.getBadges(currentUser.id);
          badgesList = Array.isArray(badgesRes) ? badgesRes : [];
          
          const gradesRes = await taskService.getGrades(currentUser.id);
          const grades = Array.isArray(gradesRes) ? gradesRes : [];
          totalScore = grades.reduce((acc, curr) => acc + (parseFloat(curr.score) || 0), 0);
        } catch (e) {
          console.log("Grades/Badges fetch error", e);
        }
      }

      setMyBadges(badgesList);

      setStats({
        enrolledGroups: groups.length,
        completedLessons: lessons.length,
        pendingTasks: tasks.length,
        totalPoints: Math.round(totalScore),
        attendanceRate: 96
      });

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [currentUser]);

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
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '650px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
            <Sparkles size={14} color="#fde047" />
            <span>O'quvchi Portali</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            Xush kelibsiz, {studentName}! 👋
          </h1>
          <p style={{ fontSize: '14px', color: '#e0e7ff', margin: 0, lineHeight: 1.6 }}>
            Bugungi darslarni o'zlashtirish, video darslarni tomosha qilish va berilgan topshiriqlarni vaqtida topshirishni unutmang!
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          {/* Points Card */}
          <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', padding: '14px 20px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#bfdbfe', fontWeight: '600' }}>To'plangan Ballar</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#fef08a' }}>{stats.totalPoints} pts</div>
          </div>

          <button 
            onClick={fetchStudentData} 
            className="btn"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', cursor: 'pointer' }}
            title="Yangilash"
          >
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        
        {/* Card 1: My Groups */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Guruhlarim</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{stats.enrolledGroups} ta</div>
          </div>
        </div>

        {/* Card 2: Lessons */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Video size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Darslar & Videolar</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{stats.completedLessons} ta</div>
          </div>
        </div>

        {/* Card 3: Tasks */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookMarked size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Topshiriq & Testlar</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{stats.pendingTasks} ta</div>
          </div>
        </div>

        {/* Card 4: Attendance */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Davomat Ko'rsatkichi</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{stats.attendanceRate}%</div>
          </div>
        </div>

      </div>

      {/* 3. Main Sections Layout (2 Columns) */}
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

      {/* 4. Student Badges & Gamification Section */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={18} color="#eab308" />
            <span>Mening Yutuqlarim va Nishonlarim (Achievements)</span>
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Gamification</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          
          {/* Badge 1: Streak Hero */}
          <div style={{ border: '1px solid #fef08a', background: 'linear-gradient(135deg, #fefce8, #fef9c3)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#eab308', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(234, 179, 8, 0.3)' }}>
              <Trophy size={24} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#854d0e' }}>Streak Hero ⚡</div>
              <div style={{ fontSize: '12px', color: '#a16207' }}>5 ta vazifani o'z vaqtida topshirganlik uchun</div>
            </div>
          </div>

          {/* Badge 2: Grammar Guru */}
          <div style={{ border: '1px solid #bfdbfe', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' }}>
              <Star size={24} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e40af' }}>Grammar Guru ⭐</div>
              <div style={{ fontSize: '12px', color: '#1d4ed8' }}>Grammatika testidan 100% natija</div>
            </div>
          </div>

          {/* Badge 3: Master of Attendance */}
          <div style={{ border: '1px solid #bbf7d0', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(22, 163, 74, 0.3)' }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#166534' }}>Intizomli O'quvchi 🎯</div>
              <div style={{ fontSize: '12px', color: '#15803d' }}>Darslarni qoldirmasdan qatnashgan</div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
