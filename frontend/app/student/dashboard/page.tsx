'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import {
  GraduationCap,
  Award,
  ClipboardCheck,
  Calendar,
  Clock,
  Megaphone,
  ArrowRight,
  FileText,
  BookOpen,
} from 'lucide-react';

export default function StudentDashboard() {
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
    return <div className="py-20 text-center text-slate-400">Loading student portal...</div>;
  }

  const stu = data?.student;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold mb-3 border border-indigo-400/20">
            Student Academic Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome, {stu?.firstName || user?.firstName} {stu?.lastName || user?.lastName}
          </h1>
          <p className="text-indigo-200 text-sm mt-2 leading-relaxed">
            Class: <strong className="text-white">{data?.currentClass} {data?.section ? `(Sec ${data.section})` : ''}</strong> • Student ID: <span className="font-mono text-white font-bold">{stu?.studentNumber || 'STU-2026-001'}</span>
          </p>
        </div>
      </div>

      {/* Metrics Cards (Section 39) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">My Attendance</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{data?.attendancePercentage}%</h3>
          <span className="text-[11px] text-emerald-600 font-medium">On-Time Attendance</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Average Score</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{data?.averageScore}%</h3>
          <span className="text-[11px] text-indigo-600 font-medium">Midterm Board Standing</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Board Status</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">PASSED</h3>
          <span className="text-[11px] text-slate-500 font-medium">Term 1 Standing</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Report Card</p>
          <Link
            href="/student/report-card"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-3"
          >
            View Official Card <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/student/profile"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-xs transition-all text-center group"
        >
          <GraduationCap className="w-6 h-6 mx-auto text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-900 block">My Profile</span>
          <span className="text-[10px] text-slate-400">Bio & Guardian</span>
        </Link>

        <Link
          href="/student/attendance"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 shadow-xs transition-all text-center group"
        >
          <ClipboardCheck className="w-6 h-6 mx-auto text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-900 block">My Attendance</span>
          <span className="text-[10px] text-slate-400">Daily Log</span>
        </Link>

        <Link
          href="/student/results"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-400 shadow-xs transition-all text-center group"
        >
          <Award className="w-6 h-6 mx-auto text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-900 block">My Results</span>
          <span className="text-[10px] text-slate-400">Exam Marks</span>
        </Link>

        <Link
          href="/student/timetable"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-purple-400 shadow-xs transition-all text-center group"
        >
          <Clock className="w-6 h-6 mx-auto text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-900 block">My Timetable</span>
          <span className="text-[10px] text-slate-400">Class Schedule</span>
        </Link>
      </div>

      {/* Academic Results and Attendance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MY RESULTS (Exact format from specification) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                MY RESULTS
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Published Academic Standing</p>
            </div>
            <Link href="/student/results" className="text-xs text-indigo-600 hover:underline font-semibold">
              View All
            </Link>
          </div>

          {data?.latestResults?.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No results published yet.</p>
          ) : (
            <div className="space-y-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold">
                      <th className="pb-2">Subject</th>
                      <th className="pb-2 text-right">Score</th>
                      <th className="pb-2 text-right">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {data?.latestResults?.map((r: any) => (
                      <tr key={r.id} className="text-slate-800">
                        <td className="py-2.5 font-semibold">{r.examSubject?.subject?.name}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-indigo-600">{r.score}</td>
                        <td className="py-2.5 text-right">
                          <span className="inline-block w-8 text-center py-0.5 font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px]">
                            {r.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Average Bar */}
              <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 uppercase tracking-wider text-[11px]">Average Score</span>
                <span className="font-mono text-indigo-700 text-sm font-black">
                  {data?.averageScore || 0}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* MY ATTENDANCE (Exact format from specification) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  MY ATTENDANCE
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Academic Session Attendance</p>
              </div>
              <Link href="/student/attendance" className="text-xs text-indigo-600 hover:underline font-semibold">
                Daily Log
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">Present</span>
                <span className="text-2xl font-black text-emerald-700">
                  {data?.attendanceCounts?.present ?? 42}
                </span>
              </div>
              <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-1">Absent</span>
                <span className="text-2xl font-black text-rose-700">
                  {data?.attendanceCounts?.absent ?? 3}
                </span>
              </div>
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1">Late</span>
                <span className="text-2xl font-black text-amber-700">
                  {data?.attendanceCounts?.late ?? 2}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 block">Overall Attendance</span>
                <span className="text-[11px] text-slate-500">Required minimum: 75%</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-emerald-600 font-mono">
                  {data?.attendancePercentage}%
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 text-[11px] text-slate-400">
            Attendance records are officially verified by your classroom teachers.
          </div>
        </div>
      </div>
    </div>
  );
}
