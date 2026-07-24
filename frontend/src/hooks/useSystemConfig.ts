
import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL;

export function useSystemConfig() {
    return useQuery({
        queryKey: ['system-config'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/config/system`);
            if (!res.ok) throw new Error('Failed to fetch config');
            return res.json() as Promise<Record<string, string>>;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
