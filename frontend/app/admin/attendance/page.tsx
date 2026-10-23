'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ClipboardCheck, Calendar, Filter, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function AdminAttendancePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sheet, setSheet] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInit() {
      try {
        const [clsRes, sumRes] = await Promise.all([
          api.get('/classes'),
          api.get('/attendance/summary'),
        ]);
        setClasses(clsRes.data || []);
        setSummary(sumRes.data);
        if (clsRes.data?.[0]) setSelectedClassId(clsRes.data[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInit();
  }, []);

  const fetchSheet = async () => {
    if (!selectedClassId) return;
    try {
      setLoading(true);
      const res = await api.get(`/attendance?classId=${selectedClassId}&date=${date}`);
      setSheet(res.data?.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) fetchSheet();
  }, [selectedClassId, date]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          School-Wide Attendance
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor daily institutional attendance registers, class comparisons, and student absence records.
        </p>
      </div>

      {/* Summary Cards (Section 23) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Present Today</p>
            <h3 className="text-xl font-bold text-slate-900">{summary?.present ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Absent Today</p>
            <h3 className="text-xl font-bold text-slate-900">{summary?.absent ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Late Arrivals</p>
            <h3 className="text-xl font-bold text-slate-900">{summary?.late ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Attendance Rate</p>
            <h3 className="text-xl font-bold text-slate-900">{summary?.percentage ?? 100}%</h3>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
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
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold"
            >
            </input>
          </div>
        </div>
      </div>

      {/* Sheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-4 py-3.5">Student ID</th>
                <th className="px-4 py-3.5">Section</th>
                <th className="px-4 py-3.5">Attendance Status</th>
                <th className="px-4 py-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">Loading register...</td>
                </tr>
              ) : sheet.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">No students enrolled in this class.</td>
                </tr>
              ) : (
                sheet.map((stu) => (
                  <tr key={stu.studentId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {stu.firstName} {stu.lastName}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-indigo-600">{stu.studentNumber}</td>
                    <td className="px-4 py-3.5 text-slate-500">Sec {stu.sectionName}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          stu.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : stu.status === 'LATE'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : stu.status === 'EXCUSED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {stu.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{stu.remarks || '—'}</td>
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
