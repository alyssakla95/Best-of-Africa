import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PersonIcon, BellIcon, LockClosedIcon, ExitIcon, IdCardIcon, EnvelopeClosedIcon, LightningBoltIcon, UpdateIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useMember } from '../context/MemberContext';
import { SEO } from '../components/SEO';
import { toast } from 'sonner';

const AVAILABLE_COUNTRIES = [
    "Nigeria", "South Africa", "Egypt", "Kenya", "Ghana", "Rwanda", "Morocco", "Ethiopia"
];

const AVAILABLE_SECTORS = [
    "finance", "technology", "agriculture", "energy", "infrastructure", "tourism"
];

export const SettingsPage: React.FC = () => {
    const { logout, isAuthenticated, user: authUser } = useAuth();
    const { memberData } = useMember();
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('boa_client_info');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return {
                    name: parsed.name || '',
                    email: parsed.email || authUser?.email || '',
                    role: parsed.organization || '',
                    tier: parsed.tier || authUser?.tier || 'free',
                };
            } catch (e) { console.error('Failed to parse user info', e); }
        }
        return {
            name: '',
            email: authUser?.email || '',
            role: '',
            tier: authUser?.tier || 'free',
        };
    });

    const [preferences, setPreferences] = useState<{
        countries_of_interest: string[];
        sectors_of_interest: string[];
    }>({
        countries_of_interest: [],
        sectors_of_interest: []
    });

    const [notifications, setNotifications] = useState({ email: true, push: false, reports: true });

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Option lists for the preference pickers, sourced live so EVERY sector (8)
    // and country (54) is offered, not a hardcoded subset. Falls back to the
    // constants if the API is unavailable. Stored value: sector id / country name.
    const [sectorOptions, setSectorOptions] = useState<{ id: string; name: string }[]>(
        AVAILABLE_SECTORS.map(s => ({ id: s, name: s })));
    const [countryOptions, setCountryOptions] = useState<string[]>(AVAILABLE_COUNTRIES);

    useEffect(() => {
        (async () => {
            try {
                const s = await api.getSectors();
                if (s.data.length) setSectorOptions(s.data.map(sector => ({ id: sector.id, name: sector.name })));
            } catch { /* keep fallback */ }
            try {
                const c = await api.getCountries();
                if (c.by_region) {
                    const names = Object.values(c.by_region)
                        .flatMap(region => region.countries.map(country => country.name))
                        .filter(Boolean)
                        .sort((a, b) => a.localeCompare(b));
                    if (names.length) setCountryOptions(names);
                }
            } catch { /* keep fallback */ }
        })();
    }, []);

    useEffect(() => {
        const fetchPrefs = async () => {
            try {
                const res = await api.getPreferences();
                if (res.preferences) {
                    setPreferences({
                        countries_of_interest: res.preferences.countries_of_interest || [],
                        sectors_of_interest: res.preferences.sectors_of_interest || [],
                    });
                    if (res.preferences.notification_preferences) {
                        setNotifications(res.preferences.notification_preferences);
                    }
                }
            } catch (e) {
                console.error("Failed to load preferences", e);
            }
        };
        fetchPrefs();
    }, []);

    const toggleNotification = (key: keyof typeof notifications) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleArrayItem = (key: 'countries_of_interest' | 'sectors_of_interest', value: string) => {
        if (!isEditing) return;
        setPreferences(prev => ({
            ...prev,
            [key]: prev[key].includes(value)
                ? prev[key].filter(i => i !== value)
                : [...prev[key], value]
        }));
    };

    const handleSave = async () => {
        if (!isEditing) {
            setIsEditing(true);
            return;
        }

        setIsSaving(true);
        try {
            await api.savePreferences({
                countries_of_interest: preferences.countries_of_interest,
                sectors_of_interest: preferences.sectors_of_interest,
                notification_preferences: notifications
            });
            
            // Update local storage profile name/role
            const saved = localStorage.getItem('boa_client_info');
            if (saved) {
                const parsed = JSON.parse(saved);
                parsed.name = user.name;
                parsed.organization = user.role;
                localStorage.setItem('boa_client_info', JSON.stringify(parsed));
            }
            
            toast.success("Settings saved successfully.");
            setIsEditing(false);
        } catch {
            toast.error("Failed to save settings.");
        } finally {
            setIsSaving(false);
        }
    };

    // AUTH GATE, no settings form is shown to unauthenticated visitors (spec §3.10)
    if (!isAuthenticated) {
        return (
            <div className="container py-20 max-w-4xl">
                <SEO title="Settings" description="Manage your Best of Africa account, preferences, and subscription." />
                <div className="mx-auto flex max-w-md flex-col items-center rounded-xl border border-white/10 bg-navy px-8 py-14 text-center text-white shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
                    <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-navy-card shadow-[0_0_40px_rgba(15,31,61,0.3)]">
                        <LockClosedIcon className="h-7 w-7 text-accent" />
                    </div>
                    <h1 className="mb-3 text-2xl font-serif font-bold">Sign in to access your settings</h1>
                    <p className="mb-8 text-sm text-white/60">Your account, preferences, and subscription live behind a secure login.</p>
                    <Button asChild className="bg-accent text-navy hover:bg-gold-italic font-bold uppercase tracking-widest px-8">
                        <Link to="/login">Sign In</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <SEO title="Settings" description="Manage your Best of Africa account, preferences, and subscription." />
            <div className="container py-20 max-w-4xl">
                <header className="mb-12 border-b border-border pb-8">
                    <h1 className="mb-2 text-4xl font-serif font-black tracking-tight text-foreground">Control Center</h1>
                    <p className="text-lg text-muted-foreground">Manage your account, preferences, and subscription.</p>
                </header>

                <div className="grid gap-10">
                    <div className="flex justify-end -mb-4">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-8 font-bold bg-accent text-navy hover:bg-gold-italic"
                        >
                            {isSaving && <UpdateIcon className="w-4 h-4 mr-2 animate-spin" />}
                            {isEditing ? 'Save Changes' : 'Edit Profile'}
                        </Button>
                    </div>

                    {/* PROFILE SETTINGS */}
                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-primary">
                                        <PersonIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold text-foreground">Profile Details</CardTitle>
                                        <CardDescription>Personal information and professional credentials.</CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={user.name}
                                        readOnly={!isEditing}
                                        onChange={(e) => setUser({ ...user, name: e.target.value })}
                                        className={cn(!isEditing && "bg-muted text-muted-foreground")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        value={user.email}
                                        readOnly={true}
                                        className="bg-muted text-muted-foreground"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Professional Role / Organization</Label>
                                    <Input
                                        id="role"
                                        value={user.role}
                                        readOnly={!isEditing}
                                        onChange={(e) => setUser({ ...user, role: e.target.value })}
                                        className={cn(!isEditing && "bg-muted text-muted-foreground")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Account Tier</Label>
                                    <div className="flex items-center h-10 px-3 rounded-full bg-secondary border border-border">
                                        <Badge variant="secondary" className="bg-background/10 text-primary hover:bg-background/20 mr-2">
                                            {user.tier}
                                        </Badge>
                                        {memberData?.expires_in_days != null && (
                                            <span className="text-sm text-muted-foreground">Access renews in {memberData.expires_in_days} days</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* INTELLIGENCE PARAMETERS */}
                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-primary">
                                    <LightningBoltIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-foreground">Intelligence Parameters</CardTitle>
                                    <CardDescription>
                                        Choose the countries, sectors and formats used to assemble your current briefing.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <Label>Tracked Countries</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {countryOptions.map(country => {
                                            const isActive = preferences.countries_of_interest.includes(country);
                                            return (
                                                <Badge
                                                    key={country}
                                                    variant={isActive ? "default" : "outline"}
                                                    className={cn(
                                                        "px-3 py-1 cursor-pointer transition-colors",
                                                        !isEditing && "opacity-70 cursor-not-allowed",
                                                        isActive ? "bg-background text-foreground" : "hover:bg-background/5"
                                                    )}
                                                    onClick={() => toggleArrayItem('countries_of_interest', country)}
                                                >
                                                    {country}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label>Tracked Sectors</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {sectorOptions.map(sector => {
                                            const isActive = preferences.sectors_of_interest.includes(sector.id);
                                            return (
                                                <Badge
                                                    key={sector.id}
                                                    variant={isActive ? "default" : "outline"}
                                                    className={cn(
                                                        "px-3 py-1 cursor-pointer transition-colors capitalize",
                                                        !isEditing && "opacity-70 cursor-not-allowed",
                                                        isActive ? "bg-accent text-primary" : "hover:bg-accent/10 hover:text-accent"
                                                    )}
                                                    onClick={() => toggleArrayItem('sectors_of_interest', sector.id)}
                                                >
                                                    {sector.name}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* NOTIFICATIONS */}
                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-primary">
                                    <BellIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-foreground">Notifications</CardTitle>
                                    <CardDescription>Configure how you receive intelligence alerts.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {[
                                { key: 'email', label: 'Email Digest', desc: 'Daily summary of tracked markets.', icon: EnvelopeClosedIcon },
                                { key: 'push', label: 'Real-time Alerts', desc: 'Immediate notification for high-volatility events.', icon: LightningBoltIcon },
                                { key: 'reports', label: 'New Reports', desc: 'When new premium reports are published.', icon: IdCardIcon },
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between rounded-3xl border border-border p-4 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="rounded-full bg-card p-2 shadow-sm border border-border">
                                            <item.icon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground">{item.label}</div>
                                            <div className="text-xs text-muted-foreground">{item.desc}</div>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={notifications[item.key as keyof typeof notifications]}
                                        onCheckedChange={() => toggleNotification(item.key as keyof typeof notifications)}
                                        disabled={!isEditing}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* SECURITY & DANGER ZONE */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <ExitIcon className="h-5 w-5 text-destructive" />
                                    <CardTitle className="text-base font-bold text-destructive">Session</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-destructive">Securely sign out of your account on all devices.</p>
                                <Button variant="destructive" className="w-full" onClick={logout}>
                                    Sign Out
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};
