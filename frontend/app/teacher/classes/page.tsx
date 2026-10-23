'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Layers, Users, BookOpen, ArrowRight } from 'lucide-react';

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/classes?assignedOnly=true');
        setClasses(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">My Assigned Classes</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Section 8: You have authorized access to only your assigned student cohorts.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading your classes...</div>
        ) : classes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">No classes currently assigned to you.</div>
        ) : (
          classes.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-base">
                    {c.gradeLevel}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    Active Assignment
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
                <p className="text-xs text-slate-500 mt-1">Classroom: {c.room || 'General Academic Hall'}</p>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Students</span>
                    <strong className="text-slate-900">{c._count?.enrollments || 0} enrolled</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Sections</span>
                    <strong className="text-slate-900">{c.sections?.length || 1} divisions</strong>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <Link
                  href="/teacher/attendance"
                  className="flex-1 py-2 text-center text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Mark Attendance
                </Link>
                <Link
                  href="/teacher/enter-scores"
                  className="flex-1 py-2 text-center text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                  Enter Scores
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
