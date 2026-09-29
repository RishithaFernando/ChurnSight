import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BarChart2,
  Phone,
  PhoneCall,
  Wifi,
  Shield,
  Cloud,
  Smartphone,
  Headphones,
  Tv,
  Film,
  Music,
  Zap,
  Star,
  XCircle,
  Clock,
} from 'lucide-react';
import API from '../api/axios';
import Toast from '../components/Toast';

const stepMeta = [
  { title: "Let's get to know you", sub: 'Just a few personal details to get started' },
  { title: 'Tell us about your plan', sub: 'Help us understand your current subscription' },
  { title: 'What services do you use?', sub: 'Select all that apply to your current plan' },
  { title: 'How has your experience been?', sub: 'Your feedback helps us serve you better' },
];

function Toggle({ label, value, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`rounded-full px-6 py-2 font-medium text-sm transition-all ${
        selected
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';

const services = [
  { key: 'phone_service', label: 'Phone Service', icon: Phone },
  { key: 'multiple_lines', label: 'Multiple Phone Lines', icon: PhoneCall },
  { key: 'internet_service', label: 'Internet Service', icon: Wifi },
  { key: 'online_security', label: 'Online Security', icon: Shield },
  { key: 'online_backup', label: 'Online Backup', icon: Cloud },
  { key: 'device_protection_plan', label: 'Device Protection', icon: Smartphone },
  { key: 'premium_tech_support', label: 'Premium Tech Support', icon: Headphones },
  { key: 'streaming_tv', label: 'Streaming TV', icon: Tv },
  { key: 'streaming_movies', label: 'Streaming Movies', icon: Film },
  { key: 'streaming_music', label: 'Streaming Music', icon: Music },
  { key: 'unlimited_data', label: 'Unlimited Data', icon: Zap },
];

const tenureOptions = [
  { label: 'Less than 6 months', value: 3 },
  { label: '6–12 months', value: 9 },
  { label: '1–2 years', value: 18 },
  { label: '2–5 years', value: 36 },
  { label: 'More than 5 years', value: 60 },
];

const satLabels = ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'];

export default function Survey() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [validating, setValidating] = useState(true);
  const [tokenError, setTokenError] = useState(''); // 'invalid' | 'inactive' | ''
  const [campaignId, setCampaignId] = useState(null);
  const [campaignName, setCampaignName] = useState('');

  useEffect(() => {
    API.get(`/survey/validate/${token}`)
      .then(res => {
        setCampaignId(res.data.campaign_id);
        setCampaignName(res.data.campaign_name || '');
        setValidating(false);
      })
      .catch(err => {
        const msg = err.response?.data?.error || '';
        if (msg.toLowerCase().includes('inactive') || msg.toLowerCase().includes('closed')) {
          setTokenError('inactive');
        } else {
          setTokenError('invalid');
        }
        setValidating(false);
      });
  }, [token]);

  const [form, setForm] = useState({
    name: '', email: '', age: '',
    gender: 1, senior_citizen: 0, married: 0,
    // plan
    tenure_in_months: 9, contract: 0,
    payment_method: 'Bank Withdrawal', paperless_billing: 0,
    monthly_charge: '',
    // services
    phone_service: 0, multiple_lines: 0, internet_service: 0,
    online_security: 0, online_backup: 0, device_protection_plan: 0,
    premium_tech_support: 0, streaming_tv: 0, streaming_movies: 0,
    streaming_music: 0, unlimited_data: 0,
    internet_type: 'No Internet',
    // experience
    satisfaction_score: 3, referred_a_friend: 0,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    if (step === 0) {
      if (!form.name.trim()) return 'Please enter your name';
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return 'Please enter a valid email';
      if (!form.age || Number(form.age) <= 0) return 'Please enter a valid age';
    }
    if (step === 1) {
      if (form.monthly_charge === '' || Number(form.monthly_charge) < 0) return 'Please enter your monthly bill';
    }
    return null;
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => Math.min(s + 1, 3));
  };
  const back = () => { setError(''); setStep(s => Math.max(s - 1, 0)); };

  const handleSubmit = async () => {
    setError('');
    if (form.satisfaction_score < 1 || form.satisfaction_score > 5) {
      setError('Please select a satisfaction rating'); return;
    }
    const mc = Number(form.monthly_charge) || 0;
    const tenure = Number(form.tenure_in_months) || 0;

    const payload = {
      name: form.name, email: form.email,
      age: Number(form.age) || 0,
      gender: Number(form.gender),
      senior_citizen: Number(form.senior_citizen),
      married: Number(form.married),
      dependents: 0, number_of_dependents: 0,
      referred_a_friend: Number(form.referred_a_friend),
      number_of_referrals: form.referred_a_friend ? 1 : 0,
      tenure_in_months: tenure,
      contract: Number(form.contract),
      offer: 'No Offer',
      paperless_billing: Number(form.paperless_billing),
      payment_method: form.payment_method,
      monthly_charge: mc,
      total_charges: Math.round(mc * tenure * 100) / 100,
      total_refunds: 0,
      phone_service: Number(form.phone_service),
      multiple_lines: Number(form.multiple_lines),
      avg_monthly_long_distance_charges: 0,
      total_long_distance_charges: 0,
      total_extra_data_charges: 0,
      internet_service: Number(form.internet_service),
      internet_type: form.internet_type,
      avg_monthly_gb_download: 25,
      online_security: Number(form.online_security),
      online_backup: Number(form.online_backup),
      device_protection_plan: Number(form.device_protection_plan),
      premium_tech_support: Number(form.premium_tech_support),
      streaming_tv: Number(form.streaming_tv),
      streaming_movies: Number(form.streaming_movies),
      streaming_music: Number(form.streaming_music),
      unlimited_data: Number(form.unlimited_data),
      satisfaction_score: Number(form.satisfaction_score),
      campaign_id: campaignId,
    };

    setLoading(true);
    try {
      await API.post('/survey/submit', payload);
      navigate('/thank-you');
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.error || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step + 1) / 4) * 100;

  // Loading while validating token
  if (validating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // Invalid token
  if (tokenError === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md animate-fadeIn">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Survey Link</h1>
          <p className="text-gray-500">This survey link is invalid or does not exist. Please check the link and try again.</p>
        </div>
      </div>
    );
  }

  // Inactive campaign
  if (tokenError === 'inactive') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md animate-fadeIn">
          <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">This survey is no longer active</h1>
          <p className="text-gray-500">This survey campaign has been closed. Please contact the sender for more information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-start justify-center">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <BarChart2 className="w-6 h-6 text-blue-600" />
          <span className="text-lg font-bold text-gray-900">ChurnSight</span>
        </div>
        {campaignName && (
          <p className="text-center text-sm text-gray-400 -mt-4 mb-4">Survey for {campaignName}</p>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fadeIn">
          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-3 pt-5 pb-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`rounded-full transition-all ${
                i < step ? 'w-2.5 h-2.5 bg-blue-600'
                : i === step ? 'w-3 h-3 border-2 border-blue-600 bg-white'
                : 'w-2.5 h-2.5 bg-gray-200'
              }`} />
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mb-4">Step {step + 1} of 4</p>

          <div className="px-6 sm:px-8 pb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">{stepMeta[step].title}</h2>
            <p className="text-sm text-gray-400 mb-6">{stepMeta[step].sub}</p>

            {/* ── Step 1: About You ── */}
            {step === 0 && (
              <div>
                <Field label="Your Name *">
                  <input type="text" className={inputCls} placeholder="Enter your full name" value={form.name} onChange={e => set('name', e.target.value)} />
                </Field>
                <Field label="Email Address *">
                  <input type="email" className={inputCls} placeholder="your@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </Field>
                <Field label="Your Age *">
                  <input type="number" className={inputCls} placeholder="Enter your age" min="1" value={form.age} onChange={e => set('age', e.target.value)} />
                </Field>
                <Field label="Gender">
                  <div className="flex gap-2">
                    <Toggle label="Male" value={1} selected={form.gender === 1} onClick={v => set('gender', v)} />
                    <Toggle label="Female" value={0} selected={form.gender === 0} onClick={v => set('gender', v)} />
                  </div>
                </Field>
                <Field label="Are you a senior citizen (65+)?">
                  <div className="flex gap-2">
                    <Toggle label="Yes" value={1} selected={form.senior_citizen === 1} onClick={v => set('senior_citizen', v)} />
                    <Toggle label="No" value={0} selected={form.senior_citizen === 0} onClick={v => set('senior_citizen', v)} />
                  </div>
                </Field>
                <Field label="Are you married?">
                  <div className="flex gap-2">
                    <Toggle label="Yes" value={1} selected={form.married === 1} onClick={v => set('married', v)} />
                    <Toggle label="No" value={0} selected={form.married === 0} onClick={v => set('married', v)} />
                  </div>
                </Field>
              </div>
            )}

            {/* ── Step 2: Your Plan ── */}
            {step === 1 && (
              <div>
                <Field label="How long have you been with us?">
                  <select className={inputCls} value={form.tenure_in_months} onChange={e => set('tenure_in_months', Number(e.target.value))}>
                    {tenureOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>

                <Field label="What type of contract are you on?">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { v: 0, label: 'Monthly', desc: 'Flexible monthly billing' },
                      { v: 1, label: 'Annual', desc: '12 month commitment' },
                      { v: 2, label: 'Biennial', desc: '24 month commitment' },
                    ].map(c => (
                      <button key={c.v} type="button" onClick={() => set('contract', c.v)}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          form.contract === c.v
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}>
                        <p className="font-semibold text-sm">{c.label}</p>
                        <p className="text-xs mt-1 opacity-70">{c.desc}</p>
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="How do you pay your bill?">
                  <div className="flex flex-wrap gap-2">
                    {['Bank Withdrawal', 'Credit Card', 'Mailed Check'].map(m => (
                      <Toggle key={m} label={m} value={m} selected={form.payment_method === m} onClick={v => set('payment_method', v)} />
                    ))}
                  </div>
                </Field>

                <Field label="Do you use paperless billing?">
                  <div className="flex gap-2">
                    <Toggle label="Yes" value={1} selected={form.paperless_billing === 1} onClick={v => set('paperless_billing', v)} />
                    <Toggle label="No" value={0} selected={form.paperless_billing === 0} onClick={v => set('paperless_billing', v)} />
                  </div>
                </Field>

                <Field label="What is your approximate monthly bill? *">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                    <input type="number" className={`${inputCls} pl-8`} placeholder="65.00" min="0" step="0.01" value={form.monthly_charge} onChange={e => set('monthly_charge', e.target.value)} />
                  </div>
                </Field>
              </div>
            )}

            {/* ── Step 3: Services ── */}
            {step === 2 && (
              <div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {services.map(s => {
                    const Icon = s.icon;
                    const on = form[s.key] === 1;
                    return (
                      <button key={s.key} type="button"
                        onClick={() => set(s.key, on ? 0 : 1)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                          on ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          on ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-4.5 h-4.5 ${on ? 'text-blue-600' : 'text-gray-400'}`} />
                        </div>
                        <span className={`text-sm font-medium ${on ? 'text-blue-700' : 'text-gray-600'}`}>{s.label}</span>
                      </button>
                    );
                  })}
                </div>

                {form.internet_service === 1 && (
                  <Field label="What type of internet do you use?">
                    <div className="flex flex-wrap gap-2">
                      {['DSL', 'Fiber Optic', 'Cable'].map(t => (
                        <Toggle key={t} label={t} value={t} selected={form.internet_type === t} onClick={v => set('internet_type', v)} />
                      ))}
                    </div>
                  </Field>
                )}
              </div>
            )}

            {/* ── Step 4: Experience ── */}
            {step === 3 && (
              <div>
                <Field label="Overall satisfaction rating">
                  <div className="flex gap-2 mt-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" onClick={() => set('satisfaction_score', n)}
                        className="p-2 rounded-lg transition-all hover:scale-110">
                        <Star className={`w-8 h-8 ${
                          n <= form.satisfaction_score
                            ? 'text-blue-600 fill-blue-600'
                            : 'text-gray-300'
                        }`} />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {satLabels[form.satisfaction_score - 1] || ''}
                  </p>
                </Field>

                <Field label="Would you recommend us to a friend?">
                  <div className="flex gap-2">
                    <Toggle label="Yes" value={1} selected={form.referred_a_friend === 1} onClick={v => set('referred_a_friend', v)} />
                    <Toggle label="No" value={0} selected={form.referred_a_friend === 0} onClick={v => set('referred_a_friend', v)} />
                  </div>
                </Field>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            {/* Nav buttons */}
            <div className="flex justify-between mt-8">
              {step > 0 ? (
                <button type="button" onClick={back}
                  className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium px-5 py-2.5 rounded-lg text-sm">
                  Back
                </button>
              ) : <div />}

              {step < 3 ? (
                <button type="button" onClick={next}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg shadow-sm hover:shadow-md text-sm">
                  Next
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2.5 rounded-lg shadow-sm hover:shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
