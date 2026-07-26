import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { EnvelopeClosedIcon, ChatBubbleIcon, PaperPlaneIcon, UpdateIcon } from '@radix-ui/react-icons';
import { toast } from "sonner"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SEO } from '../components/SEO';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';

export const ContactPage: React.FC = () => {
    const { data: config } = useSystemConfig();
    const [searchParams] = useSearchParams();
    const requestedInquiry = searchParams.get('inquiry');
    const initialInquiry = requestedInquiry === 'Market Entry Pilot' || requestedInquiry === 'Security Review'
        ? requestedInquiry
        : 'Strategic Partnership';
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        organization: '',
        email: '',
        inquiry_type: initialInquiry,
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setError('');

        try {
            const res = await fetch(`${API_BASE}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to submit');
            }

            setStatus('success');
            setFormData({ name: '', organization: '', email: '', inquiry_type: initialInquiry, message: '' });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setStatus('error');
        }
    };

    return (
        <>
            <SEO title="Contact" description="Reach Best of Africa for media inquiries, partnership opportunities, or support." />
            <div className="container py-14 md:py-20 max-w-5xl">
                <div className="app-hero mb-10 max-w-3xl rounded-lg p-6 sm:p-8 md:p-10">
                    <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Contact</p>
                    <h1 className="mb-4 text-4xl font-serif font-semibold text-foreground md:text-5xl">
                        {config?.['contact_headline'] || "Contact Best of Africa"}
                    </h1>
                    <p className="text-lg leading-relaxed text-ink-blue">
                        For media inquiries, partnership opportunities, or support.
                    </p>
                </div>

                {status === 'success' ? (
                    <Card className="rounded-xl border-border bg-card text-center text-foreground shadow-none">
                        <CardContent className="flex flex-col items-center py-12">
                            <div className="mb-6 rounded-full bg-accent/10 p-4">
                                <PaperPlaneIcon className="h-12 w-12 text-accent" />
                            </div>
                            <h2 className="mb-2 text-2xl font-bold">Message Sent</h2>
                            <p className="mb-8 text-muted-foreground">Thank you for reaching out. We will review your inquiry shortly.</p>
                            <Button
                                className="bg-accent text-navy hover:bg-gold-italic font-bold"
                                onClick={() => {
                                    setStatus('idle');
                                    toast.info("Ready for new message");
                                }}
                            >
                                Send Another
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="rounded-xl border-border bg-card text-foreground shadow-none">
                        <CardHeader>
                            <CardTitle className="text-foreground">Send us a message</CardTitle>
                            <CardDescription>We typically respond within 24 business hours.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Your Name"
                                            className="bg-background text-ink border-border placeholder:text-ink-mute focus-visible:ring-accent"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="org">Organization</Label>
                                        <Input
                                            id="org"
                                            value={formData.organization}
                                            onChange={e => setFormData({ ...formData, organization: e.target.value })}
                                            placeholder="Company / Institution"
                                            className="bg-background text-ink border-border placeholder:text-ink-mute focus-visible:ring-accent"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="official@organization.com"
                                        className="bg-background text-ink border-border placeholder:text-ink-mute focus-visible:ring-accent"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Inquiry Type</Label>
                                    <Select
                                        value={formData.inquiry_type}
                                        onValueChange={(value) => setFormData({ ...formData, inquiry_type: value })}
                                    >
                                        <SelectTrigger id="type" className="bg-background text-ink border-border">
                                            <SelectValue placeholder="Select Inquiry Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Market Entry Pilot">Market Entry Pilot</SelectItem>
                                            <SelectItem value="Security Review">Security / Procurement Review</SelectItem>
                                            <SelectItem value="Strategic Partnership">Strategic Partnership</SelectItem>
                                            <SelectItem value="Media / Press">Media / Press</SelectItem>
                                            <SelectItem value="Report Access">Report Access</SelectItem>
                                            <SelectItem value="Technical Support">Technical Support</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea
                                        id="message"
                                        required
                                        rows={5}
                                        value={formData.message}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="How can we assist you?"
                                        className="bg-background text-ink border-border placeholder:text-ink-mute focus-visible:ring-accent"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={status === 'submitting'}
                                    className="w-full font-bold bg-accent text-navy hover:bg-gold-italic"
                                >
                                    {status === 'submitting' ? (
                                        <>
                                            <UpdateIcon className="mr-2 h-4 w-4 animate-spin" /> Sending...
                                        </>
                                    ) : (
                                        <>
                                            <PaperPlaneIcon className="mr-2 h-4 w-4" /> Send Message
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="flex flex-col items-start rounded-xl bg-card border border-border p-7 text-left">
                        <ChatBubbleIcon className="mb-4 h-8 w-8 text-primary" />
                        <h3 className="mb-2 text-lg font-bold text-foreground">Press Inquiries</h3>
                        <p className="text-sm text-muted-foreground font-medium">Use the form above and select a press-related subject.</p>
                    </div>
                    <div className="flex flex-col items-start rounded-xl bg-card border border-border p-7 text-left">
                        <EnvelopeClosedIcon className="mb-4 h-8 w-8 text-primary" />
                        <h3 className="mb-2 text-lg font-bold text-foreground">General Support</h3>
                        <p className="text-sm text-muted-foreground font-medium">Use the form above so the request is recorded and routed.</p>
                    </div>
                </div>
            </div>
        </>
    );
};
