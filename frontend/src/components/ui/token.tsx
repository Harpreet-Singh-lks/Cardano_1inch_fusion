'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  StarIcon,
  LinkIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  chainId?: string;
}

interface TokenSearchProps {
  className?: string;
  onTokenSelect?: (token: Token) => void;
  selectedTokens?: Token[];
  maxHeight?: string;
}

const CHAIN_NAMES: { [key: string]: string } = {
  '1': 'Ethereum',
  '56': 'BSC',
  '137': 'Polygon',
  '10': 'Optimism',
  '42161': 'Arbitrum',
  '100': 'Gnosis',
  '43114': 'Avalanche',
  '250': 'Fantom'
};

const CHAIN_EXPLORERS: { [key: string]: string } = {
  '1': 'https://etherscan.io',
  '56': 'https://bscscan.com',
  '137': 'https://polygonscan.com',
  '10': 'https://optimistic.etherscan.io',
  '42161': 'https://arbiscan.io',
  '100': 'https://gnosisscan.io',
  '43114': 'https://snowtrace.io',
  '250': 'https://ftmscan.com'
};

export function TokenSearch({ 
  className = '', 
  onTokenSelect,
  selectedTokens = [],
  maxHeight = '600px' 
}: TokenSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<'search' | 'custom' | 'all' | 'tokenList'>('search');
  const [chainId, setChainId] = useState('1');
  const [provider, setProvider] = useState('1inch');
  const [addresses, setAddresses] = useState('');
  const [limit, setLimit] = useState('20');
  
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'search' | 'favorites'>('search');

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('token-favorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  const saveFavorites = (newFavorites: Set<string>) => {
    setFavorites(newFavorites);
    localStorage.setItem('token-favorites', JSON.stringify(Array.from(newFavorites)));
  };

  const toggleFavorite = (tokenAddress: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(tokenAddress)) {
      newFavorites.delete(tokenAddress);
    } else {
      newFavorites.add(tokenAddress);
    }
    saveFavorites(newFavorites);
  };

  const fetchTokens = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        action: selectedAction,
        chainId,
        limit
      };

      if (selectedAction === 'search' && searchQuery.trim()) {
        params.query = searchQuery.trim();
      } else if (selectedAction === 'custom' && addresses.trim()) {
        params.addresses = addresses.trim();
      } else if (['all', 'tokenList'].includes(selectedAction)) {
        params.provider = provider;
      }

      const searchParams = new URLSearchParams(params);
      const response = await fetch(`/api/tokenapi?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch token data');
      }

      const result = await response.json();
      
      if (result.success) {
        let tokenList: Token[] = [];
        
        if (Array.isArray(result.data)) {
          tokenList = result.data;
        } else if (typeof result.data === 'object') {
          // Convert object to array for custom addresses
          tokenList = Object.entries(result.data).map(([address, tokenData]: [string, any]) => ({
            address,
            ...tokenData
          }));
        }

        setTokens(tokenList);
        setLastUpdated(new Date());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (selectedAction === 'search' && !searchQuery.trim()) return;
    if (selectedAction === 'custom' && !addresses.trim()) return;
    fetchTokens();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const openInExplorer = (address: string) => {
    const explorer = CHAIN_EXPLORERS[chainId] || CHAIN_EXPLORERS['1'];
    window.open(`${explorer}/token/${address}`, '_blank');
  };

  const getFavoriteTokens = () => {
    return tokens.filter(token => favorites.has(token.address));
  };

  const displayTokens = activeTab === 'favorites' ? getFavoriteTokens() : tokens;

  return (
    <div className={`bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Token Search</h3>
          <button
            onClick={fetchTokens}
            disabled={loading}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <RefreshIcon className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-4">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'favorites'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Favorites ({favorites.size})
          </button>
        </div>

        {/* Search Controls */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            {/* Network and Action */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Network
                </label>
                <select
                  value={chainId}
                  onChange={(e) => setChainId(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(CHAIN_NAMES).map(([id, name]) => (
                    <option key={id} value={id} className="bg-gray-800">
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Action
                </label>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value as any)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="search" className="bg-gray-800">Search Tokens</option>
                  <option value="custom" className="bg-gray-800">Custom Addresses</option>
                  <option value="all" className="bg-gray-800">All Tokens</option>
                  <option value="tokenList" className="bg-gray-800">Token List</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            {selectedAction === 'search' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Search Query
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g. USDC, Ethereum, 1inch..."
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
              </div>
            )}

            {/* Custom Addresses */}
            {selectedAction === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Token Addresses
                </label>
                <input
                  type="text"
                  value={addresses}
                  onChange={(e) => setAddresses(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="0x111...,0x222... (comma separated)"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Provider and Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['all', 'tokenList'].includes(selectedAction) && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Provider
                  </label>
                  <input
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
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
                  <option value="100" className="bg-gray-800">100</option>
                </select>
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={loading || (selectedAction === 'search' && !searchQuery.trim()) || (selectedAction === 'custom' && !addresses.trim())}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Searching...' : 'Search Tokens'}
            </button>
          </div>
        )}

        {lastUpdated && (
          <p className="text-xs text-gray-400 mt-4">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-400">Loading tokens...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <InformationCircleIcon className="w-5 h-5 text-red-400" />
              <p className="text-red-400">Error: {error}</p>
            </div>
          </div>
        )}

        {!loading && !error && displayTokens.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>
              {activeTab === 'favorites' 
                ? 'No favorite tokens yet. Add some tokens to your favorites!'
                : 'No tokens found. Try adjusting your search criteria.'
              }
            </p>
          </div>
        )}

        {!loading && displayTokens.length > 0 && (
          <div className="space-y-3" style={{ maxHeight, overflowY: 'auto' }}>
            {displayTokens.map((token, index) => (
              <div
                key={`${token.address}-${index}`}
                className="bg-white/5 rounded-lg border border-white/10 p-4 hover:bg-white/10 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Token Logo */}
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                      {token.logoURI ? (
                        <img
                          src={token.logoURI}
                          alt={token.symbol}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {token.symbol?.slice(0, 2) || '??'}
                        </span>
                      )}
                    </div>

                    {/* Token Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-white">{token.symbol}</h4>
                        {token.tags && token.tags.length > 0 && (
                          <div className="flex space-x-1">
                            {token.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 truncate">{token.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="text-xs text-gray-500 font-mono">
                          {token.address.slice(0, 10)}...{token.address.slice(-8)}
                        </code>
                        <span className="text-xs text-gray-500">
                          {token.decimals} decimals
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {/* Favorite Button */}
                    <button
                      onClick={() => toggleFavorite(token.address)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {favorites.has(token.address) ? (
                        <StarSolidIcon className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <StarIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {/* Explorer Link */}
                    <button
                      onClick={() => openInExplorer(token.address)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <LinkIcon className="w-5 h-5 text-gray-400" />
                    </button>

                    {/* Select Button */}
                    {onTokenSelect && (
                      <button
                        onClick={() => onTokenSelect(token)}
                        disabled={selectedTokens.some(t => t.address === token.address)}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                      >
                        {selectedTokens.some(t => t.address === token.address) ? (
                          <CheckCircleIcon className="w-4 h-4" />
                        ) : (
                          'Select'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}