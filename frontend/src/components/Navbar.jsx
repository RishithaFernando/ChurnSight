// This component is no longer used.
// The sidebar layout is now built directly into AdminDashboard.jsx and CustomerDetail.jsx.
// This file is kept to prevent import errors if referenced elsewhere.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, LogOut } from 'lucide-react';
import API from '../api/axios';

export default function Navbar({ username }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await API.post('/admin/logout');
    } catch {}
    navigate('/admin/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-6 h-6 text-blue-600" />
        <span className="text-lg font-bold text-gray-900">ChurnSight</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 font-medium">{username}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-red-600 hover:text-red-700 text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </nav>
  );
}
