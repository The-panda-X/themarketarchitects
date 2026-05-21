import type { Metadata } from 'next';
import ServicesSection from '@/components/home/ServicesSection';
import PricingSection from '@/components/home/PricingSection';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Professional prop firm challenge passing, funded account management, and account growth services. Backed by a 97% success rate.',
};

export default function ServicesPage() {
  return (
    <div className="pt-16">
      <ServicesSection />
      <PricingSection />
    </div>
  );
}
