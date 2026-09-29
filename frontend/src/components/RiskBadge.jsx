import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

const config = {
  High: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: AlertTriangle,
    label: 'HIGH RISK',
  },
  Medium: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    icon: AlertCircle,
    label: 'MEDIUM RISK',
  },
  Low: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: CheckCircle,
    label: 'LOW RISK',
  },
};

export default function RiskBadge({ risk_level }) {
  const c = config[risk_level] || config.Low;
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${c.bg} ${c.text} rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide`}
    >
      <Icon className="w-3.5 h-3.5" />
      {c.label}
    </span>
  );
}
