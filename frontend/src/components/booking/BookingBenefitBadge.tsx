import React from 'react';
import { cn } from '@/lib/utils';
import { StarFilledIcon, TimerIcon, Link2Icon, BackpackIcon } from '@radix-ui/react-icons';
import type { IconProps } from '@radix-ui/react-icons/dist/types';

export type BenefitType = 'breakfast' | 'upgrade' | 'credit' | 'wifi' | 'checkout' | 'lounge';

interface BookingBenefitBadgeProps {
    type: BenefitType;
    className?: string;
    variant?: 'default' | 'minimal' | 'card';
}

const BENEFIT_CONFIG: Record<BenefitType, { label: string; icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>; color: string }> = {

    breakfast: {
        label: 'Daily Breakfast for Two',
        icon: StarFilledIcon,
        color: 'text-secondary' // Gold
    },
    upgrade: {
        label: 'Room Upgrade',
        icon: StarFilledIcon,
        color: 'text-secondary' // Gold
    },
    credit: {
        label: 'Partner Hotel Credit',
        icon: StarFilledIcon,
        color: 'text-secondary' // Gold
    },
    wifi: {
        label: 'High-Speed WiFi',
        icon: Link2Icon,
        color: 'text-primary' // Green
    },
    checkout: {
        label: 'Early Check-in / Late Checkout',
        icon: TimerIcon,
        color: 'text-primary' // Green
    },
    lounge: {
        label: 'Executive Lounge Access',
        icon: BackpackIcon,
        color: 'text-secondary' // Gold
    }
};

export const BookingBenefitBadge: React.FC<BookingBenefitBadgeProps> = ({
    type,
    className,
    variant = 'default'
}) => {
    const config = BENEFIT_CONFIG[type];
    const Icon = config.icon;
    const iconColorClass: string = config.color;

    if (variant === 'minimal') {
        return (
            <div className={cn("flex items-center gap-1.5 text-xs font-medium text-muted-foreground", className)}>
                <Icon className={"h-3.5 w-3.5"} />
                <span>{config.label}</span>
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <div className={cn("flex flex-col items-center justify-center p-3 rounded-lg bg-secondary/10 border border-secondary/20 text-center gap-2", className)}>
                <div className={cn("p-2 rounded-full bg-background shadow-sm", iconColorClass)}>
                    <Icon className={"h-4 w-4"} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">
                    {config.label}
                </span>
            </div>
        )
    }

    return (
        <div className={cn(
            "inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-sm font-medium transition-colors",
            "bg-background/50 border-border hover:bg-accent hover:text-accent-foreground",
            className
        )}>
            <Icon className={cn("h-4 w-4", iconColorClass)} />
            <span>{config.label}</span>
            {type === 'upgrade' && <span className="text-[10px] text-muted-foreground ml-1">(Subject to Avail.)</span>}
        </div>
    );
};
