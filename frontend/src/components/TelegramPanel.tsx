/**
 * TelegramPanel — Settings panel to configure and test the Telegram Bot integration.
 * Used in MissionControlPage for Scenario A (Internship Research).
 * All colours use design tokens only (tokens.css).
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import BorderButton from './ui/BorderButton';

interface TelegramPanelProps {
  /** If provided, show a "Send Report Now" button for this mission */
  missionId?: string;
  /** Compact mode for embedding inside a card */
  compact?: boolean;
}

export default function TelegramPanel({ missionId, compact = false }: TelegramPanelProps) {
  const qc = useQueryClient();
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message?: string } | null>(null);
  const [sendResult, setSendResult] = useState<{ ok: boolean; chunks?: number } | null>(null);

  // ── Fetch current config ──────────────────────────────────────────────────
  const { data: cfg, isLoading: cfgLoading } = useQuery({
    queryKey: ['telegram-config'],
    queryFn: api.getTelegramConfig,
    retry: 1,
    staleTime: 10_000,
  });

  // ── Save config mutation ──────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () => api.saveTelegramConfig(botToken, chatId, true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['telegram-config'] });
      setBotToken('');
      setChatId('');
      setTestResult(null);
    },
  });

  // ── Test connection mutation ──────────────────────────────────────────────
  const testMutation = useMutation({
    mutationFn: api.testTelegram,
    onSuccess: (data) => setTestResult({ ok: data.ok, message: data.ok ? '✅ Ping sent! Check Telegram.' : '❌ Failed' }),
    onError: (err: any) => setTestResult({ ok: false, message: `❌ ${err.message}` }),
  });

  // ── Send report mutation ──────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: () => api.sendTelegramReport(missionId!, [], [], 'Candidate'),
    onSuccess: (data) => setSendResult({ ok: data.ok, chunks: data.chunks_sent }),
    onError: (err: any) => setSendResult({ ok: false }),
  });

  const isConnected = cfg?.configured && cfg?.enabled;
  const canSave = botToken.trim().length > 10 && chatId.trim().length > 3;

  return (
    <div
      className={`tile border border-border rounded-2xl ${compact ? 'p-4' : 'p-6'} flex flex-col gap-4`}
      style={{ background: 'var(--color-tile)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">✈️</span>
          <div>
            <h3 className={`font-headline font-bold text-ink ${compact ? 'text-xs' : 'text-sm'}`}>
              Telegram Delivery
            </h3>
            {!compact && (
              <p className="font-mono text-[10px] text-ink-3 uppercase tracking-wider">
                Internship report → candidate chat
              </p>
            )}
          </div>
        </div>

        {/* Status badge */}
        <AnimatePresence mode="wait">
          {cfgLoading ? (
            <span className="font-mono text-[10px] text-ink-3 animate-pulse">checking…</span>
          ) : (
            <motion.span
              key={isConnected ? 'connected' : 'disconnected'}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`font-mono text-[10px] uppercase font-bold px-2.5 py-1 rounded-pill border ${
                isConnected
                  ? 'bg-prove-light text-prove-text border-prove-border'
                  : 'bg-sand text-ink-2 border-border'
              }`}
            >
              {isConnected ? '● Connected' : '○ Not connected'}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Current config display */}
      {cfg?.configured && (
        <div className="flex flex-wrap gap-3 px-3 py-2 rounded-xl bg-sand-light border border-border text-xs font-mono">
          <span className="text-ink-2">
            <span className="text-ink-3">Bot:</span> {cfg.bot_token_preview}
          </span>
          <span className="text-ink-2">
            <span className="text-ink-3">Chat ID:</span> {cfg.chat_id}
          </span>
          <span className={`font-semibold ${cfg.enabled ? 'text-prove-text' : 'text-recover-text'}`}>
            {cfg.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      )}

      {/* Config form */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[10px] uppercase text-ink-3 tracking-wider">
            Bot Token <span className="text-predict">*</span>
          </label>
          <div className="flex items-center gap-2 bg-tile border border-border rounded-xl px-3 py-2 focus-within:border-predict transition-colors">
            <span className="material-symbols-outlined text-ink-3 text-base">lock</span>
            <input
              type={showToken ? 'text' : 'password'}
              value={botToken}
              onChange={e => setBotToken(e.target.value)}
              placeholder={cfg?.bot_token_preview ? `Current: ${cfg.bot_token_preview}` : '1234567890:AAFxxxxxxxx…'}
              className="flex-1 bg-transparent text-ink font-mono text-xs outline-none placeholder:text-ink-3"
            />
            <button
              type="button"
              onClick={() => setShowToken(v => !v)}
              className="text-ink-3 hover:text-ink transition-colors"
              aria-label="Toggle token visibility"
            >
              <span className="material-symbols-outlined text-base">
                {showToken ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          <p className="font-mono text-[9px] text-ink-3">
            Get from{' '}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer"
              className="text-predict underline hover:no-underline"
            >
              @BotFather
            </a>{' '}
            → /newbot → copy the token
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-mono text-[10px] uppercase text-ink-3 tracking-wider">
            Candidate Chat ID <span className="text-predict">*</span>
          </label>
          <div className="flex items-center gap-2 bg-tile border border-border rounded-xl px-3 py-2 focus-within:border-predict transition-colors">
            <span className="material-symbols-outlined text-ink-3 text-base">tag</span>
            <input
              type="text"
              value={chatId}
              onChange={e => setChatId(e.target.value)}
              placeholder={cfg?.chat_id || '-1001234567890 or @channel_username'}
              className="flex-1 bg-transparent text-ink font-mono text-xs outline-none placeholder:text-ink-3"
            />
          </div>
          <p className="font-mono text-[9px] text-ink-3">
            Message{' '}
            <a
              href="https://t.me/userinfobot"
              target="_blank"
              rel="noreferrer"
              className="text-predict underline hover:no-underline"
            >
              @userinfobot
            </a>{' '}
            to get your numeric chat ID
          </p>
        </div>
      </div>

      {/* Save + Test buttons */}
      <div className="flex flex-wrap gap-2">
        <BorderButton
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={!canSave || saveMutation.isPending}
          className="flex-1 text-xs py-2"
        >
          <span className="material-symbols-outlined text-sm">save</span>
          Save Config
        </BorderButton>

        <BorderButton
          variant="olive"
          onClick={() => { testMutation.mutate(); setTestResult(null); }}
          loading={testMutation.isPending}
          disabled={!cfg?.configured || testMutation.isPending}
          className="flex-1 text-xs py-2"
        >
          <span className="material-symbols-outlined text-sm">send</span>
          Test Ping
        </BorderButton>
      </div>

      {/* Test result feedback */}
      <AnimatePresence>
        {(saveMutation.isSuccess || saveMutation.isError || testResult) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-xs font-mono px-3 py-2 rounded-xl border ${
              (saveMutation.isSuccess || testResult?.ok)
                ? 'bg-prove-light text-prove-text border-prove-border'
                : 'bg-predict-light text-predict-text border-predict-border'
            }`}
          >
            {saveMutation.isSuccess && '✅ Configuration saved. Telegram delivery enabled.'}
            {saveMutation.isError && `❌ ${(saveMutation.error as any)?.message}`}
            {testResult?.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send report for a specific mission */}
      {missionId && (
        <div className="border-t border-border pt-3 flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase text-ink-3 tracking-wider">
            Manual dispatch for mission <code className="text-ink">{missionId.slice(0, 12)}…</code>
          </p>
          <BorderButton
            variant="plum"
            onClick={() => { sendMutation.mutate(); setSendResult(null); }}
            loading={sendMutation.isPending}
            disabled={!isConnected || sendMutation.isPending}
            className="w-full text-xs py-2"
          >
            <span className="material-symbols-outlined text-sm">send</span>
            Send Internship Report to Telegram
          </BorderButton>

          <AnimatePresence>
            {sendResult && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-xs font-mono px-3 py-2 rounded-xl border ${
                  sendResult.ok
                    ? 'bg-prove-light text-prove-text border-prove-border'
                    : 'bg-predict-light text-predict-text border-predict-border'
                }`}
              >
                {sendResult.ok
                  ? `✅ Report delivered! (${sendResult.chunks} message${(sendResult.chunks ?? 0) > 1 ? 's' : ''} sent)`
                  : '❌ Delivery failed. Check bot token and chat ID.'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* How-to helper (collapsed) */}
      {!compact && (
        <details className="group">
          <summary className="font-mono text-[10px] uppercase text-ink-3 cursor-pointer hover:text-ink transition-colors list-none flex items-center gap-1">
            <span className="material-symbols-outlined text-sm group-open:rotate-90 transition-transform">
              chevron_right
            </span>
            How to get your Bot Token & Chat ID
          </summary>
          <div className="mt-2 pl-4 flex flex-col gap-1 font-mono text-[10px] text-ink-2 leading-relaxed">
            <p>1. Open Telegram → search <strong>@BotFather</strong></p>
            <p>2. Send <code>/newbot</code> → follow prompts → copy the HTTP API token</p>
            <p>3. Add your bot to the candidate's chat (or use a personal chat)</p>
            <p>4. To get <strong>Chat ID</strong>: send a message to your bot, then visit:</p>
            <code className="bg-sand px-2 py-0.5 rounded text-[9px] break-all">
              https://api.telegram.org/bot{'<'}TOKEN{'>'}/getUpdates
            </code>
            <p>5. Look for <code>"chat": {'{"id": -1001234…}'}</code> in the JSON response</p>
          </div>
        </details>
      )}
    </div>
  );
}
