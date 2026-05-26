import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import PricingSection from '@/components/home/PricingSection';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Transparent pricing for prop firm challenge passing and funded account management. No hidden fees.',
};

export default async function PricingPage() {
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
    <div className="pt-16 pb-20">
      <PricingSection plans={serialized} />
    </div>
  );
}
