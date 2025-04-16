import { EVMAdapter } from '../../../core/network/EVMAdapter';
import { mainnet } from 'viem/chains';
import { createPublicClient, parseEther, formatEther } from 'viem';

// Mock viem
jest.mock('viem', () => ({
  createPublicClient: jest.fn(),
  http: jest.fn(),
  parseEther: jest.fn(),
  formatEther: jest.fn()
}));

describe('EVMAdapter', () => {
  let adapter: EVMAdapter;
  const mockConfig = {
    chainId: mainnet.id,
    name: mainnet.name,
    networkName: mainnet.network,
    rpcUrl: mainnet.rpcUrls.default.http[0],
    blockExplorer: mainnet.blockExplorers?.default.url,
    nativeCurrency: {
      name: mainnet.nativeCurrency?.name,
      symbol: mainnet.nativeCurrency?.symbol,
      decimals: mainnet.nativeCurrency?.decimals
    },
    testnet: false
  };

  const mockPublicClient = {
    getBalance: jest.fn(),
    estimateGas: jest.fn(),
    estimateFeesPerGas: jest.fn(),
    getTransactionCount: jest.fn(),
    sendRawTransaction: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createPublicClient as jest.Mock).mockReturnValue(mockPublicClient);
    adapter = new EVMAdapter(mockConfig);
  });

  describe('Balance Operations', () => {
    it('should get balance for address', async () => {
      const address = '0x1234567890123456789012345678901234567890' as `0x${string}`;
      const mockBalance = BigInt('1000000000000000000'); // 1 ETH
      
      mockPublicClient.getBalance.mockResolvedValue(mockBalance);
      (formatEther as jest.Mock).mockReturnValue('1.0');

      const balance = await adapter.getBalance(address);
      
      expect(mockPublicClient.getBalance).toHaveBeenCalledWith({
        address: address
      });
      expect(balance).toBe('1.0');
    });
  });

  describe('Transaction Operations', () => {
    const mockTransaction = {
      from: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      to: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      value: '1.0', // 1 ETH
      data: '0x'
    };

    it('should prepare transaction with gas estimates', async () => {
      const mockGasEstimate = BigInt('21000');
      const mockFeeData = {
        maxFeePerGas: BigInt('20000000000'),
        maxPriorityFeePerGas: BigInt('1000000000')
      };
      
      mockPublicClient.estimateGas.mockResolvedValue(mockGasEstimate);
      mockPublicClient.estimateFeesPerGas.mockResolvedValue(mockFeeData);
      (parseEther as jest.Mock).mockReturnValue(BigInt('1000000000000000000'));

      const preparedTx = await adapter.prepareTransaction(mockTransaction);
      
      expect(preparedTx).toEqual({
        to: mockTransaction.to,
        value: '1000000000000000000',
        data: '0x',
        gasLimit: '21000',
        maxFeePerGas: '20000000000',
        maxPriorityFeePerGas: '1000000000'
      });
    });

    it('should broadcast signed transaction', async () => {
      const signedTx = '0xsignedtransaction';
      const txHash = '0xtxhash';
      
      mockPublicClient.sendRawTransaction.mockResolvedValue(txHash);

      const result = await adapter.broadcastTransaction(signedTx);
      
      expect(mockPublicClient.sendRawTransaction).toHaveBeenCalledWith({
        serializedTransaction: signedTx as `0x${string}`
      });
      expect(result).toBe(txHash);
    });

    it('should estimate gas for transaction', async () => {
      const mockGasEstimate = BigInt('21000');
      
      mockPublicClient.estimateGas.mockResolvedValue(mockGasEstimate);
      (parseEther as jest.Mock).mockReturnValue(BigInt('1000000000000000000'));

      const gasEstimate = await adapter.estimateGas(mockTransaction);
      
      expect(mockPublicClient.estimateGas).toHaveBeenCalledWith({
        to: mockTransaction.to,
        value: BigInt('1000000000000000000'),
        data: '0x'
      });
      expect(gasEstimate).toBe('21000');
    });

    it('should get nonce for address', async () => {
      const address = '0x1234567890123456789012345678901234567890' as `0x${string}`;
      const mockNonce = 5;
      
      mockPublicClient.getTransactionCount.mockResolvedValue(mockNonce);

      const nonce = await adapter.getNonce(address);
      
      expect(mockPublicClient.getTransactionCount).toHaveBeenCalledWith({
        address: address
      });
      expect(nonce).toBe(mockNonce);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unsupported chain', () => {
      const invalidConfig = {
        ...mockConfig,
        chainId: 999999 as ChainId
      };

      expect(() => new EVMAdapter(invalidConfig))
        .toThrow('Unsupported chain ID: 999999');
    });

    it('should handle RPC errors gracefully', async () => {
      const error = new Error('RPC Error');
      mockPublicClient.getBalance.mockRejectedValue(error);

      await expect(adapter.getBalance('0x1234' as `0x${string}`))
        .rejects
        .toThrow('RPC Error');
    });
  });
}); 