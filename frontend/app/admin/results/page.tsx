'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Award, CheckCircle2, Filter, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function AdminResultsReviewPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [exRes, clsRes] = await Promise.all([
          api.get('/exams'),
          api.get('/classes'),
        ]);
        setExams(exRes.data || []);
        setClasses(clsRes.data || []);
        if (exRes.data?.[0]) setSelectedExamId(exRes.data[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const fetchResults = async () => {
    if (!selectedExamId) return;
    try {
      setLoading(true);
      const query = new URLSearchParams({
        examId: selectedExamId,
        ...(selectedClassId && { classId: selectedClassId }),
      });
      const res = await api.get(`/results?${query.toString()}`);
      setResults(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) fetchResults();
  }, [selectedExamId, selectedClassId]);

  const handlePublishAll = async () => {
    if (!confirm('Are you sure you want to officially publish these examination results? Students will immediately see their scores.')) return;
    try {
      setPublishing(true);
      await api.post('/results/publish', { examId: selectedExamId });
      fetchResults();
    } catch (err: any) {
      alert(err.message || 'Failed to publish results');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Exam Results Review & Publishing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review faculty marks submissions, verify grade distributions, and authorize official release.
          </p>
        </div>
        <button
          onClick={handlePublishAll}
          disabled={publishing || results.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors disabled:opacity-50"
        >
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Publish All Exam Results
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>

        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
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
                <th className="px-4 py-3.5">Teacher Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">Loading exam scores...</td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">No score records found for this selection.</td>
                </tr>
              ) : (
                results.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{r.student.firstName} {r.student.lastName}</p>
                      <p className="font-mono text-[10px] text-slate-400">{r.student.studentNumber}</p>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">
                      {r.examSubject?.subject?.name}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {r.examSubject?.class?.name}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-indigo-700 text-sm">{r.score}</span>
                      <span className="text-[10px] text-slate-400"> / {r.examSubject?.maxScore || 100}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {r.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
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
