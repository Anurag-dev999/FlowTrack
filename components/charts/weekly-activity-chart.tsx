'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface WeeklyActivityChartProps {
    data: any[];
}

export default function WeeklyActivityChart({ data }: WeeklyActivityChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                    }}
                />
                <Legend />
                <Bar dataKey="tasks" fill="#3b82f6" />
                <Bar dataKey="activities" fill="#10b981" />
            </BarChart>
        </ResponsiveContainer>
    );
}
