'use client';

import { useState, useEffect } from 'react';
import {
  Home,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  X,
  Star,
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
  Settings,
  Trophy,
  DollarSign,
  type LucideIcon,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Tabs from '@/components/ui/Tabs';
import useToast from '@/hooks/useToast';

/* ═══════════════════════════════════════════════
   Icon picker map (shared by services + stats)
   ═══════════════════════════════════════════════ */
const SERVICE_ICONS: { name: string; component: LucideIcon }[] = [
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

const STAT_ICONS: { name: string; component: LucideIcon }[] = [
  { name: 'Trophy', component: Trophy },
  { name: 'DollarSign', component: DollarSign },
  { name: 'TrendingUp', component: TrendingUp },
  { name: 'Users', component: Users },
  { name: 'Target', component: Target },
  { name: 'Shield', component: Shield },
  { name: 'Star', component: Star },
];

const SVC_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(SERVICE_ICONS.map((i) => [i.name, i.component]));
const STAT_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(STAT_ICONS.map((i) => [i.name, i.component]));

/* ═══════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════ */
interface HomeService {
  id: string; title: string; description: string; icon: string;
  features: string[]; priceLabel: string; linkHref: string; linkText: string;
  sortOrder: number; isActive: boolean;
}

interface FAQItem {
  id: string; question: string; answer: string; sortOrder: number; isActive: boolean;
}

interface TrustStat {
  id: string; label: string; value: number; suffix?: string | null; prefix?: string | null;
  icon: string; sortOrder: number;
}

interface Testimonial {
  id: string; name: string; title: string; content: string;
  rating: number; verified: boolean; featured: boolean;
}

/* ═══════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════ */
export default function AdminHomePagePage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('services');

  const tabs = [
    { id: 'services', label: 'Services' },
    { id: 'faq', label: 'FAQs' },
    { id: 'stats', label: 'Trust Stats' },
    { id: 'testimonials', label: 'Testimonials' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Home className="h-6 w-6 text-accent-primary" /> Home Page
        </h1>
        <p className="text-text-secondary mt-1">Customize what visitors see on the landing page.</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {activeTab === 'services' && <ServicesTab addToast={addToast} />}
      {activeTab === 'faq' && <FAQTab addToast={addToast} />}
      {activeTab === 'stats' && <TrustStatsTab addToast={addToast} />}
      {activeTab === 'testimonials' && <TestimonialsTab addToast={addToast} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   1. SERVICES TAB
   ═══════════════════════════════════════════════ */
function ServicesTab({ addToast }: { addToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [items, setItems] = useState<HomeService[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HomeService | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HomeService | null>(null);
  const [deleting, setDeleting] = useState(false);

  const emptyForm = { title: '', description: '', icon: 'Target', features: [''], priceLabel: '', linkHref: '#pricing', linkText: 'View Plans', sortOrder: 0, isActive: true };
  const [form, setForm] = useState(emptyForm);

  const fetchItems = async () => {
    try { const r = await fetch('/api/admin/home-services'); if (r.ok) { const d = await r.json(); setItems(d.data ?? []); } } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, sortOrder: items.length }); setModalOpen(true); };
  const openEdit = (s: HomeService) => { setEditing(s); setForm({ title: s.title, description: s.description, icon: s.icon, features: s.features.length > 0 ? s.features : [''], priceLabel: s.priceLabel, linkHref: s.linkHref, linkText: s.linkText, sortOrder: s.sortOrder, isActive: s.isActive }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(emptyForm); };

  const handleFeatureChange = (idx: number, val: string) => { const u = [...form.features]; u[idx] = val; setForm({ ...form, features: u }); };
  const addFeature = () => setForm({ ...form, features: [...form.features, ''] });
  const removeFeature = (idx: number) => { const u = form.features.filter((_, i) => i !== idx); setForm({ ...form, features: u.length ? u : [''] }); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) { addToast('Title and description are required', 'error'); return; }
    setSaving(true);
    try {
      const payload = { ...form, features: form.features.map((f) => f.trim()).filter(Boolean) };
      const res = editing
        ? await fetch(`/api/admin/home-services/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/admin/home-services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { addToast(editing ? 'Service updated' : 'Service created', 'success'); closeModal(); fetchItems(); }
      else { const e = await res.json().catch(() => null); addToast(e?.error || 'Failed to save', 'error'); }
    } catch { addToast('Failed to save', 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return; setDeleting(true);
    try { const r = await fetch(`/api/admin/home-services/${deleteTarget.id}`, { method: 'DELETE' }); if (r.ok) { addToast('Deleted', 'success'); setDeleteTarget(null); fetchItems(); } else addToast('Failed', 'error'); }
    catch { addToast('Failed', 'error'); } finally { setDeleting(false); }
  };

  const toggleActive = async (s: HomeService) => {
    try { const r = await fetch(`/api/admin/home-services/${s.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !s.isActive }) });
      if (r.ok) { addToast(s.isActive ? 'Hidden' : 'Visible', 'success'); fetchItems(); }
    } catch { addToast('Failed', 'error'); }
  };

  return (
    <>
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-heading font-semibold">Service Cards</h2>
            <p className="text-xs text-text-tertiary mt-0.5">Displayed in the &quot;Our Services&quot; section.</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Add Service
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-accent-primary" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-10"><Target className="h-10 w-10 text-text-tertiary mx-auto mb-2" /><p className="text-sm text-text-secondary">No services yet</p></div>
        ) : (
          <div className="space-y-3">
            {items.map((svc) => {
              const Icon = SVC_ICON_MAP[svc.icon] ?? Target;
              return (
                <div key={svc.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${svc.isActive ? 'border-white/[0.06] bg-white/[0.02]' : 'border-white/[0.04] bg-white/[0.01] opacity-60'}`}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #e63946 0%, #c1121f 100%)' }}>
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
                      <span className="text-[10px] text-text-tertiary">{svc.features.length} feature{svc.features.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActive(svc)} className="p-2 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-white/[0.04]" title={svc.isActive ? 'Hide' : 'Show'}>{svc.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                    <button onClick={() => openEdit(svc)} className="p-2 rounded-lg text-text-tertiary hover:text-accent-primary hover:bg-white/[0.04]"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setDeleteTarget(svc)} className="p-2 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger/5"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Service' : 'Add Service'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Challenge Passing" className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Description *</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Brief description..." className="w-full resize-none px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Icon</label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_ICONS.map((item) => { const Ic = item.component; const sel = form.icon === item.name; return (
                <button key={item.name} type="button" onClick={() => setForm({ ...form, icon: item.name })} className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${sel ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-white/[0.08] bg-white/[0.02] text-text-tertiary hover:text-text-secondary hover:border-white/[0.15]'}`} title={item.name}><Ic className="h-5 w-5" /></button>
              ); })}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-text-secondary mb-1.5">Price Label</label><input type="text" value={form.priceLabel} onChange={(e) => setForm({ ...form, priceLabel: e.target.value })} placeholder="From $149" className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50" /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1.5">Button Text</label><input type="text" value={form.linkText} onChange={(e) => setForm({ ...form, linkText: e.target.value })} placeholder="View Plans" className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50" /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1.5">Button Link</label><input type="text" value={form.linkHref} onChange={(e) => setForm({ ...form, linkHref: e.target.value })} placeholder="#pricing" className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-text-secondary mb-1.5">Sort Order</label><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-accent-primary/50" /></div>
            <div className="flex items-end pb-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-white/20 bg-white/[0.04] text-accent-primary focus:ring-accent-primary" /><span className="text-sm text-text-secondary">Active (visible on site)</span></label></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Features</label>
            <div className="space-y-2">
              {form.features.map((feat, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="text" value={feat} onChange={(e) => handleFeatureChange(idx, e.target.value)} placeholder={`Feature ${idx + 1}`} className="flex-1 px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50" />
                  {form.features.length > 1 && <button type="button" onClick={() => removeFeature(idx)} className="p-2 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger/5"><X className="h-4 w-4" /></button>}
                </div>
              ))}
              <button type="button" onClick={addFeature} className="flex items-center gap-1.5 text-xs text-accent-primary hover:text-red-300"><Plus className="h-3.5 w-3.5" /> Add feature</button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={closeModal} className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04]">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 disabled:opacity-40 disabled:cursor-not-allowed">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? 'Save Changes' : 'Create Service'}</button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Service" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Delete <strong className="text-text-primary">{deleteTarget?.title}</strong>? This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/[0.04]">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-danger text-white text-sm font-medium disabled:opacity-40">{deleting && <Loader2 className="h-4 w-4 animate-spin" />}Delete</button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ═══════════════════════════════════════════════
   2. FAQ TAB
   ═══════════════════════════════════════════════ */
function FAQTab({ addToast }: { addToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FAQItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FAQItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const emptyForm = { question: '', answer: '', sortOrder: 0, isActive: true };
  const [form, setForm] = useState(emptyForm);

  const fetchItems = async () => {
    try { const r = await fetch('/api/admin/faq'); if (r.ok) { const d = await r.json(); setItems(d.data ?? []); } } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, sortOrder: items.length }); setModalOpen(true); };
  const openEdit = (f: FAQItem) => { setEditing(f); setForm({ question: f.question, answer: f.answer, sortOrder: f.sortOrder, isActive: f.isActive }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(emptyForm); };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) { addToast('Question and answer are required', 'error'); return; }
    setSaving(true);
    try {
      const res = editing
        ? await fetch(`/api/admin/faq/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        : await fetch('/api/admin/faq', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { addToast(editing ? 'FAQ updated' : 'FAQ created', 'success'); closeModal(); fetchItems(); }
      else { addToast('Failed to save', 'error'); }
    } catch { addToast('Failed to save', 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return; setDeleting(true);
    try { const r = await fetch(`/api/admin/faq/${deleteTarget.id}`, { method: 'DELETE' }); if (r.ok) { addToast('Deleted', 'success'); setDeleteTarget(null); fetchItems(); } else addToast('Failed', 'error'); }
    catch { addToast('Failed', 'error'); } finally { setDeleting(false); }
  };

  const toggleActive = async (f: FAQItem) => {
    try { const r = await fetch(`/api/admin/faq/${f.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !f.isActive }) });
      if (r.ok) { addToast(f.isActive ? 'Hidden' : 'Visible', 'success'); fetchItems(); }
    } catch { addToast('Failed', 'error'); }
  };

  return (
    <>
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="text-lg font-heading font-semibold">FAQ Items</h2><p className="text-xs text-text-tertiary mt-0.5">Displayed in the FAQ accordion section.</p></div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90"><Plus className="h-4 w-4" /> Add FAQ</button>
        </div>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-accent-primary" /></div> : items.length === 0 ? (
          <div className="text-center py-10"><p className="text-sm text-text-secondary">No FAQ items yet</p></div>
        ) : (
          <div className="space-y-3">
            {items.map((faq) => (
              <div key={faq.id} className={`flex items-start gap-4 p-4 rounded-xl border ${faq.isActive ? 'border-white/[0.06] bg-white/[0.02]' : 'border-white/[0.04] opacity-60'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary">{faq.question}</p>
                    {!faq.isActive && <Badge variant="yellow" size="sm">Hidden</Badge>}
                  </div>
                  <p className="text-xs text-text-tertiary mt-1 line-clamp-2">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(faq)} className="p-2 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-white/[0.04]">{faq.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                  <button onClick={() => openEdit(faq)} className="p-2 rounded-lg text-text-tertiary hover:text-accent-primary hover:bg-white/[0.04]"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteTarget(faq)} className="p-2 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger/5"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit FAQ' : 'Add FAQ'} size="lg">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-text-secondary mb-1.5">Question *</label><input type="text" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="e.g. How long does it take?" className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50" /></div>
          <div><label className="block text-sm font-medium text-text-secondary mb-1.5">Answer *</label><textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} placeholder="Answer..." className="w-full resize-none px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-text-secondary mb-1.5">Sort Order</label><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-accent-primary/50" /></div>
            <div className="flex items-end pb-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-white/20 bg-white/[0.04] text-accent-primary" /><span className="text-sm text-text-secondary">Active</span></label></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={closeModal} className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/[0.04]">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-accent-primary text-white text-sm font-medium disabled:opacity-40">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? 'Save Changes' : 'Create FAQ'}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete FAQ" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Delete this FAQ? This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/[0.04]">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-danger text-white text-sm font-medium disabled:opacity-40">{deleting && <Loader2 className="h-4 w-4 animate-spin" />}Delete</button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ═══════════════════════════════════════════════
   3. TRUST STATS TAB
   ═══════════════════════════════════════════════ */
function TrustStatsTab({ addToast }: { addToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [stats, setStats] = useState<TrustStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchStats = async () => {
    try { const r = await fetch('/api/admin/trust-stats'); if (r.ok) { const d = await r.json(); setStats(d.data ?? []); } } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchStats(); }, []);

  const updateStat = (idx: number, field: string, value: unknown) => {
    const u = [...stats]; (u[idx] as unknown as Record<string, unknown>)[field] = value; setStats(u);
  };

  const addStat = () => {
    setStats([...stats, { id: `new-${Date.now()}`, label: '', value: 0, suffix: '', prefix: '', icon: 'Trophy', sortOrder: stats.length }]);
  };

  const removeStat = (idx: number) => {
    setStats(stats.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    const valid = stats.filter((s) => s.label.trim());
    if (valid.length === 0) { addToast('Add at least one stat', 'error'); return; }
    setSaving(true);
    try {
      const payload = valid.map((s, i) => ({ ...s, id: s.id.startsWith('new-') ? `stat-${Date.now()}-${i}` : s.id, sortOrder: i }));
      const r = await fetch('/api/admin/trust-stats', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stats: payload }) });
      if (r.ok) { addToast('Stats saved', 'success'); fetchStats(); } else addToast('Failed to save', 'error');
    } catch { addToast('Failed to save', 'error'); } finally { setSaving(false); }
  };

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-lg font-heading font-semibold">Trust Indicators</h2><p className="text-xs text-text-tertiary mt-0.5">Stats bar shown below the hero section.</p></div>
        <div className="flex gap-2">
          <button onClick={addStat} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] text-text-secondary text-sm hover:bg-white/[0.04]"><Plus className="h-4 w-4" /> Add</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-primary text-white text-sm font-medium disabled:opacity-40">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Save All</button>
        </div>
      </div>
      {loading ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-accent-primary" /></div> : (
        <div className="space-y-4">
          {stats.map((stat, idx) => {
            const Icon = STAT_ICON_MAP[stat.icon] ?? Trophy;
            return (
              <div key={stat.id} className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  {/* Icon picker */}
                  <div className="flex gap-1">
                    {STAT_ICONS.map((ic) => { const Ic = ic.component; return (
                      <button key={ic.name} type="button" onClick={() => updateStat(idx, 'icon', ic.name)} className={`w-8 h-8 rounded-lg flex items-center justify-center border text-xs ${stat.icon === ic.name ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-white/[0.06] text-text-tertiary hover:text-text-secondary'}`}><Ic className="h-4 w-4" /></button>
                    ); })}
                  </div>
                  <input type="text" value={stat.label} onChange={(e) => updateStat(idx, 'label', e.target.value)} placeholder="Label" className="w-36 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50" />
                  <input type="text" value={stat.prefix ?? ''} onChange={(e) => updateStat(idx, 'prefix', e.target.value)} placeholder="Prefix ($)" className="w-16 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50" />
                  <input type="number" value={stat.value} onChange={(e) => updateStat(idx, 'value', parseFloat(e.target.value) || 0)} className="w-24 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-accent-primary/50" />
                  <input type="text" value={stat.suffix ?? ''} onChange={(e) => updateStat(idx, 'suffix', e.target.value)} placeholder="Suffix (+, %)" className="w-20 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50" />
                </div>
                <button onClick={() => removeStat(idx)} className="p-2 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger/5 shrink-0"><Trash2 className="h-4 w-4" /></button>
              </div>
            );
          })}
          {stats.length === 0 && <div className="text-center py-8 text-sm text-text-secondary">No stats yet. Click &quot;Add&quot; to create one.</div>}
        </div>
      )}
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════════
   4. TESTIMONIALS TAB
   ═══════════════════════════════════════════════ */
