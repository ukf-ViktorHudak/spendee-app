import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { FileText, Plus, Calendar, Layers, UploadCloud } from 'lucide-react';
import { FileUpload } from './FileUpload';

interface StatementsViewProps {
  transactions: Transaction[];
  onUpload: (file: File) => void;
  isAnalyzing: boolean;
}

export const StatementsView: React.FC<StatementsViewProps> = ({ transactions, onUpload, isAnalyzing }) => {
  
  // Group transactions by "Month Year" to simulate statements
  const statements = useMemo(() => {
      const groups: Record<string, { count: number, total: number }> = {};
      
      transactions.forEach(t => {
          const d = new Date(t.date);
          const key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
          if (!groups[key]) groups[key] = { count: 0, total: 0 };
          groups[key].count++;
          groups[key].total += t.amount;
      });

      return Object.entries(groups).map(([name, data]) => ({ name, ...data }));
  }, [transactions]);

  if (isAnalyzing) {
      return (
          <div className="h-full flex flex-col items-center justify-center">
             <FileUpload onFileSelect={() => {}} isAnalyzing={true} />
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Upload New Card */}
            <div className="col-span-1 min-h-[250px] relative group">
                <div className="absolute inset-0 bg-blue-600/5 rounded-2xl border-2 border-dashed border-blue-500/30 group-hover:border-blue-500/50 transition-all pointer-events-none"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Upload Statement</h3>
                    <p className="text-sm text-gray-500 mt-2 mb-4">Merge new data into your dashboard.</p>
                    <label className="cursor-pointer px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-900/20">
                        Choose File
                        <input type="file" className="hidden" accept=".pdf,.png,.jpg" onChange={(e) => e.target.files && onUpload(e.target.files[0])} />
                    </label>
                </div>
            </div>

            {/* Existing Statements (Mocked from Data) */}
            {statements.map((stmt) => (
                <div key={stmt.name} className="bg-card p-6 rounded-2xl border border-gray-800 shadow-lg hover:border-gray-700 transition-all flex flex-col justify-between min-h-[250px]">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-gray-800 rounded-xl">
                                <FileText className="w-6 h-6 text-gray-300" />
                            </div>
                            <span className="text-xs font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded">
                                PROCESSED
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{stmt.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Layers className="w-4 h-4" /> {stmt.count} Transactions
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-800/50 flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Net Flow</span>
                        <span className={`text-lg font-mono font-bold ${stmt.total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stmt.total >= 0 ? '+' : ''}{stmt.total.toFixed(2)}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};