import prisma from '@/lib/prisma';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import TrustIndicators from '@/components/home/TrustIndicators';
import ServicesSection from '@/components/home/ServicesSection';
import HowItWorks from '@/components/home/HowItWorks';
import PayoutProof from '@/components/home/PayoutProof';
import PricingSection from '@/components/home/PricingSection';
import Testimonials from '@/components/home/Testimonials';
import FAQSection from '@/components/home/FAQSection';
import CTABanner from '@/components/home/CTABanner';
import LiveNotifications from '@/components/home/LiveNotifications';

export const revalidate = 60;

export default async function HomePage() {
  const [plans, faqItems, trustStats, propFirms] = await Promise.all([
    prisma.servicePlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.fAQItem.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.trustStat.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.propFirm.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ]);

  const serialized = {
    plans: plans.map((p) => ({ ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() })),
    faq: faqItems.map((f) => ({ ...f, createdAt: f.createdAt.toISOString(), updatedAt: f.updatedAt.toISOString() })),
    stats: trustStats.map((s) => ({ ...s })),
    firms: propFirms.map((f) => ({ id: f.id, name: f.name })),
  };

  return (
    <>
      <Navbar />
      <main>
        <HeroSection firms={serialized.firms} />
        <TrustIndicators stats={serialized.stats} />
        <ServicesSection />
        <HowItWorks />
        <PayoutProof />
        <PricingSection plans={serialized.plans} />
        <Testimonials />
        <FAQSection items={serialized.faq} />
        <CTABanner />
        <LiveNotifications />
      </main>
      <Footer />
    </>
  );
}
