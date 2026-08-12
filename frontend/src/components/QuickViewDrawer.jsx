import React from 'react';
import { X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function QuickViewDrawer({ student, onClose }) {
  if (!student) return null;

  return (
    <div className="quick-view-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <img 
            src={student.avatar} 
            alt={student.full_name} 
            style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', marginBottom: '8px' }}
          />
          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{student.full_name}</h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>quick view</span>
        </div>
        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
        >
          <X size={18} />
        </button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '14px 0' }} />

      <div className="timeline-list">
        {student.recentLessons && student.recentLessons.length > 0 ? (
          student.recentLessons.map((item, idx) => (
            <div key={idx} className="timeline-item">
              <span 
                className="timeline-dot" 
                style={{ 
                  backgroundColor: item.status === 'completed' ? '#3b82f6' : item.status === 'pending' ? '#10b981' : '#f43f5e' 
                }} 
              />
              <div>
                <div style={{ fontWeight: '600', color: '#0f172a' }}>{item.title}</div>
                <div style={{ color: '#64748b', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Clock size={11} /> {item.time}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
            No recent activity recorded.
          </div>
        )}
      </div>
    </div>
  );
}
