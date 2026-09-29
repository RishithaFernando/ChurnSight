import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { format } from 'date-fns';
import { Search, Download, Eye, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import AdminBackground from '../components/AdminBackground';
import RiskBadge from '../components/RiskBadge';

const AllCustomersPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('All Campaigns');
  const [selectedRisk, setSelectedRisk] = useState('All Risks');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const username = localStorage.getItem('username') || 'Admin';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [customersRes, campaignsRes] = await Promise.all([
          API.get('/admin/customers'),
          API.get('/admin/campaigns')
        ]);
        setCustomers(customersRes.data || []);
        if (customersRes.data && customersRes.data.length > 0) {
          console.log('First customer sample:', customersRes.data[0]);
        }
        setCampaigns(campaignsRes.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load customers data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const contractMap = {
    0: 'Monthly',
    1: '1 Year',
    2: '2 Year'
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = (c.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                            (c.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchesCampaign = selectedCampaign === 'All Campaigns' || c.campaign_name === selectedCampaign;
      
      let mappedRisk = selectedRisk;
      if (selectedRisk === 'High Risk') mappedRisk = 'High';
      if (selectedRisk === 'Medium Risk') mappedRisk = 'Medium';
      if (selectedRisk === 'Low Risk') mappedRisk = 'Low';
      
      const matchesRisk = selectedRisk === 'All Risks' || c.risk_level === mappedRisk;
      return matchesSearch && matchesCampaign && matchesRisk;
    });
  }, [customers, searchQuery, selectedCampaign, selectedRisk]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  
  const currentCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCampaign, selectedRisk]);

  const renderPaginationButtons = () => {
    let pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
            currentPage === i
              ? 'bg-[#4f46e5] text-white'
              : 'text-[#64748b] hover:bg-[#f1f5f9]'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getGradientForInitials = (initials) => {
    const colors = [
      'from-blue-400 to-blue-600',
      'from-indigo-400 to-indigo-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-rose-400 to-rose-600',
      'from-emerald-400 to-emerald-600'
    ];
    let sum = 0;
    for (let i = 0; i < initials.length; i++) {
      sum += initials.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  const renderRiskBadge = (level) => {
    if (level === 'High') {
      return (
        <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-100 px-2.5 py-1 rounded-full text-xs font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> High
        </div>
      );
    }
    if (level === 'Medium') {
      return (
        <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full text-xs font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Medium
        </div>
      );
    }
    if (level === 'Low') {
      return (
        <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-full text-xs font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Low
        </div>
      );
    }
    return <RiskBadge level={level} />;
  };

  return (
    <AdminLayout username={username} breadcrumbs={['Home', 'All Customers']}>
      <AdminBackground />
      <div className="pb-10 -mx-6 -mt-6 px-6 pt-6" style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#0f172a]">All Customers</h1>
            <p className="text-[#64748b] text-sm mt-1">Complete customer list across all campaigns</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="p-4 flex flex-col md:flex-row items-center gap-3 mt-4" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.9)', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)' }}>
            <div className="relative flex-1 max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748b]" />
              <input
                type="text"
                placeholder="Search customers..."
                className="pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-xl text-sm w-full focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="border border-[#e2e8f0] bg-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 w-full md:w-auto text-[#0f172a]"
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
            >
              <option value="All Campaigns">All Campaigns</option>
              {campaigns.map(c => (
                <option key={c.id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            <select
              className="border border-[#e2e8f0] bg-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 w-full md:w-auto text-[#0f172a]"
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
            >
              <option value="All Risks">All Risks</option>
              <option value="High Risk">High Risk</option>
              <option value="Medium Risk">Medium Risk</option>
              <option value="Low Risk">Low Risk</option>
            </select>
            
            <div className="mt-2 md:mt-0 md:ml-auto">
              <div className="bg-[#eef2ff] text-[#4f46e5] px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                {filteredCustomers.length} customers
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.9)', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)' }}>
            <div style={{ width: '100%', overflowX: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ flex: 2.5 }} className="uppercase tracking-wider text-xs text-[#64748b] font-semibold">CUSTOMER</div>
                <div style={{ flex: 2 }} className="uppercase tracking-wider text-xs text-[#64748b] font-semibold">CAMPAIGN</div>
                <div style={{ flex: 1.2 }} className="uppercase tracking-wider text-xs text-[#64748b] font-semibold">RISK LEVEL</div>
                <div style={{ flex: 1.5 }} className="uppercase tracking-wider text-xs text-[#64748b] font-semibold">CHURN PROBABILITY</div>
                <div style={{ flex: 1.2 }} className="uppercase tracking-wider text-xs text-[#64748b] font-semibold">SATISFACTION</div>
                <div style={{ flex: 1.2 }} className="uppercase tracking-wider text-xs text-[#64748b] font-semibold">SUBMITTED</div>
                <div style={{ flex: 0.8, textAlign: 'right' }} className="uppercase tracking-wider text-xs text-[#64748b] font-semibold">ACTION</div>
              </div>

              <div>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse" style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ flex: 2.5 }} className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                         <div className="space-y-2">
                           <div className="h-4 bg-slate-200 rounded w-24"></div>
                           <div className="h-3 bg-slate-200 rounded w-32"></div>
                         </div>
                      </div>
                      <div style={{ flex: 2 }}><div className="h-6 bg-slate-200 rounded-full w-24"></div></div>
                      <div style={{ flex: 1.2 }}><div className="h-6 bg-slate-200 rounded-full w-20"></div></div>
                      <div style={{ flex: 1.5 }}><div className="h-8 bg-slate-200 rounded w-32"></div></div>
                      <div style={{ flex: 1.2 }}><div className="h-4 bg-slate-200 rounded w-24"></div></div>
                      <div style={{ flex: 1.2 }}><div className="h-4 bg-slate-200 rounded w-24"></div></div>
                      <div style={{ flex: 0.8 }}><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></div>
                    </div>
                  ))
                ) : currentCustomers.length === 0 ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>No customers found matching your criteria.</div>
                ) : (
                  currentCustomers.map((customer) => {
                    const initials = getInitials(customer.name);
                    const gradient = getGradientForInitials(initials);
                    
                    const probabilityRaw = customer.probability != null ? Number(customer.probability) : 0;
                    const probabilityFmt = customer.probability != null ? `${probabilityRaw.toFixed(1)}%` : '0%';
                    const probabilityBarW = customer.probability != null ? probabilityRaw : 0;
                    
                    let probColor = 'text-green-600';
                    let probBg = 'bg-green-500';
                    if (probabilityRaw > 70) { probColor = 'text-red-600'; probBg = 'bg-red-500'; }
                    else if (probabilityRaw > 30) { probColor = 'text-amber-600'; probBg = 'bg-amber-500'; }

                    return (
                      <div key={customer.id} className="hover:bg-[rgba(248,250,252,0.8)] transition-colors duration-150" style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
                        
                        <div style={{ flex: 2.5 }} className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0`}>
                            {initials}
                          </div>
                          <div>
                            <div className="text-[#0f172a] text-sm font-medium">{customer.name}</div>
                            <div className="text-[#94a3b8] text-xs">{customer.email}</div>
                          </div>
                        </div>

                        <div style={{ flex: 2 }}>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#eef2ff] text-[#4f46e5] border border-[#c7d2fe]">
                            {customer.campaign_name || 'N/A'}
                          </span>
                        </div>

                        <div style={{ flex: 1.2 }}>
                          {renderRiskBadge(customer.risk_level)}
                        </div>

                        <div style={{ flex: 1.5 }}>
                          <div className="flex flex-col gap-1.5">
                            <span className={`font-bold text-sm ${probColor}`}>{probabilityFmt}</span>
                            <div className="w-24 h-1.5 bg-gray-200/50 rounded-full overflow-hidden">
                              <div className={`h-full ${probBg}`} style={{ width: `${Math.min(100, Math.max(0, probabilityBarW))}%` }}></div>
                            </div>
                          </div>
                        </div>

                        <div style={{ flex: 1.2 }}>
                          {customer.satisfaction_score != null && !isNaN(Number(customer.satisfaction_score)) ? (
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < Number(customer.satisfaction_score) ? 'text-amber-400 fill-amber-400' : 'text-[#e2e8f0]'}`} 
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#64748b] text-sm">N/A</span>
                          )}
                        </div>

                        <div style={{ flex: 1.2 }} className="text-[#64748b] text-sm">
                          {customer.submitted_at ? format(new Date(customer.submitted_at), 'MMM d, yyyy') : 'N/A'}
                        </div>

                        <div style={{ flex: 0.8, textAlign: 'right' }}>
                          <button
                            onClick={() => navigate(`/admin/customer/${customer.id}`)}
                            className="inline-flex items-center gap-1.5 text-[#4f46e5] text-sm font-medium hover:text-[#4338ca] transition-colors"
                          >
                            <Eye className="h-4 w-4" /> View
                          </button>
                        </div>
                        
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
            {!loading && filteredCustomers.length > 0 && (
              <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.3)] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-[#64748b]">
                  Showing <span className="font-medium text-[#0f172a]">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredCustomers.length)}</span> to <span className="font-medium text-[#0f172a]">{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span> of <span className="font-medium text-[#0f172a]">{filteredCustomers.length}</span> customers
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded-lg text-[#64748b] hover:bg-gray-100/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="flex gap-1">
                    {renderPaginationButtons()}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded-lg text-[#64748b] hover:bg-gray-100/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AllCustomersPage;
