'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight, BookOpen } from 'lucide-react';
import SectionBadge from '@/components/ui/SectionBadge';
import { formatDate } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────
interface DbPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  author: string;
  tags: string[];
  published: boolean;
  publishedAt: Date | string | null;
}

interface PostCard {
  title: string;
  category: string;
  excerpt: string;
  readTime: string;
  image: string | null;
  slug: string | null;   // null = demo / no live page
  author?: string;
  publishedAt?: Date | string | null;
  status?: 'published' | 'scheduled'; // undefined = demo post
}

interface BlogContentProps {
  dbPosts: DbPost[];
  dbCategories: string[]; // categories derived from real posts
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = ['Prop Firm Guide', 'Trading Tips'];

const DEMO_FEATURED: PostCard = {
  title: 'How to Pass FTMO in 10 Days',
  category: 'Prop Firm Guide',
  excerpt:
    'A step-by-step breakdown of the exact strategy we use to pass FTMO challenges consistently, including risk management tips and trade selection criteria.',
  readTime: '8 min read',
  author: 'Alex Rivera',
  image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  slug: null,
};

const DEMO_POSTS: PostCard[] = [
  {
    title: 'The Psychology Behind Consistent Trading',
    category: 'Trading Tips',
    excerpt:
      'Why most traders fail prop firm challenges — and how to build the mental framework needed to succeed under pressure.',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1642790551116-18e150f248e3?w=800&q=80',
    slug: null,
  },
  {
    title: 'Top 5 Prop Firms Compared in 2025',
    category: 'Prop Firm Guide',
    excerpt:
      'A deep dive into FTMO, Apex, E8, MFF, and The Funded Trader — pros, cons, payout conditions, and our verdict on which is best for you.',
    readTime: '12 min read',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    slug: null,
  },
  {
    title: 'Risk Management Rules Every Prop Trader Must Know',
    category: 'Trading Tips',
    excerpt:
      'The exact drawdown rules, lot sizing formulas, and daily loss limits our traders follow to consistently stay within prop firm requirements.',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80',
    slug: null,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function estimateReadTime(excerpt: string | null): string {
  if (!excerpt) return '3 min read';
  const words = excerpt.split(' ').length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function dbToCard(p: DbPost): PostCard {
  const isScheduled = !p.published && p.publishedAt !== null && new Date(p.publishedAt as string) > new Date();
  return {
    title: p.title,
    category: p.tags[0] ?? 'Article',
    excerpt: p.excerpt ?? '',
    readTime: estimateReadTime(p.excerpt),
    image: p.coverImage,
    slug: p.slug,
    author: p.author,
    publishedAt: p.publishedAt,
    status: isScheduled ? 'scheduled' : 'published',
  };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BlogContent({ dbPosts, dbCategories }: BlogContentProps) {
  const [activeCategory, setActiveCategory] = useState('All Posts');

  const useDemo = dbPosts.length === 0;
  const allCards: PostCard[] = useDemo ? [] : dbPosts.map(dbToCard);

  // Use real categories from DB when available, fall back to defaults for demo
  const categories = ['All Posts', ...(useDemo ? DEFAULT_CATEGORIES : dbCategories)];

  const featured: PostCard | null = useDemo ? DEMO_FEATURED : (allCards[0] ?? null);
  const gridPosts: PostCard[]     = useDemo ? DEMO_POSTS    : allCards.slice(1);

  const showFeatured =
    featured !== null &&
    (activeCategory === 'All Posts' || featured.category === activeCategory);

  const filteredGrid =
    activeCategory === 'All Posts'
      ? gridPosts
      : gridPosts.filter((p) => p.category === activeCategory);

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── Header ── */}
        <div className="mb-12 text-center">
          <SectionBadge className="mb-4">Our Blog</SectionBadge>
          <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-4">
            Trading <span className="text-gradient-red">Insights &amp; Guides</span>
          </h1>
          <p className="mt-4 text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            Expert articles on prop firm challenges, trading psychology, and funded account strategies.
          </p>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={
                activeCategory === cat
                  ? 'px-5 py-2 rounded-full text-sm font-semibold border border-transparent text-white transition-all duration-200'
                  : 'px-5 py-2 rounded-full text-sm font-semibold border border-[rgba(230,57,70,0.20)] bg-white/[0.03] text-text-tertiary hover:border-[rgba(230,57,70,0.40)] hover:text-white transition-all duration-200'
              }
              style={
                activeCategory === cat
                  ? { background: 'linear-gradient(135deg, #e63946 0%, #c1121f 100%)', boxShadow: '0 0 14px rgba(230,57,70,0.4)' }
                  : {}
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Empty state ── */}
        {!showFeatured && filteredGrid.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-xl font-heading font-semibold">No Posts Yet</h3>
            <p className="text-text-secondary mt-2">Check back soon for trading insights and news.</p>
          </div>
        )}

        {/* ── Featured Post ── */}
        {showFeatured && featured && (
          <FeaturedCard post={featured} isDemo={useDemo} />
        )}

        {/* ── Post Grid ── */}
        {filteredGrid.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGrid.map((post) => (
              <GridCard key={post.title} post={post} isDemo={useDemo} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Featured card ─────────────────────────────────────────────────────────────
function FeaturedCard({ post, isDemo }: { post: PostCard; isDemo: boolean }) {
  const content = (
    <div className="group rounded-xl border border-[rgba(230,57,70,0.30)] bg-[#180c0c] backdrop-blur-xl overflow-hidden flex flex-col md:grid md:grid-cols-2 mb-8 hover:border-[rgba(230,57,70,0.50)] hover:shadow-[0_0_30px_rgba(230,57,70,0.08)] transition-all duration-300 cursor-pointer">
      {/* Image */}
      <div className="h-56 md:h-auto relative overflow-hidden">
        {post.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent-primary/10 to-accent-primary/5 flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-accent-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/50" />
      </div>

      {/* Content */}
      <div className="p-8 flex flex-col justify-center">
        <span className="text-accent-primary text-xs tracking-widest uppercase mb-3">
          {post.category}
        </span>
        <h2 className="font-heading font-bold text-3xl text-white mb-3">{post.title}</h2>
        <p className="text-zinc-500 text-sm leading-relaxed mb-5">{post.excerpt}</p>
        <div className="flex items-center gap-4 text-xs text-zinc-600 mb-5">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {post.readTime}
          </span>
          {post.author && <span>By {post.author}</span>}
          {post.publishedAt && (
            <span>{formatDate(post.publishedAt as string)}</span>
          )}
        </div>
        {isDemo || post.status === 'scheduled' ? (
          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-white/10 text-text-tertiary w-fit cursor-default">
            Coming Soon
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-[rgba(230,57,70,0.50)] text-accent-primary bg-transparent font-semibold w-fit">
            Read Article <ArrowRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </div>
  );

  if (isDemo || !post.slug || post.status === 'scheduled') return content;
  return <Link href={`/blog/${post.slug}`}>{content}</Link>;
}

// ── Grid card ─────────────────────────────────────────────────────────────────
function GridCard({ post, isDemo }: { post: PostCard; isDemo: boolean }) {
  const content = (
    <div className="group rounded-xl border border-[rgba(255,255,255,0.08)] bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-[rgba(230,57,70,0.35)] hover:shadow-[0_0_30px_rgba(230,57,70,0.08)] transition-all duration-300 cursor-pointer flex flex-col h-full">
      <div className="h-44 overflow-hidden relative shrink-0">
        {post.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent-primary/10 to-accent-primary/5 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-accent-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0303] to-transparent" />
      </div>

      <div className="p-5 flex flex-col flex-1">
        <span className="text-accent-primary text-xs tracking-widest uppercase">
          {post.category}
        </span>
        <h3 className="font-heading font-semibold text-xl text-white mt-1 mb-2">{post.title}</h3>
        <p className="text-zinc-500 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between text-xs text-zinc-600">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {post.readTime}
          </span>
          {isDemo || post.status === 'scheduled' ? (
            <span className="text-text-tertiary">Coming Soon</span>
          ) : (
            <span className="flex items-center gap-1 text-accent-primary hover:text-red-300 transition-colors">
              Read <ArrowRight className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (isDemo || !post.slug || post.status === 'scheduled') return <div>{content}</div>;
  return <Link href={`/blog/${post.slug}`}>{content}</Link>;
}
