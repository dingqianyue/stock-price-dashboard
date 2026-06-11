import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import type { ChartDataPoint } from '../types';

interface StockChartProps {
  symbol: string;
  data: ChartDataPoint[];
  isLoading: boolean;
}

export default function StockChart({ symbol, data, isLoading }: StockChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-72 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 font-medium tracking-wide">
          Loading 30-day history for {symbol}...
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-72 flex items-center justify-center text-gray-500">
        No historical data available for {symbol}.
      </div>
    );
  }

  // Calculate min and max for the Y-axis with a buffer to give some padding at the top and bottom of the chart
  const minPrice = Math.min(...data.map(d => d.price));
  const maxPrice = Math.max(...data.map(d => d.price));
  const buffer = (maxPrice - minPrice) * 0.1;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{symbol} — 30 Day Trend</h2>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#9ca3af' }} 
              tickLine={false}
              axisLine={false}
              minTickGap={20}
            />
            <YAxis 
              domain={[minPrice - buffer, maxPrice + buffer]} 
              hide={true} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#0ea5e9', fontWeight: 'bold' }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#0ea5e9" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
