'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Award, Save, Loader2, CheckCircle2, AlertCircle, Filter, FileSpreadsheet } from 'lucide-react';

export default function EnterScoresPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedAsgId, setSelectedAsgId] = useState('');
  const [examSubject, setExamSubject] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInit() {
      try {
        const [exRes, asgRes] = await Promise.all([
          api.get('/exams'),
          api.get('/assignments'),
        ]);
        setExams(exRes.data || []);
        setAssignments(asgRes.data || []);
        if (exRes.data?.[0]) setSelectedExamId(exRes.data[0].id);
        if (asgRes.data?.[0]) setSelectedAsgId(asgRes.data[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInit();
  }, []);

  const activeAssignment = assignments.find(a => a.id === selectedAsgId);

  const fetchScoreSheet = async () => {
    if (!selectedExamId || !activeAssignment) return;
    try {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams({
        examId: selectedExamId,
        classId: activeAssignment.classId,
        subjectId: activeAssignment.subjectId,
      });

      const res = await api.get(`/results/entry-sheet?${query.toString()}`);
      setExamSubject(res.data?.examSubject);
      setStudents(res.data?.students || []);
    } catch (err: any) {
      console.warn(err);
      setError(err.message || 'Exam subject not configured for this class');
      setStudents([]);
      setExamSubject(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId && activeAssignment) {
      fetchScoreSheet();
    }
  }, [selectedExamId, selectedAsgId]);

  // Dynamic Grade Estimator
  const getEstimatedGrade = (score: number) => {
    if (isNaN(score)) return { grade: '—', point: 0 };
    if (score >= 90) return { grade: 'A+', point: 4.0 };
    if (score >= 80) return { grade: 'A', point: 3.7 };
    if (score >= 70) return { grade: 'B', point: 3.0 };
    if (score >= 60) return { grade: 'C', point: 2.0 };
    if (score >= 50) return { grade: 'D', point: 1.0 };
    return { grade: 'F', point: 0.0 };
  };

  const handleScoreChange = (studentId: string, val: string) => {
    const num = val === '' ? null : parseFloat(val);
    setStudents(prev =>
      prev.map(s => {
        if (s.studentId !== studentId) return s;
        const est = num !== null ? getEstimatedGrade(num) : { grade: '', point: 0 };
        return {
          ...s,
          score: num,
          grade: est.grade,
          gradePoint: est.point,
        };
      })
    );
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudents(prev =>
      prev.map(s => (s.studentId === studentId ? { ...s, remarks } : s))
    );
  };

  const handleSaveScores = async () => {
    if (!examSubject || students.length === 0) return;

    // Validate maxScore
    const max = examSubject.maxScore;
    for (const stu of students) {
      if (stu.score !== null && (stu.score < 0 || stu.score > max)) {
        alert(`Score for ${stu.firstName} cannot exceed ${max} or be negative.`);
        return;
      }
    }

    try {
      setSaving(true);
      await api.post('/results/bulk', {
        examId: selectedExamId,
        examSubjectId: examSubject.id,
        scores: students
          .filter(s => s.score !== null)
          .map(s => ({
            studentId: s.studentId,
            score: s.score,
            remarks: s.remarks,
          })),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchScoreSheet();
    } catch (err: any) {
      alert(err.message || 'Failed to register scores');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Register Examination Scores
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Section 27: Select assigned exam, class, and subject to record student marks with real-time grade calculations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> Scores Recorded!
            </span>
          )}

          <button
            onClick={handleSaveScores}
            disabled={saving || !examSubject || students.length === 0}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Submit Marks
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Select Exam:</span>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Assigned Load:</span>
          <select
            value={selectedAsgId}
            onChange={(e) => setSelectedAsgId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.class?.name} — {a.subject?.name}
              </option>
            ))}
          </select>
        </div>

        {examSubject && (
          <div className="ml-auto text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
            Passing: {examSubject.passScore} pts • Max: {examSubject.maxScore} pts
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}. Please check with the school administrator to link this subject under the examination board.</span>
        </div>
      )}

      {/* Table (Section 27) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Student Details</th>
                <th className="px-4 py-3.5">Student ID</th>
                <th className="px-4 py-3.5">Score (Marks)</th>
                <th className="px-4 py-3.5 text-center">Calculated Grade</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Feedback Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">Loading student assessment sheet...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">No students available for this selection.</td>
                </tr>
              ) : (
                students.map((stu) => (
                  <tr key={stu.studentId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {stu.firstName} {stu.lastName}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-indigo-600">{stu.studentNumber}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={examSubject?.maxScore || 100}
                          value={stu.score ?? ''}
                          onChange={(e) => handleScoreChange(stu.studentId, e.target.value)}
                          placeholder="Score"
                          className="w-20 px-2.5 py-1 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] text-slate-400">/ {examSubject?.maxScore || 100}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-md text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {stu.grade || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          stu.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {stu.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <input
                        type="text"
                        placeholder="Instructor comment (e.g. Excellent work)"
                        value={stu.remarks || ''}
                        onChange={(e) => handleRemarksChange(stu.studentId, e.target.value)}
                        className="w-full max-w-sm px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      />
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
