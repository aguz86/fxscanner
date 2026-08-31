export interface SignalData {
  pair: string;
  close: number;
  k: number;
  d: number;
  signal: 'buy' | 'sell' | 'neutral';
  locked?: boolean;
  lockReason?: string | null;
  lockEndTime?: number | null;
  nextNewsTime?: number | null;
  nextNewsTitle?: string | null;
  pendingMessage?: string;
  isVolatile?: boolean;
}

export type Timeframe = '15m' | '30m' | '1h' | '4h';
