import type { Metadata } from 'next';
import PricingSection from '@/components/home/PricingSection';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Transparent pricing for prop firm challenge passing and funded account management. No hidden fees.',
};

export default function PricingPage() {
  return (
    <div className="pt-16 pb-20">
      <PricingSection />
    </div>
  );
}
