import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Folder, FileText, Download, Play, 
  ExternalLink, Search, Clock, User, CheckCircle, 
  Sparkles, RefreshCw, Layers
} from 'lucide-react';
import { lessonService, authService } from '../services/api';

export default function CoursesPage({ currentUser }) {
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' or 'materials'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedCourseForModal, setSelectedCourseForModal] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, groupsRes, materialsRes] = await Promise.all([
        lessonService.getCourses(),
        lessonService.getGroups(),
        lessonService.getMaterials()
      ]);

      setCourses(Array.isArray(coursesRes) ? coursesRes : []);
      setGroups(Array.isArray(groupsRes) ? groupsRes : []);
      setMaterials(Array.isArray(materialsRes) ? materialsRes : []);
    } catch (err) {
      console.error("Error fetching courses data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel.toLowerCase();
    return matchesSearch && matchesLevel;
  });

  const filteredMaterials = materials.filter(mat => 
    mat.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
            Kurslar va O'quv Materiallari
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Siz o'rganayotgan darsliklar, PDF qo'llanmalar va audio resurslar
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`btn ${activeTab === 'courses' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('courses')}
          >
            <BookOpen size={16} />
            <span>Kurslar & Guruhlar</span>
          </button>

          <button 
            className={`btn ${activeTab === 'materials' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('materials')}
          >
            <Folder size={16} />
            <span>O'quv Materiallari ({materials.length})</span>
          </button>

          <button className="btn btn-secondary" onClick={fetchData} title="Yangilash">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="#94a3b8" />
          <input 
            type="text"
            placeholder="Kurs yoki material nomini qidiring..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', background: 'transparent' }}
          />
        </div>

        {activeTab === 'courses' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Daraja:</span>
            {['All', 'A1', 'A2', 'B1', 'B2', 'C1'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: selectedLevel === lvl ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: selectedLevel === lvl ? '#eff6ff' : '#ffffff',
                  color: selectedLevel === lvl ? '#2563eb' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab 1: Courses & Groups */}
      {activeTab === 'courses' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>Kurslar yuklanmoqda...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
            Qidiruv bo'yicha kurslar topilmadi.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredCourses.map((course) => {
              // Find groups belonging to this course
              const courseGroups = groups.filter(g => g.course === course.id);
              const courseMaterials = materials.filter(m => m.course === course.id);

              return (
                <div 
                  key={course.id} 
                  className="card" 
                  style={{ 
                    padding: '24px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedCourseForModal({ ...course, groups: courseGroups, materials: courseMaterials })}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span className="badge badge-active" style={{ textTransform: 'uppercase', fontWeight: '800' }}>
                        {course.level || 'A1'} • {course.category || 'General'}
                      </span>
                      <span className="badge badge-active">{course.status}</span>
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                      {course.name}
                    </h3>

                    <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '18px' }}>
                      {course.description || "Ushbu kurs talabalarning ingliz tili darajasini oshirishga yo'naltirilgan."}
                    </p>
                  </div>

                  <div>
                    {/* Course Groups info */}
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                        Biriktirilgan Guruhlar ({courseGroups.length}):
                      </div>
                      {courseGroups.length === 0 ? (
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>Hozircha guruhlar yo'q</div>
                      ) : (
                        courseGroups.map(g => (
                          <div key={g.id} style={{ fontSize: '12px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <Clock size={12} color="#2563eb" />
                            <strong>{g.name}:</strong> {g.schedule || 'Jadval belgilanmagan'}
                          </div>
                        ))
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#2563eb', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Folder size={14} /> {courseMaterials.length} ta material
                      </span>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        Batafsil ko'rish
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Tab 2: Study Materials (PDF & Audio) */}
      {activeTab === 'materials' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>Materiallar yuklanmoqda...</div>
        ) : filteredMaterials.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
            Hozircha o'quv materiallari yuklanmagan.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
            {filteredMaterials.map((mat) => (
              <div key={mat.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: mat.link ? '#fee2e2' : '#eff6ff', color: mat.link ? '#ef4444' : '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {mat.link ? <Play size={20} /> : <FileText size={20} />}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>{mat.title}</h4>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{mat.link ? 'Audio / YouTube Havola' : 'PDF Qo\'llanma'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                  {mat.link && (
                    <a 
                      href={mat.link} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-primary"
                      style={{ flex: 1, textDecoration: 'none', justifyContent: 'center', fontSize: '13px' }}
                    >
                      <ExternalLink size={14} />
                      <span>Eshitish / Ko'rish</span>
                    </a>
                  )}
                  {mat.file && (
                    <a 
                      href={mat.file} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-secondary"
                      style={{ flex: 1, textDecoration: 'none', justifyContent: 'center', fontSize: '13px' }}
                    >
                      <Download size={14} />
                      <span>PDF Yuklab olish</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Course Details Modal */}
      {selectedCourseForModal && (
        <div className="modal-overlay" onClick={() => setSelectedCourseForModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>{selectedCourseForModal.name}</h3>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span className="badge badge-active">{selectedCourseForModal.level?.toUpperCase()}</span>
                <p style={{ marginTop: '10px', color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
                  {selectedCourseForModal.description || "Ushbu kurs o'quv dasturiga asosan olib boriladi."}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>Biriktirilgan Guruhlar:</h4>
                {selectedCourseForModal.groups?.map(g => (
                  <div key={g.id} style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', marginBottom: '6px', fontSize: '13px' }}>
                    <strong>{g.name}</strong> • {g.schedule}
                  </div>
                ))}
              </div>

              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>Kurs Materiallari:</h4>
                {selectedCourseForModal.materials?.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>Hozircha materiallar yo'q</div>
                ) : (
                  selectedCourseForModal.materials?.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{m.title}</span>
                      {m.link ? (
                        <a href={m.link} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>Ochish</a>
                      ) : (
                        <a href={m.file} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>Yuklash</a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setSelectedCourseForModal(null)}>Yopish</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
