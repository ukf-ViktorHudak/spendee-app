import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction } from '../types';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface SummaryCardProps {
  transactions: Transaction[];
  selectedMonth: string;
}

const COLORS = ['#4ade80', '#f87171']; // Success Green, Danger Red

export const SummaryCard: React.FC<SummaryCardProps> = ({ transactions, selectedMonth }) => {
  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    transactions.forEach(t => {
      if (t.amount > 0) inc += t.amount;
      else exp += Math.abs(t.amount);
    });
    return { totalIncome: inc, totalExpenses: exp, balance: inc - exp };
  }, [transactions]);

  const formattedTitle = useMemo(() => {
    if (!selectedMonth) return '';
    try {
        const [year, month] = selectedMonth.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        const slovakMonths = [
            'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 
            'Júl', 'August', 'September', 'Október', 'November', 'December'
        ];
        
        if (monthIndex >= 0 && monthIndex < 12) {
            return `${slovakMonths[monthIndex]} ${year}`;
        }
        return selectedMonth;
    } catch (e) {
        return selectedMonth;
    }
  }, [selectedMonth]);

  const data = [
    { name: 'Income', value: totalIncome },
    { name: 'Expenses', value: totalExpenses },
  ];

  return (
    <div className="bg-card p-6 rounded-2xl border border-gray-800 flex flex-col h-full shadow-lg shadow-black/40">
      <div className="flex justify-between items-start mb-4">
        <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-400" />
            Summary
            </h2>
            {formattedTitle && (
                <p className="text-sm text-blue-400 font-medium ml-7 mt-0.5 capitalize">
                    {formattedTitle}
                </p>
            )}
        </div>
        <span className={`text-sm font-mono px-2 py-1 rounded ${balance >= 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
          {balance >= 0 ? '+' : ''}{balance.toFixed(2)}
        </span>
      </div>

      <div className="flex-1 w-full min-h-[200px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
           <span className="text-xs text-gray-500 uppercase font-semibold">Balance</span>
           <span className={`text-xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>
             {Math.abs(balance).toFixed(0)}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-[#18181b] p-3 rounded-xl border border-gray-800">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <TrendingUp className="w-3 h-3 text-green-400" /> Income
            </div>
            <div className="text-lg font-bold text-green-400">+ {totalIncome.toFixed(0)}</div>
        </div>
        <div className="bg-[#18181b] p-3 rounded-xl border border-gray-800">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <TrendingDown className="w-3 h-3 text-red-400" /> Expenses
            </div>
            <div className="text-lg font-bold text-red-400">- {totalExpenses.toFixed(0)}</div>
        </div>
      </div>
    </div>
  );
};