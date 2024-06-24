import React, { useEffect } from 'react';

import { create as createStore } from 'zustand';
// @ts-ignore
import { Wallet } from "./wallets/near-wallet";
// @ts-ignore
import { Navigation } from "./components/Navigation";
// @ts-ignore
import { NetworkId, HelloNearContract } from "./config";

// Store to share wallet and signed account
export const useStore = createStore((set) => ({
  wallet: undefined,
  signedAccountId: '',
  setWallet: (wallet) => set({ wallet }),
  setSignedAccountId: (signedAccountId) => set({ signedAccountId })
}))

export default function RootLayout({ children }) {
  // @ts-ignore
  const { setWallet, setSignedAccountId } = useStore();

  useEffect(() => {
    // create wallet instance
    const wallet = new Wallet({ createAccessKeyFor: HelloNearContract, networkId: NetworkId })
    wallet.startUp(setSignedAccountId);
    setWallet(wallet);
  }, [])

  return (
    <>
      <Navigation />
      {children}
    </>
  );
}
