'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, GripVertical, Save, Layers } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import useToast from '@/hooks/useToast';

/* ─── Types ─── */
interface SizePriceEntry { size: string; price: number; originalPrice?: number | null; }
interface Plan {
  id: string; name: string; tier: string; serviceType: string; price: number | null;
  originalPrice: number | null; priceLabel: string | null; description: string;
  features: string[]; popular: boolean; accountSizes: string[]; sizePricing: SizePriceEntry[] | null;
  guarantee: string | null; successRate: number | null; deliveryDays: number | null;
  sortOrder: number; isActive: boolean;
}
interface Firm {
  id: string; name: string; phases: number; accountSizes: string[];
  sortOrder: number; isActive: boolean;
}
interface FAQ {
  id: string; question: string; answer: string; sortOrder: number; isActive: boolean;
}
interface TrustStatItem {
  id: string; label: string; value: number; suffix: string | null;
  prefix: string | null; icon: string; sortOrder: number;
}

const SERVICE_TYPES = ['CHALLENGE_PASSING', 'ACCOUNT_MANAGEMENT', 'ACCOUNT_GROWTH'];
const TIERS = ['starter', 'professional', 'elite'];
const ICONS = ['Trophy', 'DollarSign', 'TrendingUp', 'Users', 'Target', 'Shield', 'Star'];

const TABS = [
  { id: 'plans', label: 'Service Plans' },
  { id: 'firms', label: 'Prop Firms' },
  { id: 'faq', label: 'FAQ' },
  { id: 'stats', label: 'Trust Stats' },
];

