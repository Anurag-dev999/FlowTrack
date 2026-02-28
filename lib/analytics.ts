/**
 * Pure-function analytics engine.
 * All metrics are computed from Task[] — no database calls.
 * Tasks are the SINGLE source of truth for all analytics.
 */
import { Task, KPIMetrics } from '@/lib/types';

// ─── Core Counters ───────────────────────────────────────

export function totalTasks(tasks: Task[]): number {
    return tasks.length;
}

export function completedTasks(tasks: Task[]): number {
    return tasks.filter((t) => t.status === 'completed').length;
}

export function pendingTasks(tasks: Task[]): number {
    return tasks.filter((t) => t.status !== 'completed').length;
}

// ─── Rates & Revenue ─────────────────────────────────────

export function completionRate(tasks: Task[]): number {
    if (tasks.length === 0) return 0;
    return Math.round((completedTasks(tasks) / tasks.length) * 100);
}

/**
 * Productivity Revenue = SUM(estimated_value) of completed tasks.
 * This is the "revenue" concept — no money, just productivity value.
 */
export function productivityRevenue(tasks: Task[]): number {
    return tasks
        .filter((t) => t.status === 'completed')
        .reduce((sum, t) => sum + (t.estimated_value || 10), 0);
}

// ─── Growth ──────────────────────────────────────────────

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Weekly Growth = (completed_this_week - completed_last_week) / max(last_week, 1) * 100
 */
export function weeklyGrowth(tasks: Task[]): number {
    const now = new Date();
    const thisWeekStart = getWeekStart(now);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const completedThisWeek = tasks.filter((t) => {
        if (t.status !== 'completed') return false;
        const completedDate = t.completed_at ? new Date(t.completed_at) : null;
        if (!completedDate) return false;
        return completedDate >= thisWeekStart;
    }).length;

    const completedLastWeek = tasks.filter((t) => {
        if (t.status !== 'completed') return false;
        const completedDate = t.completed_at ? new Date(t.completed_at) : null;
        if (!completedDate) return false;
        return completedDate >= lastWeekStart && completedDate < thisWeekStart;
    }).length;

    const denominator = Math.max(completedLastWeek, 1);
    return Math.round(((completedThisWeek - completedLastWeek) / denominator) * 100);
}

// ─── Chart Data Generators ───────────────────────────────

export interface DailyCount {
    date: string;
    count: number;
}

export interface WeeklyData {
    week: string;
    created: number;
    completed: number;
}

export interface WeeklyValue {
    week: string;
    value: number;
    rate: number;
}

function formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
}

function formatWeekLabel(d: Date): string {
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    return `${month} ${day}`;
}

/**
 * Tasks completed per day (last 14 days)
 */
export function tasksCompletedPerDay(tasks: Task[]): DailyCount[] {
    const days = 14;
    const result: DailyCount[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = formatDate(d);

        const count = tasks.filter((t) => {
            if (t.status !== 'completed' || !t.completed_at) return false;
            return formatDate(new Date(t.completed_at)) === dateStr;
        }).length;

        result.push({ date: dateStr, count });
    }

    return result;
}

/**
 * Tasks created and completed per week (last 8 weeks)
 */
export function tasksPerWeek(tasks: Task[]): WeeklyData[] {
    const weeks = 8;
    const result: WeeklyData[] = [];
    const now = new Date();
    const currentWeekStart = getWeekStart(now);

    for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = new Date(currentWeekStart);
        weekStart.setDate(weekStart.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const created = tasks.filter((t) => {
            const d = new Date(t.created_at);
            return d >= weekStart && d < weekEnd;
        }).length;

        const completed = tasks.filter((t) => {
            if (t.status !== 'completed' || !t.completed_at) return false;
            const d = new Date(t.completed_at);
            return d >= weekStart && d < weekEnd;
        }).length;

        result.push({
            week: formatWeekLabel(weekStart),
            created,
            completed,
        });
    }

    return result;
}

/**
 * Productivity value trend and completion rate per week (last 8 weeks)
 */
export function productivityValueTrend(tasks: Task[]): WeeklyValue[] {
    const weeks = 8;
    const result: WeeklyValue[] = [];
    const now = new Date();
    const currentWeekStart = getWeekStart(now);

    for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = new Date(currentWeekStart);
        weekStart.setDate(weekStart.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekCompleted = tasks.filter((t) => {
            if (t.status !== 'completed' || !t.completed_at) return false;
            const d = new Date(t.completed_at);
            return d >= weekStart && d < weekEnd;
        });

        const weekTotal = tasks.filter((t) => {
            const d = new Date(t.created_at);
            return d < weekEnd;
        }).length;

        const weekCompletedTotal = tasks.filter((t) => {
            if (t.status !== 'completed' || !t.completed_at) return false;
            const d = new Date(t.completed_at);
            return d < weekEnd;
        }).length;

        const value = weekCompleted.reduce((sum, t) => sum + (t.estimated_value || 10), 0);
        const rate = weekTotal > 0 ? Math.round((weekCompletedTotal / weekTotal) * 100) : 0;

        result.push({
            week: formatWeekLabel(weekStart),
            value,
            rate,
        });
    }

    return result;
}

// ─── Aggregate Dashboard Metrics ─────────────────────────

export function computeDashboardMetrics(tasks: Task[]): KPIMetrics {
    return {
        totalTasks: totalTasks(tasks),
        completedTasks: completedTasks(tasks),
        pendingTasks: pendingTasks(tasks),
        completionRate: completionRate(tasks),
        productivityValue: productivityRevenue(tasks),
        weeklyGrowth: weeklyGrowth(tasks),
    };
}
