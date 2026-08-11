import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { marketplaceDestinationFor, type MarketplaceAccessKind } from '@/components/MarketplaceAccessGate';
import { FormErrorSummary, SubmitButton } from '@/components/JourneyUI';
import { SEO } from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';

const approachableError = (cause: unknown) => {
  const message = cause instanceof Error ? cause.message : '';
  if (/invalid credentials|unauthorized/i.test(message)) return 'That email and password do not match an active account. Check both fields and try again.';
  if (/deactivated/i.test(message)) return 'This account is currently deactivated. Ask your BOA-Story contact for help.';
  if (/expired/i.test(message)) return 'This account has expired. Ask your BOA-Story contact to renew access.';
  return message || 'Sign-in is temporarily unavailable. Please try again.';
};

function MarketplacePasswordLogin({ kind }: { kind: MarketplaceAccessKind }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, refreshSession, user, isAuthenticated, isHydrating } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isSpecialist = kind === 'specialist';

  useEffect(() => {
    if (isAuthenticated && user && !isHydrating) navigate(marketplaceDestinationFor(user), { replace: true });
  }, [isAuthenticated, isHydrating, navigate, user]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await api.passwordLogin(email.trim(), password);
      login(response.token, {
        email: email.trim(),
        tier: response.tier,
        id: response.client.id,
        name: response.client.name,
        organization: response.client.organization,
      });
      const verified = await refreshSession();
      if (!verified) throw new Error('We could not verify this session. Please sign in again.');
      const intended = (location.state as { from?: string } | null)?.from;
      const allowedIntended = intended?.startsWith('/specialists/') ? intended : null;
      navigate(allowedIntended || marketplaceDestinationFor(verified), { replace: true });
    } catch (cause) {
      setError(approachableError(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="page-container py-12 md:py-20">
    <SEO title={isSpecialist ? 'Specialist sign in' : 'Enterprise access'} description="Secure password access to the private BOA-Story marketplace." noIndex />
    <div className="mx-auto max-w-md rounded-3xl border bg-white p-6 shadow-sm md:p-9">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white"><LockKeyhole size={21} /></div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[.14em] text-navy/55">{isSpecialist ? 'Specialist Marketplace' : 'Enterprise Marketplace'}</p>
      <h1 className="mt-2 font-serif text-4xl text-navy">{isSpecialist ? 'Sign in to your specialist workspace' : 'Access your Enterprise workspace'}</h1>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {isSpecialist ? 'Use the work email and password created from your invitation.' : 'Use the password credentials issued for your approved Enterprise account.'}
      </p>
      <form onSubmit={submit} className="mt-7 space-y-5">
        <div><Label htmlFor={`${kind}-email`}>Work email</Label><Input id={`${kind}-email`} type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></div>
        <div><Label htmlFor={`${kind}-password`}>Password</Label><Input id={`${kind}-password`} type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></div>
        <FormErrorSummary error={error} />
        <SubmitButton type="submit" className="w-full" pending={submitting} pendingLabel="Verifying access…">Sign in securely</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSpecialist ? <>Invitation not redeemed? Use the private link in your invitation email.</> : <>Need Enterprise access? <Link className="font-semibold text-primary underline" to="/enterprise/apply">Apply for a pilot</Link>.</>}
      </p>
    </div>
  </div>;
}

export const EnterpriseAccessPage = () => <MarketplacePasswordLogin kind="enterprise" />;
export const SpecialistSignInPage = () => <MarketplacePasswordLogin kind="specialist" />;
