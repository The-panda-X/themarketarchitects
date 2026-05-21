'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import useToast from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';

interface CouponRow {
  id: string;
  code: string;
  discountPercent: number | null;
  discountAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const { addToast } = useToast();
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discountPercent: '',
    discountAmount: '',
    maxUses: '',
    validUntil: '',
  });

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) {
        const d = await res.json();
        setCoupons(d.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const d = await res.json();
        setCoupons((prev) => [d.data, ...prev]);
        addToast('Coupon created.', 'success');
        setShowModal(false);
        setForm({ code: '', discountPercent: '', discountAmount: '', maxUses: '', validUntil: '' });
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to create coupon.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: CouponRow) => {
    const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !coupon.isActive }),
    });
    if (res.ok) {
      setCoupons((prev) => prev.map((c) => c.id === coupon.id ? { ...c, isActive: !c.isActive } : c));
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      addToast('Coupon deleted.', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Coupons</h1>
          <p className="text-text-secondary mt-1">Manage discount codes.</p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>
          New Coupon
        </Button>
      </div>

      <GlassCard padding="md">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">No coupons yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-sm text-accent-primary">{coupon.code}</span>
                    <Badge variant={coupon.isActive ? 'green' : 'default'} size="sm">
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {coupon.discountPercent ? `${coupon.discountPercent}% off` : `$${coupon.discountAmount} off`}
                    {coupon.maxUses ? ` · ${coupon.usedCount}/${coupon.maxUses} uses` : ` · ${coupon.usedCount} uses`}
                    {coupon.validUntil ? ` · Expires ${formatDate(coupon.validUntil)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(coupon)} className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors">
                    {coupon.isActive ? <ToggleRight className="h-5 w-5 text-success" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <Button variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4 text-danger" />} onClick={() => deleteCoupon(coupon.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Coupon" size="sm">
        <div className="space-y-4">
          <Input
            label="Coupon Code"
            placeholder="SUMMER20"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          />
          <Input
            label="Discount Percent (%)"
            type="number"
            placeholder="e.g. 20"
            value={form.discountPercent}
            onChange={(e) => setForm({ ...form, discountPercent: e.target.value, discountAmount: '' })}
            hint="Use either percent or fixed amount."
          />
          <Input
            label="Fixed Discount ($)"
            type="number"
            placeholder="e.g. 50"
            value={form.discountAmount}
            onChange={(e) => setForm({ ...form, discountAmount: e.target.value, discountPercent: '' })}
          />
          <Input
            label="Max Uses"
            type="number"
            placeholder="Leave blank for unlimited"
            value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
          />
          <Input
            label="Expiry Date"
            type="date"
            value={form.validUntil}
            onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
          />
          <div className="flex gap-3">
            <Button variant="primary" loading={saving} onClick={handleCreate} fullWidth>Create</Button>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
