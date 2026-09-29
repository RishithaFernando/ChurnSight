import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Megaphone, Users, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import API from '../api/axios';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalCustomers: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    totalResponses: 0,
    activeCampaigns: 0,
    latestCampaign: { name: 'N/A', responses: 0 },
    churnRate: 0,
    thisMonthCustomers: 0,
  });

  const [monthlyData, setMonthlyData] = useState([]);
  const [barProgress, setBarProgress] = useState(0);

  const username = "Admin";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, statsRes, campaignsRes] = await Promise.all([
          API.get('/admin/customers').catch(() => ({ data: [] })),
          API.get('/admin/dashboard/stats').catch(() => ({ data: {} })),
          API.get('/admin/campaigns').catch(() => ({ data: [] }))
        ]);

        const customers = customersRes.data || [];
        const dashboardStats = statsRes.data || {};
        const campaigns = campaignsRes.data || [];

        let high = 0;
        let medium = 0;
        let low = 0;

        const monthMap = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        customers.forEach(c => {
          const risk = (c.risk_level || '').toLowerCase();
          const pred = c.prediction;
          const isHigh = risk === 'high' || pred === 1;
          const isMedium = risk === 'medium';
          
          if (isHigh) high++;
          else if (isMedium) medium++;
          else low++;

          if (c.submitted_at) {
            const date = new Date(c.submitted_at);
            const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
            
            if (!monthMap[key]) {
              monthMap[key] = { name: key, total: 0, low: 0, medium: 0, high: 0, monthDate: new Date(date.getFullYear(), date.getMonth(), 1) };
            }
            monthMap[key].total++;
            if (isHigh) {
              monthMap[key].high++;
            } else if (isMedium) {
              monthMap[key].medium++;
            } else {
              monthMap[key].low++;
            }
          }
        });

        const chartData = Object.values(monthMap);
        const sortedData = chartData.sort((a, b) => 
          new Date(a.monthDate) - new Date(b.monthDate)
        );
        setMonthlyData(sortedData);

        const activeCampaigns = campaigns.filter(c => c.is_active).length;
        
        let latestCampaignObj = { name: 'N/A', total_customers: 0 };
        if (campaigns.length > 0) {
          latestCampaignObj = [...campaigns].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        }

        const totalCusts = customers.length;
        
        // Use exact API response fields to fix the Medium Risk mismatch
        const finalHigh = dashboardStats.high_risk !== undefined ? dashboardStats.high_risk : high;
        const finalMedium = dashboardStats.medium_risk !== undefined ? dashboardStats.medium_risk : medium;
        const finalLow = dashboardStats.low_risk !== undefined ? dashboardStats.low_risk : low;
        // Calculate this month customers
        const now = new Date();
        const currentMonthKey = `${months[now.getMonth()]} ${now.getFullYear()}`;
        const thisMonthCustomers = monthMap[currentMonthKey] ? monthMap[currentMonthKey].total : 0;

        setStats({
          totalCampaigns: campaigns.length,
          totalCustomers: totalCusts,
          highRisk: finalHigh,
          mediumRisk: finalMedium,
          lowRisk: finalLow,
          totalResponses: dashboardStats.totalResponses || totalCusts,
          activeCampaigns: activeCampaigns,
          latestCampaign: { name: latestCampaignObj.name, responses: latestCampaignObj.total_customers || 0 },
          churnRate: totalCusts ? Math.round((finalHigh / totalCusts) * 100) : 0,
          thisMonthCustomers: thisMonthCustomers
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setBarProgress(1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading) {
    return (
      <AdminLayout username={username} breadcrumbs={['Home', 'Dashboard']}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
        </div>
      </AdminLayout>
    );
  }

  const getRingColor = (rate) => {
    if (rate > 50) return 'text-red-500';
    if (rate > 30) return 'text-amber-500';
    return 'text-green-500';
  };

  const getRingPct = (type) => {
    if (type === 'campaigns') return Math.min(100, (stats.totalCampaigns / 10) * 100);
    if (type === 'customers') return 100;
    if (stats.totalCustomers === 0) return 0;
    if (type === 'high') return (stats.highRisk / stats.totalCustomers) * 100;
    if (type === 'medium') return (stats.mediumRisk / stats.totalCustomers) * 100;
    if (type === 'low') return (stats.lowRisk / stats.totalCustomers) * 100;
    return 0;
  };

  const statCards = [
    { id: 'campaigns', label: 'Total Campaigns', value: stats.totalCampaigns, icon: Megaphone, bg: 'bg-gradient-to-br from-[#4f46e5] to-[#7c3aed]', pct: getRingPct('campaigns') },
    { id: 'customers', label: 'Total Customers', value: stats.totalCustomers, icon: Users, bg: 'bg-gradient-to-br from-[#0ea5e9] to-[#2563eb]', pct: getRingPct('customers') },
    { id: 'high', label: 'High Risk', value: stats.highRisk, icon: AlertTriangle, bg: 'bg-gradient-to-br from-[#ef4444] to-[#dc2626]', pct: getRingPct('high') },
    { id: 'medium', label: 'Medium Risk', value: stats.mediumRisk, icon: AlertCircle, bg: 'bg-gradient-to-br from-[#f59e0b] to-[#d97706]', pct: getRingPct('medium') },
    { id: 'low', label: 'Low Risk', value: stats.lowRisk, icon: CheckCircle, bg: 'bg-gradient-to-br from-[#22c55e] to-[#16a34a]', pct: getRingPct('low') },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const low = payload.find(p => p.dataKey === 'low')?.value || 0;
      const medium = payload.find(p => p.dataKey === 'medium')?.value || 0;
      const high = payload.find(p => p.dataKey === 'high')?.value || 0;
      const total = low + medium + high;
      
      return (
        <div className="bg-white rounded-xl shadow-lg p-4 border border-[#e2e8f0]">
          <div className="font-bold text-[#0f172a] text-sm mb-3">{label}</div>
          
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div>
            <div className="text-[#0f172a] text-sm">May Leave: {high} customers</div>
          </div>
          
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
            <div className="text-[#0f172a] text-sm">Watch Closely: {medium} customers</div>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#22c55e]"></div>
            <div className="text-[#0f172a] text-sm">Staying: {low} customers</div>
          </div>
          
          <div className="border-t border-[#f1f5f9] pt-2 mt-2">
            <div className="font-semibold text-[#0f172a] text-sm">Total: {total} customers</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <AdminLayout username={username} breadcrumbs={['Home', 'Dashboard']}>
      {/* Header style injection for semi-transparent header on this page */}
      <style>{`
        header { 
          background: rgba(255, 255, 255, 0.90) !important; 
          backdrop-filter: blur(12px) !important; 
          border-bottom: 1px solid rgba(255, 255, 255, 0.8) !important; 
        }
      `}</style>

      {/* Main page wrapper with diagonal background */}
      <div className="relative overflow-hidden min-h-screen pb-10 -mx-6 -mt-6 px-6 pt-6">
        {/* Full-page two-tone diagonal background */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 240,
          right: 0,
          bottom: 0,
          zIndex: 0,
          background: '#f8fafc',
          pointerEvents: 'none'
        }}>
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 1200 900" 
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0 }}
          >
            <polygon 
              points="650,0 1200,0 1200,900 0,900" 
              fill="#0f172a"
            />
          </svg>
        </div>

        {/* Content wrapper with z-index above background */}
        <div className="relative z-[1]">
          {/* Stat Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            {statCards.map((card, idx) => (
              <div key={idx} className={`relative overflow-hidden rounded-2xl p-6 ${card.bg}`}>
                {/* Decorative Circles */}
                <div className="absolute -bottom-5 -right-5 w-[100px] h-[100px] rounded-full bg-white/10 pointer-events-none"></div>
                <div className="absolute bottom-5 right-5 w-[60px] h-[60px] rounded-full bg-white/5 pointer-events-none"></div>

                <div className="flex justify-between items-start relative z-10">
                  <span className="text-white/80 text-sm font-medium uppercase tracking-wide">{card.label}</span>
                  <div className="bg-white/20 p-2.5 rounded-xl">
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                
                <div className="text-5xl font-bold text-white mt-3 relative z-10">{card.value}</div>
                
                <div className="mt-4 flex items-center justify-between relative z-10">
                  {card.id === 'campaigns' && (
                    <div>
                      <div className="flex gap-1.5 mb-1.5">
                        {[...Array(Math.min(stats.totalCampaigns, 10))].map((_, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full ${i < stats.activeCampaigns ? 'bg-white' : 'bg-white/40'}`}></div>
                        ))}
                      </div>
                      <div className="text-white/70 text-xs">{stats.activeCampaigns} active campaigns</div>
                    </div>
                  )}
                  {card.id === 'customers' && (
                    <div className="flex gap-2 items-center">
                      <div className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">{stats.thisMonthCustomers} this month</div>
                      <div className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">{stats.totalCampaigns} campaigns</div>
                    </div>
                  )}
                  {['high', 'medium', 'low'].includes(card.id) && (
                    <>
                      <div className="relative w-12 h-12">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
                          <circle cx="24" cy="24" r="20" fill="none" className="stroke-white/20" strokeWidth="4" />
                          <circle cx="24" cy="24" r="20" fill="none" className="stroke-white" strokeWidth="4" strokeLinecap="round" 
                                  strokeDasharray={`${card.pct * (125.6 / 100) * barProgress}, 125.6`} 
                                  style={{ transition: 'stroke-dasharray 1s ease-out' }} />
                        </svg>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold">
                          {Math.round(card.pct)}%
                        </div>
                      </div>
                      <div className="text-white/60 text-xs text-right">
                        of all<br/>customers
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Single Chart Section */}
          <div className="mt-6 p-6"
               style={{ 
                 background: '#ffffff', 
                 boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
                 border: '1px solid #e2e8f0', 
                 borderRadius: '20px'
               }}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
              <div>
                <h2 className="font-bold text-[#0f172a] text-lg">Customer Risk Over Time</h2>
                <p className="text-[#64748b] text-sm mt-1">How customer risk levels have changed across all campaigns</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-xl text-sm font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  {stats.highRisk} High Risk
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-xl text-sm font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  {stats.mediumRisk} Medium Risk
                </div>
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-xl text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  {stats.lowRisk} Low Risk
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="highGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02}/>
                    </linearGradient>
                    <linearGradient id="mediumGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02}/>
                    </linearGradient>
                    <linearGradient id="lowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                    domain={[0, 'dataMax + 2']}
                    tickCount={6}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="low" name="Staying" stroke="#22c55e" strokeWidth={2.5} fill="url(#lowGradient)" dot={false} activeDot={{ r: 5, fill: '#22c55e', strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="medium" name="Watch Closely" stroke="#f59e0b" strokeWidth={2.5} fill="url(#mediumGradient)" dot={false} activeDot={{ r: 5, fill: '#f59e0b', strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="high" name="May Leave" stroke="#ef4444" strokeWidth={2.5} fill="url(#highGradient)" dot={false} activeDot={{ r: 5, fill: '#ef4444', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-8 mt-4">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-6 h-1 rounded-full bg-[#ef4444]"></div>
                <span className="text-[#64748b] text-sm">May Leave</span>
              </div>
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-6 h-1 rounded-full bg-[#f59e0b]"></div>
                <span className="text-[#64748b] text-sm">Watch Closely</span>
              </div>
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-6 h-1 rounded-full bg-[#22c55e]"></div>
                <span className="text-[#64748b] text-sm">Staying</span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#f1f5f9]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 border border-red-100 rounded-xl p-5 hover:shadow-md transition-all duration-200" style={{ borderLeft: '4px solid #ef4444' }}>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-red-700 text-sm">Needs Attention</span>
                  </div>
                  <p className="text-red-600 text-xs mt-2 leading-relaxed">
                    {stats.highRisk} customers are at high risk of leaving. Contact them within 24 hours.
                  </p>
                </div>
                
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 hover:shadow-md transition-all duration-200" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-amber-700 text-sm">Monitor Closely</span>
                  </div>
                  <p className="text-amber-600 text-xs mt-2 leading-relaxed">
                    {stats.mediumRisk} customers show warning signs. Consider reaching out this week.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-xl p-5 hover:shadow-md transition-all duration-200" style={{ borderLeft: '4px solid #22c55e' }}>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-semibold text-green-700 text-sm">Looking Good</span>
                  </div>
                  <p className="text-green-600 text-xs mt-2 leading-relaxed">
                    {stats.lowRisk} customers are satisfied and loyal. Keep up the good work.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <div className="p-6 flex justify-between items-center"
                 style={{
                   background: 'rgba(255, 255, 255, 0.80)',
                   backdropFilter: 'blur(12px)',
                   border: '1px solid rgba(255, 255, 255, 0.9)',
                   borderRadius: '20px'
                 }}>
              <div>
                <div className="text-[#94a3b8] text-xs uppercase font-medium tracking-wide">Latest Campaign</div>
                <div className="text-[#0f172a] text-xl font-bold mt-1">{stats.latestCampaign.name}</div>
              </div>
              <div className="text-right">
                <div className="text-[#4f46e5] text-3xl font-bold">{stats.latestCampaign.responses}</div>
                <div className="text-[#64748b] text-sm font-medium">responses</div>
              </div>
            </div>

            <div className="p-6 flex items-center gap-6"
                 style={{
                   background: 'rgba(255, 255, 255, 0.80)',
                   backdropFilter: 'blur(12px)',
                   border: '1px solid rgba(255, 255, 255, 0.9)',
                   borderRadius: '20px'
                 }}>
              <div className="flex-1">
                <div className="text-[#94a3b8] text-xs uppercase font-medium tracking-wide">Overall Churn Rate</div>
                <div className="text-[#64748b] text-xs mt-1">Percentage of High Risk Customers</div>
              </div>
              <div className="relative w-[80px] h-[80px]">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className={getRingColor(stats.churnRate)}
                    strokeDasharray={`${stats.churnRate * barProgress}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease-out' }}
                  />
                </svg>
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold ${getRingColor(stats.churnRate)}`}>
                  {stats.churnRate}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
