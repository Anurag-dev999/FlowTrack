'use client';

import dynamic from 'next/dynamic';

const Loading = () => <div className="h-[300px] w-full bg-muted/10 animate-pulse rounded-lg" />;

export const RevenueChart = dynamic(() => import('./charts/revenue-chart'), {
    ssr: false,
    loading: Loading,
});

export const TaskStatusChart = dynamic(() => import('./charts/task-status-chart'), {
    ssr: false,
    loading: Loading,
});

export const WeeklyActivityChart = dynamic(() => import('./charts/weekly-activity-chart'), {
    ssr: false,
    loading: Loading,
});

export const CompletionRateChart = dynamic(() => import('./charts/completion-rate-chart'), {
    ssr: false,
    loading: Loading,
});
