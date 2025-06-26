import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { config } from './config/wagmi';
import './styles/index.css';
import '@rainbow-me/rainbowkit/styles.css';
import App from './App.tsx';
import BattlePage from './pages/BattlePage.tsx';
import { ToastProvider } from './components/ToastManager';
import { ReactTogether, Chat } from 'react-together'

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ToastProvider>
            <BrowserRouter>
              <ReactTogether
                sessionParams={{
                  appId: import.meta.env['VITE_APP_ID'],
                  apiKey: import.meta.env['VITE_API_KEY'],

                  // The options below will make every user immediately join session 'hello-world'
                  name: 'hello-world',
                  password: 'super-secret!!',
                }}
              >
                <Routes>
                  <Route path="/*" element={<App />} />
                  <Route path="/battle/:battleId" element={<BattlePage />} />
                </Routes>
              </ReactTogether>

            </BrowserRouter>
          </ToastProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
