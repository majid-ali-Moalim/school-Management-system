'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  GraduationCap,
  Users,
  Layers,
  BookOpen,
  ClipboardCheck,
  FileSpreadsheet,
  Award,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/reports/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const s = data?.summary || {};
  const todayAtt = data?.todayAttendance || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold mb-3 border border-indigo-400/20">
            <ShieldCheck className="w-3.5 h-3.5" /> Administrative Control Center
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            School Administration Dashboard
          </h2>
          <p className="text-indigo-200 text-sm mt-2 leading-relaxed">
            Academic Session {s.currentAcademicYear}. Manage institutional operations, faculty assignments, attendance registers, and board examination grading.
          </p>
        </div>
      </div>

      {/* Metrics Cards (Section 37) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{s.totalStudents ?? 0}</h3>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
              Active Enrollments
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Teachers</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{s.totalTeachers ?? 0}</h3>
            <span className="text-[11px] text-indigo-600 font-medium flex items-center gap-1 mt-1">
              Certified Faculty
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classes & Sections</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{s.totalClasses ?? 0}</h3>
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
              {s.totalSubjects ?? 0} Subjects Offered
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today Attendance</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{s.attendanceRate}%</h3>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
              {todayAtt.present ?? 0} Present Today
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Enrollment Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Student Enrollment by Class
            </h3>
            <Link href="/admin/students" className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {data?.enrollmentByClass?.map((c: any) => {
              const max = Math.max(...data.enrollmentByClass.map((x: any) => x.count), 1);
              const pct = Math.round((c.count / max) * 100);
              return (
                <div key={c.className} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{c.className}</span>
                    <span>{c.count} students</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gender Distribution Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Gender Distribution
            </h3>
            <div className="space-y-4">
              {data?.genderDistribution?.map((g: any) => (
                <div key={g.gender} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase">{g.gender}</span>
                  <span className="text-sm font-bold text-indigo-600">{g.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 mt-4 text-[11px] text-slate-500">
            System maintains balanced admission policies across all academic grades.
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Logs (Section 37 & 46) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Administrative Operations
            </h3>
          </div>
          <Link href="/admin/audit-logs" className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
            Full Audit Trail <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {data?.recentActivities?.map((act: any) => (
            <div key={act.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">{act.description}</p>
                  <p className="text-[11px] text-slate-500">
                    By {act.user?.firstName ? `${act.user.firstName} ${act.user.lastName}` : 'System'} • {act.action}
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">
                {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
