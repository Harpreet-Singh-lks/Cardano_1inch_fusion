import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.1inch.dev/gas-price/v1.4";

// Supported chain IDs for gas price API
const SUPPORTED_CHAINS = {
  ethereum: '1',
  bsc: '56',
  polygon: '137',
  optimism: '10',
  arbitrum: '42161',
  gnosis: '100',
  avalanche: '43114',
  fantom: '250',
  klaytn: '8217',
  aurora: '1313161554',
  zksync: '324'
};

// Helper function to make authenticated requests to 1inch Gas Price API
async function makeRequest(url: string) {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

// GET /api/gasprice?chainId=1
// GET /api/gasprice?chain=ethereum
// GET /api/gasprice (defaults to Ethereum mainnet)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain') || 'ethereum';
    
    // Get chainId from chain name or use direct chainId
    const chainId = searchParams.get('chainId') || 
                   SUPPORTED_CHAINS[chain as keyof typeof SUPPORTED_CHAINS] || 
                   '1';

    const url = `${BASE_URL}/${chainId}`;
    const data = await makeRequest(url);

    // Transform the data to include additional metadata
    const transformedData = {
      ...data,
      chainId,
      chain,
      timestamp: new Date().toISOString(),
      // Convert Wei to Gwei for better readability
      gasPricesGwei: {
        baseFee: data.baseFee ? (parseInt(data.baseFee) / 1e9).toFixed(2) : null,
        low: data.low ? {
          ...data.low,
          maxPriorityFeePerGasGwei: (parseInt(data.low.maxPriorityFeePerGas) / 1e9).toFixed(2),
          maxFeePerGasGwei: (parseInt(data.low.maxFeePerGas) / 1e9).toFixed(2)
        } : null,
        medium: data.medium ? {
          ...data.medium,
          maxPriorityFeePerGasGwei: (parseInt(data.medium.maxPriorityFeePerGas) / 1e9).toFixed(2),
          maxFeePerGasGwei: (parseInt(data.medium.maxFeePerGas) / 1e9).toFixed(2)
        } : null,
        high: data.high ? {
          ...data.high,
          maxPriorityFeePerGasGwei: (parseInt(data.high.maxPriorityFeePerGas) / 1e9).toFixed(2),
          maxFeePerGasGwei: (parseInt(data.high.maxFeePerGas) / 1e9).toFixed(2)
        } : null,
        instant: data.instant ? {
          ...data.instant,
          maxPriorityFeePerGasGwei: (parseInt(data.instant.maxPriorityFeePerGas) / 1e9).toFixed(2),
          maxFeePerGasGwei: (parseInt(data.instant.maxFeePerGas) / 1e9).toFixed(2)
        } : null
      }
    };

    return NextResponse.json({
      success: true,
      chainId,
      chain,
      data: transformedData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("1inch Gas Price API Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch gas prices",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST method for batch gas price requests across multiple chains
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chains } = body;

    if (!chains || !Array.isArray(chains)) {
      return NextResponse.json(
        { error: 'Chains array is required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const chainRequest of chains) {
      const { chain, chainId } = chainRequest;
      
      try {
        const finalChainId = chainId || 
                           SUPPORTED_CHAINS[chain as keyof typeof SUPPORTED_CHAINS] || 
                           '1';

        const url = `${BASE_URL}/${finalChainId}`;
        const data = await makeRequest(url);

        // Transform the data similar to GET request
        const transformedData = {
          ...data,
          chainId: finalChainId,
          chain: chain || 'ethereum',
          gasPricesGwei: {
            baseFee: data.baseFee ? (parseInt(data.baseFee) / 1e9).toFixed(2) : null,
            low: data.low ? {
              ...data.low,
              maxPriorityFeePerGasGwei: (parseInt(data.low.maxPriorityFeePerGas) / 1e9).toFixed(2),
              maxFeePerGasGwei: (parseInt(data.low.maxFeePerGas) / 1e9).toFixed(2)
            } : null,
            medium: data.medium ? {
              ...data.medium,
              maxPriorityFeePerGasGwei: (parseInt(data.medium.maxPriorityFeePerGas) / 1e9).toFixed(2),
              maxFeePerGasGwei: (parseInt(data.medium.maxFeePerGas) / 1e9).toFixed(2)
            } : null,
            high: data.high ? {
              ...data.high,
              maxPriorityFeePerGasGwei: (parseInt(data.high.maxPriorityFeePerGas) / 1e9).toFixed(2),
              maxFeePerGasGwei: (parseInt(data.high.maxFeePerGas) / 1e9).toFixed(2)
            } : null,
            instant: data.instant ? {
              ...data.instant,
              maxPriorityFeePerGasGwei: (parseInt(data.instant.maxPriorityFeePerGas) / 1e9).toFixed(2),
              maxFeePerGasGwei: (parseInt(data.instant.maxFeePerGas) / 1e9).toFixed(2)
            } : null
          }
        };

        results.push({
          success: true,
          chainId: finalChainId,
          chain: chain || 'ethereum',
          data: transformedData
        });

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        results.push({
          success: false,
          chainId: chainId || '1',
          chain: chain || 'ethereum',
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      total: chains.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Batch gas price API error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to process batch gas price requests",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}