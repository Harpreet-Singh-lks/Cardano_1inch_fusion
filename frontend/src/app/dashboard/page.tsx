"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { useAccount, useDisconnect, useBalance } from "wagmi";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { WalletHistory } from "@/components/ui/wallethistory";
import { TokenSearch } from "@/components/ui/token";

const Dashboard = () => {
    const { disconnect } = useDisconnect();
    const { isConnected, address } = useAccount();
    const { data: balance } = useBalance({ address });
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [activeSection, setActiveSection] = useState<'overview' | 'history' | 'tokens'>('overview');

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isConnected) {
            router.push("/");
        }
    }, [isConnected, router, mounted]);

    if (!mounted || !isConnected) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    const handleTokenSelect = (token: any) => {
        console.log('Token selected:', token);
        // You can add logic here to handle token selection
        // For example, store in state for trading/swapping
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="px-4 lg:px-6 h-16 flex items-center justify-between backdrop-blur-sm bg-black/20 border-b border-white/10">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">C</span>
                    </div>
                    <span className="ml-3 text-xl font-bold text-white">Cardano 1inch Fusion+</span>
                </div>
                <div className="flex items-center gap-4">
                    <ConnectButton />
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="container mx-auto px-4 pt-6">
                <div className="flex space-x-1 mb-6">
                    <button
                        onClick={() => setActiveSection('overview')}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${
                            activeSection === 'overview'
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveSection('history')}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${
                            activeSection === 'history'
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                    >
                        Transaction History
                    </button>
                    <button
                        onClick={() => setActiveSection('tokens')}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${
                            activeSection === 'tokens'
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                    >
                        Token Search
                    </button>
                </div>
            </div>

            {/* Main Dashboard Content */}
            <main className="container mx-auto px-4 pb-8">
                {/* Overview Section */}
                {activeSection === 'overview' && (
                    <>
                        {/* Welcome Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="mb-8"
                        >
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Welcome to Your Dashboard
                            </h1>
                            <p className="text-gray-300">
                                Connected as: {address?.slice(0, 6)}...{address?.slice(-4)}
                            </p>
                        </motion.div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                            >
                                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                                    Wallet Balance
                                </h3>
                                <p className="text-2xl font-bold text-white mt-2">
                                    {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '0.0000 ETH'}
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                            >
                                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                                    Total Volume
                                </h3>
                                <p className="text-2xl font-bold text-white mt-2">$0.00</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                            >
                                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                                    Active Pools
                                </h3>
                                <p className="text-2xl font-bold text-white mt-2">0</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                            >
                                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                                    Rewards Earned
                                </h3>
                                <p className="text-2xl font-bold text-white mt-2">$0.00</p>
                            </motion.div>
                        </div>

                        {/* Action Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all cursor-pointer group"
                            >
                                <div className="text-4xl mb-4">🔄</div>
                                <h3 className="text-xl font-bold text-white mb-2">Cross-Chain Swap</h3>
                                <p className="text-gray-300 mb-4">
                                    Swap tokens between Cardano and Ethereum networks with optimal rates.
                                </p>
                                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all group-hover:scale-105">
                                    Start Swapping
                                </button>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.6 }}
                                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all cursor-pointer group"
                            >
                                <div className="text-4xl mb-4">💧</div>
                                <h3 className="text-xl font-bold text-white mb-2">Liquidity Pools</h3>
                                <p className="text-gray-300 mb-4">
                                    Provide liquidity to earn fees and rewards from trading pairs.
                                </p>
                                <button className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-teal-600 transition-all group-hover:scale-105">
                                    Add Liquidity
                                </button>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.7 }}
                                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all cursor-pointer group"
                            >
                                <div className="text-4xl mb-4">🌾</div>
                                <h3 className="text-xl font-bold text-white mb-2">Yield Farming</h3>
                                <p className="text-gray-300 mb-4">
                                    Stake your LP tokens to earn additional rewards and boost your yields.
                                </p>
                                <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2 px-4 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all group-hover:scale-105">
                                    Start Farming
                                </button>
                            </motion.div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.8 }}
                                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                            >
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                    📊 Quick Actions
                                </h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setActiveSection('history')}
                                        className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                                    >
                                        <div className="text-white font-medium">View Transaction History</div>
                                        <div className="text-gray-400 text-sm">Check your recent transactions</div>
                                    </button>
                                    <button
                                        onClick={() => setActiveSection('tokens')}
                                        className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                                    >
                                        <div className="text-white font-medium">Search Tokens</div>
                                        <div className="text-gray-400 text-sm">Find and manage your tokens</div>
                                    </button>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.9 }}
                                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                            >
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                    🔗 Connected Network
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                                        <div>
                                            <div className="text-white font-medium">Ethereum Mainnet</div>
                                            <div className="text-gray-400 text-sm">Chain ID: 1</div>
                                        </div>
                                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                    </div>
                                    <div className="text-center">
                                        <button className="text-blue-400 hover:text-blue-300 text-sm">
                                            Switch Network
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}

                {/* Transaction History Section */}
                {activeSection === 'history' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <WalletHistory className="w-full" maxHeight="700px" />
                    </motion.div>
                )}

                {/* Token Search Section */}
                {activeSection === 'tokens' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <TokenSearch 
                            className="w-full" 
                            maxHeight="700px"
                            onTokenSelect={handleTokenSelect}
                        />
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;