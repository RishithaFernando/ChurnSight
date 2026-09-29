import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, User, Lock, Eye, EyeOff, AlertCircle, Heart, Users, Shield } from 'lucide-react';
import API from '../api/axios';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Authenticating credentials...');

  useEffect(() => {
    let interval;
    if (loading) {
      let step = 0;
      const texts = [
        'Authenticating credentials...',
        'Establishing secure connection...',
        'Encrypting session data...',
        'Preparing your dashboard...'
      ];
      interval = setInterval(() => {
        step = (step + 1) % texts.length;
        setLoadingText(texts[step]);
      }, 800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Artificial delay to display the secure loading experience
      await new Promise(resolve => setTimeout(resolve, 2500));
      await API.post('/admin/login', { username, password });
      navigate('/admin/dashboard');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white relative">
      
      {/* ── Unique Loading Overlay ── */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#020617]/90 backdrop-blur-xl transition-opacity animate-in fade-in duration-300">
          <div className="flex flex-col items-center">
            
            {/* Custom Spinner / Logo Animation */}
            <div className="relative flex items-center justify-center w-28 h-28 mb-8">
              {/* Outer pulsing ripple */}
              <div className="absolute inset-[-20%] border border-white/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
              
              {/* Spinning rings */}
              <div className="absolute inset-0 border-[3px] border-transparent border-t-white border-r-white/50 rounded-full animate-spin" style={{ animationDuration: '1.2s' }}></div>
              <div className="absolute inset-2 border-[3px] border-transparent border-b-gray-400 border-l-gray-400/50 rounded-full animate-spin" style={{ animationDuration: '1.8s', animationDirection: 'reverse' }}></div>
              
              {/* Center Core */}
              <div className="absolute inset-5 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                <BarChart2 className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>
            
            {/* Branding & Status */}
            <h3 className="text-2xl font-bold text-white tracking-tight mb-3">ChurnSight</h3>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            
            <p className="text-gray-400 text-sm font-medium w-[260px] text-center transition-all duration-300">
              {loadingText}
            </p>
          </div>
        </div>
      )}

      {/* ── Left Hero Column ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#020617] overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2069&q=80" 
            alt="Modern office architecture" 
            className="w-full h-full object-cover opacity-60"
          />
          {/* Gradient to ensure white text is readable, but image stays highly visible */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/50 to-transparent" />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Content on Image */}
        <div className="relative z-10 flex flex-col justify-between p-14 w-full h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
              <BarChart2 className="w-[20px] h-[20px] text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">ChurnSight</span>
          </div>

          {/* Hero Text - Non Technical */}
          <div className="max-w-xl mt-12 mb-auto">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight">
              Keep your customers coming back.
            </h1>
            <p className="text-gray-300 text-lg mb-10 leading-relaxed font-medium">
              The complete platform to understand customer feedback, improve satisfaction, and grow your business with confidence.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md transition-all hover:bg-white/10">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-gray-200" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Understand their needs</p>
                  <p className="text-gray-400 text-sm mt-1">Easily see what your customers love and where they need more support.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md transition-all hover:bg-white/10">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-gray-200" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Build stronger relationships</p>
                  <p className="text-gray-400 text-sm mt-1">Reach out to the right people with the right message, exactly when it matters.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 border-t border-white/10 pt-8">
            <p className="text-gray-400 text-sm font-medium mb-4">Trusted by customer-first teams worldwide</p>
            <div className="flex gap-6 opacity-40">
              <div className="h-6 w-24 bg-white/40 rounded" />
              <div className="h-6 w-20 bg-white/40 rounded" />
              <div className="h-6 w-28 bg-white/40 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Login Column ── */}
      <div className="w-full lg:w-1/2 flex flex-col relative overflow-hidden bg-[#fafafa]">
        
        {/* Subtle Crisp Grid - No colored blobs */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />

        {/* Top Header for Right Side */}
        <div className="relative z-10 p-6 flex justify-end">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 bg-white/60 px-3 py-1.5 rounded-full border border-gray-200 backdrop-blur-sm shadow-sm">
            <Shield className="w-3.5 h-3.5 text-gray-700" /> Secure Connection
          </span>
        </div>

        {/* Center Login Form */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-[420px]">
            {/* Mobile Logo */}
            <div className="flex items-center justify-center gap-3 mb-10 lg:hidden">
              <div className="w-10 h-10 bg-[#0f172a] rounded-xl flex items-center justify-center shadow-lg">
                <BarChart2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-[#0f172a] tracking-tight">ChurnSight</span>
            </div>

            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Welcome Back</h2>
                <p className="text-gray-500 text-sm font-medium">Please sign in to access your dashboard</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Username</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-4.5 h-4.5 text-gray-400 group-focus-within:text-gray-800 transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      required
                      className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-400 placeholder:text-gray-400 hover:border-gray-300"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Password</label>
                    <a href="#" className="text-xs font-semibold text-gray-600 hover:text-black transition-colors underline decoration-gray-300 hover:decoration-black underline-offset-2">Forgot?</a>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-4.5 h-4.5 text-gray-400 group-focus-within:text-gray-800 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-400 placeholder:text-gray-400 hover:border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-800 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0f172a] hover:bg-black active:bg-gray-900 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-gray-900/10 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4.5 w-4.5 border-2 border-white/20 border-t-white" />
                  )}
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Footer for Right Side */}
        <div className="relative z-10 p-6 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-gray-400 font-medium">
            Protected by enterprise-grade security.
          </p>
          <div className="flex gap-4 mt-2">
            <a href="#" className="text-xs text-gray-500 hover:text-black transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-gray-500 hover:text-black transition-colors">Terms of Service</a>
            <a href="#" className="text-xs text-gray-500 hover:text-black transition-colors">Contact Support</a>
          </div>
        </div>

      </div>
    </div>
  );
}
