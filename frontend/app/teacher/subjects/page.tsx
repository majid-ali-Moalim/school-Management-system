'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BookOpen, Layers } from 'lucide-react';

export default function TeacherSubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/subjects?assignedOnly=true');
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
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">My Teaching Subjects</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Curriculum areas you are certified and assigned to instruct.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">No subjects currently assigned.</div>
        ) : (
          subjects.map((sub) => (
            <div key={sub.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    {sub.code}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">{sub.creditHours} Credits</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">{sub.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{sub.description || 'Instructional subject'}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Pass: <strong className="text-slate-900">{sub.passScore} pts</strong></span>
                <span>Max: <strong className="text-slate-900">{sub.maxScore} pts</strong></span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
