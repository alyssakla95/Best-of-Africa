import React from 'react';
import { Button } from "@/components/ui/button";
import {
    BookmarkIcon,
    Share1Icon,
    DownloadIcon,
    PlusIcon,
    CheckIcon
} from '@radix-ui/react-icons';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ActionBarProps {
    title: string;
    type: 'article' | 'country' | 'sector';
    className?: string;
}

export const ActionBar: React.FC<ActionBarProps> = ({ title, type, className }) => {
    const [isSaved, setIsSaved] = React.useState(false);
    const [isTracked, setIsTracked] = React.useState(false);

    const handleSave = () => {
        setIsSaved(!isSaved);
        toast.success(isSaved ? "Removed from Library" : "Saved to Library");
    };

    const handleTrack = () => {
        setIsTracked(!isTracked);
        toast.success(isTracked ? `Stopped tracking ${type}` : `Now tracking ${type} updates`);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
    };

    const handleExport = () => {
        toast.info("Generating PDF Briefing...");
        setTimeout(() => toast.success("Download ready"), 1500);
    };

    return (
        <div className={cn("sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
            <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className="hidden md:flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{type} Intelligence</span>
                        <span className="truncate text-sm font-bold text-foreground max-w-[300px] lg:max-w-[500px]">{title.replace(/\*\*/g, '').replace(/##/g, '')}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleSave} className={cn("gap-2", isSaved && "bg-background/10 text-primary border-primary/20")}>
                        {isSaved ? <BookmarkIcon className="h-4 w-4" /> : <BookmarkIcon className="h-4 w-4" />}
                        <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
                    </Button>

                    {type !== 'article' && (
                        <Button variant="outline" size="sm" onClick={handleTrack} className={cn("gap-2", isTracked && "bg-accent/10 text-accent border-accent/20")}>
                            {isTracked ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                            <span className="hidden sm:inline">{isTracked ? "Tracking" : "Track Topic"}</span>
                        </Button>
                    )}

                    <Button variant="ghost" size="icon" onClick={handleShare}>
                        <Share1Icon className="h-4 w-4" />
                    </Button>

                    <Button variant="default" size="sm" onClick={handleExport} className="gap-2">
                        <DownloadIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Export PDF</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};
