'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Printer, Download, School, CheckCircle, GraduationCap, Search, FileText } from 'lucide-react';

export default function ReportCardsPage() {
  const searchParams = useSearchParams();
  const initialStudentId = searchParams.get('studentId') || '';

  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId);
  const [reportCard, setReportCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadStudents() {
      try {
        const res = await api.get('/students?limit=100');
        setStudents(res.data || []);
        if (!initialStudentId && res.data?.[0]) {
          setSelectedStudentId(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadStudents();
  }, [initialStudentId]);

  useEffect(() => {
    async function loadReport() {
      if (!selectedStudentId) return;
      try {
        setLoading(true);
        const res = await api.get(`/results/report-card/${selectedStudentId}`);
        setReportCard(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [selectedStudentId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Selector and Actions Bar (Hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-indigo-600" />
          <div>
            <h1 className="text-base font-bold text-slate-900">Official Report Card Generator</h1>
            <p className="text-xs text-slate-500">Generate, review, and print official institutional transcripts.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} ({s.studentNumber})
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Report Card
          </button>
        </div>
      </div>

      {/* Official Printable Report Card Document (Section 30) */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          Generating official report card...
        </div>
      ) : !reportCard ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          Select a student to generate their academic report card.
        </div>
      ) : (
        <div className="report-card-container bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-lg max-w-4xl mx-auto space-y-8">
          {/* Institution Letterhead */}
          <div className="flex items-center justify-between pb-6 border-b-2 border-slate-900">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-900 text-white flex items-center justify-center font-bold text-2xl shadow-md">
                <School className="w-9 h-9" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                  {reportCard.school.name}
                </h2>
                <p className="text-xs text-slate-500">{reportCard.school.address}</p>
                <p className="text-xs text-slate-500">
                  Tel: {reportCard.school.phone} • Email: {reportCard.school.email}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-900 text-xs font-black uppercase tracking-wider rounded-md border border-indigo-200">
                Official Transcript
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Date: {new Date(reportCard.issuedDate).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Student Profile Block */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Student Name</span>
              <strong className="text-sm text-slate-900">{reportCard.student.name}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Student ID</span>
              <span className="font-mono font-bold text-indigo-700">{reportCard.student.studentNumber}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Academic Class</span>
              <span className="font-semibold text-slate-900">{reportCard.academic.className} ({reportCard.academic.sectionName})</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Academic Session</span>
              <span className="font-semibold text-slate-900">{reportCard.academic.academicYear}</span>
            </div>
          </div>

          {/* Academic Results Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 border-r border-slate-800">Subject Code</th>
                  <th className="p-3 border-r border-slate-800">Subject Name</th>
                  <th className="p-3 border-r border-slate-800 text-right">Max Marks</th>
                  <th className="p-3 border-r border-slate-800 text-right">Passing</th>
                  <th className="p-3 border-r border-slate-800 text-right">Score</th>
                  <th className="p-3 border-r border-slate-800 text-center">Grade</th>
                  <th className="p-3 text-center">GPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {reportCard.performance.results?.map((res: any, idx: number) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="p-3 font-mono font-semibold text-indigo-700 border-r border-slate-200">{res.subjectCode}</td>
                    <td className="p-3 font-medium border-r border-slate-200">{res.subjectName}</td>
                    <td className="p-3 text-right border-r border-slate-200">{res.maxScore}</td>
                    <td className="p-3 text-right border-r border-slate-200 text-slate-500">{res.passScore}</td>
                    <td className="p-3 text-right font-bold text-slate-900 border-r border-slate-200">{res.score}</td>
                    <td className="p-3 text-center font-bold border-r border-slate-200">{res.grade}</td>
                    <td className="p-3 text-center font-semibold">{res.gradePoint.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Academic Performance Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-700 block">Overall Average</span>
              <strong className="text-lg font-black text-indigo-950">{reportCard.performance.averageScore}%</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-700 block">Cumulative GPA</span>
              <strong className="text-lg font-black text-indigo-950">{reportCard.performance.gpa} / 4.0</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-700 block">Attendance Rate</span>
              <strong className="text-lg font-black text-indigo-950">{reportCard.attendance.percentage}%</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-700 block">Board Result</span>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded font-black text-xs bg-emerald-600 text-white uppercase">
                {reportCard.performance.overallStatus}
              </span>
            </div>
          </div>

          {/* Signatures & Seal Area (Section 30) */}
          <div className="pt-12 grid grid-cols-3 gap-8 text-center text-xs text-slate-600 border-t border-slate-200 mt-12">
            <div>
              <div className="border-b border-slate-400 mb-2 h-10 flex items-end justify-center italic text-slate-400">
                Teacher Ahmed Hassan
              </div>
              <span className="font-semibold text-slate-800">Class Instructor</span>
            </div>
            <div>
              <div className="border-b border-slate-400 mb-2 h-10 flex items-end justify-center font-serif text-slate-400 italic">
                Dr. E. Vance, Principal
              </div>
              <span className="font-semibold text-slate-800">Principal / Headmaster</span>
            </div>
            <div>
              <div className="border-b border-slate-400 mb-2 h-10 flex items-end justify-center text-slate-300">
                [ Institutional Seal ]
              </div>
              <span className="font-semibold text-slate-800">Registrar Seal</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
