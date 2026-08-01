import { useEffect, useRef, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Activity, Zap, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { request } from '../../services/api';
import { stripMarkdown } from '@/lib/utils';
import { activeReaderLocale } from '@/i18n/locale';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentTask {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

interface AgentMetricRow {
  agent_name: string;
  runs: number;
  tasks_done: number;
  tasks_failed: number;
  avg_duration_ms: number;
  last_run_at: string;
}

interface AgentStatus {
  health: 'OPERATIONAL' | 'BUSY' | 'IDLE' | 'DEGRADED';
  tasks_24h: { pending: number; processing: number; completed: number; failed: number; stalled?: number };
  recent_tasks: AgentTask[];
  latest_article: { title: string; slug: string; published_at: string; country_code: string } | null;
  metrics_7d: AgentMetricRow[];
  generated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TASK_TYPE_LABELS: Record<string, string> = {
  generate_article:      'Article preparation',
  audit_article:         'Editorial review',
  evolve_instructions:   'Editorial standards review',
  instruction_update:    'Standards update',
};

const HEALTH_CONFIG: Record<string, { label: string; color: string; pulse: boolean }> = {
  OPERATIONAL: { label: 'Operational',  color: '#22c55e', pulse: false },
  BUSY:        { label: 'Running',      color: '#0F1F3D', pulse: true  },
  IDLE:        { label: 'Idle',         color: '#6b7280', pulse: false },
  DEGRADED:    { label: 'Degraded',     color: '#ef4444', pulse: true  },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const relative = new Intl.RelativeTimeFormat(activeReaderLocale(), { numeric: 'auto' });
  if (mins < 1) return relative.format(0, 'minute');
  if (mins < 60) return relative.format(-mins, 'minute');
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return relative.format(-hrs, 'hour');
  return relative.format(-Math.floor(hrs / 24), 'day');
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusDot({ health }: { health: string }) {
  const cfg = HEALTH_CONFIG[health];
  return (
    <span className="relative flex h-2.5 w-2.5">
      {cfg.pulse && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: cfg.color }} />
      )}
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: cfg.color }} />
    </span>
  );
}

