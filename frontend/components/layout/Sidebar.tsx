'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Calendar,
  Layers,
  BookOpen,
  ClipboardCheck,
  Award,
  Clock,
  Bell,
  Megaphone,
  BarChart3,
  Settings,
  ShieldAlert,
  UserCheck,
  FileSpreadsheet,
  FileText,
  Briefcase,
  LogOut,
  ChevronRight,
  School,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
}

interface SidebarGroup {
  title?: string;
  items: SidebarItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  // Clean 3-Dashboard Architecture matching User Specification
  const adminGroups: SidebarGroup[] = [
    {
      items: [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'PEOPLE',
      items: [
        { name: 'Students', href: '/admin/students', icon: GraduationCap },
        { name: 'Teachers', href: '/admin/teachers', icon: Users },
      ],
    },
    {
      title: 'ACADEMIC',
      items: [
        { name: 'Classes & Sections', href: '/admin/classes', icon: Layers },
        { name: 'Subjects', href: '/admin/subjects', icon: BookOpen },
        { name: 'Academic Years & Terms', href: '/admin/academic-years', icon: Calendar },
        { name: 'Teacher Assignments', href: '/admin/assignments', icon: Briefcase },
      ],
    },
    {
      title: 'ATTENDANCE',
      items: [
        { name: 'Attendance Register', href: '/admin/attendance', icon: ClipboardCheck },
      ],
    },
    {
      title: 'EXAMS & RESULTS',
      items: [
        { name: 'Exams & Subjects', href: '/admin/exams', icon: FileSpreadsheet },
        { name: 'Scores & Results', href: '/admin/results', icon: Award },
        { name: 'Report Cards', href: '/admin/report-cards', icon: FileText },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Timetable', href: '/admin/timetable', icon: Clock },
        { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
        { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'SYSTEM & SETTINGS',
      items: [
        { name: 'Settings', href: '/admin/settings', icon: Settings },
        { name: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldAlert },
        { name: 'User Accounts', href: '/admin/users', icon: UserCheck },
      ],
    },
  ];

  const teacherGroups: SidebarGroup[] = [
    {
      items: [
        { name: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'MY TEACHING',
      items: [
        { name: 'My Students', href: '/teacher/students', icon: GraduationCap },
        { name: 'My Classes', href: '/teacher/classes', icon: Layers },
        { name: 'My Subjects', href: '/teacher/subjects', icon: BookOpen },
      ],
    },
    {
      title: 'ATTENDANCE',
      items: [
        { name: 'Take Attendance', href: '/teacher/attendance', icon: ClipboardCheck },
      ],
    },
    {
      title: 'EXAMS & SCORES',
      items: [
        { name: 'My Exams', href: '/teacher/exams', icon: FileSpreadsheet },
        { name: 'Enter Scores', href: '/teacher/enter-scores', icon: Award },
        { name: 'Exam Results', href: '/teacher/results', icon: FileText },
      ],
    },
    {
      title: 'SCHEDULE & COMM.',
      items: [
        { name: 'My Timetable', href: '/teacher/timetable', icon: Clock },
        { name: 'Announcements', href: '/teacher/announcements', icon: Megaphone },
        { name: 'My Profile', href: '/teacher/profile', icon: Users },
      ],
    },
  ];

  const studentGroups: SidebarGroup[] = [
    {
      items: [
        { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'MY ACADEMICS',
      items: [
        { name: 'My Profile', href: '/student/profile', icon: Users },
        { name: 'My Subjects', href: '/student/subjects', icon: BookOpen },
        { name: 'My Attendance', href: '/student/attendance', icon: ClipboardCheck },
        { name: 'My Results', href: '/student/results', icon: Award },
        { name: 'Report Card', href: '/student/report-card', icon: FileText },
        { name: 'My Timetable', href: '/student/timetable', icon: Clock },
        { name: 'Announcements', href: '/student/announcements', icon: Megaphone },
      ],
    },
  ];

  const groups =
    user.role === 'ADMIN'
      ? adminGroups
      : user.role === 'TEACHER'
      ? teacherGroups
      : studentGroups;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 bg-slate-950/40">
        <div className="w-9 h-9 rounded-lg bg-[#1877F2] flex items-center justify-center text-white shadow-md shadow-[#1877F2]/30">
          <School className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white tracking-tight leading-none">
            School Management
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#5BA5FB]">
              {user.role}
            </span>
            <span className="text-[10px] text-slate-500">•</span>
            <span className="text-[10px] text-slate-400 font-medium truncate">
              {user.role === 'ADMIN'
                ? 'System Portal'
                : user.role === 'TEACHER'
                ? 'Faculty Portal'
                : 'Student Portal'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {groups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {group.title && (
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                {group.title}
              </h3>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors group ${
                    isActive
                      ? 'bg-[#1877F2] text-white shadow-sm shadow-[#1877F2]/25'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span className="truncate flex-1">{item.name}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-[#1877F2]/20 text-[#5BA5FB] flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-[#1877F2]/30">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
