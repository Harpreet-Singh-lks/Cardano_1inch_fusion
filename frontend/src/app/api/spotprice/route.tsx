import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.1inch.dev/price/v1.1";

// Supported chain IDs for spot price API
const SUPPORTED_CHAINS = {
  ethereum: '1',
  bsc: '56',
  polygon: '137',
  optimism: '10',
  arbitrum: '42161',
  gnosis: '100',
  avalanche: '43114',
  fantom: '250'
};

// Helper function to make authenticated requests to 1inch Spot Price API
async function makeRequest(url: string, method: 'GET' | 'POST' = 'GET', body?: any) {
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && method === 'POST') {
    requestOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

// Helper function to convert Wei to readable format
function formatPriceFromWei(priceWei: string): string {
  return (parseInt(priceWei) / 1e18).toFixed(6);
}

// GET /api/spotprice?action=whitelisted&chainId=1
// GET /api/spotprice?action=addresses&chainId=1&addresses=0x111...,0x222...
// GET /api/spotprice?action=whitelisted (defaults to Ethereum mainnet)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'whitelisted';
    const chain = searchParams.get('chain') || 'ethereum';
    const addresses = searchParams.get('addresses');
    
    // Get chainId from chain name or use direct chainId
    const chainId = searchParams.get('chainId') || 
                   SUPPORTED_CHAINS[chain as keyof typeof SUPPORTED_CHAINS] || 
                   '1';

    let url: string;
    let data: any;

    switch (action) {
      case 'whitelisted':
        // Get prices for whitelisted tokens
        url = `${BASE_URL}/${chainId}`;
        data = await makeRequest(url);
        break;

      case 'addresses':
        if (!addresses) {
          return NextResponse.json(
            { error: 'Addresses parameter is required for addresses action' },
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

        // Get prices for specific addresses
        url = `${BASE_URL}/${chainId}/${addresses}`;
        data = await makeRequest(url);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: whitelisted or addresses' },
          { status: 400 }
        );
    }

    // Transform the data to include formatted prices
    const transformedData: any = {};
    const formattedPrices: any = {};

    for (const [tokenAddress, priceWei] of Object.entries(data)) {
      transformedData[tokenAddress] = priceWei;
      formattedPrices[tokenAddress] = formatPriceFromWei(priceWei as string);
    }

    return NextResponse.json({
      success: true,
      action,
      chainId,
      chain,
      data: transformedData,
      formattedPrices, // Prices converted from Wei to readable format
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("1inch Spot Price API Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch spot prices",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST method for requesting specific token prices
// POST /api/spotprice with body: { "action": "requested", "chainId": "1", "tokens": ["0x111..."] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, chainId = '1', tokens, chains } = body;

    if (action === 'requested') {
      // Single chain, specific tokens
      if (!tokens || !Array.isArray(tokens)) {
        return NextResponse.json(
          { error: 'Tokens array is required for requested action' },
          { status: 400 }
        );
      }

      // Validate token addresses
      const validTokens = tokens.every(token => 
        /^0x[a-fA-F0-9]{40}$/.test(token)
      );

      if (!validTokens) {
        return NextResponse.json(
          { error: 'Invalid token address format' },
          { status: 400 }
        );
      }

      const url = `${BASE_URL}/${chainId}`;
      const requestBody = { tokens };
      
      const data = await makeRequest(url, 'POST', requestBody);

      // Transform the data to include formatted prices
      const transformedData: any = {};
      const formattedPrices: any = {};

      for (const [tokenAddress, priceWei] of Object.entries(data)) {
        transformedData[tokenAddress] = priceWei;
        formattedPrices[tokenAddress] = formatPriceFromWei(priceWei as string);
      }

      return NextResponse.json({
        success: true,
        action,
        chainId,
        requestedTokens: tokens,
        data: transformedData,
        formattedPrices,
        timestamp: new Date().toISOString()
      });

    } else if (action === 'batch') {
      // Batch requests across multiple chains
      if (!chains || !Array.isArray(chains)) {
        return NextResponse.json(
          { error: 'Chains array is required for batch action' },
          { status: 400 }
        );
      }

      const results = [];

      for (const chainRequest of chains) {
        const { chain, chainId: reqChainId, tokens: reqTokens, addresses } = chainRequest;
        
        try {
          const finalChainId = reqChainId || 
                             SUPPORTED_CHAINS[chain as keyof typeof SUPPORTED_CHAINS] || 
                             '1';

          let url: string;
          let data: any;

          if (reqTokens && Array.isArray(reqTokens)) {
            // POST request for specific tokens
            url = `${BASE_URL}/${finalChainId}`;
            data = await makeRequest(url, 'POST', { tokens: reqTokens });
          } else if (addresses) {
            // GET request for specific addresses
            url = `${BASE_URL}/${finalChainId}/${addresses}`;
            data = await makeRequest(url);
          } else {
            // GET request for whitelisted tokens
            url = `${BASE_URL}/${finalChainId}`;
            data = await makeRequest(url);
          }

          // Format prices
          const formattedPrices: any = {};
          for (const [tokenAddress, priceWei] of Object.entries(data)) {
            formattedPrices[tokenAddress] = formatPriceFromWei(priceWei as string);
          }

          results.push({
            success: true,
            chainId: finalChainId,
            chain: chain || 'ethereum',
            data,
            formattedPrices
          });

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          results.push({
            success: false,
            chainId: reqChainId || '1',
            chain: chain || 'ethereum',
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      return NextResponse.json({
        success: true,
        action,
        results,
        total: chains.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        timestamp: new Date().toISOString()
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use: requested or batch' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Spot price POST API error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to process spot price request",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}