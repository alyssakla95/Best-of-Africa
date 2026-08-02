import React, { useEffect, useRef, useState } from 'react';
import { BellIcon, BellOffIcon, CheckIcon, ArrowRightIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api, type ReaderNotification } from '../services/api';
import { stripMarkdown } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatReaderDate } from '../i18n/locale';

export const NotificationBell: React.FC = () => {
    const [open, setOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
    const { data, isError } = useQuery({
        queryKey: ['reader-notifications'],
        queryFn: api.getNotifications,
        refetchInterval: 60_000,
        retry: 1,
    });
    const notifications = data?.data || [];
    const unreadNotifications = notifications.filter(notification => !notification.is_read);
    const unread = unreadNotifications.length;

    const togglePanel = () => {
        const nextOpen = !open;
        setOpen(nextOpen);
        if (!nextOpen || unreadNotifications.length === 0) return;

        queryClient.setQueryData<{ data: ReaderNotification[] }>(
            ['reader-notifications'],
            current => ({ data: (current?.data || []).map(notification => ({ ...notification, is_read: true })) }),
        );
        void api.markNotificationsRead(unreadNotifications.map(notification => notification.id))
            .catch(() => queryClient.invalidateQueries({ queryKey: ['reader-notifications'] }));
    };

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={popoverRef}>
            <button
                id="notification-bell"
                onClick={togglePanel}
                className="relative p-2 rounded-full hover:bg-background/10 transition-colors text-primary/70 hover:text-primary"
                aria-label="Notifications"
            >
                <BellIcon className="w-5 h-5" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-primary text-[9px] font-black rounded-full flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-background rounded-2xl border border-primary/10 shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-primary/8">
                            <span className="text-sm font-bold text-primary">Alerts</span>
                            {unread === 0 && notifications.length > 0 && (
                                <span className="text-xs text-primary/40 flex items-center gap-1">
                                    <CheckIcon className="w-3 h-3" /> All read
                                </span>
                            )}
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-primary/5">
                            {isError ? (
                                <div className="py-10 text-center text-primary/40">
                                    <BellOffIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Notifications unavailable</p>
                                    <p className="text-xs mt-1">Could not reach the service. It will retry automatically.</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-10 text-center text-primary/40">
                                    <BellOffIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No notifications yet</p>
                                    <p className="text-xs mt-1">We'll alert you when new intelligence matches your interests</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`px-5 py-4 transition-colors ${!n.is_read ? 'bg-accent/5' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {!n.is_read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-primary leading-snug mb-0.5">{stripMarkdown(n.title)}</p>
                                                <p className="text-xs text-primary/50 leading-relaxed line-clamp-2">{stripMarkdown(n.message)}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-[10px] text-primary/30">
                                                        {formatReaderDate(n.created_at, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                    {n.article_slug && (
                                                        <Link
                                                            to={`/posts/${n.article_slug}`}
                                                            onClick={() => setOpen(false)}
                                                            className="text-[10px] text-accent font-bold flex items-center gap-0.5 hover:underline"
                                                        >
                                                            Read <ArrowRightIcon className="w-2.5 h-2.5" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="px-5 py-3 border-t border-primary/8 bg-background/2">
                            <Link
                                to="/settings"
                                onClick={() => setOpen(false)}
                                className="text-xs text-primary/50 hover:text-primary transition-colors"
                            >
                                Manage alert preferences →
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
