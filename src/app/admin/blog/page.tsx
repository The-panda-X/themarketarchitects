'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import useToast from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';

interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  author: string;
  published: boolean;
  publishedAt: string | null;
  tags: string[];
  createdAt: string;
}

export default function AdminBlogPage() {
  const { addToast } = useToast();
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog?page=${page}&limit=20`);
      if (res.ok) {
        const d = await res.json();
        setPosts(d.data.data ?? []);
        setTotalPages(d.data.totalPages ?? 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const togglePublish = async (post: BlogPostRow) => {
    const res = await fetch(`/api/admin/blog/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !post.published }),
    });
    if (res.ok) {
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, published: !p.published } : p));
      addToast(`Post ${post.published ? 'unpublished' : 'published'}.`, 'success');
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      addToast('Post deleted.', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Blog Posts</h1>
          <p className="text-text-secondary mt-1">Manage your published content.</p>
        </div>
        <Link href="/admin/blog/new">
          <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}>New Post</Button>
        </Link>
      </div>

      <GlassCard padding="md">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-secondary">No blog posts yet.</p>
            <Link href="/admin/blog/new">
              <Button variant="primary" size="sm" className="mt-4">Create First Post</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <div key={post.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-sm truncate">{post.title}</h3>
                    <Badge variant={post.published ? 'green' : 'default'} size="sm">
                      {post.published ? 'Published' : 'Draft'}
                    </Badge>
                    {post.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    By {post.author} · {formatDate(post.createdAt)}
                    {post.publishedAt ? ` · Published ${formatDate(post.publishedAt)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    onClick={() => togglePublish(post)}
                    title={post.published ? 'Unpublish' : 'Publish'}
                  />
                  <Link href={`/admin/blog/${post.id}/edit`}>
                    <Button variant="ghost" size="sm" icon={<Edit className="h-4 w-4" />} />
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="h-4 w-4 text-danger" />}
                    onClick={() => deletePost(post.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
