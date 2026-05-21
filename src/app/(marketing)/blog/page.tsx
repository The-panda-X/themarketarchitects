import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, User, ArrowRight, BookOpen } from 'lucide-react';
import SectionBadge from '@/components/ui/SectionBadge';
import prisma from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Trading tips, prop firm news, and industry insights from The Market Architects team.',
};

export const revalidate = 60;

async function getPosts() {
  try {
    return await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        author: true,
        tags: true,
        publishedAt: true,
      },
    });
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <SectionBadge className="mb-4">Blog</SectionBadge>
          <h1 className="font-heading font-black text-5xl md:text-7xl text-white tracking-tight mb-4">
            Trading <span className="text-gradient-red">Insights</span>
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            Expert guides, prop firm news, and strategy tips from our professional trading team.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-xl font-heading font-semibold">No Posts Yet</h3>
            <p className="text-text-secondary mt-2">Check back soon for trading insights and news.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-[rgba(230,57,70,0.28)] bg-white/[0.03] overflow-hidden hover:border-[rgba(230,57,70,0.40)] hover:bg-white/[0.05] transition-all duration-200"
              >
                {post.coverImage ? (
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-accent-primary/10 to-accent-gold/10 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-accent-primary/30" />
                  </div>
                )}
                <div className="flex flex-col flex-1 p-5">
                  {post.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2 className="font-heading font-semibold text-base mb-2 group-hover:text-accent-primary transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-text-secondary text-sm line-clamp-2 flex-1">{post.excerpt}</p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06] text-xs text-text-tertiary">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.author}</span>
                    {post.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{formatDate(post.publishedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
