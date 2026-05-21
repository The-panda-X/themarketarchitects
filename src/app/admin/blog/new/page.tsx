'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, FileText, Clock, Globe,
  Upload, X, ImageIcon, Plus, ChevronDown, Check,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import useToast from '@/hooks/useToast';
import { cn } from '@/lib/utils';

type PostStatus = 'draft' | 'scheduled' | 'published';

const STATUS_OPTIONS: { value: PostStatus; label: string; desc: string; icon: typeof FileText }[] = [
  { value: 'draft',     label: 'Draft',       desc: 'Save privately, not visible on site',  icon: FileText },
  { value: 'scheduled', label: 'Schedule',     desc: 'Show "Coming Soon" on a future date',  icon: Clock    },
  { value: 'published', label: 'Publish Now',  desc: 'Make live immediately',                icon: Globe    },
];

// ── Post-Type Combobox ────────────────────────────────────────────────────────
function PostTypeSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open,       setOpen]       = useState(false);
  const [addingNew,  setAddingNew]  = useState(false);
  const [newType,    setNewType]    = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setAddingNew(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectOption = (opt: string) => {
    onChange(opt);
    setOpen(false);
  };

  const confirmNew = () => {
    const trimmed = newType.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setOpen(false);
    setAddingNew(false);
    setNewType('');
  };

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-text-primary mb-1.5">
        Post Type <span className="text-danger">*</span>
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setAddingNew(false); }}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all duration-200',
          'bg-white/[0.05] text-text-primary',
          open
            ? 'border-accent-primary ring-1 ring-accent-primary/30'
            : 'border-white/[0.10] hover:border-white/[0.20]',
          !value && 'text-text-tertiary'
        )}
      >
        <span>{value || 'Select a post type…'}</span>
        <ChevronDown className={cn('h-4 w-4 text-text-tertiary transition-transform', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-white/[0.10] bg-[#170d0d] shadow-xl overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => selectOption(opt)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-text-primary hover:bg-accent-primary/10 hover:text-accent-primary transition-colors text-left"
            >
              {opt}
              {value === opt && <Check className="h-3.5 w-3.5 text-accent-primary" />}
            </button>
          ))}

          {/* Divider */}
          <div className="border-t border-white/[0.06] mx-2" />

          {/* Add new type */}
          {addingNew ? (
            <div className="flex items-center gap-2 px-3 py-2">
              <input
                autoFocus
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmNew(); if (e.key === 'Escape') setAddingNew(false); }}
                placeholder="New type name…"
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none border-b border-white/[0.15] pb-0.5"
              />
              <button
                type="button"
                onClick={confirmNew}
                className="text-xs px-2 py-1 rounded-lg bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 transition-colors"
              >
                Add
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingNew(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-accent-primary hover:bg-accent-primary/10 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add new type…
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NewBlogPostPage() {
  const router       = useRouter();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status,    setStatus]    = useState<PostStatus>('draft');
  const [categories, setCategories] = useState<string[]>(['Prop Firm Guide', 'Trading Tips']);

  const [form, setForm] = useState({
    title:       '',
    postType:    '',   // becomes tags[0]
    excerpt:     '',
    content:     '',
    coverImage:  '',
    author:      '',
    tags:        '',   // extra tags (comma-separated), appended after postType
    scheduledAt: '',
  });

  // Load existing post types from API
  useEffect(() => {
    fetch('/api/admin/blog/categories')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.data)) setCategories(d.data); })
      .catch(() => {});
  }, []);

  // ── Image upload ────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res  = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (res.ok) {
        setForm((p) => ({ ...p, coverImage: json.data.url }));
        addToast('Image uploaded.', 'success');
      } else {
        addToast(json.error || 'Upload failed.', 'error');
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.title || !form.excerpt || !form.content) {
      addToast('Title, excerpt, and content are required.', 'error');
      return;
    }
    if (!form.postType) {
      addToast('Please select a post type.', 'error');
      return;
    }
    if (status === 'scheduled' && !form.scheduledAt) {
      addToast('Please pick a future date and time to schedule.', 'error');
      return;
    }
    if (status === 'scheduled' && new Date(form.scheduledAt) <= new Date()) {
      addToast('Scheduled date must be in the future.', 'error');
      return;
    }

    // Build tags: postType first, then any extra tags
    const extraTags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const allTags   = [form.postType, ...extraTags];

    setSaving(true);
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       form.title,
          excerpt:     form.excerpt,
          content:     form.content,
          coverImage:  form.coverImage  || undefined,
          author:      form.author      || undefined,
          tags:        allTags,
          published:   status === 'published',
          scheduledAt: status === 'scheduled' ? form.scheduledAt : null,
        }),
      });

      if (res.ok) {
        const label =
          status === 'published' ? 'published' :
          status === 'scheduled' ? 'scheduled' :
          'saved as draft';
        addToast(`Post ${label}.`, 'success');
        router.push('/admin/blog');
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to save post.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const minSchedule = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Link href="/admin/blog">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>Blog</Button>
        </Link>
        <h1 className="text-xl font-heading font-bold flex-1">New Blog Post</h1>
        <Button
          variant="primary"
          size="sm"
          loading={saving}
          icon={<Save className="h-4 w-4" />}
          onClick={handleSubmit}
        >
          {status === 'published' ? 'Publish' : status === 'scheduled' ? 'Schedule' : 'Save Draft'}
        </Button>
      </div>

      {/* ── Post Fields ── */}
      <GlassCard padding="lg">
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Post title..."
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          {/* Post Type combobox */}
          <PostTypeSelect
            value={form.postType}
            options={categories}
            onChange={(v) => setForm({ ...form, postType: v })}
          />

          <Input
            label="Author"
            placeholder="Author name"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
          />

          {/* Cover Image */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">Cover Image</label>

            {form.coverImage && (
              <div className="relative rounded-xl overflow-hidden h-40 bg-white/[0.03] border border-white/[0.08]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, coverImage: '' }))}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  placeholder="https://... or upload an image →"
                  value={form.coverImage}
                  onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={uploading}
                icon={uploading ? undefined : <Upload className="h-4 w-4" />}
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 h-[42px] border border-white/[0.08] hover:border-accent-primary/40"
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </Button>
            </div>

            {!form.coverImage && (
              <div
                className="flex items-center gap-2 rounded-xl border border-dashed border-white/[0.10] bg-white/[0.02] px-4 py-6 justify-center cursor-pointer hover:border-accent-primary/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-5 w-5 text-text-tertiary" />
                <span className="text-sm text-text-tertiary">Click to upload or paste a URL above</span>
              </div>
            )}
            <p className="text-xs text-text-tertiary">JPEG, PNG, WebP or GIF · max 5 MB</p>
          </div>

          <Textarea
            label="Excerpt"
            placeholder="Short description shown in listings..."
            rows={2}
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          />
          <Textarea
            label="Content"
            placeholder={"Write your post content here...\n\nEmbed images with: ![alt text](https://url.com/image.jpg)"}
            rows={16}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <Input
            label="Additional Tags"
            placeholder="e.g. FTMO, Risk Management (comma separated)"
            hint="Optional — the Post Type above is already saved as the primary tag."
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
        </div>
      </GlassCard>

      {/* ── Publish Status ── */}
      <GlassCard padding="lg">
        <p className="text-sm font-semibold text-text-primary mb-3">Publish Status</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STATUS_OPTIONS.map(({ value, label, desc, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={cn(
                'flex flex-col items-start gap-1 p-4 rounded-xl border text-left transition-all duration-200',
                status === value
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4', status === value ? 'text-accent-primary' : 'text-text-tertiary')} />
                <span className={cn('text-sm font-semibold', status === value ? 'text-accent-primary' : 'text-text-primary')}>
                  {label}
                </span>
              </div>
              <span className="text-xs text-text-tertiary leading-tight">{desc}</span>
            </button>
          ))}
        </div>

        {status === 'scheduled' && (
          <div className="mt-4">
            <Input
              label="Publish Date & Time"
              type="datetime-local"
              min={minSchedule}
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              hint="The post will appear as 'Coming Soon' on the blog until this date."
            />
          </div>
        )}
      </GlassCard>

    </div>
  );
}
