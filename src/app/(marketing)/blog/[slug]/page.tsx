import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, User, ArrowLeft, Tag } from 'lucide-react';
import prisma from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

export const revalidate = 60;

// ── Content renderer — handles markdown images + plain paragraphs ─────────────
function BlogContent({ content }: { content: string }) {
  // Split on markdown image syntax: ![alt text](url)
  const IMAGE_RE = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = IMAGE_RE.exec(content)) !== null) {
    // Text before this image
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++} className="whitespace-pre-wrap">
          {content.slice(lastIndex, match.index)}
        </span>
      );
    }
    // The image itself
    parts.push(
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={key++}
        src={match[2]}
        alt={match[1]}
        className="w-full rounded-xl my-6 object-cover"
      />
    );
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after the last image
  if (lastIndex < content.length) {
    parts.push(
      <span key={key++} className="whitespace-pre-wrap">
        {content.slice(lastIndex)}
      </span>
    );
  }

  return <>{parts}</>;
}

interface Props {
  params: { slug: string };
}

async function getPost(slug: string) {
  try {
    return await prisma.blogPost.findFirst({
      where: { slug, published: true },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: 'Post Not Found' };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [{ url: post.coverImage }] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {post.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-accent-primary/10 text-accent-primary">
                <Tag className="h-3 w-3" />{tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-heading font-bold mb-4 leading-tight">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-text-tertiary mb-8 pb-8 border-b border-[rgba(230,57,70,0.28)]">
          <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{post.author}</span>
          {post.publishedAt && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />{formatDate(post.publishedAt)}
            </span>
          )}
        </div>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="rounded-2xl overflow-hidden mb-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-64 sm:h-80 object-cover"
            />
          </div>
        )}

        {/* Excerpt */}
        <p className="text-text-secondary text-lg leading-relaxed mb-8 italic border-l-4 border-accent-primary/30 pl-5">
          {post.excerpt}
        </p>

        {/* Content */}
        <div className="prose prose-invert prose-sm max-w-none text-text-secondary leading-relaxed">
          <BlogContent content={post.content} />
        </div>

        {/* Footer CTA */}
        <div className="mt-16 p-8 rounded-2xl border border-accent-primary/20 bg-accent-primary/5 text-center">
          <h3 className="text-xl font-heading font-bold mb-2">Ready to Get Funded?</h3>
          <p className="text-text-secondary text-sm mb-4">
            Join 2,500+ traders who have passed their prop firm challenges with The Market Architects.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-accent-primary text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-accent-primary/90 transition-colors"
          >
            Get Started Today
          </Link>
        </div>
      </div>
    </div>
  );
}
