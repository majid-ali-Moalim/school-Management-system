'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  GraduationCap,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Shield,
  Award,
  ClipboardCheck,
  Printer,
  User,
} from 'lucide-react';

export default function StudentDetailsPage() {
  const { id } = useParams();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/students/${id}`);
        setStudent(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading student profile...</div>;
  }

  if (!student) {
    return <div className="p-8 text-center text-red-500">Student not found.</div>;
  }

  const enrollment = student.enrollments?.[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/students"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {student.firstName} {student.middleName ? student.middleName + ' ' : ''}{student.lastName}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              ID: {student.studentNumber} • Admission: {student.admissionNumber}
            </p>
          </div>
        </div>

        <Link
          href={`/admin/report-cards?studentId=${student.id}`}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl transition-colors shadow-xs"
        >
          <Printer className="w-4 h-4" /> View Official Report Card
        </Link>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-md shadow-indigo-500/20 mb-3">
            {student.firstName[0]}
            {student.lastName[0]}
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
            {student.status}
          </span>
          <p className="text-xs font-bold text-slate-900 mt-2">
            {enrollment?.class?.name || 'Class Unassigned'}
          </p>
          <p className="text-[11px] text-slate-500">
            Section {enrollment?.section?.name || 'A'}
          </p>
        </div>

        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Contact & Personal Details
            </span>
            <div className="space-y-1.5 text-slate-700">
              <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /> {student.user?.email || student.email || 'N/A'}</p>
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> {student.phone || 'No direct phone'}</p>
              <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400" /> DOB: {new Date(student.dateOfBirth).toLocaleDateString()}</p>
              <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {student.address || 'Address unrecorded'}</p>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Guardian Details
            </span>
            <div className="space-y-1.5 text-slate-700">
              <p className="font-semibold text-slate-900">{student.guardianName} ({student.relationship || 'Guardian'})</p>
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> {student.guardianPhone}</p>
              {student.guardianEmail && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /> {student.guardianEmail}</p>}
              <p className="text-[11px] text-slate-500 mt-2">
                Enrolled: {new Date(student.admissionDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Exam Results & Attendance History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Results */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-indigo-600 mb-3">
            <Award className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Academic Examination Scores
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {student.results?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No examination scores recorded.</p>
            ) : (
              student.results?.map((r: any) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{r.examSubject?.subject?.name || 'Subject'}</p>
                    <p className="text-[10px] text-slate-400">{r.exam?.name} • Grade: {r.grade}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-indigo-600 text-sm">{r.score}</span>
                    <span className="text-slate-400 text-[10px]"> / 100</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Attendance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-indigo-600 mb-3">
            <ClipboardCheck className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Recent Attendance Log
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {student.attendances?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No attendance entries recorded.</p>
            ) : (
              student.attendances?.slice(0, 8).map((a: any) => (
                <div key={a.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-slate-700">
                      {new Date(a.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    {a.remarks && <p className="text-[10px] text-slate-400">{a.remarks}</p>}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.status === 'PRESENT'
                        ? 'bg-emerald-50 text-emerald-700'
                        : a.status === 'LATE'
                        ? 'bg-amber-50 text-amber-700'
                        : a.status === 'EXCUSED'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-red-50 text-red-700'
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
    </div>
  );
}
