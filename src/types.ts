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
}

export type Timeframe = '15m' | '1h' | '4h';
