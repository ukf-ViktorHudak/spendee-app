import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { CalendarClock, CreditCard, Trash2 } from 'lucide-react';

interface StandingOrdersCardProps {
  transactions: Transaction[];
  onRemoveSubscription: (id: string) => void;
}

export const StandingOrdersCard: React.FC<StandingOrdersCardProps> = ({ transactions, onRemoveSubscription }) => {
  const recurring = useMemo(() => {
    return transactions.filter(t => t.is_subscription);
  }, [transactions]);

  const totalRecurring = recurring.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="bg-card p-6 rounded-2xl border border-gray-800 flex flex-col h-full shadow-lg shadow-black/40">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-purple-400" />
          Standing Orders
        </h2>
        <span className="text-xs text-gray-500 font-medium bg-gray-800 px-2 py-1 rounded-md">
            {recurring.length} Active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {recurring.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
                <p>No subscriptions active.</p>
            </div>
        ) : (
            recurring.map((t) => (
            <div key={t.id} className="group flex items-center justify-between p-3 bg-[#18181b] rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-purple-900/20 flex items-center justify-center text-purple-400 shrink-0">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate max-w-[120px]">{t.merchant}</h4>
                        <p className="text-xs text-gray-500 truncate">{t.category}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold text-red-400">
                        {t.amount.toFixed(2)}
                    </span>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemoveSubscription(t.id);
                        }}
                        className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Stop Subscription"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center animate-pulse-fast">
        <span className="text-sm text-gray-400">Monthly Fixed Costs</span>
        <span className="text-lg font-bold text-white transition-all duration-300">
            {Math.abs(totalRecurring).toFixed(2)}
        </span>
      </div>
    </div>
  );
};