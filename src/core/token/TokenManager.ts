import { createPublicClient, http, getContract, formatUnits, parseUnits } from 'viem';
import { mainnet } from 'viem/chains';
import { ERC20_ABI } from './abi/ERC20';
import { TokenBalance, TokenInfo } from '../../types/token';
import { TransactionRequest } from '../../types/wallet';
import { EVMAdapter } from '../evm/EVMAdapter';

export class TokenManager {
  private publicClient: ReturnType<typeof createPublicClient>;
  private evmAdapter: EVMAdapter;
  private priceCache: Map<string, { price: number; timestamp: number }>;
  private readonly PRICE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(evmAdapter: EVMAdapter) {
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
      publicClient: this.publicClient
    });

    const [name, symbol, decimals] = await Promise.all([
      contract.read.name(),
      contract.read.symbol(),
      contract.read.decimals()
    ]);

    return {
      address: tokenAddress,
      name,
      symbol,
      decimals
    };
  }

  async getTokenBalance(
    tokenAddress: `0x${string}`,
    walletAddress: `0x${string}`
  ): Promise<TokenBalance> {
    const contract = getContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      publicClient: this.publicClient
    });

    const balance = await contract.read.balanceOf([walletAddress]);
    const decimals = await contract.read.decimals();
    const formattedBalance = formatUnits(balance, decimals);

    return {
      tokenAddress,
      balance: formattedBalance,
      decimals
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
      publicClient: this.publicClient
    });

    const decimals = await contract.read.decimals();
    const amountInWei = parseUnits(amount, decimals);

    const tx: TransactionRequest = {
      to: tokenAddress,
      data: contract.interface.encodeFunctionData('approve', [spender, amountInWei])
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
      publicClient: this.publicClient
    });

    const allowance = await contract.read.allowance([owner, spender]);
    const decimals = await contract.read.decimals();
    return formatUnits(allowance, decimals);
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
      publicClient: this.publicClient
    });

    return contract.read.balanceOf([owner]);
  }

  async getDecimals(tokenAddress: `0x${string}`): Promise<number> {
    const contract = getContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      publicClient: this.publicClient
    });

    return contract.read.decimals();
  }

  async approve(tokenAddress: `0x${string}`, spender: `0x${string}`, amount: bigint): Promise<`0x${string}`> {
    const contract = getContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      publicClient: this.publicClient
    });

    const tx: TransactionRequest = {
      to: tokenAddress,
      data: contract.interface.encodeFunctionData('approve', [spender, amount])
    };

    return this.evmAdapter.sendTransaction(tx);
  }
} 