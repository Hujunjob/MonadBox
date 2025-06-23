import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './config/wagmi';
import './index.css';
import '@rainbow-me/rainbowkit/styles.css';
import App from './App.tsx';
// import { ReactTogether } from 'react-together'

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {/* <ReactTogether
            sessionParams={{
              appId: import.meta.env['VITE_APP_ID'],
              apiKey: import.meta.env['VITE_API_KEY'],

              // The options below will make every user immediately join session 'hello-world'
              name: 'hello-world',
              password: 'super-secret!!',
            }}
          >
            <App />
          </ReactTogether> */}
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
