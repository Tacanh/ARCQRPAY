import { create } from 'zustand';

interface BillState {
  currentAmount: string; // Quản lý input Numpad (string để dễ nối số)
  activeBillId: string | null;
  billStatus: 'IDLE' | 'PENDING' | 'PAID' | 'FAILED';
  merchantId: string | null;
  merchantAddress: string | null;
  
  // Consumer State
  scannedBill: {
    merchantAddress: string;
    amount: string;
    billId: string;
  } | null;
  
  showScanner: boolean;
  
  // Actions
  setAmount: (amount: string) => void;
  appendNumber: (num: string) => void;
  deleteNumber: () => void;
  setBill: (id: string, status: 'PENDING') => void;
  updateStatus: (status: 'PAID' | 'FAILED') => void;
  setMerchant: (id: string, address: string) => void;
  setScannedBill: (bill: { merchantAddress: string; amount: string; billId: string } | null) => void;
  setShowScanner: (show: boolean) => void;
  reset: () => void;
}

export const useBillStore = create<BillState>((set) => ({
  currentAmount: '0',
  activeBillId: null,
  billStatus: 'IDLE',
  merchantId: null,
  merchantAddress: null,
  scannedBill: null,
  showScanner: false,

  setAmount: (amount) => set({ currentAmount: amount }),
  
  appendNumber: (num) => set((state) => {
    if (state.currentAmount === '0' && num !== '.') {
      return { currentAmount: num };
    }
    if (num === '.' && state.currentAmount.includes('.')) {
      return state; // Prevent multiple decimals
    }
    // Limit decimal places to 2
    if (state.currentAmount.includes('.')) {
      const parts = state.currentAmount.split('.');
      if (parts[1] && parts[1].length >= 2) {
        return state;
      }
    }
    // Limit total length
    if (state.currentAmount.length >= 8) {
      return state;
    }
    return { currentAmount: state.currentAmount + num };
  }),

  deleteNumber: () => set((state) => {
    if (state.currentAmount.length <= 1) {
      return { currentAmount: '0' };
    }
    return { currentAmount: state.currentAmount.slice(0, -1) };
  }),

  setBill: (id, status) => set({ activeBillId: id, billStatus: status }),
  
  updateStatus: (status) => set({ billStatus: status }),
  
  setMerchant: (id, address) => set({ merchantId: id, merchantAddress: address }),

  setScannedBill: (bill) => set({ scannedBill: bill }),

  setShowScanner: (show) => set({ showScanner: show }),

  reset: () => set({ 
    currentAmount: '0', 
    activeBillId: null, 
    billStatus: 'IDLE',
    scannedBill: null,
    showScanner: false
  }),
}));
