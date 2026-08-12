import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

export default function Header({ currentUser, onSearch }) {
  return (
    <header className="top-header">
      {/* Search Input Box matching Screenshots */}
      <div className="search-box">
        <Search size={18} color="#94a3b8" />
        <input 
          type="text" 
          placeholder="Search..." 
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
      </div>

      {/* Header Right Actions */}
      <div className="header-right">
        <button className="icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        <div className="user-profile-badge">
          <img 
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'} 
            alt="User Avatar" 
            className="user-avatar"
          />
          <ChevronDown size={16} color="#64748b" />
        </div>
      </div>
    </header>
  );
}
