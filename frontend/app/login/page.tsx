'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  School,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  Lock,
} from 'lucide-react';

type RoleTab = 'ADMIN' | 'TEACHER' | 'STUDENT';

export default function LoginPage() {
  const { login } = useAuth();
  const [roleTab, setRoleTab] = useState<RoleTab>('ADMIN');
  const [identifier, setIdentifier] = useState('admin@gmail.com');
  const [password, setPassword] = useState('123321@Admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Switch role and dynamically update identifier label & default placeholder
  const handleRoleChange = (role: RoleTab) => {
    setRoleTab(role);
    setError(null);
    if (role === 'ADMIN') {
      setIdentifier('admin@gmail.com');
      setPassword('123321@Admin');
    } else if (role === 'TEACHER') {
      setIdentifier('ahmed.teacher');
      setPassword('Teacher123!');
    } else {
      setIdentifier('B20092');
      setPassword('Student123!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please provide your login credentials.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await login(identifier.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role: RoleTab, demoId: string, demoPass: string) => {
    setRoleTab(role);
    setIdentifier(demoId);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center items-center p-4 sm:p-6 text-[#1F2937]">
      <div className="w-full max-w-md">
        {/* School Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1877F2] text-white shadow-lg shadow-[#1877F2]/25 mb-3">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Apex International Academy
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 font-medium">
            School Management & Student Information System
          </p>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Welcome Message */}
          <div className="mb-5 text-center">
            <h2 className="text-lg font-bold text-slate-900">Welcome Back 👋</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Select your account type and sign in to continue
            </p>
          </div>

          {/* Role Selector Tabs (Section 5 & 32) */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 text-center">
              Login As
            </label>
            <div className="grid grid-cols-3 p-1 bg-[#F5F7FA] rounded-xl border border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => handleRoleChange('ADMIN')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  roleTab === 'ADMIN'
                    ? 'bg-[#1877F2] text-white shadow-sm shadow-[#1877F2]/30'
                    : 'text-[#6B7280] hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Admin
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('TEACHER')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  roleTab === 'TEACHER'
                    ? 'bg-[#1877F2] text-white shadow-sm shadow-[#1877F2]/30'
                    : 'text-[#6B7280] hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" /> Teacher
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('STUDENT')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  roleTab === 'STUDENT'
                    ? 'bg-[#1877F2] text-white shadow-sm shadow-[#1877F2]/30'
                    : 'text-[#6B7280] hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Student
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-600 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dynamic Identifier Field (Section 5) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {roleTab === 'ADMIN' && 'Email Address'}
                {roleTab === 'TEACHER' && 'Username'}
                {roleTab === 'STUDENT' && 'Student ID'}
              </label>
              <input
                type={roleTab === 'ADMIN' ? 'email' : 'text'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  roleTab === 'ADMIN'
                    ? 'admin@gmail.com'
                    : roleTab === 'TEACHER'
                    ? 'e.g. ahmed.teacher'
                    : 'e.g. B20092'
                }
                required
                className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-slate-900 text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-[#1877F2] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-slate-900 text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button (Section 30: #1877F2 primary) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md shadow-[#1877F2]/25 flex items-center justify-center gap-2 transition-all mt-2 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Fast 1-Click Demo Fill Selector */}
          <div className="mt-6 pt-5 border-t border-[#E5E7EB]">
            <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center mb-2.5">
              Instant Demo Fill
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN', 'admin@gmail.com', '123321@Admin')}
                className={`p-2 rounded-xl text-left border transition-all ${
                  roleTab === 'ADMIN' && identifier === 'admin@gmail.com'
                    ? 'bg-[#E7F3FF] border-[#1877F2] text-[#1877F2]'
                    : 'bg-[#F5F7FA] hover:bg-[#E7F3FF] border-[#E5E7EB] text-slate-700'
                }`}
              >
                <p className="text-[11px] font-bold">Admin</p>
                <p className="text-[9px] text-[#6B7280] truncate font-mono">admin@gmail.com</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('TEACHER', 'ahmed.teacher', 'Teacher123!')}
                className={`p-2 rounded-xl text-left border transition-all ${
                  roleTab === 'TEACHER' && identifier === 'ahmed.teacher'
                    ? 'bg-[#E7F3FF] border-[#1877F2] text-[#1877F2]'
                    : 'bg-[#F5F7FA] hover:bg-[#E7F3FF] border-[#E5E7EB] text-slate-700'
                }`}
              >
                <p className="text-[11px] font-bold">Teacher</p>
                <p className="text-[9px] text-[#6B7280] truncate font-mono">ahmed.teacher</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('STUDENT', 'B20092', 'Student123!')}
                className={`p-2 rounded-xl text-left border transition-all ${
                  roleTab === 'STUDENT' && identifier === 'B20092'
                    ? 'bg-[#E7F3FF] border-[#1877F2] text-[#1877F2]'
                    : 'bg-[#F5F7FA] hover:bg-[#E7F3FF] border-[#E5E7EB] text-slate-700'
                }`}
              >
                <p className="text-[11px] font-bold">Student</p>
                <p className="text-[9px] text-[#6B7280] truncate font-mono">B20092</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-[#6B7280] mt-5">
          Apex Academy SMS • Connected to Supabase PostgreSQL
        </p>
      </div>

      {/* Forgot Password Modal (Section 16) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-[#E7F3FF] text-[#1877F2] flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Password Reset Policy</h3>
            <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
              Student and Teacher accounts authenticate using administrator-generated credentials.
              To maintain institutional security, accounts cannot be reset via public email links.
            </p>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 mt-3 text-[11px] text-amber-800">
              <strong>Need a password reset?</strong>
              <p className="mt-0.5">Please contact the School Administration office. An administrator can issue a new temporary password for your Student ID or Teacher Username.</p>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-semibold rounded-lg"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
