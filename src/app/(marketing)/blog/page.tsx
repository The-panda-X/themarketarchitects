import type { Metadata } from 'next';
import BlogContent from './BlogContent';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Trading tips, prop firm news, and industry insights from The Market Architects team.',
};

export default function BlogPage() {
  return <BlogContent />;
}
