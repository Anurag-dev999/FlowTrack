import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import React, { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface AppInputProps extends InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
    label?: string;
    icon?: LucideIcon;
    error?: string;
    multiline?: boolean;
}

export const AppInput = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, AppInputProps>(
    ({ label, icon: Icon, error, multiline, className, ...props }, ref) => {

        const inputStyles = cn(
            "w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground",
            Icon && "pl-11",
            error && "border-red-500 focus:ring-red-500/20",
            className
        );

        return (
            <div className="space-y-1.5 w-full">
                {label && <label className="text-xs font-semibold text-muted-foreground ml-1">{label}</label>}
                <div className="relative">
                    {Icon && (
                        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    )}
                    {multiline ? (
                        <textarea
                            ref={ref as React.Ref<HTMLTextAreaElement>}
                            className={cn(inputStyles, "min-h-[100px] resize-none")}
                            {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
                        />
                    ) : (
                        <input
                            ref={ref as React.Ref<HTMLInputElement>}
                            className={inputStyles}
                            {...(props as InputHTMLAttributes<HTMLInputElement>)}
                        />
                    )}
                </div>
                {error && <p className="text-[10px] font-medium text-red-500 ml-1">{error}</p>}
            </div>
        );
    }
);

AppInput.displayName = 'AppInput';
