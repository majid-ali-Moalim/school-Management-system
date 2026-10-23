'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { GraduationCap, Mail, Phone, Calendar, MapPin, Shield, User } from 'lucide-react';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const s = user?.studentProfile;
  const enrollment = s?.enrollments?.[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Student Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Your personal student dossier, admission details, and emergency contacts.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
            {user?.firstName[0]}
            {user?.lastName[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {user?.firstName} {s?.middleName ? s.middleName + ' ' : ''}{user?.lastName}
            </h2>
            <p className="text-xs font-mono text-indigo-600 font-semibold mt-0.5">
              Student ID: {s?.studentNumber || 'STU-2026-001'} • Admission: {s?.admissionNumber || 'ADM-2026-001'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Class</span>
            <strong className="text-slate-900 text-sm">
              {enrollment?.class?.name || 'Grade 8'} {enrollment?.section ? `(Sec ${enrollment.section.name})` : '(Sec 8A)'}
            </strong>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Academic Session</span>
            <strong className="text-slate-900 text-sm">{enrollment?.academicYear?.name || '2026/2027'}</strong>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Birth</span>
            <strong className="text-slate-900 text-sm">
              {s?.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : 'April 15, 2012'}
            </strong>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Student Email</span>
            <strong className="text-slate-900 text-sm">{user?.email}</strong>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Guardian Name & Relation</span>
            <strong className="text-slate-900 text-sm">{s?.guardianName || 'Michael Johnson'} ({s?.relationship || 'Father'})</strong>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Guardian Telephone</span>
            <strong className="text-slate-900 text-sm">{s?.guardianPhone || '+1 (555) 400-3002'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
