import { useState, useEffect, useRef } from 'react';
import { Mail, ArrowRight, Lock, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { BetaDashboard } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { request } from '../../services/api';
import { KO_FI_URL } from '../../constants/beta';
import { useMember } from '../../context/MemberContext';
import { useLanguage } from '../../context/LanguageContext';

export const BetaMemberAccess = () => {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [phase, setPhase] = useState<'form' | 'otp' | 'success' | 'error' | 'expired'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const { isMember, memberData, login, logout, isLoading } = useMember();
  const visiblePhase = isLoading ? 'checking' : isMember ? 'success' : phase === 'success' ? 'form' : phase;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await request<{ ok: boolean; status?: string }>(
        '/members/verify-email',
        {
          method: 'POST',
          body: JSON.stringify({ email: email.toLowerCase().trim() }) }
      );

      if (res.ok && res.status === 'pending_otp') {
        setIsSubmitting(false);
        setPhase('otp');
      } else {
        throw new Error('Verification failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setErrorMsg(msg.includes('404') || msg.includes('No active')
        ? 'No active membership found for this email.'
        : msg.includes('expired')
        ? 'Your membership has expired. Please renew on Ko-fi to restore access.'
        : msg
      );
      setIsSubmitting(false);
      setPhase('error');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await request<{ ok: boolean; token: string; tier: string; name: string }>(
        '/members/verify-otp',
        {
          method: 'POST',
          body: JSON.stringify({ email: email.toLowerCase().trim(), otp: otp.trim() }) }
      );

      setIsSubmitting(false);
      if (res.ok && res.token) {
        login(res.token, { tier: res.tier, name: res.name, expires_in_days: null });
        setPhase('success');
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      if (msg.includes('expired')) {
        setErrorMsg('That code has expired. Please request a new one.');
        setPhase('form');
      } else {
        setErrorMsg('Invalid verification code. Please try again.');
      }
      setIsSubmitting(false);
      setPhase('otp');
    }
  };



  // Auto-focus OTP input when the OTP screen appears
  useEffect(() => {
    if (visiblePhase === 'otp') {
      setTimeout(() => otpInputRef.current?.focus(), 50);
    }
  }, [visiblePhase]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setResendSuccess(false);
    try {
      await request<{ ok: boolean }>('/members/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase().trim() }) });
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
      // Start 30-second cooldown
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setErrorMsg('Failed to resend. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Checking state, validating existing token ─────────────────────────────
  if (visiblePhase === 'checking') {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <SEO title="Member Access | BOA-Story" />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ── Expired state ──────────────────────────────────────────────────────────
  if (visiblePhase === 'expired') {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <SEO title="Access Expired | BOA-Story" />
        
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-6">
          <div className="max-w-md mx-auto w-full text-center bg-card p-10 rounded-3xl border border-foreground/10 shadow-2xl">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 border border-accent/30 mb-8">
              <RefreshCw className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-serif text-[2.5rem] leading-none mb-4">Access Expired</h1>
            <p className="text-foreground/60 mb-10 font-light leading-relaxed text-[1.125rem]">
              Your 30-day access token has expired. Re-enter your member email to get a fresh one, or renew your membership on Ko-fi.
            </p>
            <button
              onClick={() => setPhase('form')}
              className="w-full bg-accent text-navy font-bold uppercase tracking-widest text-[11px] py-5 rounded-xl hover:bg-gold-italic transition-all mb-6"
            >
              Re-enter member email
            </button>
            <a
              href={KO_FI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-foreground/40 hover:text-foreground transition-colors uppercase tracking-widest font-bold"
            >
              Renew on Ko-fi →
            </a>
          </div>
        </div>
        
      </div>
    );
  }

  return (
    <div className="selection:bg-accent selection:text-primary flex flex-col min-h-screen bg-background text-foreground">
      <SEO 
        title="Member Access | BOA-Story" 
        description="Access your Founding Member benefits and premium stories."
      />
      
      {visiblePhase === 'success' && memberData ? (
        // ── Success state (Dashboard) ──────────────────────────────────────
        <div className="flex-1">
            <BetaDashboard
              memberData={memberData}
              onLogout={() => {
                logout();
                setPhase('form');
              }}
            />
        </div>
      ) : (
        <div className="flex-1 min-w-0 overflow-hidden bg-background">
          
          {/* Left Side Cover */}
          <div className="hidden">
            <img
              src="/images/v2_editorial_1.webp"
              alt="Premium Access"
              className="absolute inset-0 w-full h-full object-cover object-center hero-photo"
            />
            <div className="absolute inset-0 z-10 hero-scrim" />
            <div className="absolute inset-0 z-30 flex flex-col justify-end p-20 pb-32">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <div className="inline-flex items-center gap-3 bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold uppercase tracking-widest px-5 py-2 rounded-full mb-8 backdrop-blur-md">
                        <Lock size={14} />
                        Founding Members
                    </div>
                    <h1 className="text-[4rem] font-serif leading-[0.9] tracking-tighter mb-6 text-white drop-shadow-2xl">
                        Unrestricted <br/><span className="text-accent italic">Intelligence.</span>
                    </h1>
                    <p className="text-[1.125rem] font-light text-white/70 max-w-md leading-[1.8] drop-shadow-md">
                        Log in to access your curated briefings, market analytics, and VIP concierge portal.
                    </p>
                </motion.div>
            </div>
          </div>

          {/* Right Side Auth Flow */}
          <div className="mx-auto flex min-h-[70vh] w-full min-w-0 max-w-[100vw] flex-col justify-center px-6 py-16 sm:max-w-xl sm:px-10">
            <div className="mx-auto w-full min-w-0 max-w-[calc(100vw-3rem)] sm:max-w-md">

              {visiblePhase === 'otp' ? (
                // ── OTP Form State ─────────────────────────────────────────────────
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="mb-12">
                    <h1 className="font-serif text-[3rem] leading-none mb-4 text-foreground">
                      Check your email
                    </h1>
                    <p className="text-foreground/50 text-[1.125rem] font-light leading-[1.8]">
                      We sent a 6-digit verification code to <strong className="text-foreground">{email}</strong>. Entering it below will authorize this device.
                    </p>
                  </div>

                  <form onSubmit={handleOtpSubmit} className="space-y-6 mb-8">
                    <div className="relative">
                      <input
                        ref={otpInputRef}
                        type="text"
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="0 0 0 0 0 0"
                        required
                        pattern="\d*"
                        maxLength={6}
                        autoComplete="one-time-code"
                        disabled={isSubmitting}
                        className="w-full bg-background/50 border border-foreground/10 rounded-2xl px-4 py-8 text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all disabled:opacity-50 text-center font-mono text-4xl tracking-[0.5em] font-bold"
                      />
                    </div>

                    {errorMsg && (
                      <p className="text-destructive text-[13px] text-center bg-destructive/10 p-3 rounded-lg border border-destructive/20" role="alert">{errorMsg}</p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || otp.length < 6}
                      className="w-full bg-accent text-primary font-bold uppercase tracking-widest text-[11px] py-6 rounded-xl hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(15,31,61,0.2)]"
                    >
                      Verify Code
                    </button>
                  </form>

                  <div className="flex flex-col gap-4">
                    {resendSuccess && (
                      <p className="text-[13px] text-accent text-center bg-accent/10 p-3 rounded-lg border border-accent/20 font-bold tracking-wide" role="status">New code sent, check your inbox.</p>
                    )}
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isSubmitting || resendCooldown > 0}
                      className="text-[11px] text-foreground/50 hover:text-foreground uppercase tracking-widest font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-center"
                    >
                      {isSubmitting
                        ? (language === 'pt' ? 'A reenviar...' : 'Resending...')
                        : resendCooldown > 0
                          ? (language === 'pt' ? `Reenviar dentro de ${resendCooldown} s` : `Resend in ${resendCooldown}s`)
                          : (language === 'pt' ? 'Reenviar código' : 'Resend code')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPhase('form'); setOtp(''); setErrorMsg(''); }}
                      className="text-[11px] text-foreground/30 hover:text-foreground/60 uppercase tracking-widest font-bold underline transition-colors text-center mt-2"
                    >
                      Use a different email
                    </button>
                  </div>
                </motion.div>
              ) : (
                // ── Initial Email Form State ───────────────────────────────────────
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="mb-12">
                    <h1 className="font-serif text-[3rem] leading-none mb-4 text-foreground">
                      Access your <br/>intelligence.
                    </h1>
                    <p className="text-foreground/50 text-[1.125rem] font-light leading-[1.8]">
                      Enter the email address associated with your Ko-fi membership.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-foreground/30" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="founder@company.com"
                        required
                        disabled={isSubmitting}
                        className="w-full bg-background/50 border border-foreground/10 rounded-2xl pl-12 pr-4 py-5 text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all disabled:opacity-50 font-medium text-lg"
                      />
                    </div>

                    {errorMsg && (
                      <p className="text-destructive text-[13px] text-center bg-destructive/10 p-3 rounded-lg border border-destructive/20" role="alert">{errorMsg}</p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || !email}
                      className="w-full bg-accent text-navy font-bold uppercase tracking-widest text-[11px] py-5 rounded-xl hover:bg-gold-italic transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(15,31,61,0.3)]"
                    >
                      {isSubmitting ? (
                        <>Verifying...</>
                      ) : (
                        <>Continue <ArrowRight size={16} /></>
                      )}
                    </button>
                  </form>

                  <div className="mt-12 pt-8 border-t border-foreground/10 text-center">
                    <p className="text-foreground/40 text-[13px] mb-4 font-medium">Not a member yet?</p>
                    <a
                      href={KO_FI_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-foreground text-[11px] font-bold uppercase tracking-widest transition-colors"
                    >
                      Unlock Access on Ko-fi →
                    </a>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
