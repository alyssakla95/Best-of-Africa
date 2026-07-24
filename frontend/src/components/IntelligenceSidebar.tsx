import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DesktopIcon, PersonIcon, StarIcon, PaperPlaneIcon } from '@radix-ui/react-icons';
import { Badge } from '@/components/ui/badge';
import { EditorialContent } from '@/components/EditorialContent';


interface IntelligenceSidebarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const IntelligenceSidebar: React.FC<IntelligenceSidebarProps> = ({ open, onOpenChange }) => {
    const [query, setQuery] = useState("");
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', content: "Select a Lens above to adapt the market insights, or ask me to refine the parameters." }
    ]);

    const handleSend = async () => {
        if (!query.trim()) return;

        // Add user message
        const newHistory = [...chatHistory, { role: 'user', content: query }];
        setChatHistory(newHistory);
        const userQuery = query;
        setQuery("");

        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';
            const res = await fetch(`${API_BASE}/intel/ai-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('boa_auth_token') || ''}`
                },
                body: JSON.stringify({ message: userQuery, context: 'sidebar' })
            });

            if (res.ok) {
                const data = await res.json();
                setChatHistory(prev => [...prev, {
                    role: 'assistant',
                    content: data.response || data.message || "I processed your request."
                }]);
            } else {
                setChatHistory(prev => [...prev, {
                    role: 'assistant',
                    content: "I encountered an issue processing your request. Please try again."
                }]);
            }
        } catch (err) {
            console.error('AI chat error:', err);
            setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: "Connection error. The intelligence service may be temporarily unavailable."
            }]);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0 border-l border-primary/20 bg-background/95 backdrop-blur-xl">

                {/* ADAPTIVE HEADER */}
                <SheetHeader className="p-6 border-b border-border bg-muted/10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Market Context</div>
                    </div>
                    <SheetTitle className="flex items-center gap-2 text-xl font-black">
                        <StarIcon className="h-5 w-5 text-primary" /> Adaptive Intelligence
                    </SheetTitle>
                    <SheetDescription className="text-muted-foreground/80">
                        Configure the narrative lens and calibrate data vectors.
                    </SheetDescription>

                    {/* ADAPTIVE CONTROLS */}
                    <div className="mt-6 space-y-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Narrative Lens</div>
                        <div className="grid grid-cols-3 gap-2">
                            <Button variant="outline" size="sm" className="bg-background/5 border-primary/20 text-primary hover:bg-background hover:text-foreground transition-colors">
                                Investor
                            </Button>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                Gov/Policy
                            </Button>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                NGO
                            </Button>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="space-y-6">
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <Avatar className="h-8 w-8 border border-border shrink-0">
                                    <AvatarFallback className={msg.role === 'system' ? 'bg-background text-foreground' : 'bg-muted'}>
                                        {msg.role === 'system' ? <DesktopIcon className="h-4 w-4" /> : <PersonIcon className="h-4 w-4" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={`p-3 rounded-lg text-sm leading-relaxed shadow-sm ${msg.role === 'system'
                                    ? 'bg-muted/50 border border-border text-foreground'
                                    : 'bg-background text-foreground'
                                    }`}>
                                    <span className="block mb-1 text-[10px] font-bold uppercase tracking-widest opacity-50">
                                        {msg.role === 'user' ? 'Your question' : 'Briefing'}
                                    </span>
                                    {msg.role === 'user'
                                      ? msg.content
                                      : <EditorialContent content={msg.content} className="editorial-content-compact" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-border bg-background">
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                        <Badge variant="outline" className="cursor-pointer hover:bg-background/10 transition-colors">Summarize Risks</Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-background/10 transition-colors">Identify Opps</Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-background/10 transition-colors">Draft Briefing</Badge>
                    </div>
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex gap-2"
                    >
                        <Input
                            placeholder="Refine parameters..."
                            className="flex-1 bg-muted/20 focus-visible:ring-primary/20"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <Button type="submit" size="icon" className="shrink-0 shadow-sm">
                            <PaperPlaneIcon className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
};
