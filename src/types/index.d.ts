declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
      h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>
      h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>
      h3: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>
      span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>
      main: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      section: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      footer: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}

declare module 'framer-motion' {
  interface MotionStyle {
    opacity?: number | string | any
    scale?: number | string | any
  }
}

declare module 'next/link' {
  interface LinkProps {
    href: string
    children: React.ReactNode
  }
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  price?: number;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
}

export interface GasPrice {
  slow: number;
  standard: number;
  fast: number;
  timestamp: number;
}

export interface GasHistory {
  prices: Array<{
    timestamp: number;
    slow: number;
    standard: number;
    fast: number;
  }>;
  average: {
    slow: number;
    standard: number;
    fast: number;
  };
}

export interface GasEstimate {
  gasLimit: number;
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
}

export interface GasSimulationResult {
  success: boolean;
  gasUsed: number;
  error?: string;
}

export interface GasSettings {
  gasLimit: number;
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
}

export interface EventData {
  type: string;
  payload: Record<string, unknown>;
}

export interface EventHandler {
  (data: EventData): void;
}

export interface SDKConfig {
  rpcUrl: string;
  chainId: number;
  autoConnect: boolean;
  sessionTimeout: number;
}

export {} 