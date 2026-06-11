import type { StockData } from '../types';

interface StockTableProps {
  stocks: StockData[];
}

export default function StockTable({ stocks }: StockTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100 text-sm uppercase tracking-wider text-gray-500">
            <th className="p-4 font-semibold">Symbol</th>
            <th className="p-4 font-semibold text-right">Price (USD)</th>
            <th className="p-4 font-semibold text-right">24h Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {stocks.map((stock) => {
            // Determine if the stock is up or down to style the text
            const isPositive = stock.change >= 0;
            const colorClass = isPositive ? 'text-emerald-600' : 'text-rose-600';

            return (
              <tr key={stock.symbol} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold text-gray-900">{stock.symbol}</td>
                <td className="p-4 text-right font-medium">${stock.price.toFixed(2)}</td>
                <td className={`p-4 text-right font-medium ${colorClass}`}>
                  {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
