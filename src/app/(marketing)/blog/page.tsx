import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import BlogContent from './BlogContent';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Trading tips, prop firm news, and industry insights from The Market Architects team.',
};

export const revalidate = 60;

async function getPostsAndCategories() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        OR: [
          { published: true },
          { published: false, publishedAt: { gt: new Date() } },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: 20,
      select: {
        id:          true,
        title:       true,
        slug:        true,
        excerpt:     true,
        coverImage:  true,
        author:      true,
        tags:        true,
        published:   true,
        publishedAt: true,
      },
    });

    // Derive unique categories from the first tag of each post
    const categories = [
      ...new Set(
        posts
          .map((p) => p.tags[0])
          .filter((t): t is string => Boolean(t))
      ),
    ];

    return { posts, categories };
  } catch {
    return { posts: [], categories: [] };
  }
}

export default async function BlogPage() {
  const { posts, categories } = await getPostsAndCategories();
  return <BlogContent dbPosts={posts} dbCategories={categories} />;
}
