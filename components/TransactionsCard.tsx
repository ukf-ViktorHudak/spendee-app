import React, { useState, useMemo } from 'react';
import { Transaction, FilterType, SortType } from '../types';
import { ShoppingBag, Coffee, Car, Home, DollarSign, Activity, ArrowUp, ArrowDown, Filter, RefreshCw, Check, X, TrendingUp, TrendingDown, Download, Layers } from 'lucide-react';
import { stringToColor } from '../utils/colorGenerator';

interface TransactionsCardProps {
  transactions: Transaction[];
  filterType: FilterType;
  sortType: SortType;
  onFilterChange: (type: FilterType) => void;
  onSortChange: (type: SortType) => void;
  onPromoteSubscription?: (id: string, newName?: string) => void;
  // New Props for Controlled State
  selectedCategories: string[];
  onCategoryToggle: (cat: string) => void;
  onClearCategories: () => void;
}

const getCategoryIcon = (category: string) => {
  const c = category.toLowerCase();
  if (c.includes('food') || c.includes('restaurant') || c.includes('coffee')) return <Coffee className="w-4 h-4" />;
  if (c.includes('shop') || c.includes('clothing') || c.includes('retail')) return <ShoppingBag className="w-4 h-4" />;
  if (c.includes('transport') || c.includes('gas') || c.includes('uber') || c.includes('fuel')) return <Car className="w-4 h-4" />;
  if (c.includes('rent') || c.includes('utilities') || c.includes('housing')) return <Home className="w-4 h-4" />;
  if (c.includes('salary') || c.includes('income') || c.includes('dividend')) return <DollarSign className="w-4 h-4" />;
  return <Activity className="w-4 h-4" />;
};

