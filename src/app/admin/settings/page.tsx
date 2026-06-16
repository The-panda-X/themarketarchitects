'use client';

import { useEffect, useState, useCallback } from 'react';
import { Settings, AtSign, Save, Pencil, X, EyeOff, Info } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';

export default function AdminSettingsPage() {
  const { canDelete } = useAuth();
  const { addToast } = useToast();

  /* ── Staff Nickname state (accessible to all admin/mod roles) ── */
  const [nickname, setNickname]       = useState<string | null>(null);
  const [editingNick, setEditingNick] = useState(false);
  const [nickDraft, setNickDraft]     = useState('');
  const [savingNick, setSavingNick]   = useState(false);
  const [loadingNick, setLoadingNick] = useState(true);

  const fetchNickname = useCallback(async () => {
    setLoadingNick(true);
    try {
      const res = await fetch('/api/admin/staff-profile');
      if (res.ok) {
        const d = await res.json();
        setNickname(d.data?.staffNickname ?? null);
      }
    } catch { /* silent */ }
    finally { setLoadingNick(false); }
  }, []);

  useEffect(() => { fetchNickname(); }, [fetchNickname]);

  const handleSaveNickname = async () => {
    setSavingNick(true);
    try {
      const trimmed = nickDraft.trim();
      const res = await fetch('/api/admin/staff-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffNickname: trimmed.length === 0 ? null : trimmed }),
      });
      const d = await res.json();
      if (res.ok) {
        setNickname(d.data?.staffNickname ?? null);
        setEditingNick(false);
        addToast('Nickname saved', 'success');
      } else {
        addToast(d.error ?? 'Failed to save nickname', 'error');
      }
    } finally {
      setSavingNick(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-accent-primary" /> Settings
        </h1>
        <p className="text-text-secondary mt-1">Your profile and platform configuration.</p>
      </div>

      {/* ── Display Profile — visible to ALL staff roles ───────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-2">
          <EyeOff className="h-3.5 w-3.5" /> Client-Facing Identity
        </h2>

        <GlassCard padding="lg">
          <div className="flex items-start gap-3">
            <AtSign className="h-5 w-5 text-accent-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">Staff Nickname</p>
              <p className="text-xs text-text-tertiary mt-0.5 mb-3">
                The name clients see in support tickets and chat. Your real name and email stay hidden.
              </p>

              {loadingNick ? (
                <div className="h-9 w-48 rounded-lg bg-white/[0.04] animate-pulse" />
              ) : editingNick ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Input
                    autoFocus
                    value={nickDraft}
                    onChange={(e) => setNickDraft(e.target.value)}
                    placeholder="e.g. Alex, Support Team A"
                    className="!py-1.5 !text-sm w-56"
                    maxLength={30}
                  />
                  <Button variant="primary" size="sm" loading={savingNick} icon={<Save className="h-3.5 w-3.5" />} onClick={handleSaveNickname}>
                    Save
                  </Button>
                  <button
                    onClick={() => { setEditingNick(false); setNickDraft(nickname ?? ''); }}
                    className="p-1.5 text-text-tertiary hover:text-text-primary"
                    title="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-text-primary px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    {nickname ?? 'Support Team'}
                  </span>
                  {!nickname && <Badge variant="default" size="sm">Default</Badge>}
                  <button
                    onClick={() => { setNickDraft(nickname ?? ''); setEditingNick(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {nickname ? 'Edit' : 'Set Nickname'}
                  </button>
                </div>
              )}

              <div className="mt-3 flex items-start gap-2 text-xs text-text-tertiary">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p>
                  Used in: support ticket replies, live chat. For Discord signal sender tags,
                  set your <strong className="text-text-secondary">Signal Tag</strong> on the
                  Signal Hub page (or leave empty to use this nickname).
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* ── System Settings — Head Admin only ──────────────────────── */}
      {canDelete ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">
            System Settings
          </h2>
          <GlassCard>
            <p className="text-text-secondary text-sm">
              General settings coming soon. Use the <strong className="text-text-primary">Home Page</strong> section in the sidebar to customize landing page content.
            </p>
          </GlassCard>
        </section>
      ) : null}
    </div>
  );
}
