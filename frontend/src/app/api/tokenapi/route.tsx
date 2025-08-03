import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.1inch.dev/token";

// Supported chain IDs for token API
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
  aurora: '1313161554'
};

// Helper function to make authenticated requests to 1inch Token API
async function makeRequest(url: string, method: 'GET' | 'POST' = 'GET') {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

// GET /api/tokens?action=search&query=1inch&chainId=1&limit=10
// GET /api/tokens?action=custom&chainId=1&addresses=0x111...,0x222...
// GET /api/tokens?action=all&chainId=1&provider=1inch
// GET /api/tokens?action=tokenList&chainId=1&provider=1inch
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'all';
    const chain = searchParams.get('chain') || 'ethereum';
    const query = searchParams.get('query');
    const addresses = searchParams.get('addresses');
    const limit = searchParams.get('limit') || '10';
    const ignoreListed = searchParams.get('ignoreListed') || 'false';
    const provider = searchParams.get('provider') || '1inch';
    
    // Get chainId from chain name or use direct chainId
    const chainId = searchParams.get('chainId') || 
                   SUPPORTED_CHAINS[chain as keyof typeof SUPPORTED_CHAINS] || 
                   '1';

    let url: string;
    let data: any;

    switch (action) {
      case 'search':
        if (!query) {
          return NextResponse.json(
            { error: 'Query parameter is required for search action' },
            { status: 400 }
          );
        }
        
        url = `${BASE_URL}/v1.2/${chainId}/search?query=${encodeURIComponent(query)}&limit=${limit}&ignore_listed=${ignoreListed}`;
        data = await makeRequest(url);
        break;

      case 'custom':
        if (!addresses) {
          return NextResponse.json(
            { error: 'Addresses parameter is required for custom action' },
            { status: 400 }
          );
        }
        
        // Validate addresses format
        const addressList = addresses.split(',').map(addr => addr.trim());
        const validAddresses = addressList.every(addr => 
          /^0x[a-fA-F0-9]{40}$/.test(addr)
        );

        if (!validAddresses) {
          return NextResponse.json(
            { error: 'Invalid token address format' },
            { status: 400 }
          );
        }

        url = `${BASE_URL}/v1.2/${chainId}/custom/${addresses}`;
        data = await makeRequest(url);
        break;

      case 'all':
        url = `${BASE_URL}/v1.2/${chainId}?provider=${provider}`;
        data = await makeRequest(url);
        break;

      case 'tokenList':
        url = `${BASE_URL}/v1.2/${chainId}/token-list?provider=${provider}`;
        data = await makeRequest(url);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: search, custom, all, or tokenList' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      chainId,
      chain,
      ...(query && { query }),
      ...(addresses && { addresses }),
      ...(provider && { provider }),
      data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("1inch Token API Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch token data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST method for batch token operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operations } = body;

    if (!operations || !Array.isArray(operations)) {
      return NextResponse.json(
        { error: 'Operations array is required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const operation of operations) {
      const { 
        action, 
        chain, 
        chainId: reqChainId, 
        query, 
        addresses, 
        limit = '10',
        ignoreListed = 'false',
        provider = '1inch'
      } = operation;
      
      try {
        const finalChainId = reqChainId || 
                           SUPPORTED_CHAINS[chain as keyof typeof SUPPORTED_CHAINS] || 
                           '1';

        let url: string;
        let data: any;

        switch (action) {
          case 'search':
            if (!query) {
              throw new Error('Query is required for search action');
            }
            url = `${BASE_URL}/v1.2/${finalChainId}/search?query=${encodeURIComponent(query)}&limit=${limit}&ignore_listed=${ignoreListed}`;
            data = await makeRequest(url);
            break;

          case 'custom':
            if (!addresses) {
              throw new Error('Addresses are required for custom action');
            }
            
            // Validate addresses
            const addressList = addresses.split(',').map((addr: string) => addr.trim());
            const validAddresses = addressList.every((addr: string) => 
              /^0x[a-fA-F0-9]{40}$/.test(addr)
            );

            if (!validAddresses) {
              throw new Error('Invalid token address format');
            }

            url = `${BASE_URL}/v1.2/${finalChainId}/custom/${addresses}`;
            data = await makeRequest(url);
            break;

          case 'all':
            url = `${BASE_URL}/v1.2/${finalChainId}?provider=${provider}`;
            data = await makeRequest(url);
            break;

          case 'tokenList':
            url = `${BASE_URL}/v1.2/${finalChainId}/token-list?provider=${provider}`;
            data = await makeRequest(url);
            break;

          default:
            throw new Error(`Invalid action: ${action}`);
        }

        results.push({
          success: true,
          action,
          chainId: finalChainId,
          chain: chain || 'ethereum',
          ...(query && { query }),
          ...(addresses && { addresses }),
          ...(provider && { provider }),
          data
        });

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.push({
          success: false,
          action,
          chainId: reqChainId || '1',
          chain: chain || 'ethereum',
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      total: operations.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Batch token API error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to process batch token operations",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}