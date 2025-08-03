'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ChevronDownIcon, ChevronUpIcon, ArrowTopRightOnSquareIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { 
  ArrowUpRightIcon, 
  ArrowDownLeftIcon, 
  ClockIcon 
} from '@heroicons/react/24/solid';

interface Transaction {
  id: string;
  hash: string;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  token: any;
  type: string;
  status: string;
  chainId: string;
}

interface WalletHistoryProps {
  className?: string;
  maxHeight?: string;
}

const CHAIN_NAMES: { [key: string]: string } = {
  '1': 'Ethereum',
  '137': 'Polygon',
  '56': 'BSC',
  '42161': 'Arbitrum',
  '10': 'Optimism'
};

const CHAIN_EXPLORERS: { [key: string]: string } = {
  '1': 'https://etherscan.io',
  '137': 'https://polygonscan.com',
  '56': 'https://bscscan.com',
  '42161': 'https://arbiscan.io',
  '10': 'https://optimistic.etherscan.io'
};

export function WalletHistory({ className = '', maxHeight = '600px' }: WalletHistoryProps) {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState('1');
  const [limit, setLimit] = useState('20');
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTransactions = async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        address,
        chainId: selectedChain,
        limit
      });

      const response = await fetch(`/api/wallethistory?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch wallet history');
      }

      const result = await response.json();
      
      if (result.success) {
        setTransactions(result.transactions || []);
        setLastUpdated(new Date());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [address, selectedChain, limit]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAddress = (addr: string) => {
    if (!addr) return 'N/A';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatValue = (value: string, token: any) => {
    if (!value || !token) return 'N/A';
    
    try {
      const amount = parseFloat(value) / Math.pow(10, token.decimals || 18);
      return `${amount.toFixed(6)} ${token.symbol || 'TOKEN'}`;
    } catch {
      return 'N/A';
    }
  };

  const getTransactionTypeIcon = (type: string, from: string, to: string) => {
    const isOutgoing = from?.toLowerCase() === address?.toLowerCase();
    
    if (isOutgoing) {
      return <ArrowUpRightIcon className="w-4 h-4 text-red-400" />;
    } else {
      return <ArrowDownLeftIcon className="w-4 h-4 text-green-400" />;
    }
  };

  const getTransactionTypeLabel = (type: string, from: string, to: string) => {
    const isOutgoing = from?.toLowerCase() === address?.toLowerCase();
    
    switch (type.toLowerCase()) {
      case 'swap':
        return 'Swap';
      case 'transfer':
        return isOutgoing ? 'Send' : 'Receive';
      case 'approval':
        return 'Approval';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const openInExplorer = (hash: string, chainId: string) => {
    const explorer = CHAIN_EXPLORERS[chainId] || CHAIN_EXPLORERS['1'];
    window.open(`${explorer}/tx/${hash}`, '_blank');
  };

  if (!address) {
    return (
      <div className={`bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6 ${className}`}>
        <div className="text-center text-gray-400">
          <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Connect your wallet to view transaction history</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Transaction History</h3>
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Network
            </label>
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(CHAIN_NAMES).map(([id, name]) => (
                <option key={id} value={id} className="bg-gray-800">
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Limit
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="10" className="bg-gray-800">10</option>
              <option value="20" className="bg-gray-800">20</option>
              <option value="50" className="bg-gray-800">50</option>
            </select>
          </div>
        </div>

        {lastUpdated && (
          <p className="text-xs text-gray-400 mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-400">Loading transactions...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {!loading && !error && transactions.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No transactions found for this wallet</p>
          </div>
        )}

        {!loading && transactions.length > 0 && (
          <div className="space-y-3" style={{ maxHeight, overflowY: 'auto' }}>
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white/5 rounded-lg border border-white/10 transition-all duration-200 hover:bg-white/10"
              >
                {/* Transaction Row */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTransactionTypeIcon(tx.type, tx.from, tx.to)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">
                            {getTransactionTypeLabel(tx.type, tx.from, tx.to)}
                          </span>
                          <span className={`text-sm ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          {formatTimestamp(tx.timestamp)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="font-medium text-white">
                          {formatValue(tx.value, tx.token)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {CHAIN_NAMES[tx.chainId] || 'Unknown'}
                        </p>
                      </div>
                      {expandedTx === tx.id ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedTx === tx.id && (
                  <div className="px-4 pb-4 border-t border-white/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Transaction Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Hash:</span>
                            <div className="flex items-center space-x-2">
                              <code className="text-white font-mono">
                                {formatAddress(tx.hash)}
                              </code>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInExplorer(tx.hash, tx.chainId);
                                }}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">From:</span>
                            <code className="text-white font-mono">
                              {formatAddress(tx.from)}
                            </code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">To:</span>
                            <code className="text-white font-mono">
                              {formatAddress(tx.to)}
                            </code>
                          </div>
                        </div>
                      </div>

                      {tx.token && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Token Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Symbol:</span>
                              <span className="text-white">{tx.token.symbol || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Name:</span>
                              <span className="text-white">{tx.token.name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Address:</span>
                              <code className="text-white font-mono">
                                {tx.token.address ? formatAddress(tx.token.address) : 'N/A'}
                              </code>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}