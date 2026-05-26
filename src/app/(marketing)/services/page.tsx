import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ServicesSection from '@/components/home/ServicesSection';
import PricingSection from '@/components/home/PricingSection';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Professional prop firm challenge passing, funded account management, and account growth services. Backed by a 97% success rate.',
};

export default async function ServicesPage() {
  const plans = await prisma.servicePlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  const serialized = plans.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="pt-16">
      <ServicesSection />
      <PricingSection plans={serialized} />
    </div>
  );
}
