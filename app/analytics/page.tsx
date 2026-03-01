"use client";

import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { RevenueChart, WeeklyActivityChart, CompletionRateChart } from '@/components/dynamic-charts';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { GlassPanel } from '@/components/ui/glass-panel';
import { MetricCard } from '@/components/ui/metric-card';
import { TrendingUp, ListTodo, CheckCircle2, Zap } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { Task } from '@/lib/types';
import {
  computeDashboardMetrics,
  productivityValueTrend,
  tasksPerWeek,
} from '@/lib/analytics';

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('tasks')
        .select('id,title,description,status,priority,assignee,due_date,estimated_value,completed_at,deleted_at,created_at,updated_at');

      if (!error && data) {
        setTasks(
          data.map((t: any) => ({
            ...t,
            estimated_value: t.estimated_value ?? 10,
          }))
        );
      }
    } catch {
      // empty state will show
    } finally {
      setLoading(false);
    }
  };

  // Memoize all analytics
  const metrics = useMemo(() => computeDashboardMetrics(tasks), [tasks]);
  const valueTrend = useMemo(() => productivityValueTrend(tasks), [tasks]);
  const weeklyData = useMemo(() => tasksPerWeek(tasks), [tasks]);
  // Extract completion rate from valueTrend for the rate chart
  const completionRateData = useMemo(
    () => valueTrend.map((w) => ({ week: w.week, rate: w.rate })),
    [valueTrend]
  );

  const hasTasks = tasks.length > 0;
  const growth = metrics.weeklyGrowth;
  const growthTrend =
    growth !== 0
      ? { value: `${Math.abs(growth)}%`, isUp: growth > 0 }
      : undefined;

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Performance Analytics"
          description="In-depth insights into your team's productivity, derived from task data"
        />

        {!hasTasks && !loading ? (
          <GlassPanel className="p-12 text-center">
            <p className="text-muted-foreground">
              No task data yet. Create and complete tasks to see analytics here.
            </p>
          </GlassPanel>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Productivity Value"
                value={metrics.productivityValue.toString()}
                icon={Zap}
                trend={growthTrend}
                color="green"
              />
              <MetricCard
                title="Total Tasks"
                value={metrics.totalTasks.toString()}
                icon={ListTodo}
                color="blue"
              />
              <MetricCard
                title="Completed Tasks"
                value={metrics.completedTasks.toString()}
                icon={CheckCircle2}
                color="purple"
              />
              <MetricCard
                title="Completion Rate"
                value={`${metrics.completionRate}%`}
                icon={TrendingUp}
                color="orange"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold mb-6">Productivity Value Trend</h3>
                <div className="h-[300px]">
                  {valueTrend.some((w) => w.value > 0) ? (
                    <RevenueChart data={valueTrend} dataKey="value" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                      Complete tasks to see the productivity trend
                    </div>
                  )}
                </div>
              </GlassPanel>

              <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold mb-6">Weekly Activity</h3>
                <div className="h-[300px]">
                  {weeklyData.some((w) => w.created > 0 || w.completed > 0) ? (
                    <WeeklyActivityChart data={weeklyData} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                      Start creating tasks to see weekly activity
                    </div>
                  )}
                </div>
              </GlassPanel>

              <GlassPanel className="p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-6">Task Completion Rate</h3>
                <div className="h-[300px]">
                  {completionRateData.some((w) => w.rate > 0) ? (
                    <CompletionRateChart data={completionRateData} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                      Complete tasks to track your completion rate over time
                    </div>
                  )}
                </div>
              </GlassPanel>
            </div>
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
