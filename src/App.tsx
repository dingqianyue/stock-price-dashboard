import './App.css'

import { useState, useEffect } from 'react';
import StockTable from './components/StockTable';
import StockChart from './components/StockChart';
import type { FinnhubQuote, StockData, ChartDataPoint } from './types';

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

  // Chart states
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isChartLoading, setIsChartLoading] = useState<boolean>(false);
  const [isMockData, setIsMockData] = useState<boolean>(false); // NEW: Track if data is simulated

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch historical data when a stock is selected
  useEffect(() => {
    if (!selectedSymbol) return;

    const fetchChartData = async () => {
      setIsChartLoading(true);
      setIsMockData(false); // Reset the mock state on every new fetch
      
      try {
        const to = Math.floor(Date.now() / 1000);
        const from = to - (180 * 24 * 60 * 60);

        const response = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${selectedSymbol}&resolution=D&from=${from}&to=${to}&token=${API_KEY}`);
        
        // If Finnhub throws a 403 Forbidden, force it into the catch block
        if (!response.ok) {
           throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        // If Finnhub returns no data silently, force it into the catch block
        if (data.s === 'no_data' || data.error) {
           throw new Error('No historical data available');
        }

        const formattedData: ChartDataPoint[] = data.t.map((timestamp: number, index: number) => {
          const dateObj = new Date(timestamp * 1000);
          return {
            date: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`, 
            price: data.c[index]
          };
        });

        setChartData(formattedData.slice(-30));
      } catch (err) {
        // Catch the 403 error and generate realistic visual data for the UI
        console.warn(`Finnhub API blocked historical data for ${selectedSymbol}. Using UI fallback.`);
        setIsMockData(true); // Flag this data as simulated
        
        const currentPrice = stocks.find(s => s.symbol === selectedSymbol)?.price || 150;
        const fallbackData: ChartDataPoint[] = Array.from({ length: 30 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (30 - i)); 
          return {
            date: `${d.getMonth() + 1}/${d.getDate()}`,
            price: currentPrice + (Math.random() * (currentPrice * 0.1) - (currentPrice * 0.05))
          };
        });
        
        setChartData(fallbackData);
      } finally {
        setIsChartLoading(false);
      }
    };

    fetchChartData();
  }, [selectedSymbol, stocks]);

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

    // Clear the chart if the deleted stock was currently selected
    if (selectedSymbol === symbolToRemove) {
      setSelectedSymbol(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Stock Price Dashboard</h1>
          <p className="text-gray-500 mt-1">View the latest market data for your favorite stocks</p>
        </header>

        {/* The Chart & Warning Message */}
        {selectedSymbol && (
          <div className="flex flex-col gap-2">
            <StockChart 
              symbol={selectedSymbol} 
              data={chartData} 
              isLoading={isChartLoading} 
            />
            {/* Conditional Warning Note */}
            {isMockData && !isChartLoading && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-lg flex items-start">
                <span className="mr-2">⚠️</span>
                <p>
                  <strong>Note:</strong> Historical data for <strong>{selectedSymbol}</strong> is restricted by the free Finnhub API. The chart above displays simulated trend data for UI demonstration purposes.
                </p>
              </div>
            )}
          </div>
        )}

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
          !error && <StockTable stocks={stocks} onDelete={handleDeleteStock} onSelect={setSelectedSymbol} />
        )}

      </div>
    </div>
  );
}

export default App;
