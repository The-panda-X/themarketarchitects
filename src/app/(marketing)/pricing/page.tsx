import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PricingSection from '@/components/home/PricingSection';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Transparent pricing for prop firm challenge passing and funded account management. No hidden fees.',
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-primary pt-16 pb-20">
        <PricingSection />
      </main>
      <Footer />
    </>
  );
}