/* ─── Helpers ─── */
function serviceLabel(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ═══════════════ COMPONENT ═══════════════ */
export default function AdminServicesPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('plans');
  const [loading, setLoading] = useState(true);

  // Data
  const [plans, setPlans] = useState<Plan[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [stats, setStats] = useState<TrustStatItem[]>([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Plan | Firm | FAQ | null>(null);

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, fRes, qRes, sRes] = await Promise.all([
        fetch('/api/admin/plans'), fetch('/api/admin/firms'),
        fetch('/api/admin/faq'), fetch('/api/admin/trust-stats'),
      ]);
      const [pData, fData, qData, sData] = await Promise.all([pRes.json(), fRes.json(), qRes.json(), sRes.json()]);
      setPlans(pData.data ?? []);
      setFirms(fData.data ?? []);
      setFaqs(qData.data ?? []);
      setStats(sData.data ?? []);
    } catch { addToast('Failed to load data', 'error'); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Generic toggle/delete ──
  const toggleActive = async (type: string, id: string, current: boolean) => {
    try {
      await fetch(`/api/admin/${type}/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      fetchData();
      addToast(`${current ? 'Deactivated' : 'Activated'} successfully`, 'success');
    } catch { addToast('Failed to update', 'error'); }
  };

  const deleteItem = async (type: string, id: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    try {
      await fetch(`/api/admin/${type}/${id}`, { method: 'DELETE' });
      fetchData();
      addToast('Deleted successfully', 'success');
    } catch { addToast('Failed to delete', 'error'); }
  };

  // ── Save trust stats ──
  const saveStats = async () => {
    try {
      await fetch('/api/admin/trust-stats', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats }),
      });
      addToast('Trust stats saved', 'success');
    } catch { addToast('Failed to save stats', 'error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Services & Pricing</h1>
          <p className="text-text-secondary mt-1">Manage plans, firms, FAQ, and trust stats</p>
        </div>
        {activeTab !== 'stats' && (
          <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}
            onClick={() => { setEditingItem(null); setModalOpen(true); }}>
            Add {activeTab === 'plans' ? 'Plan' : activeTab === 'firms' ? 'Firm' : 'FAQ'}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-accent-primary text-white'
                : 'border border-white/[0.08] text-text-secondary hover:text-text-primary hover:border-white/[0.15]'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : (
        <>
          {/* ═══ PLANS TAB ═══ */}
          {activeTab === 'plans' && (
            <div className="space-y-3">
              {plans.map((plan) => (
                <GlassCard key={plan.id} padding="md">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-4 w-4 text-text-tertiary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-text-primary">{plan.name}</p>
                        {plan.popular && <Badge variant="red" size="sm">Popular</Badge>}
                        {!plan.isActive && <Badge variant="yellow" size="sm">Inactive</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary flex-wrap">
                        <span>{serviceLabel(plan.serviceType)}</span>
                        <span>·</span>
                        <span>{plan.sizePricing && plan.sizePricing.length > 0
                          ? plan.sizePricing.map(sp => `${sp.size}: $${sp.price}`).join(' / ')
                          : plan.price ? `$${plan.price}` : plan.priceLabel ?? 'Free'}</span>
                        <span>·</span>
                        <span>Order: {plan.sortOrder}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => toggleActive('plans', plan.id, plan.isActive)}
                        className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                        title={plan.isActive ? 'Deactivate' : 'Activate'}>
                        {plan.isActive ? <ToggleRight className="h-5 w-5 text-green-400" /> : <ToggleLeft className="h-5 w-5 text-text-tertiary" />}
                      </button>
                      <button onClick={() => { setEditingItem(plan); setModalOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors">
                        <Pencil className="h-4 w-4 text-text-secondary" />
                      </button>
                      <button onClick={() => deleteItem('plans', plan.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
              {plans.length === 0 && <p className="text-center text-text-tertiary py-8">No plans yet. Click "Add Plan" to create one.</p>}
            </div>
          )}

          {/* ═══ FIRMS TAB ═══ */}
          {activeTab === 'firms' && (
            <div className="space-y-3">
              {firms.map((firm) => (
                <GlassCard key={firm.id} padding="md">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-4 w-4 text-text-tertiary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary">{firm.name}</p>
                        {!firm.isActive && <Badge variant="yellow" size="sm">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        {firm.phases} phase{firm.phases > 1 ? 's' : ''} · {firm.accountSizes.join(', ')} · Order: {firm.sortOrder}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => toggleActive('firms', firm.id, firm.isActive)}
                        className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors">
                        {firm.isActive ? <ToggleRight className="h-5 w-5 text-green-400" /> : <ToggleLeft className="h-5 w-5 text-text-tertiary" />}
                      </button>
                      <button onClick={() => { setEditingItem(firm as any); setModalOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors">
                        <Pencil className="h-4 w-4 text-text-secondary" />
                      </button>
                      <button onClick={() => deleteItem('firms', firm.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
              {firms.length === 0 && <p className="text-center text-text-tertiary py-8">No firms yet.</p>}
            </div>
          )}

          {/* ═══ FAQ TAB ═══ */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <GlassCard key={faq.id} padding="md">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-4 w-4 text-text-tertiary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary truncate">{faq.question}</p>
                        {!faq.isActive && <Badge variant="yellow" size="sm">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{faq.answer}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => toggleActive('faq', faq.id, faq.isActive)}
                        className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors">
                        {faq.isActive ? <ToggleRight className="h-5 w-5 text-green-400" /> : <ToggleLeft className="h-5 w-5 text-text-tertiary" />}
                      </button>
                      <button onClick={() => { setEditingItem(faq as any); setModalOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors">
                        <Pencil className="h-4 w-4 text-text-secondary" />
                      </button>
                      <button onClick={() => deleteItem('faq', faq.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
              {faqs.length === 0 && <p className="text-center text-text-tertiary py-8">No FAQ items yet.</p>}
            </div>
          )}

          {/* ═══ TRUST STATS TAB ═══ */}
          {activeTab === 'stats' && (
            <GlassCard padding="lg">
              <h3 className="font-heading font-semibold mb-4">Homepage Trust Statistics</h3>
              <div className="space-y-4">
                {stats.map((stat, idx) => (
                  <div key={stat.id} className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <Input label="Label" value={stat.label}
                      onChange={(e) => { const s = [...stats]; s[idx] = { ...s[idx], label: e.target.value }; setStats(s); }} />
                    <Input label="Value" type="number" value={stat.value}
                      onChange={(e) => { const s = [...stats]; s[idx] = { ...s[idx], value: parseFloat(e.target.value) || 0 }; setStats(s); }} />
                    <Input label="Prefix" value={stat.prefix ?? ''} placeholder="e.g. $"
                      onChange={(e) => { const s = [...stats]; s[idx] = { ...s[idx], prefix: e.target.value || null }; setStats(s); }} />
                    <Input label="Suffix" value={stat.suffix ?? ''} placeholder="e.g. +, %, M+"
                      onChange={(e) => { const s = [...stats]; s[idx] = { ...s[idx], suffix: e.target.value || null }; setStats(s); }} />
                    <Select label="Icon" value={stat.icon}
                      onChange={(e) => { const s = [...stats]; s[idx] = { ...s[idx], icon: e.target.value }; setStats(s); }}>
                      {ICONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                    </Select>
                  </div>
                ))}
              </div>
              <Button variant="primary" className="mt-4" icon={<Save className="h-4 w-4" />} onClick={saveStats}>
                Save Trust Stats
              </Button>
            </GlassCard>
          )}
        </>
      )}

      {/* ═══ MODAL ═══ */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editingItem ? `Edit ${activeTab === 'plans' ? 'Plan' : activeTab === 'firms' ? 'Firm' : 'FAQ'}` : `Add ${activeTab === 'plans' ? 'Plan' : activeTab === 'firms' ? 'Firm' : 'FAQ'}`}>
        {activeTab === 'plans' && (
          <PlanForm
            initial={editingItem as Plan | null}
            onSave={async (data) => {
              try {
                const isEdit = !!(editingItem as Plan)?.id;
                const url = isEdit ? `/api/admin/plans/${(editingItem as Plan).id}` : '/api/admin/plans';
                await fetch(url, {
                  method: isEdit ? 'PATCH' : 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                });
                setModalOpen(false);
                fetchData();
                addToast(isEdit ? 'Plan updated' : 'Plan created', 'success');
              } catch { addToast('Failed to save', 'error'); }
            }}
          />
        )}
        {activeTab === 'firms' && (
          <FirmForm
            initial={editingItem as Firm | null}
            onSave={async (data) => {
              try {
                const isEdit = !!(editingItem as Firm)?.id;
                const url = isEdit ? `/api/admin/firms/${(editingItem as Firm).id}` : '/api/admin/firms';
                await fetch(url, {
                  method: isEdit ? 'PATCH' : 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                });
                setModalOpen(false);
                fetchData();
                addToast(isEdit ? 'Firm updated' : 'Firm created', 'success');
              } catch { addToast('Failed to save', 'error'); }
            }}
          />
        )}
        {activeTab === 'faq' && (
          <FAQForm
            initial={editingItem as FAQ | null}
            onSave={async (data) => {
              try {
                const isEdit = !!(editingItem as FAQ)?.id;
                const url = isEdit ? `/api/admin/faq/${(editingItem as FAQ).id}` : '/api/admin/faq';
                await fetch(url, {
                  method: isEdit ? 'PATCH' : 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                });
                setModalOpen(false);
                fetchData();
                addToast(isEdit ? 'FAQ updated' : 'FAQ created', 'success');
              } catch { addToast('Failed to save', 'error'); }
            }}
          />
        )}
      </Modal>
    </div>
  );
}

/* ═══════════════ PLAN FORM ═══════════════ */
function PlanForm({ initial, onSave }: { initial: Plan | null; onSave: (data: Partial<Plan>) => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [tier, setTier] = useState(initial?.tier ?? 'starter');
  const [serviceType, setServiceType] = useState(initial?.serviceType ?? 'CHALLENGE_PASSING');
  const [customServiceType, setCustomServiceType] = useState('');
  const [priceLabel, setPriceLabel] = useState(initial?.priceLabel ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [features, setFeatures] = useState(initial?.features.join('\n') ?? '');
  const [popular, setPopular] = useState(initial?.popular ?? false);
  const [guarantee, setGuarantee] = useState(initial?.guarantee ?? '');
  const [successRate, setSuccessRate] = useState(initial?.successRate ?? '');
  const [deliveryDays, setDeliveryDays] = useState(initial?.deliveryDays ?? '');
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);

  // Per-size pricing rows
  const [sizeRows, setSizeRows] = useState<SizePriceEntry[]>(
    initial?.sizePricing && initial.sizePricing.length > 0
      ? initial.sizePricing
      : initial?.accountSizes?.length
        ? initial.accountSizes.map((s) => ({ size: s, price: initial.price ?? 0, originalPrice: initial.originalPrice ?? null }))
        : [{ size: '', price: 0, originalPrice: null }]
  );

  const isCustomType = initial?.serviceType && !SERVICE_TYPES.includes(initial.serviceType);

  const addSizeRow = () => setSizeRows([...sizeRows, { size: '', price: 0, originalPrice: null }]);
  const removeSizeRow = (idx: number) => setSizeRows(sizeRows.filter((_, i) => i !== idx));
  const updateSizeRow = (idx: number, field: keyof SizePriceEntry, value: string | number | null) => {
    const rows = [...sizeRows];
    rows[idx] = { ...rows[idx], [field]: value };
    setSizeRows(rows);
  };

  /** Normalize size input: "5000" → "$5,000", "$50000" → "$50,000", keeps "$10K" etc as-is */
  const formatSize = (raw: string): string => {
    const s = raw.trim();
    // If it contains letters (like "$10K", "Any size", "Up to $50K"), keep as-is
    if (/[a-zA-Z]/.test(s)) return s;
    // Strip $ and commas, parse as number, reformat
    const num = parseFloat(s.replace(/[$,]/g, ''));
    if (isNaN(num)) return s;
    return `$${num.toLocaleString('en-US')}`;
  };

  const handleSubmit = () => {
    const finalType = serviceType === '__custom__' ? customServiceType.toUpperCase().replace(/\s+/g, '_') : serviceType;
    const validRows = sizeRows
      .filter((r) => r.size.trim())
      .map((r) => ({ ...r, size: formatSize(r.size) }));
    const lowestPrice = validRows.length > 0 ? Math.min(...validRows.map((r) => r.price)) : null;
    const highestOriginal = validRows.length > 0 ? Math.max(...validRows.map((r) => r.originalPrice ?? r.price)) : null;

    onSave({
      name, tier, serviceType: finalType,
      price: lowestPrice,
      originalPrice: highestOriginal !== lowestPrice ? highestOriginal : null,
      priceLabel: priceLabel || null,
      description,
      features: features.split('\n').map((f) => f.trim()).filter(Boolean),
      popular,
      accountSizes: validRows.map((r) => r.size),
      sizePricing: validRows.length > 0 ? validRows : null,
      guarantee: guarantee || null,
      successRate: successRate ? Number(successRate) : null,
      deliveryDays: deliveryDays ? Number(deliveryDays) : null,
      sortOrder,
    });
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <Input label="Plan Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pro Challenge Pass" />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Service Type *" value={isCustomType ? '__custom__' : serviceType} onChange={(e) => setServiceType(e.target.value)}>
          {SERVICE_TYPES.map((t) => <option key={t} value={t}>{serviceLabel(t)}</option>)}
          <option value="__custom__">+ Custom Type</option>
        </Select>
        {(serviceType === '__custom__' || isCustomType) && (
          <Input label="Custom Type" value={isCustomType ? (initial?.serviceType ?? '') : customServiceType}
            onChange={(e) => setCustomServiceType(e.target.value)} placeholder="e.g. VIP_MENTORSHIP" />
        )}
        <Select label="Tier" value={tier} onChange={(e) => setTier(e.target.value)}>
          {TIERS.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </Select>
      </div>
      <Textarea label="Description *" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />

      {/* Price label for profit-split / free plans */}
      <Input label="Price Label (for profit-split / free plans)" value={priceLabel} onChange={(e) => setPriceLabel(e.target.value)} placeholder="e.g. Profit Split Only" />

      {/* Per-size pricing */}
      <div>
        <label className="text-xs text-text-tertiary font-medium uppercase tracking-wide block mb-2">
          Account Sizes & Pricing *
        </label>
        <div className="space-y-2">
          {sizeRows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_100px_100px_36px] gap-2 items-end">
              <Input placeholder="e.g. $10,000" value={row.size}
                onChange={(e) => updateSizeRow(idx, 'size', e.target.value)} />
              <Input placeholder="Price" type="number" value={row.price || ''}
                onChange={(e) => updateSizeRow(idx, 'price', e.target.value ? Number(e.target.value) : 0)} />
              <Input placeholder="Was $" type="number" value={row.originalPrice ?? ''}
                onChange={(e) => updateSizeRow(idx, 'originalPrice', e.target.value ? Number(e.target.value) : null)} />
              {sizeRows.length > 1 && (
                <button type="button" onClick={() => removeSizeRow(idx)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors h-10">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addSizeRow}
          className="mt-2 flex items-center gap-1 text-xs text-accent-primary hover:text-red-300 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add size
        </button>
      </div>

      <Textarea label="Features (one per line)" value={features} onChange={(e) => setFeatures(e.target.value)} rows={4} placeholder="Phase 1 + Phase 2&#10;All major firms&#10;Refund guarantee" />
      <div className="grid grid-cols-3 gap-3">
        <Input label="Success Rate (%)" type="number" value={successRate} onChange={(e) => setSuccessRate(e.target.value)} />
        <Input label="Delivery Days" type="number" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} />
        <Input label="Sort Order" type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
      </div>
      <Input label="Guarantee" value={guarantee} onChange={(e) => setGuarantee(e.target.value)} placeholder="e.g. 100% pass or money back" />
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={popular} onChange={(e) => setPopular(e.target.checked)} className="rounded" />
        Mark as &quot;Most Popular&quot;
      </label>
      <Button variant="primary" fullWidth onClick={handleSubmit}>{initial ? 'Update Plan' : 'Create Plan'}</Button>
    </div>
  );
}

/* ═══════════════ FIRM FORM ═══════════════ */
function FirmForm({ initial, onSave }: { initial: Firm | null; onSave: (data: Partial<Firm>) => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [phases, setPhases] = useState(initial?.phases ?? 2);
  const [accountSizes, setAccountSizes] = useState(initial?.accountSizes.join(', ') ?? '');
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);

  return (
    <div className="space-y-4">
      <Input label="Firm Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. FTMO" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Phases" type="number" value={phases} onChange={(e) => setPhases(Number(e.target.value))} />
        <Input label="Sort Order" type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
      </div>
      <Input label="Account Sizes (comma separated)" value={accountSizes} onChange={(e) => setAccountSizes(e.target.value)}
        placeholder="$5,000, $10,000, $25,000, $50,000, $100,000" />
      <Button variant="primary" fullWidth onClick={() => onSave({
        name, phases, accountSizes: accountSizes.split(',').map((s) => s.trim()).filter(Boolean), sortOrder,
      })}>{initial ? 'Update Firm' : 'Create Firm'}</Button>
    </div>
  );
}

/* ═══════════════ FAQ FORM ═══════════════ */
function FAQForm({ initial, onSave }: { initial: FAQ | null; onSave: (data: Partial<FAQ>) => void }) {
  const [question, setQuestion] = useState(initial?.question ?? '');
  const [answer, setAnswer] = useState(initial?.answer ?? '');
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);

  return (
    <div className="space-y-4">
      <Input label="Question *" value={question} onChange={(e) => setQuestion(e.target.value)} />
      <Textarea label="Answer *" value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4} />
      <Input label="Sort Order" type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
      <Button variant="primary" fullWidth onClick={() => onSave({ question, answer, sortOrder })}>
        {initial ? 'Update FAQ' : 'Create FAQ'}
      </Button>
    </div>
  );
}