export const TransactionsCard: React.FC<TransactionsCardProps> = ({ 
    transactions,
    filterType,
    sortType,
    onFilterChange,
    onSortChange,
    onPromoteSubscription,
    selectedCategories,
    onCategoryToggle,
    onClearCategories
}) => {
  const [promoTarget, setPromoTarget] = useState<Transaction | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  // Derive unique categories for the filter list
  const categories = useMemo(() => {
      const cats = new Set(transactions.map(t => t.category));
      return Array.from(cats).sort();
  }, [transactions]);

  // Filter transactions by selected categories (OR logic)
  const displayedTransactions = useMemo(() => {
      if (selectedCategories.length === 0) return transactions;
      return transactions.filter(t => selectedCategories.includes(t.category));
  }, [transactions, selectedCategories]);

  // Export Handler
  const handleExport = () => {
      const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Currency', 'Subscription'];
      const rows = displayedTransactions.map(t => [
          t.date, 
          `"${t.merchant}"`, // Quote merchant to handle commas
          `"${t.category}"`, 
          t.amount.toFixed(2), 
          'EUR',
          t.is_subscription ? 'Yes' : 'No'
      ]);
      
      const csvContent = "data:text/csv;charset=utf-8," 
          + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
          
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `spendee_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Calculate stats for the selected group
  const categoryStats = useMemo(() => {
      if (selectedCategories.length === 0 || displayedTransactions.length === 0) return null;

      const timestamps = transactions.map(t => new Date(t.date).getTime());
      const maxDate = new Date(Math.max(...timestamps));
      const currentMonth = maxDate.getMonth();
      const currentYear = maxDate.getFullYear();

      const prevDate = new Date(maxDate);
      prevDate.setMonth(prevDate.getMonth() - 1);
      const prevMonth = prevDate.getMonth();
      const prevYear = prevDate.getFullYear();

      let currentTotal = 0;
      let prevTotal = 0;

      // Filter global transactions by the selected categories to get history
      const relevantTransactions = transactions.filter(t => selectedCategories.includes(t.category));

      relevantTransactions.forEach(t => {
          const d = new Date(t.date);
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
              currentTotal += t.amount;
          } else if (d.getMonth() === prevMonth && d.getFullYear() === prevYear) {
              prevTotal += t.amount;
          }
      });

      const diff = currentTotal - prevTotal;
      const absCurrent = Math.abs(currentTotal);
      const absPrev = Math.abs(prevTotal);
      const percentChange = absPrev === 0 ? 100 : ((absCurrent - absPrev) / absPrev) * 100;
      
      const isExpense = currentTotal < 0;
      const spendingMore = absCurrent > absPrev;
      const sentiment = isExpense ? (spendingMore ? 'negative' : 'positive') : (spendingMore ? 'positive' : 'negative');

      return {
          total: currentTotal,
          percentChange,
          sentiment
      };

  }, [transactions, selectedCategories, displayedTransactions]);

  const handleOpenPromoModal = (t: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    setPromoTarget(t);
    setRenameValue(t.merchant); 
  };

  const handleConfirmPromo = () => {
      if (promoTarget && onPromoteSubscription) {
          onPromoteSubscription(promoTarget.id, renameValue);
          setPromoTarget(null);
      }
  };

  return (
    <div className="bg-card p-6 rounded-2xl border border-gray-800 flex flex-col h-full shadow-lg shadow-black/40 relative transition-all duration-300">
      
      {/* Header & Toolbar */}
      <div className="flex flex-col gap-4 mb-4 pb-4 border-b border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
                <div className="flex gap-2 mt-1">
                    <span className="text-xs text-gray-500 font-mono bg-gray-900 px-2 py-1 rounded">
                        {displayedTransactions.length} ITEMS
                    </span>
                    {selectedCategories.length > 0 && (
                        <span className="text-xs text-blue-400 font-mono bg-blue-900/20 px-2 py-1 rounded flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {selectedCategories.length} FILTERS ACTIVE
                        </span>
                    )}
                </div>
            </div>

            <div className="flex gap-2">
                 {/* Export Button */}
                 <button 
                    onClick={handleExport}
                    disabled={displayedTransactions.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#27272a] border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all disabled:opacity-50"
                    title="Export Filtered CSV"
                >
                    <Download className="w-3 h-3" />
                    Export
                </button>

                {/* Filter Toggle */}
                <div className="flex bg-[#27272a] rounded-lg p-1 border border-gray-700">
                    <button 
                        onClick={() => onFilterChange('ALL')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterType === 'ALL' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => onFilterChange('INCOME')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterType === 'INCOME' ? 'bg-green-900/50 text-green-400' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        Income
                    </button>
                    <button 
                        onClick={() => onFilterChange('EXPENSE')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterType === 'EXPENSE' ? 'bg-red-900/50 text-red-400' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        Expense
                    </button>
                </div>

                {/* Sort Toggle */}
                <div className="flex bg-[#27272a] rounded-lg p-1 border border-gray-700">
                    <button 
                        onClick={() => onSortChange(sortType === 'AMOUNT_DESC' ? 'AMOUNT_ASC' : 'AMOUNT_DESC')}
                        className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                        title="Sort by Amount"
                    >
                        {sortType === 'AMOUNT_DESC' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                        Amount
                    </button>
                </div>
            </div>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center gap-3">
             {/* Category Stats Badge */}
             {categoryStats && selectedCategories.length > 0 && (
                <div className="flex-shrink-0 flex items-center gap-3 bg-[#18181b] border border-gray-700 rounded-xl px-4 py-2 animate-in fade-in slide-in-from-left-4">
                     <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                            {selectedCategories.length === 1 ? selectedCategories[0] : 'Selected Total'}
                        </span>
                        <span className={`text-sm font-mono font-bold ${categoryStats.total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {categoryStats.total >= 0 ? '+' : ''}{categoryStats.total.toFixed(2)}
                        </span>
                     </div>
                     <div className={`h-8 w-[1px] bg-gray-700`}></div>
                     <div className="flex items-center gap-1.5">
                        {categoryStats.sentiment === 'positive' ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" /> 
                        )}
                        <span className={`text-xs font-medium ${categoryStats.sentiment === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                            {categoryStats.percentChange.toFixed(0)}% vs last month
                        </span>
                     </div>
                </div>
            )}

            {/* Scrollable Pills */}
            <div className="flex-1 overflow-x-auto custom-scrollbar pb-2 flex items-center gap-2">
                 <button 
                    onClick={onClearCategories}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${
                        selectedCategories.length === 0
                        ? 'bg-white text-black border-white' 
                        : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'
                    }`}
                 >
                    {selectedCategories.length > 0 && <X className="w-3 h-3" />}
                    {selectedCategories.length === 0 ? 'All Categories' : 'Clear All'}
                 </button>
                 {categories.map(cat => {
                     const color = stringToColor(cat);
                     const isActive = selectedCategories.includes(cat);
                     return (
                         <button
                            key={cat}
                            onClick={() => onCategoryToggle(cat)}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-2 select-none`}
                            style={{
                                backgroundColor: isActive ? `${color}20` : 'transparent',
                                borderColor: isActive ? color : '#3f3f46',
                                color: isActive ? color : '#a1a1aa'
                            }}
                         >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
                            {cat}
                            {isActive && <Check className="w-3 h-3 ml-1" />}
                         </button>
                     )
                 })}
            </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <div className="col-span-1">Type</div>
        <div className="col-span-3">Merchant</div>
        <div className="col-span-3">Category</div>
        <div className="col-span-2">Date</div>
        <div className="col-span-2 text-right">Amount</div>
        <div className="col-span-1 text-center">Action</div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
        {displayedTransactions.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm animate-in fade-in duration-300">
                <Filter className="w-8 h-8 mb-2 opacity-20" />
                <p>No transactions match your filter.</p>
                {selectedCategories.length > 0 && (
                    <button onClick={onClearCategories} className="mt-2 text-blue-400 hover:underline">
                        Clear Filters
                    </button>
                )}
            </div>
        ) : (
            displayedTransactions.map((t) => {
            const isExpense = t.amount < 0;
            const categoryColor = stringToColor(t.category);
            const isSelected = selectedCategories.includes(t.category);
            
            return (
                <div 
                key={t.id} 
                className="group grid grid-cols-12 gap-4 items-center p-3 rounded-lg hover:bg-[#27272a] transition-all cursor-pointer border border-transparent hover:border-gray-700/50"
                >
                <div className="col-span-1">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: isExpense ? '#f8717120' : '#4ade8020', color: isExpense ? '#f87171' : '#4ade80' }}>
                        {getCategoryIcon(t.category)}
                    </div>
                </div>
                
                <div className="col-span-3 text-sm font-medium text-gray-200 group-hover:text-white truncate" title={t.merchant}>
                    {t.merchant}
                </div>
                
                <div className="col-span-3 truncate flex items-center gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onCategoryToggle(t.category); }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 ${isSelected ? 'brightness-125' : 'hover:brightness-110'}`}
                        style={{ backgroundColor: `${categoryColor}20`, color: categoryColor, borderColor: `${categoryColor}40` }}
                    >
                        {t.category}
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                    </button>
                </div>
                
                <div className="col-span-2 text-xs text-gray-500 font-mono">
                    {t.date}
                </div>
                
                <div className="col-span-2 text-right">
                    <span className={`text-sm font-bold font-mono ${isExpense ? 'text-red-400' : 'text-green-400'}`}>
                    {isExpense ? '' : '+'}{t.amount.toFixed(2)}
                    </span>
                </div>
                
                <div className="col-span-1 flex justify-center">
                    {isExpense && !t.is_subscription && onPromoteSubscription && (
                         <button 
                            onClick={(e) => handleOpenPromoModal(t, e)}
                            className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Add to Standing Orders"
                         >
                            <RefreshCw className="w-4 h-4" />
                         </button>
                    )}
                    {t.is_subscription && (
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Active Subscription"></div>
                    )}
                </div>
                </div>
            );
            })
        )}
      </div>

      {/* Confirmation Modal Overlay */}
      {promoTarget && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl animate-in fade-in duration-200">
              <div className="bg-[#1e1e1e] border border-gray-700 p-6 rounded-2xl shadow-2xl w-full max-w-sm mx-4 transform scale-100">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-blue-400" />
                      Mark as Recurring?
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                      This will add <span className="text-white font-medium">{promoTarget.merchant}</span> to your monthly standing orders list.
                  </p>
                  
                  <div className="mb-4">
                      <label className="text-xs text-gray-500 uppercase font-semibold mb-1 block">Rename (Optional)</label>
                      <input 
                        type="text" 
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="w-full bg-[#121212] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="Simplify name (e.g. Netflix)"
                      />
                  </div>

                  <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setPromoTarget(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleConfirmPromo}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                          <Check className="w-4 h-4" />
                          Confirm
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};