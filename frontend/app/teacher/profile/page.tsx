'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { Users, Mail, Phone, GraduationCap, Briefcase, Calendar, Shield } from 'lucide-react';

export default function TeacherProfilePage() {
  const { user } = useAuth();
  const t = user?.teacherProfile;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Instructor Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Your official faculty credentials, specialization, and employment records.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
            {user?.firstName[0]}
            {user?.lastName[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-xs font-mono text-indigo-600 font-semibold mt-0.5">
              Employee ID: {t?.employeeNumber || 'TCH-001'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Email Address</span>
            <strong className="text-slate-800 text-sm">{user?.email}</strong>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Telephone</span>
            <strong className="text-slate-800 text-sm">{user?.phone || '+1 (555) 101-2001'}</strong>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Academic Qualification</span>
            <strong className="text-slate-800 text-sm">{t?.qualification || 'M.Sc. Mathematics & Education'}</strong>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Specialization</span>
            <strong className="text-slate-800 text-sm">{t?.specialization || 'Pure Mathematics'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
