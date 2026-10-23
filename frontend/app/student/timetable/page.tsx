'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Clock, BookOpen, Layers } from 'lucide-react';

export default function StudentTimetablePage() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/timetable');
        setTimetable(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Class Weekly Timetable
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Daily class lecture hours, instructor assignments, and room numbers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {days.map((day) => {
          const slots = timetable.filter(t => t.day === day);
          return (
            <div key={day} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider">{day}</span>
                <span className="text-[10px] text-indigo-400 font-semibold">{slots.length} periods</span>
              </div>

              <div className="p-4 flex-1 divide-y divide-slate-100">
                {slots.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center italic">No scheduled periods</p>
                ) : (
                  slots.map((s) => (
                    <div key={s.id} className="py-2.5 text-xs">
                      <span className="font-mono font-bold text-indigo-700 text-[11px] block">
                        {s.startTime} - {s.endTime}
                      </span>
                      <strong className="text-slate-900 text-sm block mt-0.5">{s.subject?.name}</strong>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Teacher: {s.teacher?.firstName} {s.teacher?.lastName} • Room: {s.room || 'General'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
