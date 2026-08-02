import React, { useEffect, useRef, useState } from 'react';
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Link, useNavigate } from 'react-router-dom';
import { LockClosedIcon, PersonIcon, CheckCircledIcon, UpdateIcon, ChevronRightIcon, EnvelopeClosedIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useMember } from '../context/MemberContext';
import { SEO } from '../components/SEO';

export const LoginPage: React.FC = () => {
    const { data: config } = useSystemConfig();
    const navigate = useNavigate();
    const { login: loginAuth } = useAuth();
    const { login: loginMember } = useMember();
    
    const [step, setStep] = useState<'EMAIL' | 'OTP' | 'SUCCESS'>('EMAIL');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'ERROR'>('IDLE');
    const [error, setError] = useState<string | null>(null);

    const successTimer = useRef<number | null>(null);
    useEffect(() => () => {
        if (successTimer.current !== null) window.clearTimeout(successTimer.current);
    }, []);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('LOADING');
        setError(null);

        try {
            const res = await api.verifyEmail(email);
            if (res.ok) {
                setStep('OTP');
                setStatus('IDLE');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Network error. Please try again.');
            setStatus('ERROR');
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setStatus('LOADING');
        setError(null);

        try {
            const res = await api.verifyOtp(email, otp);
            if (res.ok && res.token) {
                const expiresInDays = res.expires_at
                    ? Math.max(0, Math.ceil((new Date(res.expires_at).getTime() - Date.now()) / 86_400_000))
                    : null;
                loginAuth(res.token, { email, tier: res.tier });
                loginMember(res.token, {
                    tier: res.tier,
                    name: res.name || email,
                    expires_in_days: expiresInDays,
                });

                // Retain the compatibility fields used by the account settings page.
                localStorage.setItem('boa_client_info', JSON.stringify({
                    email,
                    name: res.name,
                    tier: res.tier,
                    expires_at: res.expires_at,
                }));

                setStep('SUCCESS');
                
                successTimer.current = window.setTimeout(() => navigate('/feed'), 1500);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Verification failed');
            setStatus('ERROR');
        }
    };

    return (
        <>
            <SEO title="Member Portal" description="Sign in to your Best of Africa membership with a secure email verification code." />
            <div className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-16 text-foreground">
                {/* Background decorative elements, restrained navy radial glow */}
                <div className="hidden" />

                <div className="relative z-10 min-w-0 w-full max-w-[420px] py-12">
                    <div className="mb-10 text-center">
                        <div className="relative mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 bg-card">
                            {status === 'LOADING' ? (
                                <UpdateIcon className="relative h-9 w-9 animate-spin text-accent" />
                            ) : step === 'SUCCESS' ? (
                                <CheckCircledIcon className="relative h-9 w-9 text-accent" />
                            ) : (
                                <LockClosedIcon className="relative h-8 w-8 text-accent" />
                            )}
                        </div>
                        <h1 className="mb-2 text-3xl font-serif font-semibold tracking-tight text-foreground">
                            {config?.['auth_login_header'] || "Member Portal"}
                        </h1>
                        <p className="text-xs font-medium uppercase tracking-widest text-foreground/50">
                            {step === 'EMAIL' ? "PASSWORDLESS LOGIN" : step === 'OTP' ? "VERIFICATION REQUIRED" : "AUTHENTICATED"}
                        </p>
                    </div>

                    <Card className="w-full min-w-0 overflow-hidden border-navy bg-navy text-white shadow-none">
                        <CardContent className="min-w-0 p-6 sm:p-8">
                            {step === 'SUCCESS' ? (
                                <div className="animate-in fade-in zoom-in duration-500 py-10 text-center">
                                    <div className="mb-2 text-base font-bold tracking-widest text-accent">LOGIN SUCCESSFUL</div>
                                    <p className="mb-8 text-sm text-white/60">Redirecting to Intelligence Feed...</p>
                                    <UpdateIcon className="mx-auto h-10 w-10 animate-spin text-accent" />
                                </div>
                            ) : step === 'EMAIL' ? (
                                <form onSubmit={handleEmailSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-widest text-white/60">Email Address</Label>
                                        <div className="relative">
                                            <PersonIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="border-white/30 bg-navy pl-10 font-mono text-white placeholder:text-white/40 focus-visible:ring-accent"
                                                placeholder="name@organization.com"
                                                required
                                            />
                                        </div>
                                        <p className="pt-1 text-xs text-white/45 leading-relaxed">
                                            We&apos;ll email you a six-digit verification code. No password needed.
                                        </p>
                                    </div>

                                    {error && (
                                        <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-center text-xs text-destructive">
                                            {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={status === 'LOADING'}
                                        className="w-full font-bold uppercase tracking-widest bg-accent text-accent-foreground hover:bg-accent/90 shadow-md"
                                    >
                                        {status === 'LOADING' ? (
                                            <>Requesting Code...</>
                                        ) : (
                                            <>Send Verification Code <ChevronRightIcon className="ml-2 h-4 w-4" /></>
                                        )}
                                    </Button>
                                </form>
                            ) : (
                                <form onSubmit={handleOtpSubmit} className="space-y-6 animate-in slide-in-from-right-4">
                                    <div className="text-center mb-6">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-3">
                                            <EnvelopeClosedIcon className="h-6 w-6" />
                                        </div>
                                        <p className="text-sm text-white/60">
                                            We sent a 6-digit verification code to <br/>
                                            <span className="font-bold text-accent">{email}</span>
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="otp" className="text-[11px] font-bold uppercase tracking-widest text-white/60">Verification Code</Label>
                                        <Input
                                            id="otp"
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            className="border-white/30 bg-navy text-center text-2xl tracking-[0.5em] font-mono text-white focus-visible:ring-accent h-14"
                                            placeholder="------"
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    {error && (
                                        <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-center text-xs text-destructive">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <Button
                                            type="submit"
                                            disabled={status === 'LOADING' || otp.length !== 6}
                                            className="w-full font-bold uppercase tracking-widest bg-accent text-accent-foreground hover:bg-accent/90 shadow-md"
                                        >
                                            {status === 'LOADING' ? (
                                                <>Verifying...</>
                                            ) : (
                                                <>Verify Code <ChevronRightIcon className="ml-2 h-4 w-4" /></>
                                            )}
                                        </Button>
                                        
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                setStep('EMAIL');
                                                setOtp('');
                                                setError(null);
                                            }}
                                            className="w-full text-xs text-white/60 hover:text-white"
                                        >
                                            Use a different email
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    <div className="mt-8 flex justify-center gap-6 text-center">
                        <Link to="/membership" className="text-xs font-bold uppercase tracking-widest text-accent hover:text-accent/80 transition-colors">
                            Apply for Membership
                        </Link>
                    </div>

                    {/* System Footer */}
                    <div className="absolute -bottom-20 left-0 right-0 text-center opacity-50">
                        <div className="font-mono text-[10px] text-white/70">SECURE CONNECTION: TLS 1.3 / OTP AUTH</div>
                    </div>

                </div>
            </div>
        </>
    );
};
