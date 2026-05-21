'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  Check,
  Shield,
  Zap,
  Crown,
  CreditCard,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Tabs from '@/components/ui/Tabs';
import GlowBorder from '@/components/ui/GlowBorder';
import useToast from '@/hooks/useToast';
import {
  CHALLENGE_PASSING_PLANS,
  ACCOUNT_MANAGEMENT_PLANS,
  PROP_FIRMS,
} from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import useCartStore from '@/store/cartStore';
import { ServiceType } from '@/types';
import type { ServicePlan } from '@/types';

const tierIcons = { starter: Zap, professional: Shield, elite: Crown };

export default function PurchasePage() {
  const { addToast } = useToast();
  const cart = useCartStore();
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleSelectService = (type: ServiceType) => {
    cart.setService(type);
    cart.setStep(2);
  };

  const handleSelectPlan = (plan: ServicePlan) => {
    cart.setPlan(plan.id, plan.name, plan.tier, plan.price);
    cart.setStep(3);
  };

  const handleSelectAccount = (accountSize: string, firmName: string) => {
    cart.setAccount(accountSize, firmName);
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
    } catch {
      addToast('Failed to validate coupon.', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async () => {
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
          price: cart.getFinalPrice(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data?.url) {
          window.location.href = data.data.url;
        }
      } else {
        addToast('Checkout failed. Please try again.', 'error');
      }
    } catch {
      addToast('Something went wrong.', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const plans =
    cart.serviceType === ServiceType.ACCOUNT_MANAGEMENT
      ? ACCOUNT_MANAGEMENT_PLANS
      : CHALLENGE_PASSING_PLANS;

  const selectedFirm = PROP_FIRMS.find((f) => f.name === cart.firmName);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Purchase a Plan</h1>
          <p className="text-text-secondary mt-1">Step {cart.step} of 4</p>
        </div>
        {cart.step > 1 && (
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => cart.setStep(cart.step - 1)}>
            Back
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= cart.step ? 'bg-accent-primary' : 'bg-white/[0.06]'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Service */}
        {cart.step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard hover padding="lg" className="cursor-pointer" onClick={() => handleSelectService(ServiceType.CHALLENGE_PASSING)}>
              <div className="text-center py-4">
                <Target className="h-12 w-12 text-accent-primary mx-auto mb-3" />
                <h3 className="text-lg font-heading font-semibold">Challenge Passing</h3>
                <p className="text-sm text-text-secondary mt-2">We pass your prop firm challenge. You get funded.</p>
                <p className="text-xs text-text-tertiary mt-3">From $299</p>
              </div>
            </GlassCard>
            <GlassCard hover padding="lg" className="cursor-pointer" onClick={() => handleSelectService(ServiceType.ACCOUNT_MANAGEMENT)}>
              <div className="text-center py-4">
                <Shield className="h-12 w-12 text-accent-gold mx-auto mb-3" />
                <h3 className="text-lg font-heading font-semibold">Account Management</h3>
                <p className="text-sm text-text-secondary mt-2">We trade your funded account. You earn profits.</p>
                <p className="text-xs text-text-tertiary mt-3">From $499</p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 2: Select Plan */}
        {cart.step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const TierIcon = tierIcons[plan.tier] ?? Zap;
              const Wrapper = plan.popular ? GlowBorder : 'div';

              return (
                <Wrapper key={plan.id} {...(plan.popular ? { color: 'gold' } : {})}>
                  <GlassCard
                    padding="lg"
                    hover
                    className="cursor-pointer h-full"
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {plan.popular && (
                      <Badge variant="gold" className="mb-3">Most Popular</Badge>
                    )}
                    <TierIcon className="h-8 w-8 text-accent-primary mb-3" />
                    <h3 className="text-lg font-heading font-bold">{plan.name}</h3>
                    <p className="text-sm text-text-secondary mt-1">{plan.description}</p>
                    <div className="mt-4 mb-4">
                      {plan.originalPrice && (
                        <span className="text-sm text-text-tertiary line-through mr-2">
                          {formatCurrency(plan.originalPrice)}
                        </span>
                      )}
                      <span className="text-2xl font-heading font-bold">{formatCurrency(plan.price)}</span>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                          <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {plan.guarantee && (
                      <p className="text-xs text-accent-gold font-semibold mt-4">{plan.guarantee}</p>
                    )}
                  </GlassCard>
                </Wrapper>
              );
            })}
          </motion.div>
        )}

        {/* Step 3: Account Details */}
        {cart.step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <GlassCard padding="lg">
              <h3 className="text-lg font-heading font-semibold mb-4">Account Details</h3>
              <div className="space-y-4 max-w-md">
                <Select
                  label="Prop Firm"
                  value={cart.firmName ?? ''}
                  onChange={(e) => {
                    const firm = PROP_FIRMS.find((f) => f.name === e.target.value);
                    if (firm) cart.setAccount(cart.accountSize ?? '', firm.name);
                  }}
                >
                  <option value="">Select a firm...</option>
                  {PROP_FIRMS.map((f) => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
                </Select>

                {cart.firmName && (
                  <Select
                    label="Account Size"
                    value={cart.accountSize ?? ''}
                    onChange={(e) => handleSelectAccount(e.target.value, cart.firmName!)}
                  >
                    <option value="">Select size...</option>
                    {(selectedFirm?.accountSizes ?? []).map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </Select>
                )}

                {cart.accountSize && cart.firmName && (
                  <Button
                    variant="primary"
                    fullWidth
                    icon={<ArrowRight className="h-4 w-4" />} iconPosition="right"
                    onClick={() => cart.setStep(4)}
                  >
                    Continue to Checkout
                  </Button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 4: Checkout Summary */}
        {cart.step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <GlassCard padding="lg">
              <h3 className="text-lg font-heading font-semibold mb-6">Order Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Service</span>
                  <span>{cart.serviceType?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Plan</span>
                  <span>{cart.planName} ({cart.tier})</span>
                </div>
                {cart.firmName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Firm</span>
                    <span>{cart.firmName}</span>
                  </div>
                )}
                {cart.accountSize && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Account Size</span>
                    <span>{cart.accountSize}</span>
                  </div>
                )}
                <div className="border-t border-white/[0.06] my-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="font-mono">{formatCurrency(cart.price)}</span>
                </div>
                {cart.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount ({cart.couponCode})</span>
                    <span>-{formatCurrency(cart.discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-white/[0.06] my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="font-mono">{formatCurrency(cart.getFinalPrice())}</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="flex gap-2 mb-6">
                <Input
                  placeholder="Coupon code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1"
                />
                <Button variant="secondary" size="sm" onClick={handleApplyCoupon} loading={couponLoading}>
                  Apply
                </Button>
              </div>

              <Button
                variant="primary"
                fullWidth
                glow
                loading={checkoutLoading}
                icon={<CreditCard className="h-5 w-5" />}
                onClick={handleCheckout}
              >
                Proceed to Payment — {formatCurrency(cart.getFinalPrice())}
              </Button>

              <p className="text-xs text-text-tertiary text-center mt-3">
                Secure payment processed by Stripe. 256-bit SSL encryption.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Target(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
