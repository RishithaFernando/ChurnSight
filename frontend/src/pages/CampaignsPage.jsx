import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Eye,
  Share2,
  Megaphone,
  ToggleRight,
  ToggleLeft,
  X,
  Users,
  AlertTriangle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import API from '../api/axios';
import AdminLayout from '../components/AdminLayout';
import AdminBackground from '../components/AdminBackground';
import SurveyLinkModal from '../components/SurveyLinkModal';
import Toast from '../components/Toast';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CampaignsPage({ username }) {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Share modal state
  const [shareModal, setShareModal] = useState(null); // { token, name }

  const fetchCampaigns = async () => {
    try {
      const res = await API.get('/admin/campaigns');
      setCampaigns(res.data);
    } catch {
      setError('Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreating(true);
    try {
      await API.post('/admin/campaign/create', {
        name: createName.trim(),
        description: createDesc.trim(),
      });
      setShowCreate(false);
      setCreateName('');
      setCreateDesc('');
      setToast({ type: 'success', message: 'Campaign created successfully!' });
      setLoading(true);
      fetchCampaigns();
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.error || 'Failed to create campaign.' });
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await API.post(`/admin/campaign/${id}/toggle`);
      setToast({ type: 'success', message: 'Campaign status updated.' });
      fetchCampaigns();
    } catch {
      setToast({ type: 'error', message: 'Failed to toggle campaign.' });
    }
  };

  const inputCls =
    'w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent bg-white';

  return (
    <AdminLayout username={username} breadcrumbs={['Home', 'Campaigns']}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="relative overflow-hidden min-h-screen pb-10 -mx-6 -mt-6 px-6 pt-6">
        <AdminBackground />
        
        <div className="relative z-[1] max-w-7xl mx-auto">
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#0f172a]">Survey Campaigns</h1>
              <p className="text-sm text-[#64748b] mt-1">Create and manage your customer survey campaigns</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 sm:mt-0 flex items-center gap-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4" /> Create New Campaign
            </button>
          </header>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#4f46e5] border-t-transparent" />
            </div>
          ) : error ? (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Megaphone className="w-16 h-16 text-[#e2e8f0] mb-4" />
              <h2 className="text-xl font-semibold text-[#0f172a] mb-2">No campaigns yet</h2>
              <p className="text-[#64748b] mb-6">Create your first campaign to start collecting customer feedback</p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-4 h-4" /> Create New Campaign
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="flex flex-col transition-all duration-200 p-6"
                  style={{
                    background: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.9)',
                    borderRadius: '20px',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1 pr-4">
                      <h3 className="text-lg font-semibold text-[#0f172a] truncate">{camp.name}</h3>
                      {camp.description && (
                        <p className="text-[#64748b] text-sm mt-1 line-clamp-2">{camp.description}</p>
                      )}
                    </div>
                    {camp.is_active ? (
                      <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
                        Active
                      </span>
                    ) : (
                      <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]"></span>
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[#94a3b8] text-xs mt-2">
                    <Calendar className="w-3 h-3" />
                    <span>Created {formatDate(camp.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-5 mt-4">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Users className="w-4 h-4 text-[#64748b]" />
                      <span className="font-semibold text-[#0f172a]">{camp.total_customers ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="font-semibold text-red-600">{camp.high_risk ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-semibold text-green-600">{camp.low_risk ?? 0}</span>
                    </div>
                  </div>

                  <div className="border-t border-[#f1f5f9] mt-4 pt-4 flex items-center gap-3">
                    <button
                      onClick={() => navigate(`/admin/campaign/${camp.id}`)}
                      className="flex items-center gap-1.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm"
                    >
                      <Eye className="w-4 h-4" /> View Results
                    </button>
                    <button
                      onClick={() => setShareModal({ token: camp.survey_token, name: camp.name })}
                      className="flex items-center gap-1.5 bg-white border border-[#e2e8f0] text-[#64748b] px-4 py-2 rounded-xl text-sm font-medium hover:border-[#4f46e5] hover:text-[#4f46e5] transition-colors"
                    >
                      <Share2 className="w-4 h-4" /> Share Link
                    </button>
                    <button
                      onClick={() => handleToggle(camp.id)}
                      className="ml-auto flex items-center justify-center p-1"
                      title={camp.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {camp.is_active ? (
                        <ToggleRight className="w-7 h-7 text-[#4f46e5]" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-[#94a3b8]" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative animate-in fade-in zoom-in-95 duration-200 w-full max-w-lg p-6"
               style={{
                 background: '#ffffff',
                 borderRadius: '20px',
                 boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
               }}>
            <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-[#0f172a] mb-1">Create New Campaign</h2>
            <p className="text-sm text-[#64748b] mb-6">Set up a new survey campaign for your customers</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Campaign Name *</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. Q1 2026 Customer Survey"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Description</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="Brief description of this campaign"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="border border-[#e2e8f0] bg-white hover:bg-gray-50 text-[#64748b] font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !createName.trim()}
                className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-medium px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
              >
                {creating && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {shareModal && (
        <SurveyLinkModal
          token={shareModal.token}
          campaignName={shareModal.name}
          onClose={() => setShareModal(null)}
        />
      )}
    </AdminLayout>
  );
}
