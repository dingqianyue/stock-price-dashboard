import './App.css'

import { useState, useEffect } from 'react';
import StockTable from './components/StockTable';
import type { FinnhubQuote, StockData } from './types';

// Default watchlist used only if the user has no saved data
const DEFAULT_WATCHLIST = ['META', 'AMZN', 'AAPL', 'NFLX', 'GOOGL'];
const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

function App() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize watchlist from local storage, or fall back to the default 5
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('valueglance_watchlist');
    return saved ? JSON.parse(saved) : DEFAULT_WATCHLIST;
  });

  // Search bar states
  const [searchInput, setSearchInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const promises = watchlist.map(async (symbol) => {
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

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const symbol = searchInput.trim().toUpperCase();
    if (!symbol) return;

    if (stocks.some(s => s.symbol === symbol)) {
      setAddError(`${symbol} is already in your watchlist.`);
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`);
      if (!response.ok) throw new Error('API Error');

      const data: FinnhubQuote = await response.json();

      if (data.c === 0 || data.d === null) {
        setAddError(`Could not find valid data for ticker: ${symbol}`);
        return;
      }

      const newStock: StockData = { symbol, price: data.c, change: data.d, changePercent: data.dp };

      // Update the UI array
      setStocks(prev => [...prev, newStock]);
      setSearchInput('');
      
      // Save the new symbol to local storage so it persists after a refresh
      setWatchlist(prev => {
        const updated = [...prev, symbol];
        localStorage.setItem('valueglance_watchlist', JSON.stringify(updated));
        return updated;
      });

    } catch (err) {
      setAddError('Failed to fetch stock. Check your connection or API limit.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteStock = (symbolToRemove: string) => {
    // Remove from the UI array
    setStocks(prev => prev.filter(stock => stock.symbol !== symbolToRemove));
    
    // Remove from local storage so it stays deleted after a refresh
    setWatchlist(prev => {
      const updated = prev.filter(sym => sym !== symbolToRemove);
      localStorage.setItem('valueglance_watchlist', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Stock Price Dashboard</h1>
          <p className="text-gray-500 mt-1">View the latest market data for your favorite stocks</p>
        </header>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <form onSubmit={handleAddStock} className="flex gap-2 w-full max-w-md">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter ticker (e.g. TSLA)"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 uppercase placeholder:normal-case"
            />
            <button
              type="submit"
              disabled={isAdding || !searchInput.trim()}
              className="bg-gray-900 text-white px-5 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isAdding ? 'Adding...' : 'Add'}
            </button>
          </form>
          {addError && <span className="text-rose-600 text-sm font-medium">{addError}</span>}
        </div>

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
          !error && <StockTable stocks={stocks} onDelete={handleDeleteStock} />
        )}

      </div>
    </div>
  );
}

export default App;
