import { ethers } from 'ethers';

export interface NetworkAdapter {
  /**
   * Gets the transaction count for an address
   */
  getTransactionCount(address: string, blockTag?: string): Promise<number>;

  /**
   * Checks if an address is a contract
   */
  isContract(address: string): Promise<boolean>;

  /**
   * Sends a transaction
   */
  sendTransaction(transaction: {
    from: string;
    to: string;
    value: string;
    data: string;
    nonce: number;
    gasLimit: string;
    gasPrice: string;
  }): Promise<{ hash: string }>;

  /**
   * Gets a transaction by hash
   */
  getTransaction(hash: string): Promise<ethers.providers.TransactionResponse | null>;

  /**
   * Gets a transaction receipt
   */
  getTransactionReceipt(hash: string): Promise<ethers.providers.TransactionReceipt | null>;

  /**
   * Gets a block
   */
  getBlock(blockHashOrNumber: string | number): Promise<ethers.providers.Block>;

  /**
   * Estimates gas for a transaction
   */
  estimateGas(transaction: {
    from: string;
    to: string;
    value: string;
    data: string;
  }): Promise<number>;

  /**
   * Gets the current gas price
   */
  getGasPrice(): Promise<ethers.BigNumber>;

  /**
   * Waits for a transaction to be mined
   */
  waitForTransaction(hash: string): Promise<ethers.providers.TransactionReceipt>;
} 