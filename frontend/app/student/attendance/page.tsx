'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ClipboardCheck, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

export default function StudentAttendancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/attendance/summary');
        setData(res.data);
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
          My Attendance Records
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Personal lecture attendance history and semester compliance standing.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Attendance Rate</span>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">{data?.percentage ?? 100}%</h3>
          <span className="text-[11px] text-slate-500">Compliance Met</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Days Present</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{data?.present ?? 0}</h3>
          <span className="text-[11px] text-emerald-600 font-semibold">On Time</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Late Arrivals</span>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">{data?.late ?? 0}</h3>
          <span className="text-[11px] text-slate-500">Documented</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Absences</span>
          <h3 className="text-2xl font-bold text-red-600 mt-1">{data?.absent ?? 0}</h3>
          <span className="text-[11px] text-slate-500">{data?.excused ?? 0} Excused</span>
        </div>
      </div>

      {/* Attendance Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Attendance Log</h3>
          <span className="text-xs text-slate-500">{data?.recent?.length || 0} recorded sessions</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading attendance history...</div>
          ) : data?.recent?.length === 0 ? (
            <div className="py-12 text-center text-slate-400">No attendance entries recorded yet.</div>
          ) : (
            data?.recent?.map((a: any) => (
              <div key={a.id} className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900">
                    {new Date(a.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  {a.remarks && <p className="text-[11px] text-slate-400 mt-0.5">{a.remarks}</p>}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    a.status === 'PRESENT'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : a.status === 'LATE'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : a.status === 'EXCUSED'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {a.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
