"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { DollarSign, Clock, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, Users, ListTodo, TrendingUp } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { GlassPanel } from '@/components/ui/glass-panel';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { AppButton } from '@/components/ui/app-button';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    revenue: '$0',
    pendingTasks: '0',
    completedTasks: '0',
    teamSize: '0',
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [revRes, tasksRes, teamRes, activityRes] = await Promise.all([
        supabaseClient.from('revenue').select('amount'),
        supabaseClient.from('tasks').select('status'),
        supabaseClient.from('team_members').select('id'),
        supabaseClient.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const totalRevenue = revRes.data?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const pending = tasksRes.data?.filter(t => t.status !== 'Completed').length || 0;
      const completed = tasksRes.data?.filter(t => t.status === 'Completed').length || 0;

      setStats({
        revenue: `$${totalRevenue.toLocaleString()}`,
        pendingTasks: pending.toString(),
        completedTasks: completed.toString(),
        teamSize: (teamRes.data?.length || 0).toString(),
      });
      setRecentActivities(activityRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-primary">Demonstration Environment</h2>
            <p className="text-sm text-primary/70 mt-1">These are curated values for preview. You can reset to a clean state in settings.</p>
          </div>
          <Link href="/settings">
            <AppButton variant="outline" size="sm" className="bg-white/50 dark:bg-black/20">
              Manage Data
            </AppButton>
          </Link>
        </div>

        <PageHeader 
          title="Welcome to FlowTrack" 
          description="Overview of your workspace performance and team activity"
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={stats.revenue}
            icon={DollarSign}
            trend={{ value: '12%', isUp: true }}
            color="green"
          />
          <MetricCard
            title="Pending Tasks"
            value={stats.pendingTasks}
            icon={Clock}
            trend={{ value: '2', isUp: false }}
            color="orange"
          />
          <MetricCard
            title="Completed Tasks"
            value={stats.completedTasks}
            icon={CheckCircle2}
            trend={{ value: '8', isUp: true }}
            color="purple"
          />
          <MetricCard
            title="Team Size"
            value={stats.teamSize}
            icon={Users}
            color="blue"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Area placeholder or Recent Tasks */}
          <GlassPanel className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-semibold">Workspace Traffic</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 text-green-500 text-[10px] font-bold">
                  <TrendingUp className="w-3 h-3" />
                  +24% Growth
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full bg-muted/30 rounded-xl animate-pulse flex items-center justify-center border border-dashed border-border">
              <p className="text-muted-foreground text-sm font-medium italic">Traffic Analytics Layer</p>
            </div>
          </GlassPanel>

          {/* Activity Log */}
          <GlassPanel className="p-6">
            <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
            <div className="space-y-6">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">No recent logs recorded.</p>
              ) : (
                recentActivities.map((activity, i) => (
                  <div key={activity.id} className="flex gap-4 group cursor-default">
                    <div className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0 shadow-glow shadow-primary/40 group-hover:scale-125 transition-transform" />
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">{activity.action}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 font-medium">{activity.details}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1 font-bold italic">{new Date(activity.created_at).toLocaleTimeString()}</p>
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
      </PageContainer>
    </DashboardLayout>
  );
}
