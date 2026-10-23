'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Settings, Save, School, Award, CheckCircle2, Loader2 } from 'lucide-react';

export default function SettingsAdminPage() {
  const [settings, setSettings] = useState<any>({
    schoolName: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  });

  const [scales, setScales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/settings');
        if (res.data?.settings) {
          setSettings(res.data.settings);
        }
        if (res.data?.gradingScales) {
          setScales(res.data.gradingScales);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.patch('/settings', settings);
      await api.post('/settings/grading-scales', { scales });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const updateScaleRow = (index: number, field: string, val: any) => {
    setScales(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Institutional Settings & Grading System
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure school profile credentials, contact info, and dynamic GPA grading thresholds.
          </p>
        </div>
        {savedSuccess && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" /> Settings Saved!
          </span>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* School Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-indigo-600">
            <School className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              School Profile Information (Section 49)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">School Name *</label>
              <input
                type="text"
                required
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Telephone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Campus Physical Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Configurable Grading System (Section 28) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-indigo-600">
            <Award className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Configurable Grading Scale & Grade Points (Section 28)
            </h2>
          </div>

          <p className="text-xs text-slate-500">
            Admins can calibrate score ranges without code changes. Score entries dynamically map to these grades.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="p-2.5">Letter Grade</th>
                  <th className="p-2.5">Min Mark</th>
                  <th className="p-2.5">Max Mark</th>
                  <th className="p-2.5">GPA Point</th>
                  <th className="p-2.5">Classification Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {scales.map((sc, idx) => (
                  <tr key={idx} className="bg-white">
                    <td className="p-2">
                      <input
                        type="text"
                        value={sc.grade}
                        onChange={(e) => updateScaleRow(idx, 'grade', e.target.value)}
                        className="w-16 px-2 py-1 font-bold text-center bg-slate-50 border border-slate-200 rounded-lg text-indigo-700"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={sc.minScore}
                        onChange={(e) => updateScaleRow(idx, 'minScore', e.target.value)}
                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={sc.maxScore}
                        onChange={(e) => updateScaleRow(idx, 'maxScore', e.target.value)}
                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.1"
                        value={sc.gradePoint}
                        onChange={(e) => updateScaleRow(idx, 'gradePoint', e.target.value)}
                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={sc.remarks || ''}
                        onChange={(e) => updateScaleRow(idx, 'remarks', e.target.value)}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save School Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
