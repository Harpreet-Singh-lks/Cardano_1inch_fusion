'use client';

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import React from "react";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface ButtonProps {
  onClick: () => void;
  size?: 'sm' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ onClick, size = 'sm', children, className = '' }) => {
  const sizeClasses = size === 'lg' ? 'px-8 py-4 text-lg' : 'px-6 py-2';
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 ${sizeClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export function LandingPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.push("/dashboard");
    }
  }, [isConnected, router]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center backdrop-blur-sm bg-black/20 border-b border-white/10">
        <Link href="/" className="flex items-center justify-center">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="ml-3 text-xl font-bold text-white">Cardano 1inch Fusion+</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
              alt="DeFi Background"
              fill
              className="object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-purple-900/50"></div>
          </div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <motion.div
                className="flex flex-col justify-center space-y-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
              >
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-white">
                    Cross-Chain DeFi
                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {" "}Revolution
                    </span>
                  </h1>
                  <p className="max-w-[600px] text-gray-300 md:text-xl leading-relaxed">
                    Bridge Cardano and Ethereum ecosystems with our advanced fusion protocol. 
                    Experience seamless cross-chain swaps, yield farming, and liquidity provision.
                  </p>
                </div>
                <div className="flex flex-col gap-4 min-[400px]:flex-row">
                  <ConnectButton.Custom>
                    {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                      const ready = mounted;
                      const connected = ready && account && chain;

                      return (
                        <div
                          {...(!ready && {
                            "aria-hidden": true,
                            style: {
                              opacity: 0,
                              pointerEvents: "none",
                              userSelect: "none",
                            },
                          })}
                        >
                          {(() => {
                            if (!connected) {
                              return (
                                <Button onClick={openConnectModal} size="lg">
                                  Connect Wallet & Start Trading
                                </Button>
                              );
                            }

                            return (
                              <Button onClick={() => router.push("/dashboard")} size="lg">
                                Go to Dashboard
                              </Button>
                            );
                          })()}
                        </div>
                      );
                    }}
                  </ConnectButton.Custom>
                  <Button 
                    onClick={() => router.push("/docs")} 
                    size="lg"
                    className="bg-transparent border-2 border-white/30 hover:border-white/50 hover:bg-white/10"
                  >
                    Learn More
                  </Button>
                </div>
              </motion.div>
              
              <motion.div
                className="flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                <div className="relative h-[350px] w-[350px] sm:h-[450px] sm:w-[450px]">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
                  <Image
                    src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                    alt="Cross-chain DeFi Illustration"
                    fill
                    className="object-cover rounded-2xl border border-white/20"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-black/40 backdrop-blur-sm">
          <motion.div
            className="container px-4 md:px-6"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">
                  Why Choose Fusion+?
                </h2>
                <p className="max-w-[900px] text-gray-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Experience the next generation of cross-chain DeFi with our cutting-edge features and seamless integration.
                </p>
              </div>
            </div>
            
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
              {[
                {
                  icon: "🌉",
                  title: "Cross-Chain Bridge",
                  description: "Seamlessly bridge assets between Cardano and Ethereum with minimal fees and maximum security.",
                },
                {
                  icon: "⚡",
                  title: "Lightning Fast Swaps",
                  description: "Execute trades in seconds with our optimized routing algorithms and liquidity aggregation.",
                },
                {
                  icon: "🛡️",
                  title: "Enterprise Security",
                  description: "Multi-signature wallets, audited smart contracts, and decentralized architecture ensure your funds are safe.",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col items-center space-y-4 rounded-xl border border-white/10 p-6 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="text-4xl mb-2">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                  <p className="text-gray-300 text-center leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <p className="text-gray-300">© {new Date().getFullYear()} Cardano 1inch Fusion+. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <a className="text-xs hover:underline underline-offset-4 text-gray-300 hover:text-white transition-colors" href="#">
            Terms of Service
          </a>
          <a className="text-xs hover:underline underline-offset-4 text-gray-300 hover:text-white transition-colors" href="#">
            Privacy Policy
          </a>
          <a className="text-xs hover:underline underline-offset-4 text-gray-300 hover:text-white transition-colors" href="#">
            Documentation
          </a>
        </nav>
      </footer>
    </div>
  );
}