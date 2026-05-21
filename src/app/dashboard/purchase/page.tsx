'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Shield,
  Target,
  TrendingUp,
  CircleCheck,
  Clock,
  HandshakeIcon,
  Copy,
  CheckCheck,
  Bitcoin,
  AlertTriangle,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import GlowBorder from '@/components/ui/GlowBorder';
import useToast from '@/hooks/useToast';
import {
  CHALLENGE_PASSING_PLANS,
  ACCOUNT_MANAGEMENT_PLANS,
  ACCOUNT_GROWTH_PLANS,
  CRYPTO_WALLETS,
  PROP_FIRMS,
} from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import useCartStore from '@/store/cartStore';
import { ServiceType } from '@/types';
import type { ServicePlan } from '@/types';

/* ─── helpers ─────────────────────────────────────── */
function isProfitSplit(plan: ServicePlan | null) {
  return !!plan && !plan.price && !!plan.priceLabel;
}

function availableSizes(plan: ServicePlan, firmName: string): string[] {
  if (plan.accountSizes.includes('Any size')) {
    return PROP_FIRMS.find((f) => f.name === firmName)?.accountSizes ?? [];
  }
  const firmSizes = PROP_FIRMS.find((f) => f.name === firmName)?.accountSizes ?? [];
  return plan.accountSizes.filter((s) => firmSizes.includes(s));
}

/* ─── Copy button ─────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1 text-xs text-accent-primary hover:text-red-300 transition-colors shrink-0"
    >
      {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

/* ─── Plan Card ───────────────────────────────────── */
function PlanCard({ plan, onSelect }: { plan: ServicePlan; onSelect: (p: ServicePlan) => void }) {
  const isPopular = !!plan.popular;
  const profitSplit = isProfitSplit(plan);

  const card = (
    <div className="relative pt-5 h-full">
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
          <span className="text-white text-xs font-semibold px-4 py-1.5 rounded-full"
            style={{ background: 'linear-gradient(135deg,#e63946 0%,#c1121f 100%)', boxShadow: '0 0 14px rgba(230,57,70,0.5)' }}>
            ★ MOST POPULAR
          </span>
        </div>
      )}
      <div className={`rounded-xl border p-6 flex flex-col h-full transition-all duration-300 glass-shine
        ${isPopular
          ? 'border-[rgba(230,57,70,0.50)] bg-[#120404] shadow-[0_0_30px_rgba(230,57,70,0.10)]'
          : 'border-[rgba(230,57,70,0.25)] bg-[#0d0303] hover:border-[rgba(230,57,70,0.45)]'
        } hover:scale-[1.01]`}>
        <h3 className="font-heading font-semibold text-xl text-white mb-1">{plan.name}</h3>
        <p className="text-text-tertiary text-sm mb-4 leading-relaxed">{plan.description}</p>
        <div className="flex items-center gap-3 mb-4 py-3 border-y border-white/[0.06] text-xs">
          <span className="text-text-tertiary">Account:</span>
          <span className="text-white font-medium">{plan.accountSizes.join(' / ')}</span>
          {plan.successRate && <span className="ml-auto text-green-400">{plan.successRate}% success</span>}
        </div>
        <ul className="space-y-2 mb-5 flex-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
              <CircleCheck className="h-[14px] w-[14px] text-accent-primary mt-0.5 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between mb-5">
          <div>
            {profitSplit
              ? <span className="text-xl font-semibold text-accent-primary">{plan.priceLabel}</span>
              : <>
                  <span className="font-heading text-3xl font-bold text-white">${plan.price}</span>
                  {plan.originalPrice && <span className="text-text-tertiary line-through text-sm ml-2">${plan.originalPrice}</span>}
                </>
            }
          </div>
          {plan.deliveryDays && (
            <span className="flex items-center gap-1 text-xs text-text-tertiary">
              <Clock className="h-3 w-3" /> {plan.deliveryDays} days
            </span>
          )}
        </div>
        {plan.guarantee && <p className="text-xs text-yellow-400 mb-3">{plan.guarantee}</p>}
        <button type="button" onClick={() => onSelect(plan)}
          className={`inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 cursor-pointer ${
            isPopular ? 'text-white hover:scale-105' : 'bg-transparent border border-[rgba(230,57,70,0.50)] text-accent-primary hover:bg-[rgba(230,57,70,0.10)]'
          }`}
          style={isPopular ? { background: 'linear-gradient(135deg,#e63946 0%,#c1121f 100%)', boxShadow: '0 0 20px rgba(230,57,70,0.4)' } : {}}>
          Select Plan <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
  return isPopular ? <GlowBorder color="gold">{card}</GlowBorder> : card;
}

