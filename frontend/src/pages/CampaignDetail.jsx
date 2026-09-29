import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  Share2,
  Search,
  ToggleRight,
  ToggleLeft,
  Users,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import API from '../api/axios';
import AdminLayout from '../components/AdminLayout';
import AdminBackground from '../components/AdminBackground';
import SurveyLinkModal from '../components/SurveyLinkModal';
import Toast from '../components/Toast';
import RiskBadge from '../components/RiskBadge';

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 172800) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const CONTRACT_MAP = { 0: 'Monthly', 1: '1 Year', 2: '2 Year' };

export default function CampaignDetail({ username }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/admin/campaign/${id}`);
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load campaign.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleToggle = async () => {
    try {
      await API.post(`/admin/campaign/${id}/toggle`);
      setToast({ type: 'success', message: 'Campaign status updated.' });
      fetchData();
    } catch {
      setToast({ type: 'error', message: 'Failed to toggle campaign.' });
    }
  };

  const campaign = data?.campaign;
  const customers = data?.customers || [];

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'All' || c.risk_level === filter;
      return matchSearch && matchFilter;
    });
  }, [customers, search, filter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [search, filter]);

  const stats = useMemo(() => {
    return {
      total: customers.length,
      high: customers.filter(c => c.risk_level === 'High').length,
      medium: customers.filter(c => c.risk_level === 'Medium').length,
      low: customers.filter(c => c.risk_level === 'Low').length,
    };
  }, [customers]);



  if (loading) {
    return (
      <AdminLayout username={username} breadcrumbs={['Home', 'Campaigns', 'Loading...']}>
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#4f46e5] border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout username={username} breadcrumbs={['Home', 'Campaigns', 'Error']}>
        <div className="p-8">
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
        </div>
      </AdminLayout>
    );
  }

  const customLegend = (props) => {
    const { payload } = props;
    const mapping = {
      High: 'May Leave',
      Medium: 'Watch Closely',
      Low: 'Staying'
    };
    return (
      <ul className="flex flex-col gap-2 mt-4 text-sm text-gray-700">
        {payload.map((entry, index) => (
          <li key={`item-${index}`} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{mapping[entry.value] || entry.value}</span>
            </div>
            <span className="font-semibold">{entry.payload.value}</span>
          </li>
        ))}
      </ul>
    );
  };
  const churnRateRaw = stats.total > 0 ? (stats.high / stats.total * 100) : 0;
  const churnRateStr = churnRateRaw.toFixed(1);
  let churnColor = '#22c55e';
  let churnText = 'Low churn risk - looking good';
  if (churnRateRaw >= 30) {
    churnColor = '#ef4444';
    churnText = 'High churn risk - immediate action needed';
  } else if (churnRateRaw >= 10) {
    churnColor = '#f59e0b';
    churnText = 'Moderate churn risk - monitor closely';
  }

  return (
    <AdminLayout username={username} breadcrumbs={['Home', 'Campaigns', campaign?.name || 'Details']}>
      <AdminBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        <header className="bg-white border-b border-[#e2e8f0] px-8 py-6">
          <button 
            onClick={() => navigate('/admin/campaigns')} 
            className="flex items-center gap-2 text-[#64748b] text-sm hover:text-[#4f46e5] font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Campaigns
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#0f172a]">{campaign.name}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  campaign.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {campaign.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                {campaign.description && <span>{campaign.description} • </span>}
                <Calendar className="w-4 h-4" /> Created {formatDate(campaign.created_at)}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowShare(true)}
                className="flex items-center gap-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors text-sm"
              >
                <Share2 className="w-4 h-4" /> Share Link
              </button>
              <button
                onClick={handleToggle}
                className={`flex items-center gap-2 border font-medium px-5 py-2.5 rounded-xl text-sm transition-colors ${
                  campaign.is_active 
                    ? 'border-red-200 text-red-600 hover:bg-red-50' 
                    : 'border-green-200 text-green-600 hover:bg-green-50'
                }`}
              >
                {campaign.is_active ? (
                  <><ToggleRight className="w-4 h-4" /> Deactivate</>
                ) : (
                  <><ToggleLeft className="w-4 h-4" /> Activate</>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="px-8 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl p-5 shadow-sm text-white bg-gradient-to-br from-[#4f46e5] to-[#7c3aed]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-indigo-100">Total Responses</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl p-5 shadow-sm text-white bg-gradient-to-br from-red-500 to-red-600">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.high}</p>
                  <p className="text-sm text-red-100">High Risk</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl p-5 shadow-sm text-white bg-gradient-to-br from-amber-500 to-amber-600">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.medium}</p>
                  <p className="text-sm text-amber-100">Medium Risk</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl p-5 shadow-sm text-white bg-gradient-to-br from-green-500 to-green-600">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.low}</p>
                  <p className="text-sm text-green-100">Low Risk</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl shadow-sm mt-6 overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.9)', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)' }}>
            <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-gray-800 text-lg">Customer Responses</h2>
                <span className="bg-[#f1f5f9] text-gray-600 px-2.5 py-1 rounded-full text-xs font-semibold">
                  {filtered.length}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full sm:w-64 border border-[#e2e8f0] rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 transition-all"
                  />
                </div>
                
                <div className="flex gap-1.5 p-1 bg-white border border-[#e2e8f0] rounded-xl w-full sm:w-auto">
                  {['All', 'High', 'Medium', 'Low'].map((f) => {
                    const active = filter === f;
                    let activeStyle = 'bg-[#4f46e5] text-white';
                    if (active && f === 'High') activeStyle = 'bg-red-600 text-white';
                    if (active && f === 'Medium') activeStyle = 'bg-amber-500 text-white';
                    if (active && f === 'Low') activeStyle = 'bg-green-600 text-white';
                    
                    return (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1 sm:flex-none text-center ${
                          active ? activeStyle : 'bg-[#f1f5f9] text-[#64748b] hover:bg-gray-200'
                        }`}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Churn Probability</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500">
                        No responses match your criteria.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((c) => (
                      <tr 
                        key={c.id} 
                        onClick={() => navigate(`/admin/customer/${c.id}`)}
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                              {getInitials(c.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                              <p className="text-xs text-gray-500 truncate">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            c.risk_level === 'High' ? 'bg-red-50 text-red-700' :
                            c.risk_level === 'Medium' ? 'bg-amber-50 text-amber-700' :
                            'bg-green-50 text-green-700'
                          }`}>
                            {c.risk_level}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  (c.probability || 0) >= 70 ? 'bg-red-500' :
                                  (c.probability || 0) >= 40 ? 'bg-amber-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(c.probability || 0, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {c.probability != null ? `${c.probability.toFixed(1)}%` : '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {timeAgo(c.submitted_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/customer/${c.id}`); }}
                            className="inline-flex items-center gap-1.5 text-[#4f46e5] hover:text-[#4338ca] text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Showing {((page - 1) * perPage) + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length} customers
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center ${
                        page === n ? 'bg-[#4f46e5] text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {customers.length > 0 && (
            <div style={{ margin: '32px 32px 32px' }}>
              
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Campaign Analytics</h2>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Performance breakdown for this campaign</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '24px' }}>
                  <h3 style={{ fontWeight: 600, color: '#0f172a', fontSize: '15px' }}>Customer Risk Breakdown</h3>
                  <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>How customers are distributed by risk level</p>

                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', marginBottom: '16px' }}>
                    <PieChart width={300} height={220}>
                      <Pie
                        data={[
                          { name: 'High', value: stats.high, color: '#ef4444' },
                          { name: 'Medium', value: stats.medium, color: '#f59e0b' },
                          { name: 'Low', value: stats.low, color: '#22c55e' }
                        ].filter(d => d.value > 0)}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {[
                          { name: 'High', value: stats.high, color: '#ef4444' },
                          { name: 'Medium', value: stats.medium, color: '#f59e0b' },
                          { name: 'Low', value: stats.low, color: '#22c55e' }
                        ].filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', paddingBottom: '8px', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>May Leave</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{stats.high}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', paddingBottom: '8px', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>Watch Closely</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{stats.medium}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', paddingBottom: '8px', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>Staying</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{stats.low}</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '24px' }}>
                  <h3 style={{ fontWeight: 600, color: '#0f172a', fontSize: '15px' }}>Campaign Summary</h3>
                  <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Key performance metrics</p>

                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', paddingBottom: '16px', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={16} color="#4f46e5" />
                        <span style={{ color: '#64748b', fontSize: '13px' }}>Total Responses</span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '18px' }}>{stats.total}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', paddingBottom: '16px', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle size={16} color="#ef4444" />
                        <span style={{ color: '#64748b', fontSize: '13px' }}>May Leave</span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '18px' }}>{stats.high}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', paddingBottom: '16px', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertCircle size={16} color="#f59e0b" />
                        <span style={{ color: '#64748b', fontSize: '13px' }}>Watch Closely</span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '18px' }}>{stats.medium}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', paddingBottom: '16px', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CheckCircle size={16} color="#22c55e" />
                        <span style={{ color: '#64748b', fontSize: '13px' }}>Staying</span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#22c55e', fontSize: '18px' }}>{stats.low}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', paddingBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calendar size={16} color="#4f46e5" />
                        <span style={{ color: '#64748b', fontSize: '13px' }}>Created</span>
                      </div>
                      <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: 500 }}>{formatDate(campaign.created_at)}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: '24px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Churn Risk Rate</div>
                    <div style={{ marginTop: '6px', fontSize: '36px', fontWeight: 800, color: churnColor }}>
                      {churnRateStr}%
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>of customers may be considering leaving</div>
                    <div style={{ color: churnColor, fontSize: '11px', marginTop: '4px' }}>{churnText}</div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showShare && campaign && (
        <SurveyLinkModal
          token={campaign.survey_token}
          campaignName={campaign.name}
          onClose={() => setShowShare(false)}
        />
      )}
    </AdminLayout>
  );
}
