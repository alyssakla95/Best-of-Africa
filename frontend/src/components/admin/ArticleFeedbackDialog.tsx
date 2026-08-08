import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UpdateIcon } from '@radix-ui/react-icons';

interface ArticleFeedbackDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (feedback: string) => Promise<void>;
    title: string;
    description: string;
    actionLabel: string;
}

export const ArticleFeedbackDialog: React.FC<ArticleFeedbackDialogProps> = ({
    isOpen,
    onClose,
    onSubmit,
    title,
    description,
    actionLabel
}) => {
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!feedback.trim()) return;
        
        setIsLoading(true);
        try {
            await onSubmit(feedback);
            setFeedback('');
            onClose();
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="font-serif font-black">{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="feedback">Editorial feedback</Label>
                        <Textarea
                            id="feedback"
                            placeholder="Why is this change necessary? (e.g., Tone issues, unsupported claims, missing context...)"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isLoading || !feedback.trim()}
                        className="bg-background text-foreground font-bold"
                    >
                        {isLoading ? <UpdateIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {actionLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
