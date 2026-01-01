import React, { useMemo } from 'react';
import { Transaction, Currency } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, Activity, BrainCircuit } from 'lucide-react';

interface AnalyticsViewProps {
  transactions: Transaction[];
  tips: string[];
  currency: Currency;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ transactions, tips, currency }) => {
  
  // Advanced Chart Data with Forecast
  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // 1. Daily Spending
    const dailySpend: Record<number, number> = {};
    let totalSpendSoFar = 0;
    let daysWithData = 0;

    transactions.forEach(t => {
        const d = new Date(t.date);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.amount < 0) {
            const day = d.getDate();
            dailySpend[day] = (dailySpend[day] || 0) + Math.abs(t.amount);
        }
    });

    const maxDayWithData = Math.max(...Object.keys(dailySpend).map(Number), 0);
    
    // Calculate Average for Forecast
    for(let i=1; i<=maxDayWithData; i++) {
        totalSpendSoFar += (dailySpend[i] || 0);
    }
    const dailyAverage = maxDayWithData > 0 ? totalSpendSoFar / maxDayWithData : 0;

    const result = [];
    let cumulative = 0;

    for (let i = 1; i <= daysInMonth; i++) {
        const actual = dailySpend[i];
        
        // Cumulative logic for the area chart
        if (actual !== undefined) {
            cumulative += actual;
        }

        const point: any = {
            day: i,
            label: `Day ${i}`,
        };

        if (i <= maxDayWithData) {
            point.actual = cumulative;
        } else {
            // FORECAST: Simple Linear Projection based on average
            // Start from last known cumulative
            const projected = cumulative + (dailyAverage * (i - maxDayWithData));
            point.forecast = projected;
            // Connect lines smoothly
            if (i === maxDayWithData + 1) point.actual = cumulative; 
        }

        result.push(point);
    }
    return result;

  }, [transactions]);

  const totalSpent = chartData.length > 0 ? (chartData.find(d => d.forecast)?.forecast || chartData[chartData.length-1].actual) : 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Header / KPI */}
            <div className="lg:col-span-3 bg-card p-6 rounded-2xl border border-gray-800 shadow-lg relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                     <BrainCircuit className="w-32 h-32 text-blue-500" />
                 </div>
                 <div className="relative z-10">
                     <h2 className="text-xl font-bold text-white flex items-center gap-2">
                         <Activity className="w-6 h-6 text-blue-500" /> AI Spending Forecast
                     </h2>
                     <p className="text-gray-400 mt-2 max-w-xl">
                         Based on your spending habits this month, we project your total expenses to reach the amount below. 
                         The dotted line represents the predicted trend.
                     </p>
                     <div className="mt-6">
                         <span className="text-4xl font-bold text-white">{currency} {totalSpent?.toFixed(0)}</span>
                         <span className="text-sm text-gray-500 ml-2 font-medium">projected total</span>
                     </div>
                 </div>
            </div>

            {/* Main Chart */}
            <div className="lg:col-span-2 bg-card p-6 rounded-2xl border border-gray-800 shadow-lg min-h-[400px]">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Cumulative Spending & Projection</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={chartData}>
                        <defs>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                        <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                            formatter={(val: number, name) => [val.toFixed(2), name === 'actual' ? 'Actual Spend' : 'AI Forecast']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="actual" 
                            stroke="#3b82f6" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorActual)" 
                        />
                        <Line 
                            type="monotone" 
                            dataKey="forecast" 
                            stroke="#9ca3af" 
                            strokeWidth={2} 
                            strokeDasharray="5 5" 
                            dot={false} 
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* AI Insights Panel */}
            <div className="bg-card p-6 rounded-2xl border border-gray-800 shadow-lg flex flex-col">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Financial Health Tips</h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                    {tips.map((tip, i) => (
                        <div key={i} className="p-4 bg-[#27272a] rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all">
                             <div className="flex items-start gap-3">
                                 <div className="bg-green-900/20 p-1.5 rounded-lg">
                                     <TrendingUp className="w-4 h-4 text-green-400" />
                                 </div>
                                 <p className="text-sm text-gray-300 leading-relaxed">{tip}</p>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};