'use client';

import { useState, useEffect } from 'react';
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
  Upload,
  Loader2,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import GlowBorder from '@/components/ui/GlowBorder';
import useToast from '@/hooks/useToast';
import { CRYPTO_WALLETS, TRADING_PLATFORMS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import useCartStore from '@/store/cartStore';
import { ServiceType } from '@/types';

interface PlanData {
  id: string;
  name: string;
  tier: string;
  serviceType: string;
  price: number | null;
  originalPrice: number | null;
  priceLabel: string | null;
  description: string;
  features: string[];
  popular: boolean;
  accountSizes: string[];
  guarantee: string | null;
  successRate: number | null;
  deliveryDays: number | null;
}

interface FirmData {
  id: string;
  name: string;
  phases: number;
  accountSizes: string[];
}

/* ─── helpers ─────────────────────────────────────── */
function isProfitSplit(plan: PlanData | null) {
  return !!plan && !plan.price && !!plan.priceLabel;
}

function availableSizes(plan: PlanData, firmName: string, firms: FirmData[]): string[] {
  if (plan.accountSizes.includes('Any size')) {
    return firms.find((f) => f.name === firmName)?.accountSizes ?? [];
  }
  const firmSizes = firms.find((f) => f.name === firmName)?.accountSizes ?? [];
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
function PlanCard({ plan, onSelect }: { plan: PlanData; onSelect: (p: PlanData) => void }) {
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
  const [allPlans, setAllPlans] = useState<PlanData[]>([]);
  const [firms, setFirms] = useState<FirmData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cryptoOrderId, setCryptoOrderId] = useState<string | null>(null);
  const [cryptoAmount, setCryptoAmount] = useState<number>(0);
  const [selectedWallet, setSelectedWallet] = useState<string>(CRYPTO_WALLETS[0].id);
  const [proofFile, setProofFile] = useState<File | null>(null);

  // Credential fields (Step 4)
  const [credPlatform, setCredPlatform] = useState('');
  const [credServer, setCredServer] = useState('');
  const [credLoginId, setCredLoginId] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [credNotes, setCredNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [credSubmitting, setCredSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/plans').then((r) => r.json()),
      fetch('/api/public/firms').then((r) => r.json()),
    ]).then(([plansRes, firmsRes]) => {
      setAllPlans(plansRes.data ?? []);
      setFirms(firmsRes.data ?? []);
      setDataLoading(false);
    }).catch(() => setDataLoading(false));
  }, []);

  const handleSelectService = (type: ServiceType) => {
    cart.setService(type); setSelectedPlan(null); cart.setStep(2);
  };

  const handleSelectPlan = (plan: PlanData) => {
    setSelectedPlan(plan); cart.setPlan(plan.id, plan.name, plan.tier, plan.price ?? 0); cart.setStep(3);
  };

  const handleFirmChange = (firmName: string) => cart.setAccount('', firmName);
  const handleSizeChange = (size: string) => cart.setAccount(size, cart.firmName!);

  const [firmConfirmed, setFirmConfirmed] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const handleConfirmAccount = () => {
    if (!cart.firmName) { addToast('Please select a prop firm.', 'error'); return; }
    setFirmConfirmed(true);
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
          setCryptoOrderId(data.data.orderId);
          setOrderPlaced(true);
          addToast('Agreement submitted! Now submit your trading credentials.', 'success');
          cart.setStep(4); // Go to credential step
        } else if (data.data?.type === 'crypto') {
          setCryptoOrderId(data.data.orderId);
          setCryptoAmount(data.data.amount);
          setOrderPlaced(true);
          // Stay on step 3 — show crypto payment UI
        }
      } else {
        addToast('Something went wrong. Please try again.', 'error');
      }
    } catch { addToast('Something went wrong.', 'error'); }
    finally { setCheckoutLoading(false); }
  };

  const handleSubmitCredentials = async () => {
    if (!credPlatform) { addToast('Please select a trading platform.', 'error'); return; }
    if (!credLoginId.trim()) { addToast('Please enter your login ID.', 'error'); return; }
    if (!credPassword.trim()) { addToast('Please enter your password.', 'error'); return; }
    if (!cryptoOrderId) { addToast('Order not found.', 'error'); return; }

    setCredSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: cryptoOrderId,
          platform: credPlatform,
          server: credServer || undefined,
          loginId: credLoginId,
          password: credPassword,
          notes: credNotes || undefined,
        }),
      });

      if (res.ok) {
        addToast('Credentials submitted securely! Our team will contact you within 24 hours.', 'success');
        cart.reset();
        window.location.href = '/dashboard/payments';
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to submit credentials.', 'error');
      }
    } catch { addToast('Something went wrong.', 'error'); }
    finally { setCredSubmitting(false); }
  };

  const handleSkipCredentials = () => {
    cart.reset();
    window.location.href = '/dashboard/payments';
  };

  const handlePaymentSent = async () => {
    if (!proofFile) { addToast('Please upload your payment proof first.', 'error'); return; }
    setCheckoutLoading(true);
    try {
      // Upload proof screenshot
      const formData = new FormData();
      formData.append('file', proofFile);
      formData.append('orderId', cryptoOrderId ?? '');
      formData.append('network', activeWallet.network);

      await fetch('/api/dashboard/payment-proof', { method: 'POST', body: formData });

      addToast('Payment proof submitted! Now submit your trading credentials.', 'success');
      cart.setStep(4); // Go to credential step
    } catch {
      addToast('Failed to upload proof. Please try again.', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const plans = allPlans.filter((p) => p.serviceType === cart.serviceType);

  const profitSplitPlan = isProfitSplit(selectedPlan);
  const activeWallet = CRYPTO_WALLETS.find((w) => w.id === selectedWallet) ?? CRYPTO_WALLETS[0];

  const sizesForDropdown = selectedPlan && cart.firmName ? availableSizes(selectedPlan, cart.firmName, firms) : [];
  const autoSize = selectedPlan && selectedPlan.accountSizes.length === 1 && !selectedPlan.accountSizes.includes('Any size')
    ? selectedPlan.accountSizes[0] : null;

  // Derive unique service categories for Step 1
  const serviceCategories = [...new Set(allPlans.map((p) => p.serviceType))];

  // Icon + label mapping for service types
  const SERVICE_META: Record<string, { icon: typeof Target; label: string; desc: string; priceHint: string; sizeHint: string }> = {
    CHALLENGE_PASSING: { icon: Target, label: 'Challenge Passing', desc: 'We pass your prop firm challenge. You get funded.', priceHint: `From $${Math.min(...allPlans.filter(p => p.serviceType === 'CHALLENGE_PASSING' && p.price).map(p => p.price!)) || 149}`, sizeHint: allPlans.filter(p => p.serviceType === 'CHALLENGE_PASSING').flatMap(p => p.accountSizes).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).join(' · ') },
    ACCOUNT_MANAGEMENT: { icon: Shield, label: 'Account Management', desc: 'We trade your funded account. You earn profits.', priceHint: 'Profit Split Only', sizeHint: 'No upfront fee' },
    ACCOUNT_GROWTH: { icon: TrendingUp, label: 'Account Growth', desc: 'Systematic scaling to maximize your capital.', priceHint: `From $${Math.min(...allPlans.filter(p => p.serviceType === 'ACCOUNT_GROWTH' && p.price).map(p => p.price!)) || 249}`, sizeHint: 'Any account size' },
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Purchase a Plan</h1>
          <p className="text-text-secondary mt-1">
            {cart.step <= 4 ? `Step ${cart.step} of 4` : ''}
          </p>
        </div>
        {cart.step > 1 && cart.step <= 3 && !orderPlaced && (
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => { if (cart.step === 3) setFirmConfirmed(false); cart.setStep(cart.step - 1); if (cart.step === 2) setSelectedPlan(null); }}>
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
            {serviceCategories.map((type) => {
              const meta = SERVICE_META[type] ?? { icon: Target, label: type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), desc: '', priceHint: '', sizeHint: '' };
              const Icon = meta.icon;
              return (
                <GlassCard key={type} hover padding="lg" className="cursor-pointer" onClick={() => handleSelectService(type as ServiceType)}>
                  <div className="text-center py-4">
                    <Icon className="h-12 w-12 text-accent-primary mx-auto mb-3" />
                    <h3 className="text-lg font-heading font-semibold">{meta.label}</h3>
                    <p className="text-sm text-text-secondary mt-2">{meta.desc}</p>
                    <p className="text-accent-primary font-semibold mt-3">{meta.priceHint}</p>
                    <p className="text-xs text-text-tertiary mt-1">{meta.sizeHint}</p>
                  </div>
                </GlassCard>
              );
            })}
          </motion.div>
        )}

        {/* ── Step 2: Select Plan ── */}
        {cart.step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {plans.map((plan) => <PlanCard key={plan.id} plan={plan} onSelect={handleSelectPlan} />)}
          </motion.div>
        )}

        {/* ── Step 3: Account Details + Order Summary (one card) + Crypto Payment ── */}
        {cart.step === 3 && selectedPlan && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4">

            {/* Before order is placed: Account Details + Order Summary in ONE card */}
            {!orderPlaced && (
              <GlassCard padding="lg">
                <h3 className="text-lg font-heading font-semibold mb-4">Account Details</h3>

                {/* Plan summary badge */}
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

                {/* Firm & Size selectors */}
                <div className="space-y-4 max-w-md">
                  <Select label="Prop Firm" value={cart.firmName ?? ''} onChange={(e) => { handleFirmChange(e.target.value); setFirmConfirmed(false); }}>
                    <option value="">Select a firm...</option>
                    {firms.map((f) => <option key={f.id} value={f.name}>{f.name}</option>)}
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
                      <Select label="Account Size" value={cart.accountSize ?? ''} onChange={(e) => { handleSizeChange(e.target.value); setFirmConfirmed(false); }}>
                        <option value="">Select size...</option>
                        {sizesForDropdown.map((size) => <option key={size} value={size}>{size}</option>)}
                      </Select>
                    ) : (
                      <p className="text-sm text-yellow-400 px-1">⚠️ This firm doesn&apos;t offer {selectedPlan.accountSizes.join('/')} accounts. Please select a different firm.</p>
                    )
                  )}

                  {cart.firmName && (sizesForDropdown.length > 0 || autoSize) && !firmConfirmed && (
                    <Button variant="secondary" fullWidth icon={<Check className="h-4 w-4" />}
                      onClick={() => { if (autoSize) cart.setAccount(autoSize, cart.firmName!); handleConfirmAccount(); }}
                      disabled={!autoSize && !cart.accountSize}>
                      Confirm Account Details
                    </Button>
                  )}
                </div>

                {/* Order Summary — slides in after firm is confirmed */}
                {firmConfirmed && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                    <div className="border-t border-white/[0.06] mt-6 pt-6">
                      <h4 className="text-base font-heading font-semibold mb-4">
                        {profitSplitPlan ? 'Agreement Summary' : 'Order Summary'}
                      </h4>

                      {profitSplitPlan && (
                        <div className="mb-5 p-4 rounded-xl border border-accent-primary/30 bg-accent-primary/5">
                          <div className="flex items-start gap-3">
                            <HandshakeIcon className="h-5 w-5 text-accent-primary shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-white">Profit Split Agreement — No Upfront Payment</p>
                              <p className="text-xs text-text-secondary mt-1">Our team trades your funded account. Zero cost to get started.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {!profitSplitPlan && (
                        <div className="mb-5 p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex items-start gap-2">
                          <Bitcoin className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-yellow-300">Payment accepted in <strong>USDT</strong> cryptocurrency only (BEP-20, TRC-20, ERC-20). Wallet details shown after placing order.</p>
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
                        Next: {profitSplitPlan ? 'submit your trading credentials' : 'complete payment & submit credentials'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </GlassCard>
            )}

            {/* After order is placed (crypto only): Show payment UI within step 3 */}
            {orderPlaced && cryptoAmount > 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
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
                  <div className="mb-5">
                    <label className="text-xs text-text-tertiary font-medium uppercase tracking-wide block mb-2">
                      Select Payment Network
                    </label>
                    <select
                      value={selectedWallet}
                      onChange={(e) => setSelectedWallet(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/[0.10] bg-white/[0.04] text-white text-sm focus:outline-none focus:border-accent-primary transition-colors"
                    >
                      {CRYPTO_WALLETS.map((w) => (
                        <option key={w.id} value={w.id} className="bg-[#0d0303]">
                          {w.icon} {w.name} — {w.network}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Wallet details */}
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4 mb-4">
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

                  {/* Network warning */}
                  <div className="p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex items-start gap-2 mb-6">
                    <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-300">{activeWallet.note}. Sending wrong network or coin may result in permanent loss of funds.</p>
                  </div>

                  {/* Proof upload */}
                  <div className="mb-6">
                    <label className="text-xs text-text-tertiary font-medium uppercase tracking-wide block mb-2">
                      Upload Proof of Payment <span className="text-accent-primary">*</span>
                    </label>
                    <div
                      className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
                        proofFile
                          ? 'border-green-500/50 bg-green-500/5'
                          : 'border-white/[0.12] bg-white/[0.02] hover:border-accent-primary/50 hover:bg-accent-primary/5'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                      />
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center pointer-events-none">
                        {proofFile ? (
                          <>
                            <CheckCheck className="h-8 w-8 text-green-400 mb-2" />
                            <p className="text-sm font-medium text-green-400">{proofFile.name}</p>
                            <p className="text-xs text-text-tertiary mt-1">{(proofFile.size / 1024).toFixed(0)} KB · Click to change</p>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-text-tertiary mb-2" />
                            <p className="text-sm text-white font-medium">Click or drag to upload screenshot</p>
                            <p className="text-xs text-text-tertiary mt-1">PNG, JPG, PDF — Max 5MB</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button variant="primary" fullWidth glow
                    icon={<CheckCheck className="h-5 w-5" />}
                    disabled={!proofFile}
                    loading={checkoutLoading}
                    onClick={handlePaymentSent}>
                    Submit Payment Proof
                  </Button>

                  <p className="text-xs text-text-tertiary text-center mt-3">
                    Next: submit your trading credentials
                  </p>
                </GlassCard>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Step 4: Submit Credentials ── */}
        {cart.step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <GlassCard padding="lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-accent-primary/10">
                  <KeyRound className="h-6 w-6 text-accent-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-semibold">Submit Trading Credentials</h3>
                  <p className="text-text-tertiary text-sm">Securely share your trading account details so we can get started.</p>
                </div>
              </div>

              {/* Security badge */}
              <div className="flex items-start gap-2 mb-6 p-3 rounded-xl border border-green-500/20 bg-green-500/5">
                <Shield className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                <p className="text-xs text-green-300">All credentials are <strong>AES-256-GCM encrypted</strong> at rest and in transit.</p>
              </div>

              <div className="space-y-4">
                <Select label="Trading Platform" value={credPlatform} onChange={(e) => setCredPlatform(e.target.value)}>
                  <option value="">Select platform...</option>
                  {TRADING_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>

                <Input
                  label="Server (optional)"
                  placeholder="e.g., FTMO-Server3"
                  value={credServer}
                  onChange={(e) => setCredServer(e.target.value)}
                />

                <Input
                  label="Login ID"
                  placeholder="Your trading account login"
                  value={credLoginId}
                  onChange={(e) => setCredLoginId(e.target.value)}
                />

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your trading account password"
                    value={credPassword}
                    onChange={(e) => setCredPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-text-tertiary hover:text-text-secondary"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <Input
                  label="Notes (optional)"
                  placeholder="Any additional information..."
                  value={credNotes}
                  onChange={(e) => setCredNotes(e.target.value)}
                />

                <Button variant="primary" fullWidth glow loading={credSubmitting}
                  icon={<Check className="h-5 w-5" />}
                  onClick={handleSubmitCredentials}>
                  Submit Credentials & Complete
                </Button>

                <button
                  type="button"
                  onClick={handleSkipCredentials}
                  className="w-full text-center text-xs text-text-tertiary hover:text-text-secondary transition-colors py-2"
                >
                  Skip for now — I&apos;ll submit credentials later
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}


      </AnimatePresence>
    </div>
  );
}
