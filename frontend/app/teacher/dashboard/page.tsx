'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import {
  Layers,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Award,
  Clock,
  Megaphone,
  ArrowRight,
  Calendar,
} from 'lucide-react';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/reports/dashboard');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading teacher dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-semibold mb-3 border border-emerald-400/20">
            Instructor Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-emerald-200 text-sm mt-2 leading-relaxed">
            Manage your assigned classes, take morning attendance registers, schedule lectures, and enter examination scores.
          </p>
        </div>
      </div>

      {/* Metrics Cards (Section 38) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">My Teaching Classes</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{data?.myClassesCount ?? 0}</h3>
            <span className="text-[11px] text-emerald-600 font-medium">Assigned Grades</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">My Students</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{data?.myStudentsCount ?? 0}</h3>
            <span className="text-[11px] text-indigo-600 font-medium">Under Direct Instruction</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Subjects Taught</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{data?.mySubjectsCount ?? 0}</h3>
            <span className="text-[11px] text-slate-500 font-medium">Curriculum Areas</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/teacher/attendance"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">Take Class Attendance</h4>
              <p className="text-xs text-slate-500 mt-0.5">Record daily student attendance for assigned grades.</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/teacher/enter-scores"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700">Enter Exam Marks</h4>
              <p className="text-xs text-slate-500 mt-0.5">Input board scores and calculate dynamic grades.</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Assigned Classes and Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teaching Allocations */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            My Teaching Assignments (Section 19)
          </h3>
          <div className="space-y-2.5">
            {data?.assignments?.map((asg: any) => (
              <div
                key={asg.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">{asg.subject?.name}</span>
                  <p className="text-slate-500 text-[11px]">{asg.class?.name} • Sec {asg.section?.name || 'All'}</p>
                </div>
                <span className="font-mono text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                  {asg.subject?.code}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Today Timetable Schedule
          </h3>
          <div className="space-y-2.5">
            {data?.todaySchedule?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No classes scheduled for today.</p>
            ) : (
              data?.todaySchedule?.map((s: any) => (
                <div
                  key={s.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-700">{s.startTime} - {s.endTime}</span>
                    <strong className="block text-slate-900 mt-0.5">{s.subject?.name}</strong>
                    <p className="text-[11px] text-slate-500">{s.class?.name} • {s.room || 'General Room'}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">
                    {s.day}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
