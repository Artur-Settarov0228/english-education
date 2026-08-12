import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import SuperAdminPage from './pages/SuperAdminPage';
import StudentsPage from './pages/StudentsPage';
import CoursesPage from './pages/CoursesPage';
import TasksPage from './pages/TasksPage';
import AttendancePage from './pages/AttendancePage';
import PaymentsPage from './pages/PaymentsPage';
import LoginPage from './pages/LoginPage';
import { authService } from './services/api';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem('access_token'))
  );
  const [activeTab, setActiveTab] = useState('dashboard'); // Default to dashboard
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      authService.getProfile().then((user) => setCurrentUser(user));
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('username');
    localStorage.removeItem('is_superuser');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Determine if the user is the Global Super Admin
  const hostname = window.location.hostname;
  const isMainDomain = hostname === 'localhost' || hostname === '127.0.0.1';
  const isSuperUser = localStorage.getItem('is_superuser') === 'true';
  const isGlobalSuperAdmin = isSuperUser && isMainDomain;

  if (isGlobalSuperAdmin) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8fafc' }}>
        <Header currentUser={currentUser} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
           <button onClick={handleLogout} className="btn btn-secondary" style={{ color: '#ef4444', borderColor: '#ef4444' }}>
             Chiqish (Logout)
           </button>
        </div>
        <main className="page-wrapper" style={{ flex: 1, padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          <SuperAdminPage />
        </main>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'students':
        return <StudentsPage />;
      case 'courses':
        return <CoursesPage />;
      case 'tasks':
        return <TasksPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'payments':
        return <PaymentsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation matching Screenshots */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={currentUser?.role} 
        onLogout={handleLogout}
      />

      {/* Main Content View */}
      <div className="main-content">
        <Header currentUser={currentUser} />
        <main className="page-wrapper">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
}
