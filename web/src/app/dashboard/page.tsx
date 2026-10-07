'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { apiClient } from '@/lib/api';
import { DashboardStats } from '@/types';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  Hourglass, 
  ListTodo,
  ArrowRight,
  Plus
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient<{ status: string; data: DashboardStats }>('/dashboard');
      setStats(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Projects',
      value: stats?.totalProjects ?? 0,
      icon: FolderKanban,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      iconBg: 'bg-indigo-600 text-white',
    },
    {
      title: 'Projects In Progress',
      value: stats?.projectsInProgress ?? 0,
      icon: Hourglass,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-600 text-white',
    },
    {
      title: 'Total Tasks',
      value: stats?.totalTasks ?? 0,
      icon: ListTodo,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      iconBg: 'bg-purple-600 text-white',
    },
    {
      title: 'Pending Tasks',
      value: stats?.pendingTasks ?? 0,
      icon: Clock,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBg: 'bg-amber-600 text-white',
    },
    {
      title: 'Completed Tasks',
      value: stats?.completedTasks ?? 0,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-600 text-white',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500">Overview of your workspace performance and active tasks</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Manage Projects
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {card.title}
                  </span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                {loading ? (
                  <div className="h-8 w-16 bg-slate-200 animate-pulse rounded"></div>
                ) : (
                  <div className="text-2xl font-bold text-slate-900">{card.value}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Projects Overview</h2>
              <Link
                href="/projects"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Track project milestones, update timelines, and keep teams aligned with clear statuses.
            </p>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Go to Projects
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Tasks Management</h2>
              <Link
                href="/tasks"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Organize day-to-day priorities, filter by deadline or progress, and resolve pending blockers.
            </p>
            <Link
              href="/tasks"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Go to Tasks
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
