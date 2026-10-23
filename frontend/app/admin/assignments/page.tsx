'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Briefcase, Plus, Trash2, X, Users, BookOpen, Layers } from 'lucide-react';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    teacherId: '',
    subjectId: '',
    classId: '',
    sectionId: '',
    academicYearId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [asgRes, tchRes, subRes, clsRes, yrRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/teachers'),
        api.get('/subjects'),
        api.get('/classes'),
        api.get('/academic-years'),
      ]);
      setAssignments(asgRes.data || []);
      setTeachers(tchRes.data || []);
      setSubjects(subRes.data || []);
      setClasses(clsRes.data || []);
      setAcademicYears(yrRes.data || []);

      if (tchRes.data?.[0]) setFormData(prev => ({ ...prev, teacherId: tchRes.data[0].id }));
      if (subRes.data?.[0]) setFormData(prev => ({ ...prev, subjectId: subRes.data[0].id }));
      if (clsRes.data?.[0]) setFormData(prev => ({ ...prev, classId: clsRes.data[0].id }));
      if (yrRes.data?.[0]) setFormData(prev => ({ ...prev, academicYearId: yrRes.data[0].id }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/assignments', formData);
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign teacher');
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this teacher assignment?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove assignment');
    }
  };

  const selectedClassObj = classes.find(c => c.id === formData.classId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Teacher Subject & Class Assignments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Determine authorization boundaries: which teachers teach which subjects and classes.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Create New Assignment
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Assigned Faculty</th>
                <th className="px-4 py-3.5">Subject</th>
                <th className="px-4 py-3.5">Class & Section</th>
                <th className="px-4 py-3.5">Session</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">Loading assignments...</td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">No assignments created yet.</td>
                </tr>
              ) : (
                assignments.map((asg) => (
                  <tr key={asg.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center">
                          {asg.teacher.firstName[0]}
                          {asg.teacher.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {asg.teacher.firstName} {asg.teacher.lastName}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">{asg.teacher.employeeNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900">{asg.subject.name}</span>
                      <span className="ml-1 text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">
                        {asg.subject.code}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-800">{asg.class.name}</span>
                      {asg.section && (
                        <span className="ml-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                          Sec {asg.section.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {asg.academicYear.name}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteAssignment(asg.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove Assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Create Teacher Assignment
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Teacher *</label>
                <select
                  required
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.employeeNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Subject *</label>
                <select
                  required
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class *</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value, sectionId: '' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section</label>
                  <select
                    value={formData.sectionId}
                    onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">All / General</option>
                    {selectedClassObj?.sections?.map((sec: any) => (
                      <option key={sec.id} value={sec.id}>Section {sec.name}</option>
                    ))}
                  </select>
                </div>
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
                  Assign Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