function TaskBadge({ status }: { status: AgentTask['status'] }) {
  const cfg = {
    pending:    { label: 'Queued',    cls: 'bg-foreground/10 text-foreground/50' },
    processing: { label: 'Running',   cls: 'bg-accent/20 text-accent' },
    completed:  { label: 'Done',      cls: 'bg-accent/20 text-accent' },
    failed:     { label: 'Failed',    cls: 'bg-destructive/20 text-destructive' },
  }[status];
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AgentStatusPanel() {
  const [showTasks, setShowTasks] = useState(false);
  const [sseData, setSseData] = useState<Partial<AgentStatus> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const sseRetryCount = useRef(0);
  const sseRetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Expose a helper to parse unknown task types into readable strings
  const getTaskLabel = (type: string) => TASK_TYPE_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Only activate SSE + polling once the panel scrolls into view (saves network on page load)
  const { ref: panelRef, inView } = useInView({ triggerOnce: true, rootMargin: '100px' });

  // Poll agent status every 30s, only when panel is visible
  const { data: status, isLoading: isStatusLoading } = useQuery<AgentStatus>({
    queryKey: ['agent-status'],
    queryFn: () => request<AgentStatus>('/agent/status'),
    refetchInterval: inView ? 30_000 : false,
    staleTime: 25_000,
    enabled: inView,
  });

  // SSE connection factory with exponential backoff reconnect (max 3 retries)
  const connectSSE = useCallback(function connect() {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';
    const es = new EventSource(`${API_BASE}/agent/stream`);
    eventSourceRef.current = es;

    const handleAgentStatus = (e: MessageEvent) => {
      try { setSseData(JSON.parse(e.data)); } catch { /* ignore */ }
    };

    es.addEventListener('agent_status', handleAgentStatus);

    es.onerror = () => {
      es.removeEventListener('agent_status', handleAgentStatus);
      es.close();
      eventSourceRef.current = null;
      // Exponential backoff: 2s, 4s, 8s, give up after 3 retries
      if (sseRetryCount.current < 3) {
        const delay = Math.pow(2, sseRetryCount.current + 1) * 1000;
        sseRetryCount.current += 1;
        console.warn(`[AgentStatusPanel] SSE disconnected. Reconnecting in ${delay}ms (attempt ${sseRetryCount.current}/3)...`);
        sseRetryTimer.current = setTimeout(connect, delay);
      } else {
        console.warn('[AgentStatusPanel] SSE max retries reached. Relying on polling only.');
      }
    };

    return () => {
      es.removeEventListener('agent_status', handleAgentStatus);
      es.close();
    };
  }, []);

  // Open SSE only when panel scrolls into view
  useEffect(() => {
    if (!inView) return;
    sseRetryCount.current = 0;
    const cleanup = connectSSE();
    return () => {
      cleanup();
      if (sseRetryTimer.current) clearTimeout(sseRetryTimer.current);
    };
  }, [inView, connectSSE]);

  // Merge SSE data over the polled data
  const live: AgentStatus | null = status
    ? { ...status, ...(sseData || {}) }
    : null;

  const health = live?.health || 'IDLE';
  const healthCfg = HEALTH_CONFIG[health];

  // m10 FIX: Decouple loading state from inView sentinel.
  // Show the skeleton when in-view but waiting on the first API response,
  // not the full "booting" screen which can persist for up to 30s.
  if (!inView || (isStatusLoading && !live)) {
    return (
      <div ref={panelRef} className="bg-card border border-foreground/10 rounded-2xl overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 border-b border-foreground/10 bg-card">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive/20 border border-destructive/50" />
            <div className="w-3 h-3 rounded-full bg-muted-foreground/20 border border-muted-foreground/50" />
            <div className="w-3 h-3 rounded-full bg-accent/20 border border-accent/50" />
          </div>
          <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest">
            Core OS v1.0.0
          </div>
        </div>
        <div className="relative min-h-[200px] p-6 flex flex-col items-center justify-center bg-card font-mono">
          <div className="w-8 h-8 border-2 border-accent/20 border-t-[#0F1F3D] rounded-full animate-spin mb-4" />
          <span className="text-accent text-sm tracking-widest animate-pulse">
            {!inView ? 'CONNECTING TO NEWSROOM...' : 'LOADING SYSTEM STATUS...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={panelRef} className="bg-card border border-foreground/10 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-foreground/5">
          <div className="flex items-center gap-3">
            <Activity size={18} className="text-accent" />
            <span className="font-semibold text-foreground text-sm tracking-wide">Core System</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot health={health} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: healthCfg.color }}>
              {healthCfg.label}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-white/5 border-b border-foreground/5">
          {[
            { label: 'Pending',    value: live?.tasks_24h.pending    ?? '-', icon: Clock,        color: 'text-foreground/50' },
            { label: 'Running',    value: live?.tasks_24h.processing  ?? '-', icon: Zap,          color: 'text-accent' },
            { label: 'Done (24h)', value: live?.tasks_24h.completed   ?? '-', icon: CheckCircle,  color: 'text-accent' },
            { label: 'Failed',     value: live?.tasks_24h.failed      ?? '-', icon: AlertCircle,  color: 'text-destructive' },
            { label: 'Stalled',    value: live?.tasks_24h.stalled     ?? '-', icon: AlertCircle,  color: live?.tasks_24h.stalled ? 'text-destructive' : 'text-foreground/20' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex flex-col items-center justify-center py-4 px-2 gap-1">
              <Icon size={14} className={color} />
              <span className={`text-lg font-bold font-serif ${color}`}>{value}</span>
              <span className="text-[10px] text-foreground/30 uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>

        {/* Latest article */}
        {live?.latest_article && (
          <div className="px-6 py-4 border-b border-foreground/5">
            <p className="text-[10px] text-foreground/30 uppercase tracking-wider mb-1">Latest Published</p>
            <a
              href={`/stories/${live.latest_article.slug}`}
              className="text-sm text-foreground/80 hover:text-accent transition-colors line-clamp-1"
            >
              {stripMarkdown(live.latest_article.title)}
            </a>
            <p className="text-[10px] text-foreground/30 mt-0.5">{relativeTime(live.latest_article.published_at)}</p>
          </div>
        )}

        {/* Recent tasks toggle */}
        {live && live.recent_tasks.length > 0 && (
          <div>
            <button
              onClick={() => setShowTasks(v => !v)}
              className="w-full flex items-center justify-between px-6 py-3 text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
            >
              <span className="uppercase tracking-wider font-semibold">Recent Tasks ({live.recent_tasks.length})</span>
              {showTasks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {showTasks && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 space-y-2">
                    {live.recent_tasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between py-2 border-b border-foreground/5 last:border-0">
                        <div>
                          <h4 className="font-medium text-[13px]">{getTaskLabel(task.type)}</h4>
                          <p className="text-[10px] text-foreground/30">{relativeTime(task.created_at)}</p>
                        </div>
                        <TaskBadge status={task.status} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 7-day skill metrics table */}
        {live?.metrics_7d && live.metrics_7d.length > 0 && (
          <div className="px-6 pb-4 border-t border-foreground/5 pt-4">
            <p className="text-[10px] text-foreground/30 uppercase tracking-wider mb-3">7-day skill performance</p>
            <div className="responsive-data-table w-full overflow-x-auto">
              <table className="w-full text-[11px] text-left">
                <thead>
                  <tr className="text-foreground/25 uppercase tracking-wider">
                    <th className="pb-2 pr-4 font-medium">Pipeline</th>
                    <th className="pb-2 pr-3 font-medium text-right">Runs</th>
                    <th className="pb-2 pr-3 font-medium text-right">Done</th>
                    <th className="pb-2 pr-3 font-medium text-right">Fail</th>
                    <th className="pb-2 font-medium text-right">Avg ms</th>
                  </tr>
                </thead>
                <tbody>
                  {live.metrics_7d.map((row) => (
                    <tr key={row.agent_name} className="border-t border-foreground/5">
                      <td data-label="Pipeline" className="py-1.5 pr-4 text-foreground/70 font-medium">{row.agent_name}</td>
                      <td data-label="Runs" className="py-1.5 pr-3 text-foreground/50 text-right">{row.runs}</td>
                      <td data-label="Done" className="py-1.5 pr-3 text-accent text-right">{row.tasks_done}</td>
                      <td data-label="Fail" className="py-1.5 pr-3 text-right">
                        <span className={row.tasks_failed > 0 ? 'text-destructive' : 'text-foreground/20'}>{row.tasks_failed}</span>
                      </td>
                      <td data-label="Average duration" className="py-1.5 text-foreground/40 text-right">{row.avg_duration_ms ? `${Math.round(row.avg_duration_ms).toLocaleString()}ms` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer timestamp */}
        {live?.generated_at && (
          <div className="px-6 py-3 border-t border-foreground/5">
            <p className="text-[10px] text-foreground/20">Updated {relativeTime(live.generated_at)}</p>
          </div>
        )}
      </div>

    </>
  );
}