function TestimonialsTab({ addToast }: { addToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const [deleting, setDeleting] = useState(false);

  const emptyForm = { name: '', title: '', content: '', rating: 5, verified: false, featured: false };
  const [form, setForm] = useState(emptyForm);

  const fetchItems = async () => {
    try { const r = await fetch('/api/admin/testimonials'); if (r.ok) { const d = await r.json(); setItems(d.data ?? []); } } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (t: Testimonial) => { setEditing(t); setForm({ name: t.name, title: t.title, content: t.content, rating: t.rating, verified: t.verified, featured: t.featured }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(emptyForm); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.title.trim() || !form.content.trim()) { addToast('Name, title, and content are required', 'error'); return; }
    setSaving(true);
    try {
      const res = editing
        ? await fetch(`/api/admin/testimonials/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        : await fetch('/api/admin/testimonials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { addToast(editing ? 'Updated' : 'Created', 'success'); closeModal(); fetchItems(); }
      else addToast('Failed to save', 'error');
    } catch { addToast('Failed to save', 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return; setDeleting(true);
    try { const r = await fetch(`/api/admin/testimonials/${deleteTarget.id}`, { method: 'DELETE' }); if (r.ok) { addToast('Deleted', 'success'); setDeleteTarget(null); fetchItems(); } else addToast('Failed', 'error'); }
    catch { addToast('Failed', 'error'); } finally { setDeleting(false); }
  };

  return (
    <>
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="text-lg font-heading font-semibold">Testimonials</h2><p className="text-xs text-text-tertiary mt-0.5">Client reviews displayed on the home page.</p></div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90"><Plus className="h-4 w-4" /> Add Testimonial</button>
        </div>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-accent-primary" /></div> : items.length === 0 ? (
          <div className="text-center py-10"><Star className="h-10 w-10 text-text-tertiary mx-auto mb-2" /><p className="text-sm text-text-secondary">No testimonials yet</p></div>
        ) : (
          <div className="space-y-3">
            {items.map((t) => (
              <div key={t.id} className="flex items-start gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-text-primary">{t.name}</p>
                    <div className="flex gap-0.5">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-accent-gold text-accent-gold" />)}</div>
                    {t.verified && <Badge variant="green" size="sm">Verified</Badge>}
                    {t.featured && <Badge variant="gold" size="sm">Featured</Badge>}
                  </div>
                  <p className="text-xs text-accent-primary mt-0.5">{t.title}</p>
                  <p className="text-xs text-text-tertiary mt-1 line-clamp-2">{t.content}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(t)} className="p-2 rounded-lg text-text-tertiary hover:text-accent-primary hover:bg-white/[0.04]"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteTarget(t)} className="p-2 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger/5"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Testimonial' : 'Add Testimonial'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-text-secondary mb-1.5">Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John D." className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50" /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1.5">Title *</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Passed $200K FTMO Challenge" className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50" /></div>
          </div>
          <div><label className="block text-sm font-medium text-text-secondary mb-1.5">Content *</label><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} placeholder="Their review..." className="w-full resize-none px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50" /></div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button key={r} type="button" onClick={() => setForm({ ...form, rating: r })} className="p-1"><Star className={`h-5 w-5 ${r <= form.rating ? 'fill-accent-gold text-accent-gold' : 'text-text-tertiary'}`} /></button>
                ))}
              </div>
            </div>
            <div className="flex items-end pb-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} className="w-4 h-4 rounded border-white/20 bg-white/[0.04] text-accent-primary" /><span className="text-sm text-text-secondary">Verified</span></label></div>
            <div className="flex items-end pb-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4 rounded border-white/20 bg-white/[0.04] text-accent-primary" /><span className="text-sm text-text-secondary">Featured</span></label></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={closeModal} className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/[0.04]">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-accent-primary text-white text-sm font-medium disabled:opacity-40">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? 'Save Changes' : 'Create'}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Testimonial" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Delete testimonial from <strong className="text-text-primary">{deleteTarget?.name}</strong>?</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/[0.04]">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-danger text-white text-sm font-medium disabled:opacity-40">{deleting && <Loader2 className="h-4 w-4 animate-spin" />}Delete</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
