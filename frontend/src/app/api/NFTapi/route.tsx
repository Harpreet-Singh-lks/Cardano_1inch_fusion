import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.1inch.dev/nft/v1/byaddress";

// Supported chain IDs for NFT API
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

// Helper function to make authenticated requests to 1inch NFT API
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

// GET /api/nft?address=0x...&chainIds=1&limit=50&offset=0
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const chainIds = searchParams.get('chainIds') || '1';
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Validate numeric parameters
    const numericLimit = parseInt(limit);
    const numericOffset = parseInt(offset);

    if (isNaN(numericLimit) || numericLimit < 1 || numericLimit > 100) {
      return NextResponse.json(
        { error: 'Limit must be a number between 1 and 100' },
        { status: 400 }
      );
    }

    if (isNaN(numericOffset) || numericOffset < 0) {
      return NextResponse.json(
        { error: 'Offset must be a non-negative number' },
        { status: 400 }
      );
    }

    const constructedUrl = `${BASE_URL}?address=${address}&chainIds=${chainIds}&limit=${limit}&offset=${offset}`;

    const data = await makeRequest(constructedUrl);

    // Transform the data to include additional metadata
    const transformedData = {
      ...data,
      address,
      chainIds,
      limit: numericLimit,
      offset: numericOffset,
      totalItems: data.assets?.length || 0,
      hasMore: data.assets?.length === numericLimit,
      nextOffset: numericOffset + numericLimit
    };

    return NextResponse.json({
      success: true,
      data: transformedData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("1inch NFT API Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch NFT data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST method for batch NFT requests across multiple addresses/chains
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requests } = body;

    if (!requests || !Array.isArray(requests)) {
      return NextResponse.json(
        { error: 'Requests array is required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const nftRequest of requests) {
      const { 
        address, 
        chainIds = '1', 
        limit = '50', 
        offset = '0' 
      } = nftRequest;
      
      try {
        if (!address) {
          throw new Error('Address is required for each request');
        }

        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
          throw new Error('Invalid wallet address format');
        }

        // Validate numeric parameters
        const numericLimit = parseInt(limit);
        const numericOffset = parseInt(offset);

        if (isNaN(numericLimit) || numericLimit < 1 || numericLimit > 100) {
          throw new Error('Limit must be a number between 1 and 100');
        }

        if (isNaN(numericOffset) || numericOffset < 0) {
          throw new Error('Offset must be a non-negative number');
        }

        const constructedUrl = `${BASE_URL}?address=${address}&chainIds=${chainIds}&limit=${limit}&offset=${offset}`;
        const data = await makeRequest(constructedUrl);

        // Transform the data
        const transformedData = {
          ...data,
          address,
          chainIds,
          limit: numericLimit,
          offset: numericOffset,
          totalItems: data.assets?.length || 0,
          hasMore: data.assets?.length === numericLimit,
          nextOffset: numericOffset + numericLimit
        };

        results.push({
          success: true,
          address,
          chainIds,
          data: transformedData
        });

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.push({
          success: false,
          address: address || 'unknown',
          chainIds: chainIds || '1',
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      total: requests.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Batch NFT API error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to process batch NFT requests",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}