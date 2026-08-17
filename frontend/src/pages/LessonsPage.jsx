import React, { useState, useEffect } from 'react';
import { 
  Video, Play, Calendar, Clock, Search, RefreshCw, 
  ExternalLink, CheckCircle2, AlertCircle, X, Film, 
  MessageSquare, Send, User, BookOpen, Check, Plus, Upload, UploadCloud, Edit
} from 'lucide-react';
import api, { lessonService } from '../services/api';

export default function LessonsPage({ currentUser }) {
  const [lessons, setLessons] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Role check
  const userRole = currentUser?.role || localStorage.getItem('user_role') || 'student';
  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin' || userRole === 'manager' || localStorage.getItem('is_superuser') === 'true';

  // Video Player Modal & Q&A
  const [activeVideoLesson, setActiveVideoLesson] = useState(null);
  const [modalTab, setModalTab] = useState('notes'); // 'notes' or 'qa'
  const [newQuestionText, setNewQuestionText] = useState('');
  const [lessonComments, setLessonComments] = useState({
    1: [
      { id: 1, user: "Teacher (Artur)", role: "teacher", text: "Ushbu dars bo'yicha berilgan vazifani soat 20:00 gacha topshirishni unutmang!", time: "2 soat oldin" },
      { id: 2, user: "Malika", role: "student", text: "Ustoz, 15-daqiqadagi Present Perfect qoidasi bo'yicha qo'shimcha misollar qayerda bor?", time: "1 soat oldin" }
    ]
  });

  // Modal States for Teacher/Admin
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [showUploadVideoModal, setShowUploadVideoModal] = useState(null); // lesson object

  // Form State: Add Lesson
  const [newLesson, setNewLesson] = useState({
    group: '',
    topic: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '14:00',
    end_time: '15:30',
    youtube_url: ''
  });
  const [savingLesson, setSavingLesson] = useState(false);

  // Form State: Upload Video
  const [videoFile, setVideoFile] = useState(null);
  const [videoDirectUrl, setVideoDirectUrl] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lessonsData, groupsData] = await Promise.all([
        lessonService.getLessons(selectedGroup || null),
        lessonService.getGroups()
      ]);
      const lList = Array.isArray(lessonsData) ? lessonsData : [];
      const gList = Array.isArray(groupsData) ? groupsData : [];

      setLessons(lList);
      setGroups(gList);
      if (gList.length > 0 && !newLesson.group) {
        setNewLesson(prev => ({ ...prev, group: gList[0].id }));
      }
    } catch (err) {
      console.error("Ma'lumotlarni olishda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedGroup, currentUser]);

  const filteredLessons = lessons.filter(lesson => 
    lesson.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lesson.group_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lesson.date?.includes(searchTerm)
  );

  const getYoutubeEmbedUrl = (lesson) => {
    if (lesson.youtube_video_id) {
      return `https://www.youtube.com/embed/${lesson.youtube_video_id}?autoplay=1`;
    }
    if (lesson.youtube_url) {
      const match = lesson.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
      }
      return lesson.youtube_url;
    }
    return null;
  };

  // 1. Create New Lesson Handler
  const handleCreateLesson = async (e) => {
    e.preventDefault();
    if (!newLesson.topic || !newLesson.group || !newLesson.date) {
      alert("Iltimos, guruh, mavzu va sanani to'ldiring!");
      return;
    }

    setSavingLesson(true);
    try {
      await lessonService.createLesson(newLesson);
      alert("Yangi dars muvaffaqiyatli qo'shildi!");
      setShowAddLessonModal(false);
      setNewLesson({
        group: groups[0]?.id || '',
        topic: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '14:00',
        end_time: '15:30',
        youtube_url: ''
      });
      fetchData();
    } catch (err) {
      alert("Dars yaratishda xatolik: " + JSON.stringify(err.response?.data || err.message));
    } finally {
      setSavingLesson(false);
    }
  };

  // 2. Upload Video to Lesson Handler
  const handleUploadVideoToLesson = async (e) => {
    e.preventDefault();
    if (!showUploadVideoModal) return;

    setUploadingVideo(true);
    try {
      if (videoFile) {
        // Upload video file via Celery backend API
        await lessonService.uploadVideo(
          showUploadVideoModal.id,
          videoFile,
          showUploadVideoModal.topic,
          `Video lesson for ${showUploadVideoModal.group_name}`
        );
        alert("Video yuklash boshlandi! Video fonda qayta ishlanadi va YouTube'ga joylanadi.");
      } else if (videoDirectUrl) {
        // Directly update lesson with YouTube URL
        const patchData = { youtube_url: videoDirectUrl };
        const match = videoDirectUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (match && match[1]) {
          patchData.youtube_video_id = match[1];
        }
        await api.patch(`/Lessons/lessons/${showUploadVideoModal.id}/`, patchData);
        alert("Video havolasi muvaffaqiyatli darsga biriktirildi!");
      } else {
        alert("Iltimos, video fayl tanlang yoki YouTube havolasini kiriting!");
        setUploadingVideo(false);
        return;
      }

      setShowUploadVideoModal(null);
      setVideoFile(null);
      setVideoDirectUrl('');
      fetchData();
    } catch (err) {
      alert("Video yuklashda xatolik: " + JSON.stringify(err.response?.data || err.message));
    } finally {
      setUploadingVideo(false);
    }
  };

  // 3. Send Q&A Comment Handler
  const handleSendComment = (e) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !activeVideoLesson) return;

    const lessonId = activeVideoLesson.id;
    const authorName = currentUser?.first_name 
      ? `${currentUser.first_name} ${currentUser.last_name || ''}`
      : currentUser?.username || "Foydalanuvchi";

    const newEntry = {
      id: Date.now(),
      user: authorName,
      role: userRole,
      text: newQuestionText.trim(),
      time: "Hozirda"
    };

    setLessonComments({
      ...lessonComments,
      [lessonId]: [...(lessonComments[lessonId] || []), newEntry]
    });
    setNewQuestionText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
            Video Darslar & Mavzular
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {isTeacherOrAdmin ? "Darslar jadvalini boshqarish va video darslarni yuklash" : "O'tilgan darslar yozuvlari va video qo'llanmalarni onlayn tomosha qiling"}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {isTeacherOrAdmin && (
            <button className="btn btn-primary" onClick={() => setShowAddLessonModal(true)}>
              <Plus size={16} />
              <span>Yangi Dars Qo'shish</span>
            </button>
          )}

          <button className="btn btn-secondary" onClick={fetchData} title="Yangilash">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Yangilash</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="#94a3b8" />
          <input 
            type="text"
            placeholder="Dars mavzusi yoki sana bo'yicha qidiring..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', background: 'transparent' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Guruh:</span>
          <select 
            className="form-select" 
            style={{ width: 'auto', minWidth: '180px', padding: '6px 12px' }}
            value={selectedGroup} 
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="">Barcha Guruhlar</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lessons List / Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Darslar yuklanmoqda...</div>
      ) : filteredLessons.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <Film size={40} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
            Hozircha darslar topilmadi
          </h3>
          {isTeacherOrAdmin && (
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              Yuqoridagi <strong>"Yangi Dars Qo'shish"</strong> tugmasini bosib birinchi darsni va videoni kiriting!
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredLessons.map((lesson) => {
            const hasVideo = Boolean(lesson.youtube_video_id || lesson.youtube_url);
            
            return (
              <div 
                key={lesson.id} 
                className="card" 
                style={{ 
                  padding: '24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  border: hasVideo ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                  background: hasVideo ? 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' : '#ffffff'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="badge badge-active" style={{ fontSize: '12px' }}>
                      {lesson.group_name || 'Guruh'}
                    </span>
                    {hasVideo ? (
                      <span className="badge badge-active" style={{ background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Film size={12} /> Video Tayyor
                      </span>
                    ) : (
                      <span className="badge badge-hold">Video Kutilmoqda</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '10px', lineHeight: 1.4 }}>
                    {lesson.topic}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#2563eb" />
                      <span>Sana: <strong>{lesson.date}</strong></span>
                    </div>
                    {(lesson.start_time || lesson.end_time) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="#2563eb" />
                        <span>Vaqt: {lesson.start_time || ''} - {lesson.end_time || ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {hasVideo && (
                    <button 
                      className="btn btn-primary"
                      style={{ flex: 1, justifyContent: 'center', gap: '8px', padding: '10px 16px' }}
                      onClick={() => { setActiveVideoLesson(lesson); setModalTab('notes'); }}
                    >
                      <Play size={16} fill="#ffffff" />
                      <span>Videoni Ko'rish</span>
                    </button>
                  )}

                  {isTeacherOrAdmin && (
                    <button 
                      className={`btn ${hasVideo ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ flex: hasVideo ? '0 0 auto' : 1, justifyContent: 'center', gap: '6px', padding: '10px 14px' }}
                      onClick={() => {
                        setShowUploadVideoModal(lesson);
                        setVideoDirectUrl(lesson.youtube_url || '');
                      }}
                      title="Video fayl yuklash yoki havolani o'zgartirish"
                    >
                      <UploadCloud size={16} />
                      <span>{hasVideo ? "O'zgartirish" : "Video Yuklash"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Add New Lesson (Teacher/Admin) */}
      {showAddLessonModal && (
        <div className="modal-overlay" onClick={() => setShowAddLessonModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Yangi Dars Qo'shish</h3>
            </div>
            <form onSubmit={handleCreateLesson}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Guruh *</label>
                  <select 
                    className="form-select"
                    required
                    value={newLesson.group}
                    onChange={(e) => setNewLesson({ ...newLesson, group: e.target.value })}
                  >
                    <option value="">-- Guruhni tanlang --</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Dars Mavzusi (Topic) *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="Masalan: Present Perfect vs Past Simple" 
                    value={newLesson.topic} 
                    onChange={(e) => setNewLesson({ ...newLesson, topic: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label>Dars Sanasi *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    required 
                    value={newLesson.date} 
                    onChange={(e) => setNewLesson({ ...newLesson, date: e.target.value })} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Boshlanish vaqti</label>
                    <input 
                      type="time" 
                      className="form-input" 
                      value={newLesson.start_time} 
                      onChange={(e) => setNewLesson({ ...newLesson, start_time: e.target.value })} 
                    />
                  </div>

                  <div className="form-group">
                    <label>Tugash vaqti</label>
                    <input 
                      type="time" 
                      className="form-input" 
                      value={newLesson.end_time} 
                      onChange={(e) => setNewLesson({ ...newLesson, end_time: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>YouTube Video Havolasi (Ixtiyoriy)</label>
                  <input 
                    type="url" 
                    className="form-input" 
                    placeholder="https://www.youtube.com/watch?v=..." 
                    value={newLesson.youtube_url} 
                    onChange={(e) => setNewLesson({ ...newLesson, youtube_url: e.target.value })} 
                  />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Videoni dars yaratilgandan so'ng ham yuklashingiz mumkin.</span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddLessonModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingLesson}>
                  <span>{savingLesson ? "Saqlanmoqda..." : "Darsni Saqlash"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Upload Video File or Link (Teacher/Admin) */}
      {showUploadVideoModal && (
        <div className="modal-overlay" onClick={() => setShowUploadVideoModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>
                Video Yuklash: {showUploadVideoModal.topic}
              </h3>
            </div>
            <form onSubmit={handleUploadVideoToLesson}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Option A: YouTube Link */}
                <div className="form-group">
                  <label>1. YouTube Video Havolasi (Tezkor usul)</label>
                  <input 
                    type="url" 
                    className="form-input" 
                    placeholder="https://www.youtube.com/watch?v=..." 
                    value={videoDirectUrl} 
                    onChange={(e) => setVideoDirectUrl(e.target.value)} 
                  />
                </div>

                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: '700' }}>
                  — YOKI —
                </div>

                {/* Option B: Direct Video File Upload to YouTube API */}
                <div className="form-group">
                  <label>2. Kompyuterdan Video Fayl Yuklash (.mp4, .mov)</label>
                  <input 
                    type="file" 
                    className="form-input" 
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files[0])} 
                  />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Fayl Celery orqali avtomatik YouTube kanalga yuklanadi.</span>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadVideoModal(null)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploadingVideo}>
                  <UploadCloud size={16} />
                  <span>{uploadingVideo ? "Yuklanmoqda..." : "Videoni Saqlash"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Video Player with Q&A Comments */}
      {activeVideoLesson && (
        <div className="modal-overlay" onClick={() => setActiveVideoLesson(null)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '900px', width: '92%', padding: '0', overflow: 'hidden' }}
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', color: '#ffffff' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>{activeVideoLesson.topic}</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{activeVideoLesson.group_name} • {activeVideoLesson.date}</span>
              </div>
              <button 
                onClick={() => setActiveVideoLesson(null)} 
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Embedded Video */}
            <div style={{ position: 'relative', paddingBottom: '52%', height: 0, background: '#000000' }}>
              {getYoutubeEmbedUrl(activeVideoLesson) ? (
                <iframe
                  src={getYoutubeEmbedUrl(activeVideoLesson)}
                  title={activeVideoLesson.topic}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div style={{ position: 'absolute', top: '45%', width: '100%', textAlign: 'center', color: '#ffffff' }}>
                  Video yuklanishida xatolik yuz berdi.
                </div>
              )}
            </div>

            {/* Below Video: Tabs (Notes & Q&A Discussion) */}
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
              <button
                className={`btn ${modalTab === 'notes' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '13px' }}
                onClick={() => setModalTab('notes')}
              >
                <BookOpen size={14} />
                <span>Dars Qaydlari</span>
              </button>

              <button
                className={`btn ${modalTab === 'qa' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '13px' }}
                onClick={() => setModalTab('qa')}
              >
                <MessageSquare size={14} />
                <span>Savol-Javob & Muhokama ({(lessonComments[activeVideoLesson.id] || []).length})</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div style={{ padding: '20px 24px', maxHeight: '240px', overflowY: 'auto' }}>
              {modalTab === 'notes' ? (
                <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>Mavzu: {activeVideoLesson.topic}</h4>
                  <p>
                    Ushbu dars davomida talabalar yangi grammatik qoidalar, so'z birikmalari va nutq ko'nikmalarini o'rganadilar.
                    Darsni to'liq tomosha qilib bo'lgach, <strong>"Vazifalar & Testlar"</strong> bo'limida berilgan topshiriqni bajarish tavsiya etiladi.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Comments list */}
                  {(lessonComments[activeVideoLesson.id] || []).length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '12px 0', fontSize: '13px' }}>
                      Ushbu dars bo'yicha hali savollar yo'q. Birinchi bo'lib savol qoldiring!
                    </div>
                  ) : (
                    (lessonComments[activeVideoLesson.id] || []).map((comm) => (
                      <div 
                        key={comm.id}
                        style={{ 
                          padding: '10px 14px', 
                          borderRadius: '10px', 
                          background: comm.role === 'teacher' ? '#eff6ff' : '#ffffff',
                          border: comm.role === 'teacher' ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '700', fontSize: '13px', color: comm.role === 'teacher' ? '#1e40af' : '#0f172a' }}>
                            {comm.user} {comm.role === 'teacher' && <span className="badge badge-active" style={{ fontSize: '10px', padding: '2px 6px', marginLeft: '4px' }}>Ustoz</span>}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{comm.time}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>
                          {comm.text}
                        </p>
                      </div>
                    ))
                  )}

                  {/* Input form */}
                  <form onSubmit={handleSendComment} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="Dars bo'yicha savolingizni yozing..."
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      style={{ fontSize: '13px' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>
                      <Send size={14} />
                      <span>Yuborish</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 24px', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <button className="btn btn-secondary" onClick={() => setActiveVideoLesson(null)}>
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
