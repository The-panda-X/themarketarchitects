'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  GripVertical,
  Eye,
  EyeOff,
  Target,
  TrendingUp,
  Zap,
  Shield,
  BarChart3,
  Users,
  Briefcase,
  Coins,
  Rocket,
  Award,
  LineChart,
  Globe,
  X,
  type LucideIcon,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';

// ── Icon picker config ──
const AVAILABLE_ICONS: { name: string; component: LucideIcon }[] = [
  { name: 'Target', component: Target },
  { name: 'TrendingUp', component: TrendingUp },
  { name: 'Zap', component: Zap },
  { name: 'Shield', component: Shield },
  { name: 'BarChart3', component: BarChart3 },
  { name: 'Users', component: Users },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Coins', component: Coins },
  { name: 'Rocket', component: Rocket },
  { name: 'Award', component: Award },
  { name: 'LineChart', component: LineChart },
  { name: 'Globe', component: Globe },
  { name: 'Settings', component: Settings },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  AVAILABLE_ICONS.map((i) => [i.name, i.component])
);

interface HomeService {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  priceLabel: string;
  linkHref: string;
  linkText: string;
  sortOrder: number;
  isActive: boolean;
}

const EMPTY_SERVICE: Omit<HomeService, 'id'> = {
  title: '',
  description: '',
  icon: 'Target',
  features: [''],
  priceLabel: '',
  linkHref: '#pricing',
  linkText: 'View Plans',
  sortOrder: 0,
  isActive: true,
};

