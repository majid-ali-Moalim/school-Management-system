'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BarChart3, TrendingUp, Award, Users, BookOpen } from 'lucide-react';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/reports/academic');
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
          Academic Reports & Institutional Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Detailed metrics on curriculum performance, grade distribution tiers, and class averages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance Averages */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-indigo-600">
            <BookOpen className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Subject Academic Performance Averages
            </h2>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-xs text-slate-400 py-6 text-center">Calculating performance...</p>
            ) : data?.subjectAverages?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No examination results available.</p>
            ) : (
              data?.subjectAverages?.map((s: any) => (
                <div key={s.subject} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{s.subject}</span>
                    <span className="font-bold text-indigo-700">{s.average}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${s.average}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-indigo-600">
            <Award className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Grade Distribution Tiers
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {loading ? (
              <p className="col-span-full text-xs text-slate-400 py-6 text-center">Loading distribution...</p>
            ) : (
              data?.gradeDistribution?.map((g: any) => (
                <div key={g.grade} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-xs font-bold text-slate-400 block uppercase">Grade</span>
                  <span className="text-2xl font-black text-indigo-600 block mt-1">{g.grade}</span>
                  <span className="text-xs font-semibold text-slate-600 mt-1 block">{g.count} scores</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
