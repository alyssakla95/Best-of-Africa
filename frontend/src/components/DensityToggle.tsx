import React from 'react';
import { useDensity } from '@/context/DensityContext';
import { Button } from '@/components/ui/button';
import { PaddingIcon, TextAlignJustifyIcon } from '@radix-ui/react-icons';

export const DensityToggle: React.FC = () => {
    const { density, toggleDensity } = useDensity();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleDensity}
            className="w-8 h-8 rounded-full text-muted-foreground hover:bg-foreground/50 hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
            aria-label={density === 'comfortable' ? 'Switch to compact layout' : 'Switch to comfortable layout'}
            title={density === 'comfortable' ? 'Switch to compact layout' : 'Switch to comfortable layout'}
        >
            {density === 'comfortable' ? (
                <PaddingIcon className="h-4 w-4" />
            ) : (
                <TextAlignJustifyIcon className="h-4 w-4" />
            )}
        </Button>
    );
};
