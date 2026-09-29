import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  BarChart2,
  LogOut,
  Bell,
  AlignJustify,
  Mail,
  Moon,
  Sun,
  Settings,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import API from '../api/axios';

export default function AdminLayout({ children, username, breadcrumbs = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutText, setLogoutText] = useState('Initiating logout...');

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let interval;
    if (isLoggingOut) {
      let step = 0;
      const texts = [
        'Terminating secure session...',
        'Clearing local cache...',
        'Revoking access tokens...',
        'Signing out...'
      ];
      interval = setInterval(() => {
        step = (step + 1) % texts.length;
        setLogoutText(texts[step]);
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isLoggingOut]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    setIsLoggingOut(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2400));
      await API.post('/admin/logout');
    } catch {}
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/campaigns', icon: Megaphone, label: 'Campaigns' },
    { path: '/admin/customers', icon: Users, label: 'All Customers' },
    { path: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
  ];

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* ── Unique Logout Overlay ── */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020617]/90 backdrop-blur-xl transition-opacity animate-in fade-in duration-300">
          <div className="flex flex-col items-center">
            
            {/* Custom Spinner / Logo Animation (Reversed theme for logout) */}
            <div className="relative flex items-center justify-center w-28 h-28 mb-8">
              {/* Outer pulsing ripple */}
              <div className="absolute inset-[-20%] border border-white/20 rounded-full animate-ping" style={{ animationDuration: '2.5s' }}></div>
              
              {/* Spinning rings */}
              <div className="absolute inset-0 border-[3px] border-transparent border-t-white border-r-white/50 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
              <div className="absolute inset-2 border-[3px] border-transparent border-b-gray-400 border-l-gray-400/50 rounded-full animate-spin" style={{ animationDuration: '1s' }}></div>
              
              {/* Center Core */}
              <div className="absolute inset-5 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <LogOut className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>
            
            {/* Branding & Status */}
            <h3 className="text-2xl font-bold text-white tracking-tight mb-3">Goodbye</h3>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            
            <p className="text-gray-400 text-sm font-medium w-[260px] text-center transition-all duration-300">
              {logoutText}
            </p>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside 
        className="fixed inset-y-0 left-0 bg-[#0f172a] z-30 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
        style={{ width: sidebarCollapsed ? '0px' : '240px' }}
      >
        {/* Top Logo */}
        <div className="flex items-center gap-3 px-6 py-6 min-w-[240px]">
          <div className="w-8 h-8 bg-[#4f46e5] rounded-lg flex items-center justify-center">
            <BarChart2 className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">ChurnSight</span>
          <span className="text-xs text-[#475569] ml-auto">v1.0</span>
        </div>

        {/* Navigation */}
        <div className="px-2 flex-1 mt-2 min-w-[240px]">
          <p className="text-[11px] font-semibold text-[#475569] tracking-widest uppercase px-4 mb-2 mt-4">MAIN MENU</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = path === item.path || (item.path !== '/admin/dashboard' && path.startsWith(item.path));
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mx-0 ${
                    active
                      ? 'bg-[#4f46e5] text-white shadow-lg shadow-indigo-500/25'
                      : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Area */}
        <div className="mt-auto border-t border-white/10 px-4 py-4 min-w-[240px]">
          <div className="flex items-center gap-3 px-2 mb-2">
            <div className="w-9 h-9 bg-[#4f46e5] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {getInitials(username)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{username}</p>
              <p className="text-xs text-[#64748b] truncate">Administrator</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#94a3b8] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div 
        className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarCollapsed ? '0px' : '240px' }}
      >
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-8 sticky top-0 z-20">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg hover:bg-[#f1f5f9] transition-colors text-[#64748b]"
            >
              <AlignJustify className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight size={14} color="#94a3b8" className="mx-2" />}
                  <span 
                    className={i === breadcrumbs.length - 1 ? 'text-[#0f172a] font-medium' : 'text-[#64748b] hover:text-[#4f46e5] hover:underline cursor-pointer'}
                    style={{ fontSize: '14px' }}
                    onClick={() => {
                      if (i === breadcrumbs.length - 1) return;
                      if (crumb === 'Home') navigate('/admin/dashboard');
                      else if (crumb === 'Customers') navigate('/admin/customers');
                      else if (crumb === 'Campaigns') navigate('/admin/campaigns');
                      else if (crumb === 'Analytics') navigate('/admin/analytics');
                    }}
                  >
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Right Icons Row */}
          <div className="flex items-center gap-2">
            
            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-[#f1f5f9] transition-colors duration-200" title="Notifications">
                <Bell className="w-[18px] h-[18px] text-[#64748b]" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              
              {showNotifications && (
                <div style={{
                  position: 'absolute', top: '48px', right: 0,
                  background: 'white', borderRadius: '16px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                  border: '1px solid #e2e8f0', width: '320px', zIndex: 1000
                }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="font-semibold text-[#0f172a] text-sm">Notifications</span>
                    <span className="text-[#4f46e5] text-xs cursor-pointer">Mark all read</span>
                  </div>
                  
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc', display: 'flex', gap: '12px', alignItems: 'flex-start' }} className="hover:bg-[#f8fafc]">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', marginTop: '6px', flexShrink: 0 }} />
                    <div>
                      <div className="text-[#374151] text-sm leading-relaxed">60 customers are at high risk of leaving</div>
                      <div className="text-[#94a3b8] text-xs mt-1">Just now</div>
                    </div>
                  </div>

                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc', display: 'flex', gap: '12px', alignItems: 'flex-start' }} className="hover:bg-[#f8fafc]">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', marginTop: '6px', flexShrink: 0 }} />
                    <div>
                      <div className="text-[#374151] text-sm leading-relaxed">New survey responses received in Q1 2026</div>
                      <div className="text-[#94a3b8] text-xs mt-1">2 hours ago</div>
                    </div>
                  </div>

                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc', display: 'flex', gap: '12px', alignItems: 'flex-start' }} className="hover:bg-[#f8fafc]">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4f46e5', marginTop: '6px', flexShrink: 0 }} />
                    <div>
                      <div className="text-[#374151] text-sm leading-relaxed">Q1 2026 Customer Survey is currently active</div>
                      <div className="text-[#94a3b8] text-xs mt-1">1 day ago</div>
                    </div>
                  </div>
                  
                  <div style={{ padding: '12px 20px', textAlign: 'center' }}>
                    <span className="text-[#4f46e5] text-sm cursor-pointer hover:underline">View all notifications</span>
                  </div>
                </div>
              )}
            </div>

            <button className="p-2 rounded-lg hover:bg-[#f1f5f9] transition-colors duration-200" title="Messages">
              <Mail className="w-[18px] h-[18px] text-[#64748b]" />
            </button>
            
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-[#f1f5f9] transition-colors duration-200" title="Dark Mode">
              {darkMode ? <Sun className="w-[18px] h-[18px] text-[#64748b]" /> : <Moon className="w-[18px] h-[18px] text-[#64748b]" />}
            </button>

            <div className="w-px h-6 bg-[#e2e8f0] mx-2" />

            {/* User Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <div 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center cursor-pointer hover:bg-[#f8fafc] p-1.5 rounded-lg transition-colors duration-200"
              >
                <div className="w-9 h-9 bg-[#4f46e5] rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {getInitials(username)}
                </div>
                <span className="text-sm font-medium text-[#0f172a] mx-2 hidden sm:block">{username}</span>
                <ChevronDown className="w-4 h-4 text-[#94a3b8]" />
              </div>
              
              {showUserMenu && (
                <div style={{
                  position: 'absolute', top: '48px', right: 0,
                  background: 'white', borderRadius: '16px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                  border: '1px solid #e2e8f0', width: '220px', zIndex: 1000, overflow: 'hidden'
                }}>
                  <div style={{ padding: '16px 20px', backgroundColor: '#f8fafc' }}>
                    <div className="w-10 h-10 bg-[#4f46e5] rounded-full flex items-center justify-center text-white font-bold">
                      {getInitials(username)}
                    </div>
                    <div className="font-semibold text-[#0f172a] text-sm mt-2">{username}</div>
                    <div className="text-[#64748b] text-xs">Administrator</div>
                  </div>
                  
                  <div className="border-t border-[#e2e8f0]" />
                  
                  <div style={{ padding: '12px 20px', display: 'flex', gap: '12px', alignItems: 'center' }} className="hover:bg-[#f8fafc] cursor-pointer transition-colors">
                    <Settings size={16} color="#64748b" />
                    <span className="text-[#374151] text-sm">Settings</span>
                  </div>
                  
                  <div className="border-t border-[#e2e8f0]" />
                  
                  <div 
                    onClick={handleLogout}
                    style={{ padding: '12px 20px', display: 'flex', gap: '12px', alignItems: 'center' }} className="hover:bg-[#f8fafc] cursor-pointer transition-colors">
                    <LogOut size={16} color="#ef4444" />
                    <span className="text-red-600 text-sm font-medium">Log out</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
