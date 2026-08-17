import React, { useState, useEffect } from 'react';
import { 
  Video, Play, Calendar, Clock, Search, RefreshCw, 
  ExternalLink, CheckCircle2, AlertCircle, X, Film
} from 'lucide-react';
import { lessonService } from '../services/api';

export default function LessonsPage({ currentUser }) {
  const [lessons, setLessons] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Video Player Modal
  const [activeVideoLesson, setActiveVideoLesson] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lessonsData, groupsData] = await Promise.all([
        lessonService.getLessons(selectedGroup || null),
        lessonService.getGroups()
      ]);
      setLessons(Array.isArray(lessonsData) ? lessonsData : []);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (err) {
      console.error("Ma'lumotlarni olishda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedGroup]);

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
      // Parse video ID from url if possible
      const match = lesson.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
      }
      return lesson.youtube_url;
    }
    return null;
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
            O'tilgan darslar yozuvlari va video qo'llanmalarni onlayn tomosha qiling
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchData} title="Yangilash">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Yangilash</span>
        </button>
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
          Hozircha darslar topilmadi.
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

                <div>
                  {hasVideo ? (
                    <button 
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', gap: '8px', padding: '10px 16px' }}
                      onClick={() => setActiveVideoLesson(lesson)}
                    >
                      <Play size={16} fill="#ffffff" />
                      <span>Video Darsni Ko'rish</span>
                    </button>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '8px', background: '#f1f5f9', borderRadius: '8px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                      Video dars tez orada yuklanadi
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Player Modal */}
      {activeVideoLesson && (
        <div className="modal-overlay" onClick={() => setActiveVideoLesson(null)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '850px', width: '90%', padding: '0', overflow: 'hidden' }}
          >
            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', color: '#ffffff' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{activeVideoLesson.topic}</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{activeVideoLesson.group_name} • {activeVideoLesson.date}</span>
              </div>
              <button 
                onClick={() => setActiveVideoLesson(null)} 
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000000' }}>
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

            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
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
