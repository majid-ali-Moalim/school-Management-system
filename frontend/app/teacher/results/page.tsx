'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Award, Plus, ArrowRight } from 'lucide-react';

export default function TeacherResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/results');
        setResults(res.data || []);
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Submitted Exam Results</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Review student examination scores recorded for your assigned classes.</p>
        </div>
        <Link
          href="/teacher/enter-scores"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Enter New Scores
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-4 py-3.5">Subject</th>
                <th className="px-4 py-3.5">Class</th>
                <th className="px-4 py-3.5">Score</th>
                <th className="px-4 py-3.5">Grade</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">Loading exam results...</td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">No results submitted yet.</td>
                </tr>
              ) : (
                results.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {r.student.firstName} {r.student.lastName}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">
                      {r.examSubject?.subject?.name}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {r.examSubject?.class?.name}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-indigo-700">
                      {r.score} / {r.examSubject?.maxScore || 100}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded font-black text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {r.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 italic">
                      {r.remarks || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
