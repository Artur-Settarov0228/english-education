import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, User, LogOut, Settings, X, Upload } from 'lucide-react';
import { authService } from '../services/api';

export default function Header({ currentUser, onSearch, onLogout, onProfileUpdated }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Profil modal holati
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({ first_name: '', last_name: '', phone_number: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const openProfileModal = () => {
    setProfileData({
      first_name: currentUser?.first_name || '',
      last_name: currentUser?.last_name || '',
      phone_number: currentUser?.phone_number || ''
    });
    setAvatarPreview(currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120');
    setAvatarFile(null);
    setIsProfileModalOpen(true);
    setShowProfileMenu(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (avatarFile) {
        await authService.uploadAvatar(avatarFile);
      }
      await authService.updateProfile(profileData);
      if (onProfileUpdated) await onProfileUpdated();
      setIsProfileModalOpen(false);
    } catch (err) {
      alert("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsSaving(false);
    }
  };

  // Oyna tashqarisiga bosilganda dropdownlarni yopish
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
    <header className="top-header">
      {/* Search Input Box matching Screenshots */}
      <div className="search-box">
        <Search size={18} color="#94a3b8" />
        <input 
          type="text" 
          placeholder="Qidiruv..." 
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
      </div>

      {/* Header Right Actions */}
      <div className="header-right">
        
        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button 
            className="icon-btn" 
            title="Bildirishnomalar (Notifications)" 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
          >
            <Bell size={18} />
            <span className="notification-dot" />
          </button>
          
          {showNotifications && (
            <div style={{
              position: 'absolute', right: 0, top: '45px', width: '280px',
              background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0', zIndex: 100, overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: '700', fontSize: '14px' }}>
                Bildirishnomalar
              </div>
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                Hozircha yangi xabarlar yo'q
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <div 
            className="user-profile-badge" 
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
          >
            <img 
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'} 
              alt="User Avatar" 
              className="user-avatar"
            />
            <ChevronDown size={16} color="#64748b" style={{ transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }} />
          </div>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div style={{
              position: 'absolute', right: 0, top: '50px', width: '220px',
              background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0', zIndex: 100, overflow: 'hidden'
            }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>
                  {currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name}` : `@${currentUser?.username || 'User'}`}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', textTransform: 'capitalize' }}>
                  {currentUser?.role || 'Admin'}
                </div>
              </div>
              
              <div style={{ padding: '8px' }}>
                <button 
                  className="dropdown-item" 
                  onClick={openProfileModal}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', color: '#334155' }}
                  onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <User size={16} /> Mening Profilim
                </button>
                <button 
                  className="dropdown-item" 
                  onClick={openProfileModal}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', color: '#334155' }}
                  onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <Settings size={16} /> Sozlamalar
                </button>
                
                <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 0' }}></div>
                
                <button 
                  onClick={onLogout}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', color: '#ef4444', fontWeight: '600' }}
                  onMouseEnter={(e) => e.target.style.background = '#fee2e2'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <LogOut size={16} /> Chiqish
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Profile Modal */}
    {isProfileModalOpen && (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '500px' }}>
          <div className="modal-header">
            <h2>Mening Profilim</h2>
            <button className="icon-btn" onClick={() => setIsProfileModalOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSaveProfile} style={{ padding: '10px 4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
              <div style={{ position: 'relative', width: '110px', height: '110px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #e0f2fe', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
                <img 
                  src={avatarPreview} 
                  alt="Preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <label style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                  color: '#fff', textAlign: 'center', padding: '6px 0', cursor: 'pointer', fontSize: '12px', fontWeight: '500',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', transition: 'background 0.2s'
                }}>
                  <Upload size={14} /> O'zgartirish
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Rasm formati: JPG, PNG, GIF</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Ism</label>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', transition: 'all 0.2s', background: '#f8fafc' }}
                  value={profileData.first_name}
                  onChange={e => setProfileData({...profileData, first_name: e.target.value})}
                  placeholder="Ismingizni kiriting"
                  onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Familiya</label>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', transition: 'all 0.2s', background: '#f8fafc' }}
                  value={profileData.last_name}
                  onChange={e => setProfileData({...profileData, last_name: e.target.value})}
                  placeholder="Familiyangizni kiriting"
                  onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Telefon Raqam</label>
              <input 
                type="text" 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', transition: 'all 0.2s', background: '#f8fafc' }}
                value={profileData.phone_number}
                onChange={e => setProfileData({...profileData, phone_number: e.target.value})}
                placeholder="Masalan: +998901234567"
                onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
              <button 
                type="button" 
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: '0.2s' }}
                onClick={() => setIsProfileModalOpen(false)}
                onMouseEnter={e => e.target.style.background = '#f8fafc'}
                onMouseLeave={e => e.target.style.background = '#fff'}
              >
                Bekor qilish
              </button>
              <button 
                type="submit" 
                style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: '0.2s', opacity: isSaving ? 0.7 : 1 }}
                disabled={isSaving}
                onMouseEnter={e => !isSaving && (e.target.style.background = '#1d4ed8')}
                onMouseLeave={e => !isSaving && (e.target.style.background = '#2563eb')}
              >
                {isSaving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
