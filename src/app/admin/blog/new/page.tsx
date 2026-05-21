'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Toggle from '@/components/ui/Toggle';
import useToast from '@/hooks/useToast';

export default function NewBlogPostPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    coverImage: '',
    author: '',
    tags: '',
    published: false,
  });

  const handleSubmit = async () => {
    if (!form.title || !form.excerpt || !form.content) {
      addToast('Title, excerpt, and content are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          coverImage: form.coverImage || undefined,
          author: form.author || undefined,
        }),
      });
      if (res.ok) {
        addToast('Post created.', 'success');
        router.push('/admin/blog');
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to create post.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>Blog</Button>
        </Link>
        <h1 className="text-xl font-heading font-bold flex-1">New Blog Post</h1>
        <Button variant="primary" size="sm" loading={saving} icon={<Save className="h-4 w-4" />} onClick={handleSubmit}>
          Save Post
        </Button>
      </div>

      <GlassCard padding="lg">
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Post title..."
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            label="Author"
            placeholder="Author name (leave blank for your name)"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
          />
          <Input
            label="Cover Image URL"
            placeholder="https://..."
            value={form.coverImage}
            onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
          />
          <Textarea
            label="Excerpt"
            placeholder="Short description shown in listings..."
            rows={2}
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          />
          <Textarea
            label="Content"
            placeholder="Write your post content here. Markdown is supported..."
            rows={16}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <Input
            label="Tags"
            placeholder="trading, prop firm, challenge (comma separated)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
          <Toggle
            label="Publish Now"
            description="Make this post publicly visible immediately."
            enabled={form.published}
            onChange={(v) => setForm({ ...form, published: v })}
          />
        </div>
      </GlassCard>
    </div>
  );
}
