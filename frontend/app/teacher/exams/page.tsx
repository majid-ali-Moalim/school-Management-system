'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { FileSpreadsheet, Calendar, Award, ArrowRight } from 'lucide-react';

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/exams');
        setExams(res.data || []);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Examinations & Assessments</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Review scheduled board assessments and enter student scores.</p>
        </div>
        <Link
          href="/teacher/enter-scores"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
        >
          <Award className="w-4 h-4" /> Enter Exam Scores
        </Link>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            Loading examination boards...
          </div>
        ) : exams.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            No exams scheduled.
          </div>
        ) : (
          exams.map((ex) => (
            <div key={ex.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{ex.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {ex.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(ex.startDate).toLocaleDateString()} — {new Date(ex.endDate).toLocaleDateString()} • Type: {ex.type}
                </p>
                <p className="text-xs text-slate-600 mt-1">{ex.description || 'Institutional evaluations'}</p>
              </div>

              <Link
                href="/teacher/enter-scores"
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              >
                Open Score Sheet <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
