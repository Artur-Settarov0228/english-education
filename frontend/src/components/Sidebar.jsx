import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings, 
  BookMarked,
  CreditCard,
  CalendarCheck,
  Building2,
  LogOut
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, userRole, onLogout }) {
  let navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'tasks', label: 'Tasks & Quizzes', icon: BookMarked },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (userRole === 'teacher') {
    navItems = navItems.filter(item => ['dashboard', 'courses', 'tasks', 'attendance'].includes(item.id));
  } else if (userRole === 'student') {
    navItems = navItems.filter(item => ['dashboard', 'courses', 'tasks', 'payments'].includes(item.id));
  }

  return (
    <aside className="sidebar">
      {/* Brand Logo & Name matching Screenshots */}
      <div className="brand-header">
        <div className="brand-icon">
          <BookOpen size={22} />
        </div>
        <div className="brand-title">
          English Language<br />Learning CRM
        </div>
      </div>

      {/* Navigation List */}
      <ul className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <li key={item.id} className={`nav-item ${isActive ? 'active' : ''}`}>
              <button onClick={() => setActiveTab(item.id)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Logout button at bottom */}
      <div style={{ marginTop: 'auto', padding: '16px' }}>
        <button 
          onClick={onLogout}
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'flex-start', color: '#ef4444' }}
        >
          <LogOut size={18} />
          <span>Chiqish (Logout)</span>
        </button>
      </div>
    </aside>
  );
}
