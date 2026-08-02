import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner';
import { UpdateIcon, CheckCircledIcon } from '@radix-ui/react-icons';

const formSchema = z.object({
    user_email: z.string().email("Invalid email address"),
    user_name: z.string().min(2, "Name is required"),
    user_organization: z.string().optional(),
    user_title: z.string().optional(),
    ticket_type: z.enum(["Standard", "VIP", "Media"]),
    dietary_requirements: z.string().optional(),
    special_requests: z.string().optional(),
});

interface EventRegistrationFormProps {
    eventId: string;
    onSuccess?: () => void;
}

export function EventRegistrationForm({ eventId, onSuccess }: EventRegistrationFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [confirmationCode, setConfirmationCode] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            user_email: "",
            user_name: "",
            user_organization: "",
            user_title: "",
            ticket_type: "Standard",
            dietary_requirements: "",
            special_requests: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1'}/services/events/${eventId}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (data.success) {
                setIsSuccess(true);
                setConfirmationCode(data.data.confirmation_code);
                toast.success("Registration successful!");
                if (onSuccess) onSuccess();
            } else {
                toast.error(data.message || "Registration failed");
            }
        } catch (err) {
            console.error('Registration failed:', err);
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center bg-accent/10 rounded-lg border border-accent/20">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                    <CheckCircledIcon className="w-6 h-6 text-accent" />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-foreground">You're Registered!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Check your email for full details.
                    </p>
                </div>
                <div className="w-full p-3 bg-background dark:bg-card rounded border border-dashed border-accent/30">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Confirmation Code</p>
                    <code className="text-lg font-mono font-bold text-primary">{confirmationCode}</code>
                </div>
                <Button variant="outline" onClick={() => setIsSuccess(false)} className="mt-4">
                    Register Another Person
                </Button>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <fieldset disabled={isSubmitting} className="space-y-4 disabled:opacity-60 disabled:pointer-events-none">
                <FormField
                    control={form.control}
                    name="user_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="user_email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                                <Input placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="user_organization"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Organization</FormLabel>
                                <FormControl>
                                    <Input placeholder="Acme Corp" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="user_title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Job Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="Director" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="ticket_type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ticket Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select ticket type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Standard">Standard Access</SelectItem>
                                    <SelectItem value="VIP">VIP All-Access</SelectItem>
                                    <SelectItem value="Media">Media Pass</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="dietary_requirements"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Dietary Requirements (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Vegetarian, Gluten-free, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                </fieldset>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <UpdateIcon className="mr-2 h-4 w-4 animate-spin" />
                            Registering...
                        </>
                    ) : (
                        "Complete Registration"
                    )}
                </Button>
            </form>
        </Form>
    );
}
