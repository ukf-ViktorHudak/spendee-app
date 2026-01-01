import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction } from '../types';
import { PieChart as PieChartIcon, Lightbulb, TrendingUp, ArrowRight } from 'lucide-react';
import { stringToColor } from '../utils/colorGenerator';

interface AnalyticsCardProps {
  transactions: Transaction[]; 
  selectedMonth: string; 
  tips: string[];
  selectedCategories: string[]; 
  onCategoryToggle: (category: string) => void;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ 
    transactions, 
    selectedMonth, 
    tips,
    selectedCategories,
    onCategoryToggle
}) => {
  
  // --- Data Processing ---
  const { chartData, totalExpense, topCategory } = useMemo(() => {
    if (!selectedMonth || transactions.length === 0) {
        return { chartData: [], totalExpense: 0, topCategory: null };
    }

    // 1. Filter for Expenses in Selected Month
    const relevantTransactions = transactions.filter(t => 
        t.date.startsWith(selectedMonth) && t.amount < 0
    );

    // 2. Aggregate by Category
    const categoryTotals: Record<string, number> = {};
    let total = 0;

    relevantTransactions.forEach(t => {
        const val = Math.abs(t.amount);
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + val;
        total += val;
    });

    // 3. Format for Chart & List
    const data = Object.entries(categoryTotals)
        .map(([name, value]) => ({
            name,
            value,
            percentage: total > 0 ? (value / total) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value); // Descending order

    return { 
        chartData: data, 
        totalExpense: total,
        topCategory: data.length > 0 ? data[0] : null
    };
  }, [transactions, selectedMonth]);

  // --- AI Insight Generator ---
  const insight = useMemo(() => {
    if (!topCategory) return "Not enough data to generate insights yet.";
    
    // Check if Top Category is dominating (> 40%)
    if (topCategory.percentage > 40) {
        return `Your spending on '${topCategory.name}' is significantly high, accounting for ${topCategory.percentage.toFixed(0)}% of total expenses this month.`;
    }
    
    // Check if Top 3 make up most (> 70%)
    const top3Share = chartData.slice(0, 3).reduce((acc, curr) => acc + curr.percentage, 0);
    if (top3Share > 70) {
        return `Your top 3 categories (${chartData[0].name}, ${chartData[1].name}, ${chartData[2].name}) consume ${top3Share.toFixed(0)}% of your budget.`;
    }

    // Fallback to a random tip from the API if available, or generic
    if (tips.length > 0) return tips[0];
    return "Track your recurring expenses to optimize your monthly cash flow.";
  }, [topCategory, chartData, tips]);

  return (
    <div className="bg-card p-6 rounded-2xl border border-gray-800 flex flex-col h-full shadow-lg shadow-black/40">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-purple-400" />
                    Expense Distribution
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                    Where your money went in {selectedMonth}
                </p>
            </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-8 min-h-0">
            
            {/* LEFT COLUMN: Interactive Donut Chart (60%) */}
            <div className="lg:col-span-3 relative flex items-center justify-center min-h-[250px] lg:min-h-0">
                {/* Recharts Wrapper with Fixed Height for Stability */}
                <div className="w-full h-[280px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                                onClick={(data) => onCategoryToggle(data.name)}
                                cursor="pointer"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={stringToColor(entry.name)} 
                                        opacity={selectedCategories.length === 0 || selectedCategories.includes(entry.name) ? 1 : 0.2}
                                    />
                                ))}
                            </Pie>
                            <Tooltip 
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-[#18181b]/95 backdrop-blur border border-gray-700 p-3 rounded-xl shadow-2xl">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stringToColor(data.name) }}></div>
                                                    <span className="font-bold text-white">{data.name}</span>
                                                </div>
                                                <div className="flex items-end gap-2">
                                                    <span className="text-lg font-mono font-bold text-white">{data.value.toFixed(2)}</span>
                                                    <span className="text-xs text-gray-400 mb-1">({data.percentage.toFixed(1)}%)</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Center Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Total Expenses</span>
                        <span className="text-2xl font-bold text-white font-mono mt-1">
                            {totalExpense.toFixed(0)}
                        </span>
                        <span className="text-[10px] text-gray-600 mt-1 bg-gray-900/50 px-2 py-0.5 rounded-full border border-gray-800">
                            {chartData.length} Categories
                        </span>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Top Spenders List (40%) */}
            <div className="lg:col-span-2 flex flex-col justify-center min-h-[250px]">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" /> Top Spenders
                </h3>
                
                <div className="space-y-3 overflow-y-auto max-h-[240px] custom-scrollbar pr-2">
                    {chartData.slice(0, 5).map((item, index) => {
                         const color = stringToColor(item.name);
                         return (
                            <div 
                                key={item.name}
                                onClick={() => onCategoryToggle(item.name)}
                                className="group cursor-pointer"
                            >
                                <div className="flex justify-between items-center mb-1 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                                        <span className="text-gray-300 group-hover:text-white transition-colors truncate max-w-[100px]" title={item.name}>
                                            {item.name}
                                        </span>
                                    </div>
                                    <span className="font-mono text-gray-400 group-hover:text-white transition-colors">
                                        {item.value.toFixed(0)}
                                    </span>
                                </div>
                                {/* Percentage Bar */}
                                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-500 ease-out"
                                        style={{ 
                                            width: `${item.percentage}%`, 
                                            backgroundColor: color,
                                            opacity: 0.8
                                        }}
                                    ></div>
                                </div>
                            </div>
                         );
                    })}
                    {chartData.length > 5 && (
                        <div className="text-center pt-2">
                            <span className="text-[10px] text-gray-600 italic">
                                + {chartData.length - 5} other categories
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* BOTTOM: AI Insight Box */}
        <div className="mt-6 pt-4 border-t border-gray-800">
            <div className="bg-[#27272a]/50 p-3 rounded-xl border border-gray-800 flex items-start gap-3">
                <div className="bg-yellow-500/10 p-2 rounded-lg shrink-0">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">AI Insight</h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                        {insight}
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};