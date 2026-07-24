import React from 'react';
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { SEO } from '../components/SEO';

export const NotFoundPage: React.FC = () => {
    const { data: config } = useSystemConfig();

    return (
        <>
            <SEO title="Page Not Found" description="The page you are looking for is unavailable." />
            <div className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 rounded-full bg-destructive/10 p-6">
                    <ExclamationTriangleIcon className="h-16 w-16 text-destructive" />
                </div>
                <h1 className="mb-4 text-6xl font-black text-foreground tracking-tighter">404</h1>
                <h2 className="mb-8 text-2xl font-serif font-bold text-muted-foreground uppercase tracking-wide">
                    {config?.['error_404_headline'] || "Page Not Found"}
                </h2>
                <p className="mb-10 max-w-md text-lg leading-relaxed text-muted-foreground">
                    {config?.['error_404_desc'] || "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."}
                </p>
                <Button asChild size="lg" className="font-bold">
                    <Link to="/">Return Home</Link>
                </Button>
            </div>
        </>
    );
};
