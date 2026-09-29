import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import AdminLayout from '../components/AdminLayout';
import AdminBackground from '../components/AdminBackground';
import RiskBadge from '../components/RiskBadge';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  ArrowLeft, Mail, Calendar, Star, CheckCircle, XCircle, AlertTriangle, AlertCircle,
  Lightbulb, UserCheck, TrendingUp, TrendingDown
} from 'lucide-react';

const contractMap = { 0: 'Month-to-Month', 1: 'One Year', 2: 'Two Year' };
const genderMap = { 1: 'Male', 0: 'Female', 'Male': 'Male', 'Female': 'Female' };

const FACTOR_NAMES = {
  'Satisfaction Score': 'Customer Satisfaction',
  'Contract': 'Contract Type',
  'Tenure in Months': 'Time as Customer',
  'Monthly Charge': 'Monthly Bill Amount',
  'Number of Referrals': 'Friend Referrals',
  'Referred a Friend': 'Has Referred Friends',
  'Online Security': 'Online Security Service',
  'Internet Type_Fiber Optic': 'Fiber Optic Internet',
  'Internet Type_DSL': 'DSL Internet',
  'Internet Type_Cable': 'Cable Internet',
  'Internet Type_No Internet': 'No Internet Service',
  'Payment Method_Mailed Check': 'Pays by Mailed Check',
  'Payment Method_Bank Withdrawal': 'Pays by Bank Withdrawal',
  'Payment Method_Credit Card': 'Pays by Credit Card',
  'Total Charges': 'Total Amount Paid',
  'Avg Monthly Long Distance Charges': 'Long Distance Usage',
  'Senior Citizen': 'Senior Customer',
  'Paperless Billing': 'Uses Paperless Billing',
  'Streaming TV': 'Uses TV Streaming',
  'Streaming Movies': 'Uses Movie Streaming',
  'Streaming Music': 'Uses Music Streaming',
  'Multiple Lines': 'Multiple Phone Lines',
  'Phone Service': 'Has Phone Service',
  'Internet Service': 'Has Internet Service',
  'Unlimited Data': 'Has Unlimited Data',
  'Device Protection Plan': 'Has Device Protection',
  'Premium Tech Support': 'Has Premium Support',
  'Online Backup': 'Has Online Backup',
  'Offer_Offer A': 'Enrolled in Offer A',
  'Offer_Offer B': 'Enrolled in Offer B',
  'Offer_Offer C': 'Enrolled in Offer C',
  'Offer_Offer D': 'Enrolled in Offer D',
  'Offer_Offer E': 'Enrolled in Offer E',
  'Offer_No Offer': 'No Promotional Offer',
  'Dependents': 'Has Dependents',
  'Number of Dependents': 'Number of Dependents',
  'Married': 'Marital Status',
  'Gender': 'Gender',
  'Age': 'Customer Age',
  'Under 30': 'Under 30 Years Old',
  'Total Refunds': 'Total Refunds Received',
  'Total Extra Data Charges': 'Extra Data Charges',
  'Total Long Distance Charges': 'Long Distance Charges',
  'Avg Monthly GB Download': 'Monthly Data Usage',
};

const translateFactor = (name) => {
  if (FACTOR_NAMES[name]) return FACTOR_NAMES[name];
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

const TENURE_LABELS = {
  3: 'Less than 6 months',
  9: '6 to 12 months',
  18: '1 to 2 years',
  36: '2 to 5 years',
  60: 'More than 5 years'
};

const getTenureLabel = (months) => {
  const num = Number(months);
  if (TENURE_LABELS[num]) return TENURE_LABELS[num];
  if (num < 6) return 'Less than 6 months';
  if (num <= 12) return '6 to 12 months';
  if (num <= 24) return '1 to 2 years';
  if (num <= 60) return '2 to 5 years';
  return 'More than 5 years';
};

const formatApproxAmount = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  return `~$${Number(amount).toFixed(2)}`;
};

