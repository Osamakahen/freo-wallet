import { createPublicClient, http, getContract, formatUnits, parseUnits, type PublicClient } from 'viem';
import { mainnet } from 'viem/chains';
import { ERC20_ABI } from './abi/ERC20';
import { TokenBalance, TokenInfo } from '../../types/token';
import { TransactionRequest } from '../../types/wallet';
import { WalletAdapter } from '../evm/WalletAdapter';

export class TokenManager {
  private publicClient: PublicClient;
  private evmAdapter: WalletAdapter;
  private priceCache: Map<string, { price: number; timestamp: number }>;
  private readonly PRICE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(evmAdapter: WalletAdapter) {
    this.evmAdapter = evmAdapter;
    this.publicClient = createPublicClient({
      chain: mainnet,
      transport: http()
    });
    this.priceCache = new Map();
  }

  async getTokenInfo(tokenAddress: `0x${string}`): Promise<TokenInfo> {
    const contract = getContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      client: this.publicClient
    });

    const [name, symbol, decimals] = await Promise.all([
      contract.read.name(),
      contract.read.symbol(),
      contract.read.decimals()
    ]);

    return {
      address: tokenAddress,
      name: name as string,
      symbol: symbol as string,
      decimals: decimals as number
    };
  }

  async getTokenBalance(
    tokenAddress: `0x${string}`,
    walletAddress: `0x${string}`
  ): Promise<TokenBalance> {
    const contract = getContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      client: this.publicClient
    });

    const [balance, decimals] = await Promise.all([
      contract.read.balanceOf([walletAddress]),
      contract.read.decimals()
    ]);

    return {
      tokenAddress,
      balance: formatUnits(balance as bigint, decimals as number),
      decimals: decimals as number
    };
  }

  async approveToken(
    tokenAddress: `0x${string}`,
    spender: `0x${string}`,
    amount: string
  ): Promise<`0x${string}`> {
    const contract = getContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      client: this.publicClient
    });

    const decimals = await contract.read.decimals();
    const amountInWei = parseUnits(amount, decimals as number);

    const data = contract.write.approve.data([spender, amountInWei]);

    const tx: TransactionRequest = {
      from: await this.evmAdapter.getAddress(),
      to: tokenAddress,
      value: '0',
      data
    };

    return this.evmAdapter.sendTransaction(tx);
  }

  async getAllowance(
    tokenAddress: `0x${string}`,
    owner: `0x${string}`,
    spender: `0x${string}`
  ): Promise<string> {
    const contract = getContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      client: this.publicClient
    });

    const [allowance, decimals] = await Promise.all([
      contract.read.allowance([owner, spender]),
      contract.read.decimals()
    ]);

    return formatUnits(allowance as bigint, decimals as number);
  }

  async getTokenPrice(tokenAddress: `0x${string}`): Promise<number> {
    const cached = this.priceCache.get(tokenAddress);
    if (cached && Date.now() - cached.timestamp < this.PRICE_CACHE_DURATION) {
      return cached.price;
    }

    try {
      // Using CoinGecko API for price data
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd`
      );
      const data = await response.json();
      const price = data[tokenAddress.toLowerCase()]?.usd;

      if (price) {
        this.priceCache.set(tokenAddress, {
          price,
          timestamp: Date.now()
        });
        return price;
      }

      throw new Error('Price not found');
    } catch (error) {
      console.error('Error fetching token price:', error);
      throw new Error('Failed to fetch token price');
    }
  }

  async getTokenBalancesWithPrices(
    tokenAddresses: `0x${string}`[],
    walletAddress: `0x${string}`
  ): Promise<(TokenBalance & { price: number; value: number })[]> {
    const balances = await Promise.all(
      tokenAddresses.map((address) => this.getTokenBalance(address, walletAddress))
    );

    const prices = await Promise.all(
      tokenAddresses.map((address) => this.getTokenPrice(address))
    );

    return balances.map((balance, index) => ({
      ...balance,
      price: prices[index],
      value: parseFloat(balance.balance) * prices[index]
    }));
  }

  async getBalance(tokenAddress: `0x${string}`, owner: `0x${string}`): Promise<bigint> {
    const contract = getContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      client: this.publicClient
    });

    const balance = await contract.read.balanceOf([owner]);
    return balance as bigint;
  }

  async getDecimals(tokenAddress: `0x${string}`): Promise<number> {
    const contract = getContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      client: this.publicClient
    });

    const decimals = await contract.read.decimals();
    return decimals as number;
  }

  async getTokenList(): Promise<`0x${string}`[]> {
    // For now, return a list of common ERC20 tokens
    // In a real implementation, this would fetch from a token registry or user preferences
    return [
      '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
      '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'  // UNI
    ];
  }

  async approve(tokenAddress: `0x${string}`, spender: `0x${string}`, amount: bigint): Promise<`0x${string}`> {
    const contract = getContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      client: this.publicClient
    });

    const data = contract.write.approve.data([spender, amount]);

    const tx: TransactionRequest = {
      from: await this.evmAdapter.getAddress(),
      to: tokenAddress,
      value: '0',
      data
    };

    return this.evmAdapter.sendTransaction(tx);
  }
} 