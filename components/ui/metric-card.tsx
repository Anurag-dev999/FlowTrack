import { LucideIcon } from 'lucide-react';
import { GlassPanel } from './glass-panel';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isUp: boolean;
  };
  className?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  href?: string;
}

import Link from 'next/link';

export function MetricCard({ title, value, icon: Icon, trend, className, color = 'blue', href }: MetricCardProps) {
  const colorStyles = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  const content = (
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>

        {trend && (
          <div className={`flex items-center text-xs font-semibold ${trend.isUp ? 'text-green-500' : 'text-red-500'}`}>
            <span className="mr-1">{trend.isUp ? '↑' : '↓'}</span>
            {trend.value}
            <span className="ml-1 text-muted-foreground font-normal italic">vs last month</span>
          </div>
        )}
      </div>
      <div className={cn("p-3 rounded-xl", colorStyles[color])}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );

  return (
    <GlassPanel className={cn("p-6 transition-all duration-300", href && "hover:translate-y-[-4px] hover:shadow-lg cursor-pointer", className)}>
      {href ? (
        <Link href={href}>
          {content}
        </Link>
      ) : (
        content
      )}
    </GlassPanel>
  );
}
