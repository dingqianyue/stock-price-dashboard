import { useState } from 'react';
import type { StockData } from '../types';

interface StockTableProps {
  stocks: StockData[];
  onDelete: (symbol: string) => void; 
}

// Define the keys we can sort by and the possible sort directions
type SortKey = 'symbol' | 'price' | 'change' | 'changePercent';
type SortDirection = 'asc' | 'desc';

export default function StockTable({ stocks, onDelete }: StockTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // The sorting function
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      // If clicking the same column, toggle the direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new column, default to descending for numbers, ascending for text
      setSortKey(key);
      setSortDirection(key === 'symbol' ? 'asc' : 'desc');
    }
  };

  // Create a sorted copy of the stocks array
  const sortedStocks = [...stocks].sort((a, b) => {
    if (a[sortKey] < b[sortKey]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortKey] > b[sortKey]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Helper to show the up/down arrow on the active column
  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-gray-900 ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100 text-sm uppercase tracking-wider text-gray-500">
            <th className="p-4 font-semibold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('symbol')}>
              Symbol <SortIcon columnKey="symbol" />
            </th>
            <th className="p-4 font-semibold text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('price')}>
              Price (USD) <SortIcon columnKey="price" />
            </th>
            <th className="p-4 font-semibold text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('changePercent')}>
              24h Change <SortIcon columnKey="changePercent" />
            </th>
            <th className="p-4 w-12"></th> 
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedStocks.map((stock) => {
            // Determine if the stock is up or down to style the text
            const isPositive = stock.change >= 0;
            const colorClass = isPositive ? 'text-emerald-600' : 'text-rose-600';

            return (
              <tr key={stock.symbol} className="hover:bg-gray-50 transition-colors group">
                <td className="p-4 font-bold text-gray-900">{stock.symbol}</td>
                <td className="p-4 text-right font-medium">${stock.price.toFixed(2)}</td>
                <td className={`p-4 text-right font-medium ${colorClass}`}>
                  {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                </td>
                <td className="p-4 text-center">
                  <button 
                    type="button"
                    // Only show the delete button when the user hovers over the row
                    onClick={() => onDelete(stock.symbol)}
                    className="text-gray-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                    title={`Remove ${stock.symbol}`}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
