'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ClipboardCheck, CheckCircle2, Save, Loader2, Calendar, Filter, Users } from 'lucide-react';

export default function TeacherAttendancePage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAsgId, setSelectedAsgId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadAssignments() {
      try {
        const res = await api.get('/assignments');
        const asgs = res.data || [];
        setAssignments(asgs);
        if (asgs[0]) setSelectedAsgId(asgs[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAssignments();
  }, []);

  const activeAssignment = assignments.find(a => a.id === selectedAsgId);

  const fetchAttendanceSheet = async () => {
    if (!activeAssignment) return;
    try {
      setLoading(true);
      const query = new URLSearchParams({
        classId: activeAssignment.classId,
        ...(activeAssignment.sectionId && { sectionId: activeAssignment.sectionId }),
        ...(activeAssignment.subjectId && { subjectId: activeAssignment.subjectId }),
        date,
      });

      const res = await api.get(`/attendance?${query.toString()}`);
      setStudents(res.data?.students || []);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to load attendance register');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeAssignment) fetchAttendanceSheet();
  }, [selectedAsgId, date]);

  const handleStatusChange = (studentId: string, status: string) => {
    setStudents(prev =>
      prev.map(s => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudents(prev =>
      prev.map(s => (s.studentId === studentId ? { ...s, remarks } : s))
    );
  };

  const handleMarkAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'PRESENT' })));
  };

  const handleSaveAttendance = async () => {
    if (!activeAssignment || students.length === 0) return;
    try {
      setSaving(true);
      await api.post('/attendance/bulk', {
        classId: activeAssignment.classId,
        sectionId: activeAssignment.sectionId,
        subjectId: activeAssignment.subjectId,
        date,
        records: students.map(s => ({
          studentId: s.studentId,
          status: s.status,
          remarks: s.remarks,
        })),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchAttendanceSheet();
    } catch (err: any) {
      alert(err.message || 'Failed to save attendance');
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
            Class Attendance Register
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Section 22: Mark daily lecture and homeroom attendance for your assigned students.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> Attendance Recorded!
            </span>
          )}

          <button
            onClick={handleMarkAllPresent}
            disabled={students.length === 0 || loading}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            Mark All Present
          </button>

          <button
            onClick={handleSaveAttendance}
            disabled={saving || students.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Attendance Register
          </button>
        </div>
      </div>

      {/* Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Assigned Teaching Load:</span>
          <select
            value={selectedAsgId}
            onChange={(e) => setSelectedAsgId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.class?.name} {a.section ? `(Sec ${a.section.name})` : ''} — {a.subject?.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold"
          />
        </div>
      </div>

      {/* Attendance Form Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Student Details</th>
                <th className="px-4 py-3.5">Student ID</th>
                <th className="px-6 py-3.5 text-center">Status (Select)</th>
                <th className="px-4 py-3.5">Remarks (Optional)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400">Loading student roster...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400">No students found in this assigned class.</td>
                </tr>
              ) : (
                students.map((stu) => (
                  <tr key={stu.studentId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {stu.firstName} {stu.lastName}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-indigo-600">{stu.studentNumber}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleStatusChange(stu.studentId, st)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition-all ${
                              stu.status === st
                                ? st === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : st === 'ABSENT'
                                  ? 'bg-red-600 text-white shadow-xs'
                                  : st === 'LATE'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <input
                        type="text"
                        placeholder="Add note (e.g. sick, traffic)"
                        value={stu.remarks || ''}
                        onChange={(e) => handleRemarksChange(stu.studentId, e.target.value)}
                        className="w-full max-w-xs px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400"
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
