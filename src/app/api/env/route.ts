import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    mainnetRpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
    polygonRpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL,
    bscRpcUrl: process.env.NEXT_PUBLIC_BSC_RPC_URL,
    arbitrumRpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL,
    optimismRpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL,
    infuraApiKey: process.env.INFURA_API_KEY
  });
} 