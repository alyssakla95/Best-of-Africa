import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowTopRightIcon, LinkBreak1Icon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

interface PartnerPromoProps {
    title: string;
    description: string;
    ctaText?: string;
    ctaUrl?: string;
    imageUrl?: string;
    category?: string;
    className?: string;
    variant?: 'sidebar' | 'horizontal' | 'featured';
}

export const PartnerPromo: React.FC<PartnerPromoProps> = ({
    title,
    description,
    ctaText = "Learn More",
    ctaUrl = "#",
    imageUrl,
    category = "Strategic Partner",
    className,
    variant = 'sidebar'
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn(
                "group relative overflow-hidden rounded-3xl border border-primary/20 bg-muted/40 backdrop-blur-md shadow-lg",
                variant === 'horizontal' ? "flex flex-col md:flex-row" : "flex flex-col",
                className
            )}
        >
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-background to-secondary" />
            </div>

            {imageUrl && (
                <div className={cn(
                    "relative z-10 overflow-hidden",
                    variant === 'horizontal' ? "w-full md:w-1/3 h-48 md:h-auto" : "w-full h-40"
                )}>
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                </div>
            )}

            <div className="relative z-20 flex flex-1 flex-col p-6">
                <div className="mb-3 flex items-center justify-between">
                    <Badge variant="outline" className="border-primary/30 bg-background/10 text-[10px] font-bold uppercase tracking-widest text-primary">
                        {category}
                    </Badge>
                    <LinkBreak1Icon className="h-4 w-4 text-muted-foreground opacity-50" />
                </div>

                <h3 className="mb-2 text-xl font-black leading-tight text-foreground transition-colors group-hover:text-primary">
                    {title}
                </h3>

                <p className="mb-6 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {description}
                </p>

                <div className="mt-auto">
                    <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="w-full font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all group-hover:bg-background group-hover:text-foreground"
                    >
                        <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                            {ctaText} <ArrowTopRightIcon className="h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </div>

            {/* Premium "River Bridge" style accent */}
            <div className="absolute bottom-0 left-0 h-1 w-0 bg-background transition-all duration-700 group-hover:w-full" />
        </motion.div>
    );
};

