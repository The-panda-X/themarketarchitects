import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import BlogContent from './BlogContent';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Trading tips, prop firm news, and industry insights from The Market Architects team.',
};

export const revalidate = 60;

async function getPublishedPosts() {
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
  const posts = await getPublishedPosts();
  return <BlogContent dbPosts={posts} />;
}
