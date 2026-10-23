'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { GraduationCap, Search, Phone, Mail, UserCheck } from 'lucide-react';

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const query = search ? `?search=${search}` : '';
      const res = await api.get(`/students${query}`);
      setStudents(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Assigned Students Roster
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Students enrolled in your assigned grade levels and section divisions.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
            placeholder="Search by student name or ID..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Student Details</th>
                <th className="px-4 py-3.5">Student ID</th>
                <th className="px-4 py-3.5">Class & Section</th>
                <th className="px-4 py-3.5">Guardian Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400">Loading student roster...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400">No students found in your assigned classes.</td>
                </tr>
              ) : (
                students.map((stu) => {
                  const enrollment = stu.enrollments?.[0];
                  return (
                    <tr key={stu.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                            {stu.firstName[0]}
                            {stu.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{stu.firstName} {stu.lastName}</p>
                            <p className="text-[11px] text-slate-400">{stu.email || 'student account'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-indigo-600 font-medium">
                        {stu.studentNumber}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-800">
                        {enrollment?.class?.name || 'Class'}
                        {enrollment?.section && ` (Sec ${enrollment.section.name})`}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-800">{stu.guardianName}</p>
                        <p className="text-[11px] text-slate-500">{stu.guardianPhone}</p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
