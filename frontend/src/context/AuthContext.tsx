/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { api, type AuthUser, type ClientTier } from '@/services/api';

// ─────────────────────────────────────────────────────────────────────────────
// AUTH CONTEXT: Manages authentication and subscription state
// ─────────────────────────────────────────────────────────────────────────────

interface AuthState {
    isAuthenticated: boolean;
    isSubscribed: boolean;
    isHydrating: boolean;
    user: AuthUser | null;
    token: string | null;
}

interface AuthContextType extends AuthState {
    login: (token: string, user: Pick<AuthUser, 'email' | 'tier'> & Partial<AuthUser>) => void;
    logout: () => void;
    refreshSession: () => Promise<AuthUser | null>;
    checkSubscription: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>(() => {
        const token = localStorage.getItem('boa_auth_token');
        return {
            isAuthenticated: false,
            isSubscribed: false,
            isHydrating: Boolean(token),
            user: null,
            token,
        };
    });

    // Persist to localStorage
    useEffect(() => {
        if (state.token) {
            localStorage.setItem('boa_auth_token', state.token);
        } else {
            localStorage.removeItem('boa_auth_token');
        }

        if (state.user) {
            localStorage.setItem('boa_user', JSON.stringify(state.user));
        } else {
            localStorage.removeItem('boa_user');
        }
    }, [state.token, state.user]);

    const login = (token: string, user: Pick<AuthUser, 'email' | 'tier'> & Partial<AuthUser>) => {
        const normalized: AuthUser = {
            id: user.id || '',
            name: user.name || user.email,
            email: user.email,
            organization: user.organization ?? null,
            tier: user.tier as ClientTier,
            type: user.type || (user.tier === 'specialist' ? 'specialist' : 'other'),
            marketplace_access_status: user.marketplace_access_status || 'not_granted',
        };
        localStorage.setItem('boa_auth_token', token);
        setState({
            isAuthenticated: true,
            isSubscribed: normalized.tier === 'premium' || normalized.tier === 'enterprise',
            isHydrating: false,
            user: normalized,
            token,
        });
    };

    const clearSession = useCallback(() => {
        setState({
            isAuthenticated: false,
            isSubscribed: false,
            isHydrating: false,
            user: null,
            token: null,
        });
        localStorage.removeItem('boa_client_info');
        localStorage.removeItem('boa_client_tier');
    }, []);

    const logout = useCallback(() => {
        clearSession();
        // Let MemberContext (and any other listener) clear its session state too.
        // The listener below handles this event itself via clearSession — never
        // route this dispatch back through logout, which would recurse until the
        // call stack overflows on every 401.
        window.dispatchEvent(new Event('boa:auth:unauthorized'));
    }, [clearSession]);

    const refreshSession = useCallback(async () => {
        const token = localStorage.getItem('boa_auth_token');
        if (!token) {
            clearSession();
            return null;
        }
        try {
            const response = await api.getCurrentUser();
            const user = response.client;
            setState({
                isAuthenticated: true,
                isSubscribed: user.tier === 'premium' || user.tier === 'enterprise',
                isHydrating: false,
                user,
                token,
            });
            return user;
        } catch {
            clearSession();
            return null;
        }
    }, [clearSession]);

    useEffect(() => {
        if (!localStorage.getItem('boa_auth_token')) return;
        const timer = window.setTimeout(() => void refreshSession(), 0);
        return () => window.clearTimeout(timer);
    }, [refreshSession]);

    // Listen for 401 unauthorized events from the API layer and log out globally.
    useEffect(() => {
        window.addEventListener('boa:auth:unauthorized', clearSession);
        return () => window.removeEventListener('boa:auth:unauthorized', clearSession);
    }, [clearSession]);

    const checkSubscription = () => state.isSubscribed;

    return (
        <AuthContext.Provider value={{ ...state, login, logout, refreshSession, checkSubscription }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
