import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Shield, Target, TrendingUp, Users, Award, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'The Market Architects was founded by traders, for traders. Learn about our story, values, and the team behind 2,400+ successful prop firm challenges.',
};

const stats = [
  { value: '2,400+', label: 'Challenges Passed' },
  { value: '$18M+',  label: 'Total Payouts' },
  { value: '97%',    label: 'Success Rate' },
  { value: '3 Years', label: 'Experience' },
];

const values = [
  {
    icon: Shield,
    title: 'Trust & Transparency',
    description: 'We provide real-time updates on every challenge. No hidden fees, no surprises — ever.',
  },
  {
    icon: Target,
    title: 'Precision Execution',
    description: 'Our traders follow strict risk protocols with every trade, respecting all prop firm rules.',
  },
  {
    icon: TrendingUp,
    title: 'Results First',
    description: 'We measure our success by your success. 97% challenge pass rate speaks for itself.',
  },
  {
    icon: Users,
    title: 'Client-Centric',
    description: 'Every client gets dedicated attention and personalized communication throughout.',
  },
];

const team = [
  {
    name: 'Alex Rivera',
    role: 'Head Trader',
    specialty: 'FTMO Specialist',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  },
  {
    name: 'Marcus Chen',
    role: 'Risk Manager',
    specialty: 'Drawdown Expert',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
  },
  {
    name: 'Sofia Laurent',
    role: 'Operations Lead',
    specialty: 'Client Relations',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  },
];

const guarantees = [
  'Full refund if we fail your challenge',
  'Real-time progress updates',
  'Strict prop firm rule compliance',
  'No hidden fees or charges',
  'Dedicated support team',
];

export default function AboutPage() {
  return (
    <div className="bg-bg-primary pt-24 pb-20 overflow-x-hidden">

      {/* ─── Hero ─── */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center mb-16">
        <div className="mx-auto mb-6 w-36 h-36 md:w-52 md:h-52 animate-float"
          style={{ filter: 'drop-shadow(0 0 30px rgba(230,57,70,0.5))' }}>
          <Image
            src="/assets/logos/logo.png"
            alt="TMA"
            width={208}
            height={208}
            className="object-contain w-full h-full scale-150"
            priority
          />
        </div>
        <h1 className="font-heading font-black text-5xl md:text-7xl text-white mb-4 tracking-tight">
          ABOUT <span className="text-gradient-red">US</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
          The Market Architects was founded by traders, for traders. We exist to democratize access to
          funded accounts through professional challenge passing and expert account management.
        </p>
      </div>

      {/* ─── Stats Bar ─── */}
      <section className="py-10 border-y border-[rgba(230,57,70,0.18)] mb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-heading font-bold text-4xl text-white mb-1">{s.value}</div>
              <div className="text-zinc-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Our Story ─── */}
      <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div>
            <span className="text-accent-primary text-xs tracking-widest uppercase font-medium">
              Our Story
            </span>
            <h2 className="font-heading font-bold text-4xl text-white mt-2 mb-4">
              Built by Traders Who Know the Struggle
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">
              We started as independent traders frustrated by the prop firm challenge process. After
              spending thousands on failed attempts, we developed a systematic approach that
              consistently beats every major firm's requirements.
            </p>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">
              Today, we've channeled that expertise into a service that helps hundreds of traders every
              month access funding they deserve — without the stress or wasted capital.
            </p>
            <Link href="/services">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold tracking-wide text-base text-white transition-all duration-300 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #e63946 0%, #c01c28 100%)',
                  boxShadow: '0 0 20px rgba(230,57,70,0.4)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    '0 0 40px rgba(230,57,70,0.6)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    '0 0 20px rgba(230,57,70,0.4)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
              >
                Explore Services <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {/* Guarantee Card */}
          <div className="rounded-xl border border-[rgba(230,57,70,0.30)] bg-[#180c0c] backdrop-blur-xl p-8 hover:border-[rgba(230,57,70,0.50)] hover:shadow-[0_0_30px_rgba(230,57,70,0.08)] transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <Award className="h-6 w-6 text-accent-primary" />
              <span className="font-heading font-semibold text-white text-xl">Our Guarantee</span>
            </div>
            <ul className="space-y-4">
              {guarantees.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Values ─── */}
      <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <span className="inline-block text-xs font-semibold tracking-[0.3em] text-accent-primary uppercase mb-3 px-3 py-1 rounded-full border border-[rgba(230,57,70,0.20)] bg-[rgba(230,57,70,0.05)]">
            Our Values
          </span>
          <h2 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
            What <span className="text-gradient-red">Drives Us</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-white/[0.05] backdrop-blur-xl p-6 text-center hover:border-[rgba(230,57,70,0.40)] hover:shadow-[0_0_30px_rgba(230,57,70,0.08)] transition-all duration-300"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'linear-gradient(135deg, #e63946 0%, #c01c28 100%)',
                  boxShadow: '0 0 20px rgba(230,57,70,0.4)',
                }}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-heading font-semibold text-white text-lg mb-2">{title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Team ─── */}
      <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="mb-12 text-center">
          <span className="inline-block text-xs font-semibold tracking-[0.3em] text-accent-primary uppercase mb-3 px-3 py-1 rounded-full border border-[rgba(230,57,70,0.20)] bg-[rgba(230,57,70,0.05)]">
            The Team
          </span>
          <h2 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
            Meet the <span className="text-gradient-red">Architects</span>
          </h2>
          <p className="mt-4 text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Our team of elite traders and professionals.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {team.map((member) => (
            <div
              key={member.name}
              className="rounded-xl border border-[rgba(230,57,70,0.30)] bg-[#180c0c] backdrop-blur-xl p-6 text-center hover:border-[rgba(230,57,70,0.50)] hover:shadow-[0_0_30px_rgba(230,57,70,0.08)] transition-all duration-300"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={member.photo}
                alt={member.name}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-4 ring-2 ring-[rgba(230,57,70,0.30)]"
              />
              <h3 className="font-heading font-bold text-white text-xl">{member.name}</h3>
              <p className="text-accent-primary text-sm mt-0.5">{member.role}</p>
              <p className="text-zinc-500 text-xs mt-1">{member.specialty}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
