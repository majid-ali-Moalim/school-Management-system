'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Megaphone, Calendar, Users } from 'lucide-react';

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/announcements');
        setAnnouncements(res.data || []);
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
          School Announcements
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Official academic notices, holiday schedules, and event bulletins.
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            No active announcements for students.
          </div>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {a.audience}
                </span>
                <span className="text-[11px] text-slate-400">
                  {new Date(a.publishDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{a.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{a.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
