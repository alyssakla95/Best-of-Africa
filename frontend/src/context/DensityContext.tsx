/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

type DensityMode = 'comfortable' | 'compact';

interface DensityContextType {
    density: DensityMode;
    setDensity: (mode: DensityMode) => void;
    toggleDensity: () => void;
}

const DensityContext = createContext<DensityContextType | undefined>(undefined);

export const DensityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [density, setDensity] = useState<DensityMode>('comfortable');

    useEffect(() => {
        // Sync with body attribute for global CSS styling if needed (e.g. [data-density="compact"] .card { ... })
        document.body.setAttribute('data-density', density);
    }, [density]);

    const toggleDensity = () => {
        setDensity(prev => prev === 'comfortable' ? 'compact' : 'comfortable');
    };

    return (
        <DensityContext.Provider value={{ density, setDensity, toggleDensity }}>
            {children}
        </DensityContext.Provider>
    );
};

export const useDensity = () => {
    const context = useContext(DensityContext);
    if (context === undefined) {
        throw new Error('useDensity must be used within a DensityProvider');
    }
    return context;
};
