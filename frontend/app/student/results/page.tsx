'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Award, Printer, CheckCircle } from 'lucide-react';

export default function StudentResultsPage() {
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

  const totalScore = results.reduce((acc, r) => acc + r.score, 0);
  const average = results.length > 0 ? (totalScore / results.length).toFixed(1) : 0;
  const totalGpa = results.reduce((acc, r) => acc + r.gradePoint, 0);
  const gpa = results.length > 0 ? (totalGpa / results.length).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Examination Results
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Section 29: Officially published grades and board assessment marks.
          </p>
        </div>
        <Link
          href="/student/report-card"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" /> View Official Report Card
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Average</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{average}%</h3>
          <span className="text-[11px] text-emerald-600 font-semibold">Passing Standard Met</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Cumulative GPA</span>
          <h3 className="text-2xl font-bold text-indigo-700 mt-1">{gpa} / 4.0</h3>
          <span className="text-[11px] text-indigo-600 font-semibold">Standard Scale</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Subjects Assessed</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{results.length} Subjects</h3>
          <span className="text-[11px] text-slate-500">Board Evaluated</span>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Subject</th>
                <th className="px-4 py-3.5">Exam Board</th>
                <th className="px-4 py-3.5 text-right">Max Marks</th>
                <th className="px-4 py-3.5 text-right">Score</th>
                <th className="px-4 py-3.5 text-center">Grade</th>
                <th className="px-4 py-3.5 text-center">GPA</th>
                <th className="px-5 py-3.5">Teacher Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">Loading your marks...</td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">No published results available.</td>
                </tr>
              ) : (
                results.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <strong className="text-slate-900 block">{r.examSubject?.subject?.name}</strong>
                      <span className="font-mono text-[10px] text-indigo-600 font-semibold">{r.examSubject?.subject?.code}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-medium">
                      {r.exam?.name}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-500">
                      {r.examSubject?.maxScore || 100}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-indigo-700 text-sm">
                      {r.score}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded font-black text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {r.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-semibold text-slate-800">
                      {r.gradePoint.toFixed(1)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 italic">
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
