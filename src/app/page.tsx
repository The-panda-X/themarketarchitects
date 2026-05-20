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

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <TrustIndicators />
        <ServicesSection />
        <HowItWorks />
        <PayoutProof />
        <PricingSection />
        <Testimonials />
        <FAQSection />
        <CTABanner />
        <LiveNotifications />
      </main>
      <Footer />
    </>
  );
}
