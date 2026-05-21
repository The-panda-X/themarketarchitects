'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Shield, Eye, EyeOff, Plus, Check } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { credentialSchema, type CredentialInput } from '@/lib/validations';
import { formatDate } from '@/lib/utils';
import { TRADING_PLATFORMS } from '@/lib/constants';
import type { Order, Credential } from '@/types';

export default function CredentialsPage() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CredentialInput>({
    resolver: zodResolver(credentialSchema),
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, credsRes] = await Promise.all([
          fetch('/api/dashboard/orders?status=PAID,IN_PROGRESS'),
          fetch('/api/dashboard/credentials'),
        ]);
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(data.data ?? []);
        }
        if (credsRes.ok) {
          const data = await credsRes.json();
          setCredentials(data.data ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const onSubmit = async (data: CredentialInput) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        setCredentials([result.data, ...credentials]);
        addToast('Credentials submitted securely.', 'success');
        reset();
        setShowForm(false);
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to submit credentials.', 'error');
      }
    } catch {
      addToast('Something went wrong.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Trading Credentials</h1>
          <p className="text-text-secondary mt-1">Securely submit your trading account details.</p>
        </div>
        {!showForm && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowForm(true)}
            className="!px-2 !py-2"
          />
        )}
      </div>

      {/* Security Notice */}
      <GlassCard padding="md" variant="subtle">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-success shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-success">AES-256-GCM Encrypted</p>
            <p className="text-xs text-text-tertiary mt-0.5">
              All credentials are encrypted at rest and in transit. Only authorized traders can access them.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Submission Form */}
      {showForm && (
        <GlassCard padding="lg">
          <h3 className="text-lg font-heading font-semibold mb-4">Submit New Credentials</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Select
              label="Order"
              error={errors.orderId?.message}
              {...register('orderId')}
            >
              <option value="">Select an order...</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.planName} — {order.firmName ?? order.serviceType} ({order.accountSize ?? ''})
                </option>
              ))}
            </Select>

            <Select
              label="Trading Platform"
              error={errors.platform?.message}
              {...register('platform')}
            >
              <option value="">Select platform...</option>
              {TRADING_PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>

            <Input
              label="Server (optional)"
              placeholder="e.g., FTMO-Server3"
              error={errors.server?.message}
              {...register('server')}
            />

            <Input
              label="Login ID"
              placeholder="Your trading account login"
              error={errors.loginId?.message}
              {...register('loginId')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Your trading account password"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-text-tertiary hover:text-text-secondary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Textarea
              label="Notes (optional)"
              placeholder="Any additional information..."
              rows={3}
              error={errors.notes?.message}
              {...register('notes')}
            />

            <div className="flex gap-3">
              <Button type="submit" variant="primary" loading={submitting} fullWidth>
                Submit Securely
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setShowForm(false); reset(); }}>
                Cancel
              </Button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Submitted Credentials */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : credentials.length === 0 && !showForm ? (
        <GlassCard padding="lg">
          <div className="text-center py-12">
            <KeyRound className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
            <p className="text-text-secondary font-medium">No credentials submitted yet.</p>
            <p className="text-text-tertiary text-sm mt-1">Submit your trading credentials after placing an order.</p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-secondary">Submitted Credentials</h3>
          {credentials.map((cred) => (
            <GlassCard key={cred.id} padding="md">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-accent-primary/10">
                  <KeyRound className="h-4 w-4 text-accent-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{cred.platform}</p>
                    <Badge variant="green" size="sm">Encrypted</Badge>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    Login: {cred.loginId} {cred.server && `• Server: ${cred.server}`} • Submitted {formatDate(cred.submittedAt)}
                  </p>
                </div>
                <Check className="h-4 w-4 text-success" />
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
