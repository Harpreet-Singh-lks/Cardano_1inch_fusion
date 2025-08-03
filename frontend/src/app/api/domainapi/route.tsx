import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.1inch.dev/domains/v2.0";

// Helper function to make authenticated requests to 1inch Domain API
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

// GET /api/domainapi?action=lookup&domain=vitalik.eth
// GET /api/domainapi?action=reverseLookup&address=0x...
// GET /api/domainapi?action=providersData
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const domain = searchParams.get('domain');
    const address = searchParams.get('address');

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter is required. Use: lookup, reverseLookup, or providersData' },
        { status: 400 }
      );
    }

    let url: string;
    let data: any;

    switch (action) {
      case 'lookup':
        if (!domain) {
          return NextResponse.json(
            { error: 'Domain parameter is required for lookup action' },
            { status: 400 }
          );
        }
        
        // Validate domain format (basic validation)
        if (!domain.includes('.')) {
          return NextResponse.json(
            { error: 'Invalid domain format' },
            { status: 400 }
          );
        }

        url = `${BASE_URL}/${domain}/lookup`;
        data = await makeRequest(url);
        break;

      case 'reverseLookup':
        if (!address) {
          return NextResponse.json(
            { error: 'Address parameter is required for reverseLookup action' },
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

        url = `${BASE_URL}/${address}/reverse-lookup`;
        data = await makeRequest(url);
        break;

      case 'providersData':
        url = `${BASE_URL}/get-providers-data-with-avatar`;
        data = await makeRequest(url);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: lookup, reverseLookup, or providersData' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      ...(domain && { domain }),
      ...(address && { address }),
      data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("1inch Domain API Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch domain data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST method for batch domain operations
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
      const { action, domain, address } = operation;
      
      try {
        let url: string;
        let data: any;

        switch (action) {
          case 'lookup':
            if (!domain) {
              throw new Error('Domain is required for lookup action');
            }
            
            if (!domain.includes('.')) {
              throw new Error('Invalid domain format');
            }

            url = `${BASE_URL}/${domain}/lookup`;
            data = await makeRequest(url);
            break;

          case 'reverseLookup':
            if (!address) {
              throw new Error('Address is required for reverseLookup action');
            }
            
            if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
              throw new Error('Invalid wallet address format');
            }

            url = `${BASE_URL}/${address}/reverse-lookup`;
            data = await makeRequest(url);
            break;

          case 'providersData':
            url = `${BASE_URL}/get-providers-data-with-avatar`;
            data = await makeRequest(url);
            break;

          default:
            throw new Error(`Invalid action: ${action}`);
        }

        results.push({
          success: true,
          action,
          ...(domain && { domain }),
          ...(address && { address }),
          data
        });

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.push({
          success: false,
          action,
          ...(domain && { domain }),
          ...(address && { address }),
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
    console.error("Batch domain API error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to process batch domain operations",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}