/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { IntelligenceLens } from '../types';

interface LensContextType {
    lens: IntelligenceLens;
    setLens: (lens: IntelligenceLens) => void;
    cycleLens: () => void;
}

const STORAGE_KEY = 'boa-intelligence-lens';
const LENS_ORDER: IntelligenceLens[] = ['investor', 'government', 'explorer'];

const LensContext = createContext<LensContextType | undefined>(undefined);

export const LensProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lens, setLensState] = useState<IntelligenceLens>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored && LENS_ORDER.includes(stored as IntelligenceLens)) {
                return stored as IntelligenceLens;
            }
        } catch (e) {
            console.warn('Failed to load lens from storage:', e);
        }
        return 'investor';
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, lens);
        } catch (e) {
            console.warn('Failed to save lens to storage:', e);
        }
        document.body.setAttribute('data-lens', lens);
    }, [lens]);

    const setLens = useCallback((newLens: IntelligenceLens) => {
        if (LENS_ORDER.includes(newLens)) {
            setLensState(newLens);
        }
    }, []);

    const cycleLens = useCallback(() => {
        setLensState(prev => {
            const idx = LENS_ORDER.indexOf(prev);
            return LENS_ORDER[(idx + 1) % LENS_ORDER.length];
        });
    }, []);

    return (
        <LensContext.Provider value={{ lens, setLens, cycleLens }}>
            {children}
        </LensContext.Provider>
    );
};

export const useLens = () => {
    const context = useContext(LensContext);
    if (context === undefined) {
        throw new Error('useLens must be used within a LensProvider');
    }
    return context;
};
