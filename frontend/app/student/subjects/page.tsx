'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BookOpen, GraduationCap, Award } from 'lucide-react';

export default function StudentSubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/subjects');
        setSubjects(res.data || []);
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
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Enrolled Subjects & Curriculum
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Academic subjects, credit units, and assessment benchmarks for your current grade.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading curriculum...</div>
        ) : (
          subjects.map((s) => (
            <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {s.code}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">{s.creditHours} Credits</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">{s.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{s.description || 'Core academic competency'}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Pass: <strong className="text-slate-900">{s.passScore} pts</strong></span>
                <span>Max: <strong className="text-slate-900">{s.maxScore} pts</strong></span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
