import { NextRequest, NextResponse } from "next/server";


const BASE_URL = "https://api.1inch.dev/history/v2.0/history";
export async function GET(request: NextRequest){
    try{
        const {searchParams} = new URL(request.url);
        const address = searchParams.get('address');
        const limit = searchParams.get('limit')||'10';
        const chain = searchParams.get('chain')||"ethereum";

        const chainId = searchParams.get('chainId')|| "1";
        if(!address){
            return NextResponse.json(
                {error: 'wallet address is Required'},
                {status: 400}
            );
        }

        const constructedUrl = `${BASE_URL}/${address}/events?chainId=${1}&limit=${limit}`;
        console.log('fetching from 1Inch api', constructedUrl);

        const response= await fetch(constructedUrl, {
            headers:{
                'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
                "Content_Type": 'appication/json',
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('1inch API Error Response:', errorText);
            
            if (response.status === 401) {
              return NextResponse.json(
                { error: 'Invalid API key' },
                { status: 401 }
              );
            }
            
            if (response.status === 429) {
              return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429 }
              );
            }
      
            throw new Error(`1inch API error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();

          const transformedTransactions= data.items?.map((item: any)=>({
            id: item.id,
             hash: item.txHash,
            timestamp: item.timeStamp,
            from: item.details?.fromAddress,
            to: item.details?.toAddress,
            value: item.details?.amount,
            token: item.details?.token,
            type: item.type,
            status: item.status || 'completed',
            chainId: chainId
          
            }))||[];
        return NextResponse.json({
        success: true,
        address,
        chain,
        chainId,
        transactions: transformedTransactions,
        total: transformedTransactions.length,
        metadata: {
          limit: parseInt(limit),
          apiProvider: '1inch'
        }
      });
    }catch(error ){
        console.error("1inch API error:", error);
        return NextResponse.json(
            { 
              error: "Failed to fetch wallet transactions",
              details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
          );

    }
}