/* ─── Page ────────────────────────────────────────── */
export default function PurchasePage() {
  const { addToast } = useToast();
  const cart = useCartStore();
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cryptoOrderId, setCryptoOrderId] = useState<string | null>(null);
  const [cryptoAmount, setCryptoAmount] = useState<number>(0);
  const [selectedWallet, setSelectedWallet] = useState<string>(CRYPTO_WALLETS[0].id);

  const handleSelectService = (type: ServiceType) => {
    cart.setService(type); setSelectedPlan(null); cart.setStep(2);
  };

  const handleSelectPlan = (plan: ServicePlan) => {
    setSelectedPlan(plan); cart.setPlan(plan.id, plan.name, plan.tier, plan.price ?? 0); cart.setStep(3);
  };

  const handleFirmChange = (firmName: string) => cart.setAccount('', firmName);
  const handleSizeChange = (size: string) => cart.setAccount(size, cart.firmName!);

  const handleContinueToCheckout = () => {
    if (!cart.firmName) { addToast('Please select a prop firm.', 'error'); return; }
    cart.setStep(4);
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.toUpperCase(), amount: cart.price }),
      });
      if (res.ok) {
        const data = await res.json();
        cart.setCoupon(couponInput.toUpperCase(), data.data.discount);
        addToast(`Coupon applied! ${formatCurrency(data.data.discount)} off.`, 'success');
      } else {
        addToast('Invalid or expired coupon.', 'error');
      }
    } catch { addToast('Failed to validate coupon.', 'error'); }
    finally { setCouponLoading(false); }
  };

  const handlePlaceOrder = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: cart.serviceType,
          planName: cart.planName,
          planId: cart.planId,
          tier: cart.tier,
          accountSize: cart.accountSize,
          firmName: cart.firmName,
          couponCode: cart.couponCode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data?.type === 'profit_split') {
          addToast('Agreement submitted! Our team will contact you within 24 hours.', 'success');
          cart.reset();
          window.location.href = '/dashboard/payments';
        } else if (data.data?.type === 'crypto') {
          // Move to crypto payment step
          setCryptoOrderId(data.data.orderId);
          setCryptoAmount(data.data.amount);
          cart.setStep(5);
        }
      } else {
        addToast('Something went wrong. Please try again.', 'error');
      }
    } catch { addToast('Something went wrong.', 'error'); }
    finally { setCheckoutLoading(false); }
  };

  const handlePaymentSent = async () => {
    // Notify admin that payment was sent
    addToast('Payment confirmation received! Our team will verify and activate your order within 24 hours.', 'success');
    cart.reset();
    window.location.href = '/dashboard/payments';
  };

  const plans =
    cart.serviceType === ServiceType.ACCOUNT_MANAGEMENT ? ACCOUNT_MANAGEMENT_PLANS
    : cart.serviceType === ServiceType.ACCOUNT_GROWTH ? ACCOUNT_GROWTH_PLANS
    : CHALLENGE_PASSING_PLANS;

  const profitSplitPlan = isProfitSplit(selectedPlan);
  const activeWallet = CRYPTO_WALLETS.find((w) => w.id === selectedWallet) ?? CRYPTO_WALLETS[0];

  const sizesForDropdown = selectedPlan && cart.firmName ? availableSizes(selectedPlan, cart.firmName) : [];
  const autoSize = selectedPlan && selectedPlan.accountSizes.length === 1 && !selectedPlan.accountSizes.includes('Any size')
    ? selectedPlan.accountSizes[0] : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Purchase a Plan</h1>
          <p className="text-text-secondary mt-1">
            {cart.step <= 4 ? `Step ${cart.step} of 4` : 'Complete Payment'}
          </p>
        </div>
        {cart.step > 1 && cart.step < 5 && (
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => { cart.setStep(cart.step - 1); if (cart.step === 2) setSelectedPlan(null); }}>
            Back
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {cart.step <= 4 && (
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= cart.step ? 'bg-accent-primary' : 'bg-white/[0.06]'}`} />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* ── Step 1: Select Service ── */}
        {cart.step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard hover padding="lg" className="cursor-pointer" onClick={() => handleSelectService(ServiceType.CHALLENGE_PASSING)}>
              <div className="text-center py-4">
                <Target className="h-12 w-12 text-accent-primary mx-auto mb-3" />
                <h3 className="text-lg font-heading font-semibold">Challenge Passing</h3>
                <p className="text-sm text-text-secondary mt-2">We pass your prop firm challenge. You get funded.</p>
                <p className="text-accent-primary font-semibold mt-3">From $149</p>
                <p className="text-xs text-text-tertiary mt-1">$10K · $50K · $100K–$200K</p>
              </div>
            </GlassCard>
            <GlassCard hover padding="lg" className="cursor-pointer" onClick={() => handleSelectService(ServiceType.ACCOUNT_MANAGEMENT)}>
              <div className="text-center py-4">
                <Shield className="h-12 w-12 text-accent-primary mx-auto mb-3" />
                <h3 className="text-lg font-heading font-semibold">Account Management</h3>
                <p className="text-sm text-text-secondary mt-2">We trade your funded account. You earn profits.</p>
                <p className="text-accent-primary font-semibold mt-3">Profit Split Only</p>
                <p className="text-xs text-text-tertiary mt-1">15%–20% split · No upfront fee</p>
              </div>
            </GlassCard>
            <GlassCard hover padding="lg" className="cursor-pointer" onClick={() => handleSelectService(ServiceType.ACCOUNT_GROWTH)}>
              <div className="text-center py-4">
                <TrendingUp className="h-12 w-12 text-accent-primary mx-auto mb-3" />
                <h3 className="text-lg font-heading font-semibold">Account Growth</h3>
                <p className="text-sm text-text-secondary mt-2">Systematic scaling to maximize your capital.</p>
                <p className="text-accent-primary font-semibold mt-3">From $249</p>
                <p className="text-xs text-text-tertiary mt-1">Any account size</p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ── Step 2: Select Plan ── */}
        {cart.step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {plans.map((plan) => <PlanCard key={plan.id} plan={plan} onSelect={handleSelectPlan} />)}
          </motion.div>
        )}

        {/* ── Step 3: Firm + Account Size ── */}
        {cart.step === 3 && selectedPlan && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <GlassCard padding="lg">
              <h3 className="text-lg font-heading font-semibold mb-4">Account Details</h3>
              {/* Plan summary */}
              <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{selectedPlan.name}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    Account: <span className="text-white font-medium">{selectedPlan.accountSizes.join(' / ')}</span>
                    {selectedPlan.deliveryDays ? ` · ${selectedPlan.deliveryDays}-day delivery` : ''}
                  </p>
                </div>
                <div className="text-right">
                  {profitSplitPlan
                    ? <span className="text-accent-primary font-semibold text-sm">{selectedPlan.priceLabel}</span>
                    : <span className="text-white font-bold">${selectedPlan.price}</span>
                  }
                </div>
              </div>
              <div className="space-y-4 max-w-md">
                <Select label="Prop Firm" value={cart.firmName ?? ''} onChange={(e) => handleFirmChange(e.target.value)}>
                  <option value="">Select a firm...</option>
                  {PROP_FIRMS.map((f) => <option key={f.id} value={f.name}>{f.name}</option>)}
                </Select>

                {cart.firmName && (
                  autoSize ? (
                    <div className="space-y-1">
                      <label className="text-xs text-text-tertiary font-medium uppercase tracking-wide">Account Size</label>
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-sm">
                        <Check className="h-4 w-4 text-accent-primary shrink-0" />
                        <span className="text-white font-medium">{autoSize}</span>
                        <span className="text-text-tertiary text-xs ml-auto">Fixed by plan</span>
                      </div>
                    </div>
                  ) : sizesForDropdown.length > 0 ? (
                    <Select label="Account Size" value={cart.accountSize ?? ''} onChange={(e) => handleSizeChange(e.target.value)}>
                      <option value="">Select size...</option>
                      {sizesForDropdown.map((size) => <option key={size} value={size}>{size}</option>)}
                    </Select>
                  ) : (
                    <p className="text-sm text-yellow-400 px-1">⚠️ This firm doesn&apos;t offer {selectedPlan.accountSizes.join('/')} accounts. Please select a different firm.</p>
                  )
                )}

                {cart.firmName && (sizesForDropdown.length > 0 || autoSize) && (
                  <Button variant="primary" fullWidth icon={<ArrowRight className="h-4 w-4" />} iconPosition="right"
                    onClick={() => { if (autoSize) cart.setAccount(autoSize, cart.firmName!); handleContinueToCheckout(); }}
                    disabled={!autoSize && !cart.accountSize}>
                    Continue to {profitSplitPlan ? 'Agreement' : 'Order Summary'}
                  </Button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ── Step 4: Order Summary ── */}
        {cart.step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <GlassCard padding="lg">
              <h3 className="text-lg font-heading font-semibold mb-6">
                {profitSplitPlan ? 'Agreement Summary' : 'Order Summary'}
              </h3>

              {profitSplitPlan && selectedPlan && (
                <div className="mb-5 p-4 rounded-xl border border-accent-primary/30 bg-accent-primary/5">
                  <div className="flex items-start gap-3">
                    <HandshakeIcon className="h-5 w-5 text-accent-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">Profit Split Agreement — No Upfront Payment</p>
                      <p className="text-xs text-text-secondary mt-1">
                        Our team trades your funded account and takes{' '}
                        <span className="text-accent-primary font-semibold">
                          {selectedPlan.id === 'am-starter' ? '20%' : '15%'}
                        </span>{' '}
                        of profits. You keep the rest. Zero cost to get started.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!profitSplitPlan && (
                <div className="mb-5 p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex items-start gap-2">
                  <Bitcoin className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-300">Payment accepted in <strong>USDT, BTC</strong> cryptocurrency only. Wallet details shown after confirming order.</p>
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm"><span className="text-text-secondary">Service</span><span>{cart.serviceType?.replace(/_/g, ' ')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-secondary">Plan</span><span>{cart.planName}</span></div>
                {cart.firmName && <div className="flex justify-between text-sm"><span className="text-text-secondary">Firm</span><span>{cart.firmName}</span></div>}
                {cart.accountSize && <div className="flex justify-between text-sm"><span className="text-text-secondary">Account Size</span><span>{cart.accountSize}</span></div>}
                <div className="border-t border-white/[0.06] my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="font-mono">
                    {profitSplitPlan
                      ? <span className="text-accent-primary text-base font-semibold">{selectedPlan?.priceLabel}</span>
                      : formatCurrency(cart.getFinalPrice())}
                  </span>
                </div>
                {!profitSplitPlan && cart.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Discount ({cart.couponCode})</span><span>-{formatCurrency(cart.discountAmount)}</span>
                  </div>
                )}
              </div>

              {/* Coupon — paid plans only */}
              {!profitSplitPlan && (
                <div className="flex gap-2 mb-6">
                  <Input placeholder="Coupon code" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} className="flex-1" />
                  <Button variant="secondary" size="sm" onClick={handleApplyCoupon} loading={couponLoading}>Apply</Button>
                </div>
              )}

              <Button variant="primary" fullWidth glow loading={checkoutLoading}
                icon={profitSplitPlan ? <HandshakeIcon className="h-5 w-5" /> : <Bitcoin className="h-5 w-5" />}
                onClick={handlePlaceOrder}>
                {profitSplitPlan ? 'Confirm Agreement' : `Place Order — ${formatCurrency(cart.getFinalPrice())}`}
              </Button>

              <p className="text-xs text-text-tertiary text-center mt-3">
                {profitSplitPlan ? 'Our team will contact you within 24 hours.' : 'You will receive crypto wallet details on the next step.'}
              </p>
            </GlassCard>
          </motion.div>
        )}

        {/* ── Step 5: Crypto Payment ── */}
        {cart.step === 5 && (
          <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4">
            <GlassCard padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-accent-primary/10">
                  <Bitcoin className="h-6 w-6 text-accent-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-semibold">Send Crypto Payment</h3>
                  <p className="text-text-tertiary text-sm">Order #{cryptoOrderId?.slice(-8).toUpperCase()} · <span className="text-white font-semibold">{formatCurrency(cryptoAmount)}</span></p>
                </div>
              </div>

              {/* Wallet selector */}
              <div className="flex gap-2 mb-5 flex-wrap">
                {CRYPTO_WALLETS.map((w) => (
                  <button key={w.id} type="button" onClick={() => setSelectedWallet(w.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 ${
                      selectedWallet === w.id
                        ? 'text-white border-transparent'
                        : 'border-[rgba(230,57,70,0.30)] text-text-secondary hover:border-[rgba(230,57,70,0.60)] hover:text-white'
                    }`}
                    style={selectedWallet === w.id ? { background: 'linear-gradient(135deg,#e63946 0%,#c1121f 100%)' } : {}}>
                    {w.icon} {w.name} <span className="text-xs opacity-70 ml-1">({w.network.split(' ')[0]})</span>
                  </button>
                ))}
              </div>

              {/* Wallet details */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
                <div>
                  <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Network</p>
                  <p className="text-sm text-white font-medium">{activeWallet.network}</p>
                </div>

                <div>
                  <p className="text-xs text-text-tertiary uppercase tracking-wider mb-2">Wallet Address</p>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-black/30 border border-white/[0.06]">
                    <p className="text-sm font-mono text-white break-all flex-1">{activeWallet.address}</p>
                    <CopyButton text={activeWallet.address} />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-text-tertiary uppercase tracking-wider mb-2">Amount to Send (USD equivalent)</p>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-black/30 border border-white/[0.06]">
                    <p className="text-xl font-mono font-bold text-white flex-1">{formatCurrency(cryptoAmount)}</p>
                    <CopyButton text={String(cryptoAmount)} />
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="mt-4 p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-300">{activeWallet.note}. Sending wrong network or coin may result in permanent loss of funds.</p>
              </div>

              <Button variant="primary" fullWidth glow className="mt-6"
                icon={<CheckCheck className="h-5 w-5" />}
                onClick={handlePaymentSent}>
                I&apos;ve Sent the Payment
              </Button>

              <p className="text-xs text-text-tertiary text-center mt-3">
                After sending, our team will verify the transaction and activate your order within <strong className="text-white">24 hours</strong>. You'll receive a notification.
              </p>
            </GlassCard>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
