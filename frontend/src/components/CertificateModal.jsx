import React from 'react';
import { Award, Download, Printer, X, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function CertificateModal({ currentUser, courseName = "General English Mastery (B2)", onClose }) {
  const studentName = currentUser?.first_name 
    ? `${currentUser.first_name} ${currentUser.last_name || ''}`
    : currentUser?.username || "Artur Settarov";

  const certId = `ENG-CERT-${Math.floor(100000 + Math.random() * 900000)}`;
  const issueDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '820px', width: '95%', padding: '0', background: 'transparent', boxShadow: 'none' }}
      >
        
        {/* Certificate Paper Container */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fefce8 100%)',
            border: '12px solid #1e3a8a',
            outline: '4px solid #ca8a04',
            borderRadius: '12px',
            padding: '48px 40px',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center',
            color: '#0f172a'
          }}
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={24} />
          </button>

          {/* Top Emblem & Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
            <div 
              style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #ca8a04 0%, #eab308 100%)', 
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(202, 138, 4, 0.4)',
                marginBottom: '12px'
              }}
            >
              <Award size={36} />
            </div>

            <div style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.2em', color: '#854d0e', textTransform: 'uppercase' }}>
              English Language Learning CRM
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e3a8a', margin: '4px 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              Certificate of Completion
            </h1>
            <div style={{ width: '120px', height: '3px', background: '#ca8a04', margin: '8px auto 0 auto', borderRadius: '2px' }} />
          </div>

          {/* Body Text */}
          <div style={{ fontSize: '14px', color: '#475569', fontStyle: 'italic', marginBottom: '12px' }}>
            This certificate is proudly presented to:
          </div>

          <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', borderBottom: '2px solid #e2e8f0', display: 'inline-block', paddingBottom: '6px' }}>
            {studentName}
          </h2>

          <p style={{ fontSize: '15px', color: '#334155', maxWidth: '600px', margin: '0 auto 32px auto', lineHeight: 1.6 }}>
            for successfully completing all curriculum requirements, homework assignments, and exams for the course:
            <br />
            <strong style={{ fontSize: '18px', color: '#1e3a8a', display: 'block', marginTop: '6px' }}>
              {courseName}
            </strong>
          </p>

          {/* Signatures & Security Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #cbd5e1', paddingTop: '24px', margin: '0 20px' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Artur Settarov</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Academic Director & Lead Instructor</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                <ShieldCheck size={14} />
                <span>Verified Certificate</span>
              </div>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>ID: {certId}</span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{issueDate}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Issue Date</div>
            </div>
          </div>

        </div>

        {/* Action Buttons Below Certificate */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '20px' }}>
          <button 
            className="btn btn-secondary"
            onClick={handlePrint}
            style={{ background: '#ffffff', color: '#0f172a', padding: '10px 20px' }}
          >
            <Printer size={16} />
            <span>Chop etish (Print)</span>
          </button>

          <button 
            className="btn btn-primary"
            onClick={handlePrint}
            style={{ padding: '10px 24px' }}
          >
            <Download size={16} />
            <span>PDF Yuklab olish</span>
          </button>
        </div>

      </div>
    </div>
  );
}
