'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Clock, Plus, Trash2, Calendar, X, Filter } from 'lucide-react';

export default function AdminTimetablePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    classId: '',
    sectionId: '',
    subjectId: '',
    teacherId: '',
    day: 'MONDAY',
    startTime: '08:00',
    endTime: '09:00',
    room: 'Block B - 201',
    academicYearId: '',
  });

  const fetchInit = async () => {
    try {
      setLoading(true);
      const [clsRes, tchRes, subRes, yrRes] = await Promise.all([
        api.get('/classes'),
        api.get('/teachers'),
        api.get('/subjects'),
        api.get('/academic-years'),
      ]);
      setClasses(clsRes.data || []);
      setTeachers(tchRes.data || []);
      setSubjects(subRes.data || []);
      setAcademicYears(yrRes.data || []);

      if (clsRes.data?.[0]) {
        setSelectedClassId(clsRes.data[0].id);
        setForm(prev => ({ ...prev, classId: clsRes.data[0].id }));
      }
      if (tchRes.data?.[0]) setForm(prev => ({ ...prev, teacherId: tchRes.data[0].id }));
      if (subRes.data?.[0]) setForm(prev => ({ ...prev, subjectId: subRes.data[0].id }));
      if (yrRes.data?.[0]) setForm(prev => ({ ...prev, academicYearId: yrRes.data[0].id }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    if (!selectedClassId) return;
    try {
      const res = await api.get(`/timetable?classId=${selectedClassId}`);
      setTimetable(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInit();
  }, []);

  useEffect(() => {
    if (selectedClassId) fetchSchedule();
  }, [selectedClassId]);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/timetable', form);
      setShowModal(false);
      fetchSchedule();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule class slot');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this timetable slot?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      fetchSchedule();
    } catch (err: any) {
      alert(err.message || 'Failed to delete slot');
    }
  };

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Class Timetables & Schedules
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Build and manage weekly classroom schedules, instructor allocations, and lesson periods.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Timetable Period
        </button>
      </div>

      {/* Class Picker */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-600">Viewing Schedule For:</span>
        <select
          value={selectedClassId}
          onChange={(e) => {
            setSelectedClassId(e.target.value);
            setForm(prev => ({ ...prev, classId: e.target.value }));
          }}
          className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Timetable Grid by Day (Section 31) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {days.map((day) => {
          const slots = timetable.filter(t => t.day === day);
          return (
            <div key={day} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider">{day}</span>
                <span className="text-[10px] text-slate-400 font-medium">{slots.length} periods</span>
              </div>

              <div className="p-4 flex-1 divide-y divide-slate-100">
                {slots.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center italic">No lessons scheduled</p>
                ) : (
                  slots.map((s) => (
                    <div key={s.id} className="py-2.5 flex items-start justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-indigo-600 text-[11px] block">
                          {s.startTime} - {s.endTime}
                        </span>
                        <strong className="text-slate-900 text-sm block mt-0.5">{s.subject?.name}</strong>
                        <p className="text-slate-500 text-[11px]">
                          {s.teacher?.firstName} {s.teacher?.lastName} • {s.room || 'General'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="Delete slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Add Timetable Slot</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={form.day}
                    onChange={(e) => setForm({ ...form, day: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {days.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class</label>
                  <select
                    value={form.classId}
                    onChange={(e) => setForm({ ...form, classId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                <select
                  value={form.subjectId}
                  onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teacher</label>
                <select
                  value={form.teacherId}
                  onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.employeeNumber})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Room</label>
                <input
                  type="text"
                  placeholder="e.g. Block B - 201"
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
                >
                  Save Timetable Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
