import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';
import {
  LayoutDashboard, Users, Megaphone, BarChart2, TrendingUp, TrendingDown,
  Minus, Lightbulb, ShieldAlert, Zap, Target, ArrowRight, Info
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import AdminBackground from '../components/AdminBackground';
import RiskBadge from '../components/RiskBadge';
import API from '../api/axios';

const AnalyticsPage = () => {
  const [username, setUsername] = useState('Admin');
  const [activeTab, setActiveTab] = useState('overview');
  
  const [stats, setStats] = useState({
    totalResponses: 0,
    activeCampaigns: 0,
    highRisk: 0,
    lowRisk: 0,
  });

  const [monthlyData, setMonthlyData] = useState([]);
  const [riskSummary, setRiskSummary] = useState([]);
  const [campaignData, setCampaignData] = useState([]);
  const [contractData, setContractData] = useState([]);
  const [satisfactionData, setSatisfactionData] = useState([]);
  const [journeyData, setJourneyData] = useState([]);
  const [insight, setInsight] = useState(null);

  const [changeFilter, setChangeFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const formatMonth = (dateString) => {
    if (!dateString) return 'Unknown';
    const d = new Date(dateString);
    return d.toLocaleString('default', { month: 'short', year: '2-digit' });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, campaignsRes, custsRes] = await Promise.all([
          API.get('/admin/dashboard/stats').catch(() => ({ data: {} })),
          API.get('/admin/campaigns').catch(() => ({ data: [] })),
          API.get('/admin/customers').catch(() => ({ data: [] }))
        ]);
        
        const campaigns = campaignsRes.data || [];
        const customers = custsRes.data || [];

        // Tab 1: Stats
        const activeCamps = campaigns.filter(c => c.is_active).length;
        
        let highRiskCount = 0;
        let mediumRiskCount = 0;
        let lowRiskCount = 0;

        // Grouping monthly data
        const monthCounts = {};
        
        // Grouping contract data
        const contractCounts = { 'Monthly': 0, '1 Year': 0, '2 Year': 0 };
        
        // Grouping satisfaction
        const satCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        // Grouping by email for journey
        const emailGroups = {};

        customers.forEach(c => {
          // Risk parsing
          const r = (c.risk_level || '').toLowerCase();
          if (r === 'high') highRiskCount++;
          else if (r === 'medium') mediumRiskCount++;
          else if (r === 'low') lowRiskCount++;

          // Monthly
          const m = formatMonth(c.submitted_at || c.created_at);
          monthCounts[m] = (monthCounts[m] || 0) + 1;

          // Contract
          if (c.contract === 0 || c.contract === '0') contractCounts['Monthly']++;
          else if (c.contract === 1 || c.contract === '1') contractCounts['1 Year']++;
          else if (c.contract === 2 || c.contract === '2') contractCounts['2 Year']++;

          // Satisfaction (assuming satisfaction or rating field exists, fallback to overall_satisfaction)
          const sat = c.overall_satisfaction || c.satisfaction || 3;
          const satRounded = Math.min(5, Math.max(1, Math.round(sat)));
          satCounts[satRounded]++;

          // Email groups
          if (c.email) {
            if (!emailGroups[c.email]) {
              emailGroups[c.email] = [];
            }
            emailGroups[c.email].push(c);
          }
        });

        setStats({
          totalResponses: customers.length,
          activeCampaigns: activeCamps,
          highRisk: highRiskCount,
          lowRisk: lowRiskCount,
        });

        const monthArr = Object.keys(monthCounts).map(k => ({ name: k, count: monthCounts[k] }));
        setMonthlyData(monthArr);

        setRiskSummary([
          { name: 'May Leave', value: highRiskCount, color: '#ef4444' },
          { name: 'Watch Closely', value: mediumRiskCount, color: '#f59e0b' },
          { name: 'Happy Customers', value: lowRiskCount, color: '#22c55e' }
        ]);

        // Tab 2: Campaigns
        const sortedCampaigns = [...campaigns].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const campData = sortedCampaigns.map(c => {
          return {
            name: c.name,
            'May Leave': c.high_risk || 0,
            'Watch Closely': c.medium_risk || 0,
            'Staying': c.low_risk || 0,
          };
        });
        setCampaignData(campData);

        if (campData.length >= 2) {
          const first = campData[0]['May Leave'] || 0;
          const last = campData[campData.length - 1]['May Leave'] || 0;
          if (first > 0) {
            const diff = ((last - first) / first) * 100;
            setInsight(`High risk customers changed by ${diff > 0 ? '+' : ''}${diff.toFixed(1)}% between your first and most recent campaign.`);
          } else {
            setInsight('Not enough data to calculate risk change over time.');
          }
        } else {
          setInsight('Not enough data to calculate risk change over time.');
        }

        // Tab 3: Insights
        setContractData([
          { name: 'Monthly', value: contractCounts['Monthly'], color: '#6366f1' },
          { name: '1 Year', value: contractCounts['1 Year'], color: '#ec4899' },
          { name: '2 Year', value: contractCounts['2 Year'], color: '#14b8a6' },
        ]);

        setSatisfactionData([1, 2, 3, 4, 5].map(score => ({
          rating: `${score} Star${score > 1 ? 's' : ''}`,
          count: customers.filter(c => Number(c.satisfaction_score) === score).length
        })));

        const riskVal = (r) => {
          const lr = (r || '').toLowerCase();
          if (lr === 'high') return 3;
          if (lr === 'medium') return 2;
          if (lr === 'low') return 1;
          return 0;
        };

        const returning = Object.keys(emailGroups)
          .filter(email => emailGroups[email].length > 1)
          .map(email => {
            const records = emailGroups[email].sort((a, b) => new Date(a.submitted_at || a.created_at) - new Date(b.submitted_at || b.created_at));
            const firstR = records[0].risk_level || 'Unknown';
            const lastR = records[records.length - 1].risk_level || 'Unknown';
            const name = records[0].name || email;
            
            const v1 = riskVal(firstR);
            const v2 = riskVal(lastR);
            let change = 'No Change';
            if (v1 > 0 && v2 > 0) {
              if (v2 < v1) change = 'Improved';
              else if (v2 > v1) change = 'Worsened';
            }

            return { name, first: firstR, latest: lastR, change };
          })
          .slice(0, 20);
        
        setJourneyData(returning);

      } catch (err) {
        console.error("Failed to fetch analytics data", err);
      }
    };
    fetchData();
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'campaign', label: 'Campaign Comparison', icon: Megaphone },
    { id: 'insights', label: 'Customer Insights', icon: Users },
    { id: 'risk', label: 'Risk Factors', icon: ShieldAlert },
  ];

  const factors = [
    { name: 'Overall Satisfaction Rating', value: 5.07, description: 'How happy the customer is overall' },
    { name: 'Number of Friends Referred', value: 0.79, description: 'Customers who refer friends tend to stay' },
    { name: 'Online Security Service', value: 0.78, description: 'Security protection increases loyalty' },
    { name: 'Monthly Bill Amount', value: 0.54, description: 'Higher bills increase chance of leaving' },
    { name: 'Contract Length', value: 0.53, description: 'Longer contracts mean more commitment' },
    { name: 'Long Distance Usage', value: 0.47, description: 'Active usage shows engagement' },
    { name: 'Has Family Dependents', value: 0.45, description: 'Families tend to be more stable' },
    { name: 'Time as a Customer', value: 0.43, description: 'Longer-serving customers are loyal' },
    { name: 'Has Referred a Friend', value: 0.38, description: 'Brand advocates rarely leave' },
    { name: 'Total Amount Paid', value: 0.37, description: 'Reflects tenure with us' },
  ];

  const renderTab1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Responses', value: stats.totalResponses, from: 'from-indigo-500', to: 'to-indigo-700' },
          { title: 'Active Campaigns', value: stats.activeCampaigns, from: 'from-purple-500', to: 'to-purple-700' },
          { title: 'High Risk', value: stats.highRisk, from: 'from-red-500', to: 'to-red-700' },
          { title: 'Low Risk', value: stats.lowRisk, from: 'from-green-500', to: 'to-green-700' },
        ].map((stat, i) => (
          <div key={i} className={`p-4 rounded-xl shadow-sm text-white bg-gradient-to-br ${stat.from} ${stat.to}`}>
            <p className="text-sm opacity-90">{stat.title}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.9)', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)' }}>
          <h3 className="text-lg font-semibold text-gray-800">Monthly Survey Responses</h3>
          <p className="text-sm text-gray-500 mb-6">Number of customers who completed the survey each month</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-xl shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.9)', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)' }}>
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Customer Risk Summary</h3>
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskSummary} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                  {riskSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-[-20px]">
              <span className="text-3xl font-bold text-gray-800">{stats.totalResponses}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTab2 = () => (
    <div className="space-y-6">
      {insight && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-start">
            <Lightbulb className="text-blue-500 w-5 h-5 mt-0.5 mr-3" />
            <div>
              <h4 className="font-semibold text-blue-800">Insight</h4>
              <p className="text-blue-700 text-sm mt-1">{insight}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 rounded-xl shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.9)', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)' }}>
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Survey Responses Per Campaign</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={campaignData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="Staying" fill="#22c55e" stackId="a" />
              <Bar dataKey="Watch Closely" fill="#f59e0b" stackId="a" />
              <Bar dataKey="May Leave" fill="#ef4444" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-6 rounded-xl shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.9)', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)' }}>
        <h3 className="text-lg font-semibold text-gray-800 mb-6">How did risk levels change over time?</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={campaignData}>
              <defs>
                <linearGradient id="colorGreen2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAmber2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRed2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Area type="monotone" dataKey="Staying" stroke="#22c55e" fillOpacity={1} fill="url(#colorGreen2)" />
              <Area type="monotone" dataKey="Watch Closely" stroke="#f59e0b" fillOpacity={1} fill="url(#colorAmber2)" />
              <Area type="monotone" dataKey="May Leave" stroke="#ef4444" fillOpacity={1} fill="url(#colorRed2)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const SATISFACTION_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e'];

  const renderInlineBadge = (level) => {
    const l = (level || '').toLowerCase();
    if (l === 'high') return <span className="inline-block bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full text-xs font-semibold">High</span>;
    if (l === 'medium') return <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold">Medium</span>;
    if (l === 'low') return <span className="inline-block bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full text-xs font-semibold">Low</span>;
    return <span className="inline-block bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-full text-xs font-semibold capitalize">{level}</span>;
  };

  const renderTab3 = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2 p-6" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.9)', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)' }}>
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Contract Type Breakdown</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={contractData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {contractData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-6" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.9)', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)' }}>
          <h3 className="text-lg font-semibold text-gray-800 mb-6">How satisfied are your customers?</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={satisfactionData}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="rating" type="category" width={80} />
                <RechartsTooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {satisfactionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SATISFACTION_COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="p-6" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.9)', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <h3 style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '18px', marginRight: 'auto' }}>Returning Customer Journey</h3>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <select 
              value={changeFilter} 
              onChange={e => setChangeFilter(e.target.value)}
              style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', color: '#64748b', background: 'white', cursor: 'pointer' }}
            >
              <option value="">All Changes</option>
              <option value="improved">Improved</option>
              <option value="worsened">Worsened</option>
              <option value="no_change">No Change</option>
            </select>
            
            <select 
              value={riskFilter} 
              onChange={e => setRiskFilter(e.target.value)}
              style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', color: '#64748b', background: 'white', cursor: 'pointer' }}
            >
              <option value="">All Risk Levels</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
            
            <input 
              type="text" 
              placeholder="Search by name..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', width: '180px' }}
            />
          </div>
        </div>

        {(() => {
          const filteredJourney = journeyData.filter(customer => {
            const changeMap = {
              'improved': 'Improved',
              'worsened': 'Worsened',
              'no_change': 'No Change'
            };
            const matchesChange = !changeFilter || customer.change === changeMap[changeFilter];
            const matchesRisk = !riskFilter || (customer.latest && customer.latest.toLowerCase() === riskFilter.toLowerCase());
            const matchesSearch = !searchQuery || (customer.name && customer.name.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesChange && matchesRisk && matchesSearch;
          });

          return (
            <>
              <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '16px' }}>Showing {filteredJourney.length} of {journeyData.length} returning customers</p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-sm font-medium text-gray-500">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">First Risk</th>
                      <th className="py-3 px-4">Latest Risk</th>
                      <th className="py-3 px-4">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJourney.length === 0 ? (
                      <tr><td colSpan="4" className="py-4 text-center text-gray-500">No returning customers found.</td></tr>
                    ) : filteredJourney.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{row.name}</td>
                        <td className="py-3 px-4">{renderInlineBadge(row.first)}</td>
                        <td className="py-3 px-4">{renderInlineBadge(row.latest)}</td>
                        <td className="py-3 px-4">
                          {row.change === 'Improved' && <span className="flex items-center text-green-600"><TrendingDown className="w-4 h-4 mr-1"/> Improved</span>}
                          {row.change === 'Worsened' && <span className="flex items-center text-red-600"><TrendingUp className="w-4 h-4 mr-1"/> Worsened</span>}
                          {row.change === 'No Change' && <span className="flex items-center text-gray-500"><Minus className="w-4 h-4 mr-1"/> No Change</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );

  const renderTab4 = () => (
    <div>
      {/* EXPLANATION BOX */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px' }}>
        <Info size={18} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <div className="font-semibold text-[#92400e] text-sm">How to read this chart</div>
          <div className="text-[#78350f] text-sm mt-1">
            Our system analyses dozens of factors about each customer to understand who might be thinking about leaving and why. The chart below shows which factors matter most. A longer bar means that factor plays a bigger role in the prediction.
          </div>
        </div>
      </div>

      {/* CHART CARD */}
      <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '28px', marginBottom: '20px' }}>
        <h3 className="font-bold text-[#0f172a] text-lg">What Influences a Customer's Decision to Leave?</h3>
        <p className="text-[#64748b] text-sm mt-1 mb-6">Factors ranked by their influence on churn prediction</p>
        
        <div style={{ height: '380px', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={factors} margin={{ left: 180, right: 30, top: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="riskBarGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#a5b4fc"/>
                  <stop offset="100%" stopColor="#4f46e5"/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="rgba(148,163,184,0.2)" />
              <XAxis type="number" tick={false} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" width={180} tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
              
              <RechartsTooltip 
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div style={{ background: '#1e293b', color: 'white', borderRadius: '12px', padding: '12px 16px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                        <p className="font-semibold text-sm">{payload[0].payload.name}</p>
                        <p className="text-white/70 text-xs mt-1">{payload[0].payload.description}</p>
                      </div>
                    );
                  }
                  return null;
                }} 
              />
              <Bar dataKey="value" fill="url(#riskBarGradient)" radius={[0, 6, 6, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
          
          <div style={{ position: 'absolute', bottom: '0px', left: '180px', right: '30px', display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
            <span className="text-[#94a3b8] text-xs">Less Influence</span>
            <span className="text-[#94a3b8] text-xs">More Influence</span>
          </div>
        </div>
      </div>

      {/* ACTION CARDS ROW */}
      <div style={{ display: 'flex', gap: '16px' }}>
        
        {/* Card 1 */}
        <div style={{ flex: 1, background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '1px solid #fecaca', borderLeft: '4px solid #ef4444', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Zap size={16} className="text-red-500" />
            <span className="font-bold text-red-700 text-sm">Top Priority</span>
          </div>
          <p className="text-red-600 text-sm mt-2 leading-relaxed">
            Address low satisfaction ratings immediately. Reach out to customers scoring below 3 stars with targeted personalised offers.
          </p>
        </div>

        {/* Card 2 */}
        <div style={{ flex: 1, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe', borderLeft: '4px solid #4f46e5', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Target size={16} className="text-indigo-500" />
            <span className="font-bold text-indigo-700 text-sm">Quick Win</span>
          </div>
          <p className="text-indigo-600 text-sm mt-2 leading-relaxed">
            Promote the referral program. Customers who refer friends are significantly less likely to leave. Even one referral makes a big difference.
          </p>
        </div>

        {/* Card 3 */}
        <div style={{ flex: 1, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0', borderLeft: '4px solid #22c55e', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <TrendingUp size={16} className="text-green-500" />
            <span className="font-bold text-green-700 text-sm">Long Term Strategy</span>
          </div>
          <p className="text-green-600 text-sm mt-2 leading-relaxed">
            Encourage customers on monthly plans to switch to annual or two-year contracts. Longer contracts significantly reduce the chance of leaving.
          </p>
        </div>

      </div>
    </div>
  );

  return (
    <AdminLayout username={username} breadcrumbs={['Home', 'Analytics']}>
      <AdminBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Page header */}
        <div style={{ padding: '32px 32px 0' }}>
          <h1 className="text-2xl font-bold text-[#0f172a]">Analytics Dashboard</h1>
          <p className="text-[#64748b] text-sm mt-1">Deep dive into customer sentiment and churn risk.</p>
        </div>
        
        {/* Tab navigation */}
        <div style={{ padding: '24px 32px 0' }}>
          <div className="overflow-x-auto flex p-1" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.9)', borderRadius: '16px' }}>
            <nav className="flex space-x-2 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      px-5 py-3 text-sm font-medium flex items-center gap-2 rounded-xl transition-all duration-200
                      ${isActive 
                        ? 'bg-white text-[#4f46e5] shadow-sm' 
                        : 'text-[#64748b] hover:text-[#0f172a] hover:bg-white/50'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
        
        {/* Tab content */}
        <div style={{ padding: '24px 32px 32px' }}>
          {activeTab === 'overview' && renderTab1()}
          {activeTab === 'campaign' && renderTab2()}
          {activeTab === 'insights' && renderTab3()}
          {activeTab === 'risk' && renderTab4()}
        </div>
        
      </div>
    </AdminLayout>
  );
};

export default AnalyticsPage;
