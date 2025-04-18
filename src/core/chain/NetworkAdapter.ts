import { 
  TransactionResponse, 
  TransactionReceipt, 
  Block, 
  BigNumberish 
} from 'ethers';

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
  getTransaction(hash: string): Promise<TransactionResponse | null>;

  /**
   * Gets a transaction receipt
   */
  getTransactionReceipt(hash: string): Promise<TransactionReceipt | null>;

  /**
   * Gets a block
   */
  getBlock(blockHashOrNumber: string | number): Promise<Block>;

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
  getGasPrice(): Promise<BigNumberish>;

  /**
   * Waits for a transaction to be mined
   */
  waitForTransaction(hash: string): Promise<TransactionReceipt>;
} 