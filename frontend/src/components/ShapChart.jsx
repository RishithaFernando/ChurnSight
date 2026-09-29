import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

/* ── Plain-English factor name translations ── */
const factorNames = {
  'Satisfaction Score': 'Customer Satisfaction',
  Contract: 'Contract Type',
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
  'Number of Dependents': 'Number of Dependents',
  Dependents: 'Has Dependents',
  Married: 'Marital Status',
  Gender: 'Gender',
  Age: 'Age',
  'Under 30': 'Under 30 Years Old',
  'Avg Monthly GB Download': 'Monthly Data Download',
  'Total Refunds': 'Refunds Received',
  'Total Extra Data Charges': 'Extra Data Charges',
  'Total Long Distance Charges': 'Long Distance Charges',
};

export function translateFactor(name) {
  if (factorNames[name]) return factorNames[name];
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function translateDirection(dir) {
  return dir === 'Increases Risk'
    ? 'Contributing to churn risk'
    : 'Supporting customer retention';
}

export function translateImpact(impact) {
  if (impact === 'High') return 'Strong influence';
  if (impact === 'Medium') return 'Moderate influence';
  return 'Minor influence';
}

/* ── Custom tooltip ── */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3.5 text-sm max-w-xs">
      <p className="font-semibold text-gray-800">{d.translatedName}</p>
      <p className="text-gray-500 mt-1">
        {d.direction === 'Increases Risk'
          ? 'Contributing to churn risk'
          : 'Supporting customer retention'}
      </p>
      <p className="text-gray-400 mt-0.5">
        Influence Score: {Math.abs(d.shap_value).toFixed(4)}
      </p>
    </div>
  );
};

/* ── Main chart ── */
export default function ShapChart({ top_factors }) {
  if (!top_factors || top_factors.length === 0) return null;

  const data = [...top_factors].reverse().map((f) => ({
    ...f,
    translatedName: translateFactor(f.factor),
    absValue: Math.abs(f.shap_value),
  }));

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-4">
        Key Influencing Factors
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="translatedName"
            width={170}
            tick={{ fontSize: 13, fill: '#475569' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
          />
          <Bar dataKey="absValue" radius={[0, 6, 6, 0]} barSize={28}>
            {data.map((entry, i) => (
              <Cell
                key={`cell-${i}`}
                fill={
                  entry.direction === 'Increases Risk' ? '#DC2626' : '#16A34A'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
