import React from 'react';
import { UpdateIcon } from '@radix-ui/react-icons';

export const CinematicLoader: React.FC = () => {
    return (
        <div className="flex h-[60vh] flex-col items-center justify-center p-8">
            <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-background/20 duration-1000"></div>
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-background border-2 border-primary shadow-2xl">
                    <UpdateIcon className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
            <h2 className="mt-8 text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
                Loading...
            </h2>
        </div>
    );
};
