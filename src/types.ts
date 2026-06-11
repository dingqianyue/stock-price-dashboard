// src/types.ts

// The exact shape of the response from Finnhub's /quote endpoint
export interface FinnhubQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
}

export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface ChartDataPoint {
  date: string;
  price: number;
}
