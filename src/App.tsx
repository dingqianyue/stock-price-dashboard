import './App.css'

import { useState, useEffect } from 'react';
import StockTable from './components/StockTable';
import type { FinnhubQuote, StockData } from './types';

// Default watchlist of FAANG stocks to display on the dashboard
const WATCHLIST = ['META', 'AMZN', 'AAPL', 'NFLX', 'GOOGL'];
const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

function App() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const promises = WATCHLIST.map(async (symbol) => {
          // Finnhub /quote endpoint
          const response = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`
          );
          
          if (!response.ok) {
            throw new Error(`Failed to fetch data for ${symbol}`);
          }

          const data: FinnhubQuote = await response.json();
          
          return {
            symbol,
            price: data.c,
            change: data.d,
            changePercent: data.dp,
          };
        });

        // Wait for all the individual stock calls to finish
        const results = await Promise.all(promises);
        const validStocks = results.filter(
          (stock) => stock.price > 0 && stock.change !== null && stock.change !== undefined
        );

        setStocks(validStocks);

      } catch (err) {
        console.error("API Error:", err);
        setError('Failed to load market data. Please check your API key or try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Stock Price Dashboard</h1>
          <p className="text-gray-500 mt-1">View the latest market data for your favorite stocks</p>
        </header>

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 text-rose-700 p-4 rounded-lg border border-rose-200">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && !error ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-gray-400 font-medium tracking-wide">
              Fetching latest market data...
            </div>
          </div>
        ) : (
          /* The Main Data Table */
          !error && <StockTable stocks={stocks} />
        )}

      </div>
    </div>
  );
}

export default App;
