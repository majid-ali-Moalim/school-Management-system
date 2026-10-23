'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Users, Plus, Search, Mail, Phone, Briefcase, GraduationCap, X, Loader2, Key, CheckCircle, AlertCircle } from 'lucide-react';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    username: string;
    temporaryPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    username: '',
    email: '',
    employeeNumber: `TCH-${Math.floor(100 + Math.random() * 900)}`,
    phone: '',
    qualification: 'M.Sc. Education',
    specialization: 'Mathematics & STEM',
    password: '',
  });

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const query = search ? `?search=${search}` : '';
      const res = await api.get(`/teachers${query}`);
      setTeachers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await api.post('/teachers', formData);
      if (res.data?.credentials) {
        setCreatedCredentials(res.data.credentials);
        setShowModal(false);
      } else {
        setShowModal(false);
      }
      fetchTeachers();
    } catch (err: any) {
      setError(err.message || 'Failed to register teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (teacherId: string) => {
    if (!confirm('Are you sure you want to reset this teacher\'s password? A new temporary password will be generated.')) return;
    try {
      setResettingId(teacherId);
      const res = await api.post(`/teachers/${teacherId}/reset-password`);
      if (res.data) {
        setCreatedCredentials({
          username: res.data.username,
          temporaryPassword: res.data.temporaryPassword,
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setResettingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Faculty & Teachers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage academic instructors, departmental staff, and teaching credentials.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Register Teacher
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchTeachers()}
            placeholder="Search teacher by name or employee #..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            Loading faculty directory...
          </div>
        ) : teachers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            No instructors found.
          </div>
        ) : (
          teachers.map((t) => (
            <div
              key={t.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                      {t.firstName[0]}
                      {t.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {t.firstName} {t.middleName ? t.middleName + ' ' : ''}{t.lastName}
                      </h3>
                      <span className="font-mono text-[11px] text-indigo-600 font-semibold">
                        {t.employeeNumber}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {t.status}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.qualification || 'Certified Faculty'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-800">{t.specialization || 'General Studies'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.user?.email || t.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.phone || 'No direct phone'}</span>
                  </p>
                </div>
              </div>

              {/* Assignments pill */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Active Teaching Loads:</span>
                <span className="font-bold text-[#1877F2] bg-[#E7F3FF] px-2 py-0.5 rounded-md">
                  {t.assignments?.length || 0} classes assigned
                </span>
              </div>

              {/* Reset Password Action (Section 16 & 29) */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleResetPassword(t.id)}
                  disabled={resettingId === t.id}
                  className="text-[11px] font-semibold text-[#1877F2] hover:underline flex items-center gap-1"
                >
                  <Key className="w-3 h-3" /> {resettingId === t.id ? 'Resetting...' : 'Reset Password'}
                </button>
                <span className="text-[10px] text-slate-400 font-mono">
                  {t.user?.username ? `@${t.user.username}` : t.employeeNumber}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Register Teacher (Section 34) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Register New Teacher
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTeacher} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="teacher@school.local"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeNumber}
                    onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-indigo-700 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teacher Username (for Portal Login)</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. ahmed.teacher (leave blank to auto-generate)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Temporary Initial Password</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank to auto-generate"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold rounded-xl disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Faculty Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Created Successfully Confirmation Modal (Section 13 & 35) */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="text-center text-lg font-bold text-slate-900 tracking-tight">
              ACCOUNT CREATED SUCCESSFULLY
            </h3>
            <p className="text-center text-xs text-slate-500 mt-1 mb-6">
              The teacher's credentials have been generated and saved.
            </p>

            <div className="space-y-3 bg-[#F5F7FA] p-4 rounded-xl border border-[#E5E7EB] mb-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Username
                </span>
                <span className="text-lg font-mono font-bold text-slate-900">
                  {createdCredentials.username}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Temporary Password
                </span>
                <span className="text-lg font-mono font-bold text-[#1877F2] tracking-wider">
                  {createdCredentials.temporaryPassword}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 mb-6 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-snug">
                ⚠️ <strong>Give these credentials to the user.</strong> The teacher will be required to change this temporary password on their first login.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Apex Academy Teacher Credentials:\nUsername: ${createdCredentials.username}\nPassword: ${createdCredentials.temporaryPassword}\nLogin Portal: ${window.location.origin}/login`
                  );
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex-1 py-2.5 px-3 bg-[#F5F7FA] hover:bg-slate-100 border border-[#E5E7EB] text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy Credentials'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-4 bg-[#F5F7FA] hover:bg-slate-100 border border-[#E5E7EB] text-slate-800 text-xs font-semibold rounded-xl"
              >
                Print
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="py-2.5 px-5 bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-semibold rounded-xl shadow-md shadow-[#1877F2]/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
