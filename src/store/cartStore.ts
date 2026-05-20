import { create } from 'zustand';
import type { ServiceType } from '@/types';

interface CartState {
  step: number;
  serviceType: ServiceType | null;
  planId: string | null;
  planName: string | null;
  tier: string | null;
  accountSize: string | null;
  firmName: string | null;
  price: number;
  couponCode: string | null;
  discountAmount: number;

  setStep: (step: number) => void;
  setService: (serviceType: ServiceType) => void;
  setPlan: (planId: string, planName: string, tier: string, price: number) => void;
  setAccount: (accountSize: string, firmName: string) => void;
  setCoupon: (code: string, discount: number) => void;
  clearCoupon: () => void;
  reset: () => void;
  getFinalPrice: () => number;
}

const initialState = {
  step: 1,
  serviceType: null as ServiceType | null,
  planId: null as string | null,
  planName: null as string | null,
  tier: null as string | null,
  accountSize: null as string | null,
  firmName: null as string | null,
  price: 0,
  couponCode: null as string | null,
  discountAmount: 0,
};

const useCartStore = create<CartState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  setService: (serviceType) =>
    set({
      serviceType,
      planId: null,
      planName: null,
      tier: null,
      accountSize: null,
      firmName: null,
      price: 0,
    }),

  setPlan: (planId, planName, tier, price) =>
    set({ planId, planName, tier, price }),

  setAccount: (accountSize, firmName) =>
    set({ accountSize, firmName }),

  setCoupon: (code, discount) =>
    set({ couponCode: code, discountAmount: discount }),

  clearCoupon: () =>
    set({ couponCode: null, discountAmount: 0 }),

  reset: () => set(initialState),

  getFinalPrice: () => {
    const state = get();
    return Math.max(0, state.price - state.discountAmount);
  },
}));

export default useCartStore;