export default function CustomerDetail({ username }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/admin/customer/${id}`)
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !data) {
    return (
      <AdminLayout username={username} breadcrumbs={['Home', 'Customers', 'Loading...']}>
        <div className="flex items-center justify-center h-full text-[#64748b]">Loading...</div>
      </AdminLayout>
    );
  }

  const { customer, prediction } = data;
  
  // Format dates
  const submittedDate = customer?.submitted_at ? format(new Date(customer.submitted_at), 'MMMM d, yyyy') : 'Unknown Date';

  // Attribute pills
  const gender = genderMap[customer?.gender] || 'Unknown';
  const age = customer?.age || 'N/A';
  const isSenior = customer?.senior_citizen === 1 || customer?.senior_citizen === 'Yes';

  // Info grid
  const tenure = customer?.tenure_in_months || 0;
  const contract = contractMap[customer?.contract] || customer?.contract || 'Unknown';
  const monthlyBill = Number(customer?.monthly_charge || 0).toFixed(2);
  const totalPaid = Number(customer?.total_charges || 0).toFixed(2);
  const internetType = customer?.internet_type || 'None';
  const paymentMethod = customer?.payment_method || 'Unknown';
  const promo = customer?.offer && customer.offer !== 'None' ? customer.offer : 'None';
  const paperless = (customer?.paperless_billing === 1 || customer?.paperless_billing === 'Yes') ? 'Yes' : 'No';

  // Services
  const servicesList = [
    { key: 'phone_service', label: 'Phone Service' },
    { key: 'multiple_lines', label: 'Multiple Lines' },
    ...(internetType !== 'No Internet' && internetType !== 'None' ? [{ key: 'internet_type', label: 'Internet', val: internetType }] : []),
    { key: 'online_security', label: 'Online Security' },
    { key: 'online_backup', label: 'Online Backup' },
    { key: 'device_protection', label: 'Device Protection' },
    { key: 'tech_support', label: 'Tech Support' },
    { key: 'streaming_tv', label: 'Streaming TV' },
    { key: 'streaming_movies', label: 'Streaming Movies' },
    { key: 'streaming_music', label: 'Streaming Music' },
    { key: 'unlimited_data', label: 'Unlimited Data' },
  ];

  const getServiceStatus = (key) => {
    if (key === 'internet_type') return true;
    const val = customer?.[key];
    return val === 1 || val === 'Yes' || val === true;
  };

  // Prediction data
  const prob = prediction?.probability || 0;
  const riskLevel = prediction?.risk_level || 'Low';
  const isHigh = riskLevel === 'High';
  const isMed = riskLevel === 'Medium';
  const predictionLabel = prediction?.prediction === 1 ? 'Likely to Leave' : 'Likely to Stay';
  const predictionSub = prediction?.prediction === 1 
    ? `Our analysis indicates a ${prob}% likelihood of churning`
    : `Our analysis indicates only a ${prob}% likelihood of churning`;

  const topFactorsRaw = prediction?.top_factors 
    ? (typeof prediction.top_factors === 'string' ? JSON.parse(prediction.top_factors) : prediction.top_factors)
    : [];

  const topFactors = topFactorsRaw.map(f => ({
    ...f,
    name: translateFactor(f.factor),
    absVal: Math.abs(f.shap_value)
  }));
  const chartData = topFactors;
  const maxShap = Math.max(...chartData.map(f => f.absVal), 0.001);

  // SVG Ring
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (prob / 100) * circumference;
  const strokeColor = prob >= 70 ? '#ef4444' : prob >= 40 ? '#f59e0b' : '#22c55e';
  
  const initial = customer?.name ? customer.name.charAt(0).toUpperCase() : '?';

  return (
    <AdminLayout username={username} breadcrumbs={['Home', 'Customers', customer?.name || 'Customer']}>
      <AdminBackground />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center text-[#64748b] text-sm hover:text-[#4f46e5]">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-[#0f172a] mt-2">{customer?.name || 'Unknown'}</h1>
        <div className="flex items-center text-[#64748b] text-sm mt-1">
          <Mail className="w-4 h-4 mr-1" /> {customer?.email || 'No email'}
          <span className="mx-2">·</span>
          <Calendar className="w-4 h-4 mr-1" /> {submittedDate}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6" style={{ alignItems: 'stretch' }}>
        {/* LEFT COLUMN */}
        <div className="w-full lg:w-2/5 bg-white rounded-2xl border overflow-hidden h-fit" style={{ height: '100%' }}>
          <div className="bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] p-6">
            <div className="w-[72px] h-[72px] rounded-full bg-white/20 backdrop-blur text-white font-bold text-2xl mx-auto flex items-center justify-center">
              {initial}
            </div>
            <h2 className="text-white font-bold text-xl text-center mt-3">{customer?.name}</h2>
            <p className="text-white/70 text-sm text-center">{customer?.email}</p>
            <div className="flex justify-center gap-2 mt-3">
              <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">{gender}</span>
              <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">{age} yrs</span>
              {isSenior && <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">Senior</span>}
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-5 border-b border-gray-100">
            <div>
              <div className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">Time as Customer</div>
              <div className="text-[#0f172a] text-sm font-medium mt-0.5">{getTenureLabel(customer?.tenure_in_months)}</div>
            </div>
            <div>
              <div className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">Contract Type</div>
              <div className="text-[#0f172a] text-sm font-medium mt-0.5">{contract}</div>
            </div>
            <div>
              <div className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">Monthly Bill</div>
              <div className="text-[#0f172a] text-sm font-medium mt-0.5">${monthlyBill}</div>
            </div>
            <div>
              <div className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">EST. TOTAL PAID</div>
              <div className="text-[#0f172a] text-sm font-medium mt-0.5">{formatApproxAmount(customer?.total_charges)}</div>
              <span style={{ 
                fontSize: '10px', 
                color: '#94a3b8',
                display: 'block',
                marginTop: '2px'
              }}>
                Based on approximate tenure
              </span>
            </div>
            <div>
              <div className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">Internet Type</div>
              <div className="text-[#0f172a] text-sm font-medium mt-0.5">{internetType}</div>
            </div>
            <div>
              <div className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">Payment Method</div>
              <div className="text-[#0f172a] text-sm font-medium mt-0.5">{paymentMethod}</div>
            </div>
            <div>
              <div className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">Promotional Offer</div>
              <div className="text-[#0f172a] text-sm font-medium mt-0.5">{promo}</div>
            </div>
            <div>
              <div className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">Paperless Billing</div>
              <div className="text-[#0f172a] text-sm font-medium mt-0.5">{paperless}</div>
            </div>
          </div>

          <div className="px-6 mt-4">
            <div className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-2">Satisfaction</div>
            <div className="flex flex-col">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className={`w-5 h-5 ${star <= (customer?.satisfaction_score || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <div className="text-[#64748b] text-sm mt-1">{customer?.satisfaction_score || 0} out of 5</div>
            </div>
          </div>

          <div className="px-6 pb-6 mt-4">
            <div className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-3">Active Services</div>
            <div className="grid grid-cols-2 gap-2">
              {servicesList.map(s => {
                const isActive = getServiceStatus(s.key);
                return (
                  <div key={s.key} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium ${isActive ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' : 'bg-[#f8fafc] text-[#94a3b8] border-[#e2e8f0]'}`}>
                    {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {s.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 flex flex-col" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Churn Risk Assessment */}
          <div className="bg-white rounded-2xl border overflow-hidden">
            {isHigh ? (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-100 px-6 py-4 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <div>
                  <div className="text-red-700 font-bold">IMMEDIATE ACTION REQUIRED</div>
                  <div className="text-red-600 text-sm">This customer is at high risk of churning.</div>
                </div>
              </div>
            ) : isMed ? (
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-100 px-6 py-4 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-500" />
                <div>
                  <div className="text-amber-700 font-bold">MONITOR CLOSELY</div>
                  <div className="text-amber-600 text-sm">This customer shows signs of disengagement.</div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-100 px-6 py-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <div className="text-green-700 font-bold">CUSTOMER IS LOYAL</div>
                  <div className="text-green-600 text-sm">This customer is not currently at risk.</div>
                </div>
              </div>
            )}
            
            <div className="p-6 flex items-center">
              <div className="relative w-[120px] h-[120px]">
                <svg className="-rotate-90 w-full h-full" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="55" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                  <circle cx="60" cy="60" r="55" fill="none" stroke={strokeColor} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xl" style={{ color: strokeColor }}>
                  {prob}%
                </div>
              </div>
              <div className="ml-6">
                <RiskBadge risk_level={riskLevel} />
                <div className={`font-bold text-lg mt-2 ${prediction?.prediction === 1 ? 'text-red-600' : 'text-green-600'}`}>
                  {predictionLabel}
                </div>
                <div className="text-gray-500 text-sm mt-1">
                  {predictionSub}
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Action */}
          <div className="bg-white rounded-2xl border mt-4 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-[#4f46e5]" />
              <div className="font-semibold text-[#0f172a]">Recommended Action</div>
            </div>
            <div className="border-l-4 border-[#4f46e5] pl-4 text-sm text-[#475569] mb-4">
              {prediction?.recommendation || 'No recommendation available.'}
            </div>
            <button className="self-start px-4 py-2 bg-white border border-[#e2e8f0] text-[#0f172a] text-sm font-medium rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#64748b]" />
              Mark as Contacted
            </button>
          </div>

          {/* SHAP Factors */}
          {topFactors.length > 0 && (
            <div className="bg-white rounded-2xl border mt-6 p-6" style={{ flex: 1 }}>
              <h2 className="text-lg font-semibold text-[#0f172a]">What's driving this prediction?</h2>
              <p className="text-sm text-[#64748b] mb-4">Key factors influencing the customer's likelihood to churn</p>
              
              <div className="h-[200px] w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide={true} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={120} />
                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border p-2 rounded shadow-sm text-xs">
                            <div className="font-medium">{translateFactor(payload[0]?.payload?.factor || '')}</div>
                            <div className={data.direction === 'Increases Risk' ? 'text-red-600' : 'text-green-600'}>{data.direction}</div>
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Bar dataKey="absVal" radius={[0, 4, 4, 0]} barSize={20}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.direction === 'Increases Risk' ? '#ef4444' : '#22c55e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col">
                {topFactors.map((f, idx) => {
                  const isRisk = f.direction === 'Increases Risk';
                  const p = (f.absVal / maxShap) * 100;
                  return (
                    <div key={idx} className="flex items-center p-4 rounded-xl border border-[#f1f5f9] bg-[#fafafa] mb-3">
                      <div className={`w-1 self-stretch rounded-full mr-4 ${isRisk ? 'bg-red-500' : 'bg-green-500'}`} />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-semibold text-[#0f172a] text-sm">{translateFactor(f.factor)}</div>
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${isRisk ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {isRisk ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {f.direction}
                          </div>
                        </div>
                        <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isRisk ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.max(p, 2)}%` }} />
                        </div>
                      </div>

                      <div className="ml-4 w-20 text-right">
                        <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">{f.impact}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}
