import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.1inch.dev/traces/v1.0/chain";

// Helper function to make authenticated requests to 1inch API
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

// GET /api/Traceapi?action=syncedInterval&chain=1
// GET /api/Traceapi?action=blockTrace&chain=1&blockNumber=15000000
// GET /api/Traceapi?action=txTrace&chain=1&blockNumber=15000000&txHash=0x...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const chain = searchParams.get('chain') || '1';
    const blockNumber = searchParams.get('blockNumber');
    const txHash = searchParams.get('txHash');

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter is required. Use: syncedInterval, blockTrace, or txTrace' },
        { status: 400 }
      );
    }

    let data;
    let url;

    switch (action) {
      case 'syncedInterval':
        url = `${BASE_URL}/${chain}/synced-interval`;
        data = await makeRequest(url);
        break;

      case 'blockTrace':
        if (!blockNumber) {
          return NextResponse.json(
            { error: 'blockNumber parameter is required for blockTrace action' },
            { status: 400 }
          );
        }
        url = `${BASE_URL}/${chain}/block-trace/${blockNumber}`;
        data = await makeRequest(url);
        break;

      case 'txTrace':
        if (!blockNumber || !txHash) {
          return NextResponse.json(
            { error: 'blockNumber and txHash parameters are required for txTrace action' },
            { status: 400 }
          );
        }
        url = `${BASE_URL}/${chain}/block-trace/${blockNumber}/tx-hash/${txHash}`;
        data = await makeRequest(url);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: syncedInterval, blockTrace, or txTrace' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      chain,
      data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("1inch Trace API Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch trace data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST method for batch operations
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
      const { action, chain = '1', blockNumber, txHash } = operation;
      
      try {
        let url;
        let data;

        switch (action) {
          case 'syncedInterval':
            url = `${BASE_URL}/${chain}/synced-interval`;
            data = await makeRequest(url);
            break;

          case 'blockTrace':
            if (!blockNumber) {
              throw new Error('blockNumber is required for blockTrace');
            }
            url = `${BASE_URL}/${chain}/block-trace/${blockNumber}`;
            data = await makeRequest(url);
            break;

          case 'txTrace':
            if (!blockNumber || !txHash) {
              throw new Error('blockNumber and txHash are required for txTrace');
            }
            url = `${BASE_URL}/${chain}/block-trace/${blockNumber}/tx-hash/${txHash}`;
            data = await makeRequest(url);
            break;

          default:
            throw new Error(`Invalid action: ${action}`);
        }

        results.push({
          success: true,
          action,
          chain,
          blockNumber,
          txHash,
          data
        });

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.push({
          success: false,
          action,
          chain,
          blockNumber,
          txHash,
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
    console.error("Batch trace API error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to process batch operations",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}