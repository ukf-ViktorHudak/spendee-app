import React, { useState } from 'react';
import { Transaction, Currency } from '../types';
import { Settings, Save, RotateCcw, DollarSign, PoundSterling, Euro } from 'lucide-react';

interface PreferencesViewProps {
  transactions: Transaction[];
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  onUpdateCategory: (oldName: string, newName: string) => void;
  onResetData: () => void;
}

export const PreferencesView: React.FC<PreferencesViewProps> = ({ 
    transactions, 
    currency, 
    onCurrencyChange, 
    onUpdateCategory,
    onResetData
}) => {
  const categories = Array.from(new Set(transactions.map(t => t.category))).sort();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const startEdit = (cat: string) => {
      setEditingCategory(cat);
      setTempName(cat);
  };

  const saveEdit = () => {
      if (editingCategory && tempName) {
          onUpdateCategory(editingCategory, tempName);
          setEditingCategory(null);
      }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        
        {/* General Settings */}
        <div className="bg-card p-8 rounded-2xl border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-gray-400" /> General Settings
            </h2>
            
            <div className="space-y-6">
                <div>
                    <label className="text-sm text-gray-500 font-bold uppercase tracking-wider block mb-3">Display Currency</label>
                    <div className="flex gap-3">
                        {(['EUR', 'USD', 'GBP'] as Currency[]).map(c => (
                            <button
                                key={c}
                                onClick={() => onCurrencyChange(c)}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                                    currency === c 
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' 
                                    : 'bg-[#27272a] border-gray-700 text-gray-400 hover:bg-[#3f3f46]'
                                }`}
                            >
                                {c === 'EUR' && <Euro className="w-4 h-4" />}
                                {c === 'USD' && <DollarSign className="w-4 h-4" />}
                                {c === 'GBP' && <PoundSterling className="w-4 h-4" />}
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                 <div className="pt-6 border-t border-gray-800">
                    <label className="text-sm text-gray-500 font-bold uppercase tracking-wider block mb-3">Data Management</label>
                    <button 
                        onClick={onResetData}
                        className="flex items-center gap-2 px-4 py-3 bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-900/50 rounded-xl transition-all"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset All Application Data
                    </button>
                    <p className="text-xs text-gray-600 mt-2">Permanently deletes all transactions and settings from this browser.</p>
                </div>
            </div>
        </div>

        {/* Category Management */}
        <div className="bg-card p-8 rounded-2xl border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6">Manage Categories</h2>
            <p className="text-gray-400 text-sm mb-6">Rename categories to merge them. For example, renaming "Uber Eats" to "Food" will update all matching transactions.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(cat => (
                    <div key={cat} className="flex items-center justify-between p-3 bg-[#27272a] rounded-lg border border-gray-700">
                        {editingCategory === cat ? (
                            <div className="flex items-center gap-2 w-full">
                                <input 
                                    autoFocus
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    className="bg-[#121212] text-white px-2 py-1 rounded border border-blue-500 text-sm w-full outline-none"
                                />
                                <button onClick={saveEdit} className="p-1.5 bg-blue-600 rounded text-white"><Save className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <>
                                <span className="text-sm font-medium text-gray-200">{cat}</span>
                                <button 
                                    onClick={() => startEdit(cat)} 
                                    className="text-xs text-blue-400 hover:text-white transition-colors"
                                >
                                    Rename
                                </button>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};