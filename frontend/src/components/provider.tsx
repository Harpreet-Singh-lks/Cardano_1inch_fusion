'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { 
    mainnet, 
    sepolia, 
    polygon, 
    polygonMumbai, 
    arbitrum, 
    arbitrumSepolia, 
    optimism, 
    optimismSepolia, 
    base, 
    baseSepolia,
    bsc,
    bscTestnet,
    avalanche,
    avalancheFuji
} from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import type React from 'react';
import { ThemeProvider } from "next-themes";

const WALLETCONNECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!WALLETCONNECT_ID) {
   throw new Error("Please enter the project id in .env.local");
}

const config = getDefaultConfig({
    appName: "Cardano 1inch Fusion+",
    projectId: WALLETCONNECT_ID,
    chains: [
        // Ethereum Networks
        mainnet,
        sepolia,
        
        // Polygon Networks
        polygon,
        polygonMumbai,
        
        // Arbitrum Networks
        arbitrum,
        arbitrumSepolia,
        
        // Optimism Networks
        optimism,
        optimismSepolia,
        
        // Base Networks
        base,
        baseSepolia,
        
        // BSC Networks
        bsc,
        bscTestnet,
        
        // Avalanche Networks
        avalanche,
        avalancheFuji
    ],
    ssr: false
});

const queryClient = new QueryClient();

const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <WagmiProvider config={config}>
                <QueryClientProvider client={queryClient}>
                    <RainbowKitProvider modalSize="compact">
                        {children}
                    </RainbowKitProvider>
                </QueryClientProvider>
            </WagmiProvider>
        </ThemeProvider>
    );
};

export default Provider;