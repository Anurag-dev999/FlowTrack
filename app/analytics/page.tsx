"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { RevenueChart, WeeklyActivityChart, CompletionRateChart } from '@/components/dynamic-charts';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { GlassPanel } from '@/components/ui/glass-panel';
import { MetricCard } from '@/components/ui/metric-card';
import { TrendingUp, Users, CheckCircle2, DollarSign } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState({
    totalRevenue: '$0',
    activeUsers: '0',
    completedTasks: '0',
    efficiency: '0%',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const [revRes, usersRes, tasksRes] = await Promise.all([
        supabaseClient.from('revenue').select('amount'),
        supabaseClient.from('team_members').select('id'),
        supabaseClient.from('tasks').select('id').eq('status', 'Completed'),
      ]);

      const totalRevenue = revRes.data?.reduce((sum, item) => sum + item.amount, 0) || 0;
      
      setMetrics({
        totalRevenue: `$${totalRevenue.toLocaleString()}`,
        activeUsers: (usersRes.data?.length || 0).toString(),
        completedTasks: (tasksRes.data?.length || 0).toString(),
        efficiency: '84%', 
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader 
          title="Performance Analytics" 
          description="In-depth insights into your organization's productivity and revenue" 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={metrics.totalRevenue}
            icon={DollarSign}
            trend={{ value: '12%', isUp: true }}
            color="green"
          />
          <MetricCard
            title="Active Users"
            value={metrics.activeUsers}
            icon={Users}
            trend={{ value: '4%', isUp: true }}
            color="blue"
          />
          <MetricCard
            title="Completed Tasks"
            value={metrics.completedTasks}
            icon={CheckCircle2}
            trend={{ value: '18%', isUp: true }}
            color="purple"
          />
          <MetricCard
            title="Avg Efficiency"
            value={metrics.efficiency}
            icon={TrendingUp}
            trend={{ value: '2%', isUp: true }}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassPanel className="p-6">
            <h3 className="text-lg font-semibold mb-6">Revenue Growth</h3>
            <div className="h-[300px]">
              <RevenueChart />
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <h3 className="text-lg font-semibold mb-6">Weekly Activity</h3>
            <div className="h-[300px]">
              <WeeklyActivityChart />
            </div>
          </GlassPanel>

          <GlassPanel className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-6">Task Completion Rate</h3>
            <div className="h-[300px]">
              <CompletionRateChart />
            </div>
          </GlassPanel>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
