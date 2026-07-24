import { Link } from 'react-router-dom';
import { LogOut, CheckCircle, Clock, BookOpen, Globe, Mail, BarChart2 } from 'lucide-react';
import { TIER_LABELS, KO_FI_URL } from '../../constants/beta';

// per-tier icon to add visual identity to the dashboard
const TIER_ICONS: Record<string, string> = {
  basic: '🥉',
  premium: '🥇',
  enterprise: '💎',
  supporter: '🥉',
  founding: '🥇',
  partner: '💎',
};

interface BetaDashboardProps {
  memberData: { tier: string; name: string; expires_in_days?: number | null };
  onLogout: () => void;
}

export const BetaDashboard = ({ memberData, onLogout }: BetaDashboardProps) => {
  const tierInfo = TIER_LABELS[memberData.tier] || TIER_LABELS.basic;
  const tierIcon = TIER_ICONS[memberData.tier] || '🥉';

  // Format renewal message from expires_in_days
  const renewalMsg = (() => {
    const days = memberData.expires_in_days;
    if (days == null) return null;
    if (days <= 0) return 'Access expired, please renew';
    if (days <= 7) return `Access expires in ${days} day${days === 1 ? '' : 's'}`;
    if (days <= 30) return `${days} days remaining`;
    return `Renews in ~${Math.ceil(days / 30)} months`;
  })();

  return (
    <div className="flex-1 flex flex-col justify-center py-20 px-6">
      <div className="max-w-xl mx-auto w-full">
        
        {/* Welcome Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-[32px] mb-1 text-primary">Welcome back, {memberData.name}</h1>
            <p className="text-primary/50 text-sm flex items-center gap-2">
              <CheckCircle size={14} className="text-accent" /> Active Membership
            </p>
          </div>
          <button 
            onClick={onLogout}
            className="p-3 bg-background/5 rounded-full text-primary/40 hover:text-primary hover:bg-background/10 transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Current Tier Panel */}
        <div className="bg-card border border-accent/30 rounded-2xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none select-none text-[120px] leading-none">
            {tierIcon}
          </div>
          
          <div className="relative z-10">
            <span className="text-xs font-bold tracking-widest text-accent uppercase block mb-2">Current Tier</span>
            <h2 className="font-serif text-[28px] text-primary flex items-center gap-3">
              {tierIcon} {tierInfo.title}
            </h2>
            <p className="text-primary/60 mt-2 text-sm max-w-md leading-relaxed">
              {tierInfo.desc}
            </p>
            {renewalMsg && (
              <p className={`mt-3 text-xs font-medium flex items-center gap-1.5 ${
                (memberData.expires_in_days ?? 99) <= 7
                  ? 'text-destructive'
                  : 'text-primary/40'
              }`}>
                <Clock size={11} />
                {renewalMsg}
              </p>
            )}
          </div>
        </div>

        {/* Access Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link to="/posts" className="group bg-card border border-primary/10 p-5 rounded-xl hover:border-accent/40 transition-colors flex flex-col gap-2">
            <BookOpen size={16} className="text-accent" />
            <h3 className="font-medium text-primary group-hover:text-accent transition-colors">All Stories</h3>
            <p className="text-xs text-primary/50 leading-relaxed">Full narrative reports and deep dives.</p>
          </Link>
          <Link to="/countries" className="group bg-card border border-primary/10 p-5 rounded-xl hover:border-accent/40 transition-colors flex flex-col gap-2">
            <Globe size={16} className="text-accent" />
            <h3 className="font-medium text-primary group-hover:text-accent transition-colors">Country Hubs</h3>
            <p className="text-xs text-primary/50 leading-relaxed">Stories from across the 54 nations.</p>
          </Link>
          <Link to="/intel" className="group bg-card border border-primary/10 p-5 rounded-xl hover:border-accent/40 transition-colors flex flex-col gap-2">
            <BarChart2 size={16} className="text-accent" />
            <h3 className="font-medium text-primary group-hover:text-accent transition-colors">Supporter Feed</h3>
            <p className="text-xs text-primary/50 leading-relaxed">Behind-the-scenes data and updates.</p>
          </Link>
          <Link to="/newsletter" className="group bg-card border border-primary/10 p-5 rounded-xl hover:border-accent/40 transition-colors flex flex-col gap-2">
            <Mail size={16} className="text-accent" />
            <h3 className="font-medium text-primary group-hover:text-accent transition-colors">Dispatch</h3>
            <p className="text-xs text-primary/50 leading-relaxed">Weekly stories sent to your inbox.</p>
          </Link>
        </div>

        {/* What's included at this tier */}
        <div className="bg-card rounded-xl border border-primary/10 p-5 mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-4">Included in your membership</p>
          <ul className="space-y-2">
            {tierInfo.perks.map((perk) => (
              <li key={perk} className="flex items-center gap-2 text-sm text-primary/70">
                <CheckCircle size={13} className="text-accent shrink-0" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        {/* Support Nudge */}
        <div className="text-center border-t border-primary/10 pt-8">
          <p className="text-xs text-primary/40 mb-3 flex items-center justify-center gap-1">
            <Clock size={12} /> Access renews automatically via Ko-fi
          </p>
          <a
            href={KO_FI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/50 text-xs hover:text-primary transition-colors underline"
          >
            Manage subscription on Ko-fi
          </a>
        </div>

      </div>
    </div>
  );
};
