import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ServicesSection from '@/components/home/ServicesSection';
import PricingSection from '@/components/home/PricingSection';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Professional prop firm challenge passing, funded account management, and account growth services. Backed by a 97% success rate.',
};

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-primary pt-16">
        <ServicesSection />
        <PricingSection />
      </main>
      <Footer />
    </>
  );
}
