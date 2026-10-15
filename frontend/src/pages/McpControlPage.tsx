import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export default function McpControlPage() {
  const qc = useQueryClient();

  const { data: servers, isLoading: sLoading } = useQuery({
    queryKey: ['mcp-servers'],
    queryFn: api.getMcpServers,
    refetchInterval: 5000,
  });

  const { data: tools, isLoading: tLoading } = useQuery({
    queryKey: ['mcp-tools'],
    queryFn: api.getMcpTools,
    refetchInterval: 10000,
  });

  const { data: invocations } = useQuery({
    queryKey: ['mcp-invocations'],
    queryFn: () => api.listMcpInvocations(),
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
  });

  const refreshMutation = useMutation({
    mutationFn: api.refreshMcp,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mcp-servers'] });
      qc.invalidateQueries({ queryKey: ['mcp-tools'] });
      qc.invalidateQueries({ queryKey: ['mcp-invocations'] });
    },
  });

  // Format raw result_summary (Python dict strings → human-readable)
  const fmtSummary = (raw: string | null | undefined): string => {
    if (!raw) return '—';
    // Strip outer list/dict noise; pull key fields
    let s = raw
      .replace(/\[\{/g, '').replace(/\}\]/g, '')
      .replace(/\{'/g, '').replace(/\}'/, '')
      .replace(/': '/g, ': ').replace(/', '/g, ' · ')
      .replace(/True/g, '✓').replace(/False/g, '✗')
      .replace(/'overall_eligible': (\S+)/g, 'eligible=$1')
      .replace(/'opportunity_id': '([^']+)'/g, '$1')
      .replace(/'url': '([^']+)'/g, '');
    // Already clean (demo or natural text)
    return s.slice(0, 72) + (s.length > 72 ? '…' : '');
  };

  const statusColor: Record<string, string> = {
    CONNECTED: 'var(--prove)',
    DEGRADED: 'var(--recover)',
    DISCONNECTED: 'var(--predict)',
  };

  const riskColor: Record<string, string> = {
    LOW: 'var(--prove-text)',
    MEDIUM: 'var(--recover-text)',
    HIGH: 'var(--predict-text)',
    CRITICAL: 'var(--predict-text)',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-[var(--tile)] border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['Bricolage_Grotesque'] font-bold text-lg text-[var(--ink)]">MCP CONTROL CENTER</h1>
            <p className="font-mono text-[10px] uppercase mt-0.5 text-[var(--ink-2)] tracking-wider">
              Model Context Protocol servers · tool registry · invocation telemetry
            </p>
          </div>
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--predict)] text-[var(--predict)] hover:bg-[var(--predict-light)] font-mono text-[10px] uppercase font-bold tracking-wider transition-colors"
          >
            <span className="material-symbols-outlined text-xs">refresh</span>
            {refreshMutation.isPending ? 'REFRESHING...' : 'REFRESH MCP'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 content-start">
        {/* Server Status */}
        <div className="col-span-1 space-y-4">
          <div className="tile p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--sand)] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[var(--ink-2)]">hub</span>
              <span className="font-mono text-[10px] uppercase text-[var(--ink)] font-bold tracking-wider">
                SERVER STATUS ({servers?.length || 0})
              </span>
            </div>
            {sLoading ? (
              <div className="p-6 text-center font-mono text-xs text-[var(--ink-2)]">LOADING...</div>
            ) : servers?.map(server => (
              <div key={server.id} className="px-4 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--sand-light)] transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColor[server.status] || 'var(--ink-3)' }} />
                  <span className="font-['Bricolage_Grotesque'] font-bold text-sm text-[var(--ink)]">{server.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  {[
                    { label: 'STATUS', val: server.status, color: statusColor[server.status] },
                    { label: 'TRANSPORT', val: server.transport.toUpperCase(), color: 'var(--ink)' },
                    { label: 'TOOLS', val: server.tool_count, color: 'var(--ink)' },
                    { label: 'LATENCY', val: `${server.latency_ms_ewma.toFixed(0)}ms`, color: 'var(--ink)' },
                  ].map(({ label, val, color }) => (
                    <div key={label}>
                      <span className="font-mono text-[9px] uppercase text-[var(--ink-2)]">{label}: </span>
                      <span className="font-mono text-[10px] font-semibold" style={{ color }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!sLoading && !servers?.length && (
              <div className="p-6 text-center font-mono text-xs text-[var(--ink-2)]">NO SERVERS</div>
            )}
          </div>
        </div>

        {/* Tool Registry */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <div className="tile p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--sand)] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[var(--ink-2)]">build</span>
              <span className="font-mono text-[10px] uppercase text-[var(--ink)] font-bold tracking-wider">
                TOOL REGISTRY ({tools?.length || 0})
              </span>
            </div>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-[var(--border)] font-mono text-[9px] uppercase bg-[var(--sand-light)] text-[var(--ink-2)] tracking-wider">
              <div className="col-span-3">TOOL NAME</div>
              <div className="col-span-2">SERVER</div>
              <div className="col-span-1">RISK</div>
              <div className="col-span-2">REVERSIBILITY</div>
              <div className="col-span-1 text-center">INVERSE</div>
              <div className="col-span-1 text-right">P(FAIL)</div>
              <div className="col-span-2 text-right">STATUS</div>
            </div>
            <div className="max-h-80 overflow-auto divide-y divide-[var(--border)]">
              {tLoading ? (
                <div className="p-6 text-center font-mono text-xs text-[var(--ink-2)]">LOADING TOOLS...</div>
              ) : tools?.map(tool => (
                <div key={`${tool.server_id}/${tool.name}`} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-[var(--sand-light)] transition-colors">
                  <div className="col-span-3 font-mono text-[11px] font-bold text-[var(--ink)] truncate">{tool.name}</div>
                  <div className="col-span-2 font-mono text-[10px] text-[var(--ink-2)] truncate">{tool.server_id}</div>
                  <div className="col-span-1">
                    <span className="font-mono text-[9px] font-bold uppercase" style={{ color: riskColor[tool.risk] }}>{tool.risk}</span>
                  </div>
                  <div className="col-span-2 font-mono text-[10px] text-[var(--ink-2)]">{tool.reversibility}</div>
                  <div className="col-span-1 text-center">
                    <span className="material-symbols-outlined text-sm" style={{ color: tool.has_inverse ? 'var(--prove)' : 'var(--border-strong)' }}>
                      {tool.has_inverse ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                  <div className="col-span-1 font-mono text-[10px] text-right"
                    style={{ color: (tool.health.p_fail || 0) > 0.3 ? 'var(--predict-text)' : 'var(--ink-2)' }}>
                    {tool.health.p_fail != null ? (tool.health.p_fail * 100).toFixed(0) + '%' : '—'}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tool.available ? 'var(--prove)' : 'var(--predict)' }} />
                    <span className="font-mono text-[10px] font-semibold" style={{ color: tool.health.anomaly ? 'var(--recover-text)' : 'var(--ink-2)' }}>
                      {tool.available ? 'OK' : 'DOWN'}{tool.health.anomaly ? ' ANOM' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live MCP Tool Call Log */}
          <div className="tile p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--sand)] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[var(--ink-2)]">terminal</span>
              <span className="font-mono text-[10px] uppercase text-[var(--ink)] font-bold tracking-wider">
                Live MCP Tool Calls
              </span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[var(--predict)] text-[var(--cream)] font-bold ml-1">
                {invocations?.items?.length || 0}
              </span>
              <div className="ml-auto flex items-center gap-2">
                {invocations?.items?.[0]?.id?.startsWith('inv_demo_') && (
                  <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-[var(--sand)] text-[var(--ink-2)] border border-[var(--border)] font-semibold">
                    DEMO
                  </span>
                )}
                <div className="w-2 h-2 rounded-full animate-pulse bg-[var(--predict)]" />
              </div>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-12 gap-1 px-4 py-1.5 border-b border-[var(--border)] font-mono text-[9px] uppercase bg-[var(--sand-light)] text-[var(--ink-2)] tracking-wider">
              <div className="col-span-1">ST</div>
              <div className="col-span-3">TOOL</div>
              <div className="col-span-2">SERVER</div>
              <div className="col-span-1 text-center">ATT</div>
              <div className="col-span-1 text-right">MS</div>
              <div className="col-span-4">RESULT</div>
            </div>

            <div className="max-h-64 overflow-auto divide-y divide-[var(--border)]">
              {!invocations?.items?.length ? (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-[var(--border-strong)] block mb-2">terminal</span>
                  <p className="font-mono text-xs text-[var(--ink-2)]">No tool calls yet</p>
                  <p className="font-mono text-[10px] text-[var(--ink-3)] mt-1">Run a mission to see live MCP invocations</p>
                </div>
              ) : invocations.items.slice(0, 30).map((inv, i) => {
                const isErr = inv.status !== 'OK';
                const isFallback = inv.result_summary?.toLowerCase().includes('fallback');
                return (
                  <div
                    key={inv.id}
                    className="grid grid-cols-12 gap-1 px-4 py-2 items-start hover:bg-[var(--sand-light)] transition-colors"
                    style={{ background: isErr ? 'color-mix(in srgb, var(--predict-light) 40%, transparent)' : undefined }}
                  >
                    {/* Status dot */}
                    <div className="col-span-1 pt-0.5">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: isErr ? 'var(--predict)' : isFallback ? 'var(--recover)' : 'var(--prove)' }}
                      />
                    </div>

                    {/* Tool name */}
                    <div className="col-span-3 font-mono text-[11px] font-bold text-[var(--ink)] truncate" title={inv.tool}>
                      {inv.tool}
                    </div>

                    {/* Server */}
                    <div className="col-span-2 font-mono text-[9px] text-[var(--ink-2)] truncate" title={inv.server_id}>
                      {inv.server_id?.replace('_', ' ')}
                    </div>

                    {/* Attempt */}
                    <div className="col-span-1 text-center font-mono text-[10px]" style={{ color: inv.attempt > 1 ? 'var(--recover-text)' : 'var(--ink-3)' }}>
                      A{inv.attempt}
                    </div>

                    {/* Duration */}
                    <div
                      className="col-span-1 font-mono text-[10px] text-right"
                      style={{ color: (inv.duration_ms || 0) > 150 ? 'var(--recover-text)' : 'var(--ink-2)' }}
                    >
                      {inv.duration_ms > 0 ? `${inv.duration_ms.toFixed(0)}` : '—'}
                    </div>

                    {/* Result summary */}
                    <div
                      className="col-span-4 font-mono text-[9px] leading-tight"
                      style={{ color: isErr ? 'var(--predict-text)' : isFallback ? 'var(--recover-text)' : 'var(--ink-2)' }}
                      title={inv.result_summary || ''}
                    >
                      {(inv.result_summary || '—').slice(0, 60)}{(inv.result_summary?.length || 0) > 60 ? '…' : ''}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer: total count + live indicator */}
            {(invocations?.items?.length || 0) > 0 && (
              <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--sand-light)] flex items-center justify-between">
                <span className="font-mono text-[9px] text-[var(--ink-3)]">
                  Showing {Math.min(invocations!.items.length, 30)} of {invocations!.items.length} calls
                  {invocations?.items?.[0]?.id?.startsWith('inv_demo_') ? ' (Scenario A Demo)' : ' (Live)'}
                </span>
                <span className="font-mono text-[9px] text-[var(--prove-text)] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--prove)] animate-pulse inline-block" />
                  Refreshing every 5s
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
