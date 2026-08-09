/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// AUTH CONTEXT: Manages authentication and subscription state
// ─────────────────────────────────────────────────────────────────────────────

interface AuthState {
    isAuthenticated: boolean;
    isSubscribed: boolean;
    user: { email: string; tier: 'free' | 'premium' | 'enterprise' } | null;
    token: string | null;
}

interface AuthContextType extends AuthState {
    login: (token: string, user: AuthState['user']) => void;
    logout: () => void;
    checkSubscription: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>(() => {
        // Initialize from localStorage
        const token = localStorage.getItem('boa_auth_token');
        const userJson = localStorage.getItem('boa_user');
        const user = userJson ? JSON.parse(userJson) : null;

        return {
            isAuthenticated: !!token,
            isSubscribed: user?.tier === 'premium' || user?.tier === 'enterprise',
            user,
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

    const login = (token: string, user: AuthState['user']) => {
        setState({
            isAuthenticated: true,
            isSubscribed: user?.tier === 'premium' || user?.tier === 'enterprise',
            user,
            token,
        });
    };

    const clearSession = useCallback(() => {
        setState({
            isAuthenticated: false,
            isSubscribed: false,
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

    // Listen for 401 unauthorized events from the API layer and log out globally.
    useEffect(() => {
        window.addEventListener('boa:auth:unauthorized', clearSession);
        return () => window.removeEventListener('boa:auth:unauthorized', clearSession);
    }, [clearSession]);

    const checkSubscription = () => state.isSubscribed;

    return (
        <AuthContext.Provider value={{ ...state, login, logout, checkSubscription }}>
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
