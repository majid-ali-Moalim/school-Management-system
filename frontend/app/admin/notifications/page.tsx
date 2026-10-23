'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Bell, CheckCheck, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">System Notifications</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Alerts on examinations, attendance updates, and operational events.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden text-xs">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading alerts...</div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No notifications in your inbox.</div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`p-4 flex items-start justify-between gap-4 ${!n.isRead ? 'bg-indigo-50/40' : ''}`}>
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-sm">{n.title}</p>
                <p className="text-slate-600 leading-relaxed">{n.message}</p>
                {n.link && (
                  <Link href={n.link} className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-semibold text-[11px] mt-1">
                    Go to item <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                {new Date(n.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
