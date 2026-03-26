import React, { createContext, useContext, useState } from 'react';

export interface BetSlipItem {
  id: string;
  eventId: string;
  sportId: string;
  description: string;
  team?: string;
  odds: number; // used as price in cents (0-100)
  eventDetails: string;
}

interface BetSlipContextType {
  betSlipItems: BetSlipItem[];
  addToBetSlip: (item: BetSlipItem) => void;
  removeFromBetSlip: (id: string) => void;
  clearBetSlip: () => void;
  shares: number;
  setShares: (amount: number) => void;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

export function BetSlipProvider({ children }: { children: React.ReactNode }) {
  const [betSlipItems, setBetSlipItems] = useState<BetSlipItem[]>([]);
  const [shares, setShares] = useState<number>(10);

  const addToBetSlip = (item: BetSlipItem) => {
    setBetSlipItems((prev) => {
      const filtered = prev.filter((bet) => bet.id !== item.id);
      return [...filtered, item];
    });
  };

  const removeFromBetSlip = (id: string) => {
    setBetSlipItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearBetSlip = () => {
    setBetSlipItems([]);
  };

  return (
    <BetSlipContext.Provider
      value={{
        betSlipItems,
        addToBetSlip,
        removeFromBetSlip,
        clearBetSlip,
        shares,
        setShares,
      }}
    >
      {children}
    </BetSlipContext.Provider>
  );
}

export function useBetSlip() {
  const context = useContext(BetSlipContext);
  if (!context) {
    throw new Error('useBetSlip must be used within BetSlipProvider');
  }
  return context;
}
