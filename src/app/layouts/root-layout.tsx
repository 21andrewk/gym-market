import { Outlet } from 'react-router';
import { Header } from '../components/header';
import { BetSlipModal } from '../components/bet-slip-modal';
import { BetSlipProvider } from '../context/bet-slip-context';
import { WalletProvider } from '../context/wallet-context';
import { AuthProvider } from '../context/auth-context';

export function RootLayout() {
  return (
    <AuthProvider>
      <WalletProvider>
        <BetSlipProvider>
          <div className="min-h-screen bg-white">
            <Header />
            <main className="max-w-3xl mx-auto px-4 py-6">
              <Outlet />
            </main>
            <BetSlipModal />
          </div>
        </BetSlipProvider>
      </WalletProvider>
    </AuthProvider>
  );
}
