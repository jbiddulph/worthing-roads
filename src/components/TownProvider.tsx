'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { TownSelection } from '@/lib/town';
import { getDefaultTown, loadStoredTown, storeTown } from '@/lib/town';

type TownContextValue = {
  town: TownSelection;
  setTown: (town: TownSelection) => void;
  hasStoredTown: boolean;
};

const TownContext = createContext<TownContextValue | null>(null);

export function TownProvider({ children }: { children: React.ReactNode }) {
  const [town, setTownState] = useState<TownSelection>(getDefaultTown());
  const [hasStoredTown, setHasStoredTown] = useState(false);

  useEffect(() => {
    const stored = loadStoredTown();
    if (stored) {
      setTownState(stored);
      setHasStoredTown(true);
    }
  }, []);

  const setTown = (next: TownSelection) => {
    setTownState(next);
    setHasStoredTown(true);
    storeTown(next);
  };

  const value = useMemo(() => ({ town, setTown, hasStoredTown }), [town, hasStoredTown]);

  return <TownContext.Provider value={value}>{children}</TownContext.Provider>;
}

export function useTown() {
  const ctx = useContext(TownContext);
  if (!ctx) throw new Error('useTown must be used within TownProvider');
  return ctx;
}

