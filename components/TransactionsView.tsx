import React, { useState, useMemo } from 'react';
import { Transaction, Currency } from '../types';
import { Search, Download, CheckSquare, Square, Edit2, Filter, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { stringToColor } from '../utils/colorGenerator';

interface TransactionsViewProps {
  transactions: Transaction[];
  onPromoteSubscription: (id: string, newName?: string) => void;
  onBulkUpdateCategory: (ids: string[], newCategory: string) => void;
  currency: Currency;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ 
    transactions, 
    onPromoteSubscription,
    onBulkUpdateCategory,
    currency
}) => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('');

  // Filtering
  const displayedTransactions = useMemo(() => {
    return transactions.filter(t => 
        t.merchant.toLowerCase().includes(search.toLowerCase()) || 
        t.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [transactions, search]);

  const uniqueCategories = useMemo(() => 
      Array.from(new Set(transactions.map(t => t.category))).sort(), 
  [transactions]);

  // Selection Logic
  const handleSelectAll = () => {
    if (selectedIds.size === displayedTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedTransactions.map(t => t.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkApply = () => {
      if (bulkCategory) {
          onBulkUpdateCategory(Array.from(selectedIds), bulkCategory);
          setIsBulkEditing(false);
          setSelectedIds(new Set());
          setBulkCategory('');
      }
  };

  const handleExport = () => {
      const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Currency', 'Subscription'];
      // Export selected or all if none selected
      const target = selectedIds.size > 0 
        ? displayedTransactions.filter(t => selectedIds.has(t.id))
        : displayedTransactions;

      const rows = target.map(t => [
          t.date, 
          `"${t.merchant}"`,
          `"${t.category}"`, 
          t.amount.toFixed(2), 
          currency,
          t.is_subscription ? 'Yes' : 'No'
      ]);
      
      const csvContent = "data:text/csv;charset=utf-8," 
          + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
          
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `spendee_full_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-300">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-xl border border-gray-800 shadow-lg shadow-black/40">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search transactions..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#121212] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white text-sm font-medium rounded-lg transition-colors border border-gray-700"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 bg-card rounded-xl border border-gray-800 shadow-lg shadow-black/40 overflow-hidden flex flex-col relative">
            
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#27272a] border-b border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider items-center">
                <div className="col-span-1 flex items-center justify-center">
                    <button onClick={handleSelectAll} className="hover:text-white transition-colors">
                        {selectedIds.size === displayedTransactions.length && displayedTransactions.length > 0 
                            ? <CheckSquare className="w-4 h-4 text-blue-500" /> 
                            : <Square className="w-4 h-4" />}
                    </button>
                </div>
                <div className="col-span-2">Date</div>
                <div className="col-span-4">Merchant</div>
                <div className="col-span-3">Category</div>
                <div className="col-span-2 text-right">Amount ({currency})</div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {displayedTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Filter className="w-12 h-12 mb-2 opacity-20" />
                        <p>No transactions found.</p>
                    </div>
                ) : (
                    displayedTransactions.map(t => {
                        const isSelected = selectedIds.has(t.id);
                        const isExpense = t.amount < 0;
                        const catColor = stringToColor(t.category);

                        return (
                            <div 
                                key={t.id} 
                                onClick={() => handleSelectOne(t.id)}
                                className={`grid grid-cols-12 gap-4 px-4 py-3 items-center rounded-lg border cursor-pointer transition-all mb-1 ${
                                    isSelected 
                                    ? 'bg-blue-900/10 border-blue-500/30' 
                                    : 'bg-transparent border-transparent hover:bg-[#27272a] hover:border-gray-700/50'
                                }`}
                            >
                                <div className="col-span-1 flex items-center justify-center">
                                    {isSelected 
                                        ? <CheckSquare className="w-4 h-4 text-blue-500" /> 
                                        : <Square className="w-4 h-4 text-gray-600" />}
                                </div>
                                <div className="col-span-2 text-sm text-gray-400 font-mono">{t.date}</div>
                                <div className="col-span-4 text-sm font-medium text-white truncate">{t.merchant}</div>
                                <div className="col-span-3">
                                    <span 
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10"
                                        style={{ backgroundColor: `${catColor}20`, color: catColor, borderColor: `${catColor}40` }}
                                    >
                                        {t.category}
                                    </span>
                                </div>
                                <div className={`col-span-2 text-right font-mono text-sm font-bold ${isExpense ? 'text-red-400' : 'text-green-400'}`}>
                                    {isExpense ? '' : '+'}{t.amount.toFixed(2)}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1e1e1e] border border-gray-600 rounded-full px-6 py-3 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4">
                    <span className="text-sm font-bold text-white">{selectedIds.size} Selected</span>
                    <div className="h-4 w-[1px] bg-gray-600"></div>
                    
                    {isBulkEditing ? (
                        <div className="flex items-center gap-2">
                            <select 
                                autoFocus
                                value={bulkCategory}
                                onChange={(e) => setBulkCategory(e.target.value)}
                                className="bg-[#121212] text-white text-sm border border-gray-600 rounded-md px-2 py-1 focus:outline-none focus:border-blue-500"
                            >
                                <option value="">Select Category...</option>
                                {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <button onClick={handleBulkApply} className="p-1 bg-green-600 rounded hover:bg-green-500 text-white"><Check className="w-4 h-4"/></button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsBulkEditing(true)}
                            className="flex items-center gap-2 text-sm text-blue-400 hover:text-white transition-colors"
                        >
                            <Edit2 className="w-4 h-4" /> Edit Category
                        </button>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};