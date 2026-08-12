import React, { useState, useEffect } from 'react';
import { PlayCircle, HelpCircle, BookOpen, Plus, UploadCloud, RefreshCw, Folder, Search, Filter, MoreVertical, Eye, Edit, Trash2, ArrowUpRight, GraduationCap } from 'lucide-react';
import { lessonService } from '../services/api';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showCourseModal, setShowCourseModal] = useState(false);
  
  // Form states
  const [newCourse, setNewCourse] = useState({ name: '', description: '', monthly_price: '500000.00' });

  const currentUserRole = localStorage.getItem('user_role') || 'student';

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetchedCourses = await lessonService.getCourses();
      setCourses(Array.isArray(fetchedCourses) ? fetchedCourses : []);

      const fetchedGroups = await lessonService.getGroups();
      setGroups(Array.isArray(fetchedGroups) ? fetchedGroups : []);
    } catch (err) {
      console.error("Error fetching courses/groups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await lessonService.createCourse(newCourse);
      setShowCourseModal(false);
      setNewCourse({ name: '', description: '', monthly_price: '500000.00' });
      fetchData();
    } catch (err) {
      alert("Kurs yaratishda xatolik: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  // Mock stats since backend might not have them natively yet
  const totalCourses = courses.length;
  const totalGroups = groups.length;
  const activeCourses = totalCourses; 
  const totalStudents = 1248; // Mock 
  
  // Array of placeholder images for the course cards
  const placeholderImages = [
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1571260899304-42507011bb6b?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400'
  ];

  return (
    <div>
      {/* Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>
              Kurslar
            </h2>
            <span style={{ fontSize: '14px', color: '#64748b' }}>
              Tizimdagi barcha ingliz tili kurslarini boshqarish
            </span>
          </div>
        </div>

        {currentUserRole !== 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowCourseModal(true)}>
            <Plus size={16} />
            <span>Kurs Qo'shish</span>
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-title">Jami Kurslar</div>
            <div className="stat-value">{totalCourses}</div>
            <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontWeight: '600' }}>
              <ArrowUpRight size={14} />
              +5 shu oyda
            </div>
          </div>
          <div className="stat-icon-wrapper">
            <BookOpen size={20} />
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-title">Faol Kurslar</div>
            <div className="stat-value">{activeCourses}</div>
            <div style={{ width: '100px', height: '4px', background: '#e2e8f0', borderRadius: '4px', marginTop: '12px' }}>
              <div style={{ width: '75%', height: '100%', background: '#10b981', borderRadius: '4px' }}></div>
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#dcfce7', color: '#10b981' }}>
            <RefreshCw size={20} />
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-title">Jami O'quvchilar</div>
            <div className="stat-value">{totalStudents}</div>
            <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontWeight: '600' }}>
              <ArrowUpRight size={14} />
              +120 shu oyda
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
            <GraduationCap size={20} />
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-title">Jami Guruhlar</div>
            <div className="stat-value">{totalGroups}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#fce7f3', color: '#db2777' }}>
            <Folder size={20} />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ width: '300px' }}>
          <Search size={16} color="#64748b" />
          <input type="text" placeholder="Kurs nomi yoki daraja bo'yicha qidiruv..." />
        </div>
        <select className="select-filter">
          <option>Barcha Darajalar</option>
          <option>Boshlang'ich (A1)</option>
          <option>Elementar (A2)</option>
        </select>
        <select className="select-filter">
          <option>Barcha Toifalar</option>
          <option>Grammatika</option>
          <option>So'zlashuv</option>
        </select>
        <select className="select-filter">
          <option>Barcha Holatlar</option>
          <option>Faol</option>
          <option>Qoralama</option>
        </select>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Kurslar yuklanmoqda...</div>
      ) : courses.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: '#eff6ff', borderRadius: '50%', color: '#2563eb', marginBottom: '16px' }}>
            <BookOpen size={32} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Hozircha kurslar yo'q</h3>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>Birinchi ingliz tili kursingizni yaratishdan boshlang.</p>
          {currentUserRole !== 'admin' && (
            <button className="btn btn-primary" onClick={() => setShowCourseModal(true)}>
              <Plus size={16} /> Kurs Yaratish
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Courses Grid Cards */}
          <div className="courses-grid">
            {courses.map((course, index) => {
              const bgImage = placeholderImages[index % placeholderImages.length];
              const level = ['A1', 'A2', 'B1', 'B2'][index % 4];
              const progress = [75, 60, 80, 40][index % 4];
              const courseGroups = groups.filter(g => g.course === course.id);
              
              return (
                <div key={course.id} className="course-card">
                  <div className="course-card-image" style={{ backgroundImage: `url(${bgImage})` }}>
                    <div className="course-card-badge">Faol</div>
                  </div>
                  <div className="course-card-content">
                    <h3 className="course-card-title">{course.name}</h3>
                    <p className="course-card-desc">{course.description || "Boshlang'ichlar uchun oddiy ingliz tili. Grammatika va lug'at."}</p>
                    
                    <div className="course-card-meta">
                      <span className="course-card-level">{level}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <PlayCircle size={14} /> {courseGroups.length * 10} Dars
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <GraduationCap size={14} /> {Math.floor(Math.random() * 300) + 50} O'quvchi
                      </span>
                    </div>

                    <div className="course-card-progress">
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                      </div>
                      <span className="progress-label">{progress}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table List View */}
          <div className="table-container">
            <div className="table-toolbar">
              <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} color="#2563eb" /> Barcha Kurslar ({courses.length})
              </h3>
              <button className="btn btn-secondary">
                <UploadCloud size={16} /> Yuklab Olish
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kurs Nomi</th>
                    <th>Daraja</th>
                    <th>Toifa</th>
                    <th>Guruhlar</th>
                    <th>Holat</th>
                    {currentUserRole !== 'admin' && <th>Harakatlar</th>}
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, index) => {
                    const level = ['A1', 'A2', 'B1', 'B2'][index % 4];
                    const category = ['Grammatika', "Lug'at", "So'zlashuv", 'Yozish'][index % 4];
                    const courseGroups = groups.filter(g => g.course === course.id);

                    return (
                      <tr key={course.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', overflow: 'hidden' }}>
                              <img src={placeholderImages[index % placeholderImages.length]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <span style={{ fontWeight: '700' }}>{course.name}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: '#15803d', fontWeight: '800' }}>{level}</span>
                        </td>
                        <td style={{ fontWeight: '600', color: '#475569' }}>{category}</td>
                        <td style={{ fontWeight: '700' }}>{courseGroups.length}</td>
                        <td><span className="badge badge-active">Faol</span></td>
                        {currentUserRole !== 'admin' && (
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="icon-btn"><Eye size={16} /></button>
                              <button className="icon-btn"><Edit size={16} /></button>
                              <button className="icon-btn"><MoreVertical size={16} /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal: Create Course */}
      {showCourseModal && (
        <div className="modal-overlay" onClick={() => setShowCourseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Yangi Kurs Yaratish</h3>
            </div>
            <form onSubmit={handleCreateCourse}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Kurs Nomi *</label>
                  <input type="text" className="form-input" required value={newCourse.name} onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })} placeholder="masalan, Boshlang'ich A1" />
                </div>
                <div className="form-group">
                  <label>Tavsif (Description)</label>
                  <textarea className="form-textarea" rows="3" value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} placeholder="Ushbu kurs kimlar uchun..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCourseModal(false)}>Bekor Qilish</button>
                <button type="submit" className="btn btn-primary">Kursni Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
