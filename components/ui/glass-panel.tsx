import { cn } from '@/lib/utils';

interface GlassPanelProps {
    children: React.ReactNode;
    className?: string;
}

export function GlassPanel({ children, className }: GlassPanelProps) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-md shadow-sm transition-all duration-300",
            className
        )}>
            {children}
        </div>
    );
}
