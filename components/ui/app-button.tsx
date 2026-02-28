import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import React, { ButtonHTMLAttributes } from 'react';

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'premium' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

export const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
    ({ children, className, variant = 'premium', size = 'md', loading, disabled, ...props }, ref) => {

        const variants = {
            premium: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
            outline: 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground',
            ghost: 'hover:bg-accent hover:text-accent-foreground',
            danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm'
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-xs',
            md: 'px-5 py-2.5 text-sm',
            lg: 'px-8 py-3.5 text-base font-semibold'
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={disabled || loading}
                {...props}
            >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {children}
            </button>
        );
    }
);

AppButton.displayName = 'AppButton';
