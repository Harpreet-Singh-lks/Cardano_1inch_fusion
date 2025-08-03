import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.1inch.dev/portfolio/portfolio/v4/overview/erc20";

// Helper function to make authenticated requests to 1inch Portfolio API
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

// Helper function to add delay for rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// GET /api/portfolioapi?action=currentValue&addresses=0x...&chainId=1
// GET /api/portfolioapi?action=profitAndLoss&addresses=0x...&chainId=1&fromTimestamp=2023-01-01T00:00:00Z&toTimestamp=2023-01-31T23:59:59Z
// GET /api/portfolioapi?action=tokenDetails&addresses=0x...&chainId=1
// GET /api/portfolioapi?action=all&addresses=0x...&chainId=1
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const addresses = searchParams.get('addresses');
    const chainId = searchParams.get('chainId') || '1';
    const fromTimestamp = searchParams.get('fromTimestamp');
    const toTimestamp = searchParams.get('toTimestamp');

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter is required. Use: currentValue, profitAndLoss, tokenDetails, or all' },
        { status: 400 }
      );
    }

    if (!addresses) {
      return NextResponse.json(
        { error: 'Wallet addresses parameter is required' },
        { status: 400 }
      );
    }

    // Validate addresses format (basic validation for Ethereum addresses)
    const addressList = addresses.split(',');
    const validAddresses = addressList.every(addr => 
      /^0x[a-fA-F0-9]{40}$/.test(addr.trim())
    );

    if (!validAddresses) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    let data;
    let url;

    switch (action) {
      case 'currentValue':
        url = `${BASE_URL}/current_value?addresses=${addresses}&chain_id=${chainId}`;
        data = await makeRequest(url);
        break;

      case 'profitAndLoss':
        if (!fromTimestamp || !toTimestamp) {
          return NextResponse.json(
            { error: 'fromTimestamp and toTimestamp parameters are required for profitAndLoss action' },
            { status: 400 }
          );
        }
        url = `${BASE_URL}/profit_and_loss?addresses=${addresses}&chain_id=${chainId}&from_timestamp=${fromTimestamp}&to_timestamp=${toTimestamp}`;
        data = await makeRequest(url);
        break;

      case 'tokenDetails':
        url = `${BASE_URL}/details?addresses=${addresses}&chain_id=${chainId}`;
        data = await makeRequest(url);
        break;

      case 'all':
        // Get all three types of data sequentially
        const currentValueUrl = `${BASE_URL}/current_value?addresses=${addresses}&chain_id=${chainId}`;
        const currentValue = await makeRequest(currentValueUrl);
        
        await delay(1000); // Rate limiting delay
        
        const tokenDetailsUrl = `${BASE_URL}/details?addresses=${addresses}&chain_id=${chainId}`;
        const tokenDetails = await makeRequest(tokenDetailsUrl);
        
        let profitAndLoss = null;
        if (fromTimestamp && toTimestamp) {
          await delay(1000); // Rate limiting delay
          const profitAndLossUrl = `${BASE_URL}/profit_and_loss?addresses=${addresses}&chain_id=${chainId}&from_timestamp=${fromTimestamp}&to_timestamp=${toTimestamp}`;
          profitAndLoss = await makeRequest(profitAndLossUrl);
        }

        data = {
          currentValue,
          tokenDetails,
          profitAndLoss
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: currentValue, profitAndLoss, tokenDetails, or all' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      addresses,
      chainId,
      data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("1inch Portfolio API Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch portfolio data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST method for batch portfolio operations
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
        addresses, 
        chainId = '1', 
        fromTimestamp, 
        toTimestamp 
      } = operation;
      
      try {
        if (!addresses) {
          throw new Error('addresses is required for all operations');
        }

        let url;
        let data;

        switch (action) {
          case 'currentValue':
            url = `${BASE_URL}/current_value?addresses=${addresses}&chain_id=${chainId}`;
            data = await makeRequest(url);
            break;

          case 'profitAndLoss':
            if (!fromTimestamp || !toTimestamp) {
              throw new Error('fromTimestamp and toTimestamp are required for profitAndLoss');
            }
            url = `${BASE_URL}/profit_and_loss?addresses=${addresses}&chain_id=${chainId}&from_timestamp=${fromTimestamp}&to_timestamp=${toTimestamp}`;
            data = await makeRequest(url);
            break;

          case 'tokenDetails':
            url = `${BASE_URL}/details?addresses=${addresses}&chain_id=${chainId}`;
            data = await makeRequest(url);
            break;

          default:
            throw new Error(`Invalid action: ${action}`);
        }

        results.push({
          success: true,
          action,
          addresses,
          chainId,
          data
        });

        // Add delay to avoid rate limiting
        await delay(1000);

      } catch (error) {
        results.push({
          success: false,
          action,
          addresses,
          chainId,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      total: operations.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

  } catch (error) {
    console.error("Batch portfolio API error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to process batch operations",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}