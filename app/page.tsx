"use client";

import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Clock, CheckCircle2, Users, ListTodo, TrendingUp, Zap, Plus } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { Task } from '@/lib/types';
import { GlassPanel } from '@/components/ui/glass-panel';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { AppButton } from '@/components/ui/app-button';
import { WeeklyActivityChart } from '@/components/dynamic-charts';
import {
  computeDashboardMetrics,
  tasksPerWeek,
} from '@/lib/analytics';
import Link from 'next/link';

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamSize, setTeamSize] = useState(0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, teamRes, activityRes] = await Promise.all([
        supabaseClient
          .from('tasks')
          .select('id,title,description,status,priority,assignee,due_date,estimated_value,completed_at,created_at,updated_at'),
        supabaseClient.from('team_members').select('id'),
        supabaseClient
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      setTasks(
        (tasksRes.data || []).map((t: any) => ({
          ...t,
          estimated_value: t.estimated_value ?? 10,
        }))
      );
      setTeamSize(teamRes.data?.length || 0);
      setRecentActivities(activityRes.data || []);
    } catch {
      // silently handle — empty state will show
    } finally {
      setLoading(false);
    }
  };

  // Memoize analytics to avoid recomputation on every render
  const metrics = useMemo(() => computeDashboardMetrics(tasks), [tasks]);
  const weeklyChartData = useMemo(() => tasksPerWeek(tasks), [tasks]);

  const hasTasks = tasks.length > 0;
  const growth = metrics.weeklyGrowth;
  const growthTrend =
    growth !== 0
      ? { value: `${Math.abs(growth)}%`, isUp: growth > 0 }
      : undefined;

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex justify-center py-32">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Welcome to FlowTrack"
          description="Overview of your workspace performance and team activity"
        />

        {/* ─── Empty state / Onboarding ─── */}
        {!hasTasks ? (
          <GlassPanel className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <ListTodo className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Get Started with FlowTrack</h2>
              <p className="text-muted-foreground">
                Create your first task to start tracking productivity. Analytics will unlock progressively as you add activity.
              </p>
              <Link href="/tasks">
                <AppButton className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Task
                </AppButton>
              </Link>
            </div>
          </GlassPanel>
        ) : (
          <>
            {/* ─── Stats Grid ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Productivity Value"
                value={metrics.productivityValue.toString()}
                icon={Zap}
                trend={growthTrend}
                color="green"
              />
              <MetricCard
                title="Pending Tasks"
                value={metrics.pendingTasks.toString()}
                icon={Clock}
                color="orange"
                href="/tasks"
              />
              <MetricCard
                title="Completed Tasks"
                value={metrics.completedTasks.toString()}
                icon={CheckCircle2}
                color="green"
                href="/tasks"
              />
              <MetricCard
                title="Total Team"
                value={teamSize.toString()}
                icon={Users}
                color="purple"
                href="/team"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Task Activity Chart */}
              <GlassPanel className="lg:col-span-2 p-6">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-semibold">Task Activity</h3>
                  {growth !== 0 && (
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold ${growth > 0
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                        }`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {growth > 0 ? '+' : ''}
                      {growth}% Weekly
                    </div>
                  )}
                </div>
                <div className="h-[300px]">
                  <WeeklyActivityChart data={weeklyChartData} />
                </div>
              </GlassPanel>

              {/* Activity Log */}
              <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
                <div className="space-y-6">
                  {recentActivities.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-8">
                      No recent logs recorded.
                    </p>
                  ) : (
                    recentActivities.map((activity) => (
                      <div key={activity.id} className="flex gap-4 group cursor-default">
                        <div className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0 shadow-glow shadow-primary/40 group-hover:scale-125 transition-transform" />
                        <div>
                          <p className="text-sm font-semibold text-foreground leading-tight">
                            {activity.action}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                            {activity.details}
                          </p>
                          <p className="text-[10px] text-muted-foreground/50 mt-1 font-bold italic">
                            {new Date(activity.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <AppButton variant="ghost" className="w-full mt-8" size="sm">
                  View Audit Log
                </AppButton>
              </GlassPanel>
            </div>
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