export default function AdminSettingsPage() {
  const { canDelete } = useAuth();
  const { addToast } = useToast();

  const [services, setServices] = useState<HomeService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HomeService | null>(null);
  const [form, setForm] = useState<Omit<HomeService, 'id'>>(EMPTY_SERVICE);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<HomeService | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/admin/home-services');
      if (res.ok) {
        const d = await res.json();
        setServices(d.data ?? []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchServices(); }, []);

  // ── Form helpers ──
  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_SERVICE, sortOrder: services.length });
    setModalOpen(true);
  };

  const openEdit = (svc: HomeService) => {
    setEditing(svc);
    setForm({
      title: svc.title,
      description: svc.description,
      icon: svc.icon,
      features: svc.features.length > 0 ? svc.features : [''],
      priceLabel: svc.priceLabel,
      linkHref: svc.linkHref,
      linkText: svc.linkText,
      sortOrder: svc.sortOrder,
      isActive: svc.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_SERVICE);
  };

  const handleFeatureChange = (idx: number, val: string) => {
    const updated = [...form.features];
    updated[idx] = val;
    setForm({ ...form, features: updated });
  };

  const addFeature = () => {
    setForm({ ...form, features: [...form.features, ''] });
  };

  const removeFeature = (idx: number) => {
    const updated = form.features.filter((_, i) => i !== idx);
    setForm({ ...form, features: updated.length > 0 ? updated : [''] });
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      addToast('Title and description are required', 'error');
      return;
    }

    const cleanFeatures = form.features.map((f) => f.trim()).filter(Boolean);

    setSaving(true);
    try {
      const payload = {
        ...form,
        features: cleanFeatures,
      };

      let res: Response;
      if (editing) {
        res = await fetch(`/api/admin/home-services/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/home-services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        addToast(editing ? 'Service updated' : 'Service created', 'success');
        closeModal();
        fetchServices();
      } else {
        const err = await res.json().catch(() => null);
        addToast(err?.error || 'Failed to save', 'error');
      }
    } catch {
      addToast('Failed to save service', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/home-services/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('Service deleted', 'success');
        setDeleteTarget(null);
        fetchServices();
      } else {
        addToast('Failed to delete', 'error');
      }
    } catch {
      addToast('Failed to delete service', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (svc: HomeService) => {
    try {
      const res = await fetch(`/api/admin/home-services/${svc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !svc.isActive }),
      });
      if (res.ok) {
        addToast(svc.isActive ? 'Service hidden' : 'Service visible', 'success');
        fetchServices();
      }
    } catch {
      addToast('Failed to update', 'error');
    }
  };

  if (!canDelete) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-accent-primary" /> Settings
        </h1>
        <GlassCard>
          <p className="text-text-secondary">Only the Head Admin can access settings.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-accent-primary" /> Settings
        </h1>
        <p className="text-text-secondary mt-1">Manage your website content and configuration.</p>
      </div>

      {/* ── Home Page Services ── */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-heading font-semibold">Home Page Services</h2>
            <p className="text-xs text-text-tertiary mt-0.5">
              These cards appear on the landing page &quot;Our Services&quot; section.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-accent-primary" />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-10">
            <Target className="h-10 w-10 text-text-tertiary mx-auto mb-2" />
            <p className="text-text-secondary text-sm">No services yet</p>
            <p className="text-text-tertiary text-xs mt-1">Add your first service to display on the home page.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((svc) => {
              const Icon = ICON_MAP[svc.icon] ?? Target;
              return (
                <div
                  key={svc.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                    svc.isActive
                      ? 'border-white/[0.06] bg-white/[0.02]'
                      : 'border-white/[0.04] bg-white/[0.01] opacity-60'
                  }`}
                >
                  <GripVertical className="h-4 w-4 text-text-tertiary shrink-0" />

                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #e63946 0%, #c1121f 100%)',
                    }}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-primary truncate">{svc.title}</p>
                      {!svc.isActive && <Badge variant="yellow" size="sm">Hidden</Badge>}
                    </div>
                    <p className="text-xs text-text-tertiary truncate mt-0.5">{svc.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-accent-primary font-medium">{svc.priceLabel}</span>
                      <span className="text-[10px] text-text-tertiary">
                        {svc.features.length} feature{svc.features.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-[10px] text-text-tertiary">Order: {svc.sortOrder}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleActive(svc)}
                      className="p-2 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-white/[0.04] transition-colors"
                      title={svc.isActive ? 'Hide' : 'Show'}
                    >
                      {svc.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(svc)}
                      className="p-2 rounded-lg text-text-tertiary hover:text-accent-primary hover:bg-white/[0.04] transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(svc)}
                      className="p-2 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger/5 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* ── Create / Edit Modal ── */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Service' : 'Add Service'} size="lg">
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Challenge Passing"
              className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of this service..."
              rows={2}
              className="w-full resize-none px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50 transition-colors"
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Icon</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ICONS.map((item) => {
                const Ic = item.component;
                const selected = form.icon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setForm({ ...form, icon: item.name })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${
                      selected
                        ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                        : 'border-white/[0.08] bg-white/[0.02] text-text-tertiary hover:text-text-secondary hover:border-white/[0.15]'
                    }`}
                    title={item.name}
                  >
                    <Ic className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Label + Link */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Price Label</label>
              <input
                type="text"
                value={form.priceLabel}
                onChange={(e) => setForm({ ...form, priceLabel: e.target.value })}
                placeholder="e.g. From $149"
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Button Text</label>
              <input
                type="text"
                value={form.linkText}
                onChange={(e) => setForm({ ...form, linkText: e.target.value })}
                placeholder="e.g. View Plans"
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Button Link</label>
              <input
                type="text"
                value={form.linkHref}
                onChange={(e) => setForm({ ...form, linkHref: e.target.value })}
                placeholder="e.g. #pricing"
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Sort Order + Active */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-accent-primary/50 transition-colors"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/[0.04] text-accent-primary focus:ring-accent-primary"
                />
                <span className="text-sm text-text-secondary">Active (visible on site)</span>
              </label>
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Features / Bullet Points
            </label>
            <div className="space-y-2">
              {form.features.map((feat, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => handleFeatureChange(idx, e.target.value)}
                    placeholder={`Feature ${idx + 1}`}
                    className="flex-1 px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50 transition-colors"
                  />
                  {form.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeature(idx)}
                      className="p-2 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger/5 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="flex items-center gap-1.5 text-xs text-accent-primary hover:text-red-300 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add feature
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save Changes' : 'Create Service'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirmation ── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Service" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete <strong className="text-text-primary">{deleteTarget?.title}</strong>?
            This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-danger text-white text-sm font-medium hover:bg-danger/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
