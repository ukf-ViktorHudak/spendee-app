import React, { useState, useEffect, useMemo } from 'react';
import { AppState, AppView, FinancialAudit, Transaction, FilterType, SortType, Currency } from './types';
import { analyzeBankStatement } from './services/geminiService';
import { FileUpload } from './components/FileUpload';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { TransactionsCard } from './components/TransactionsCard';
import { TransactionsView } from './components/TransactionsView';
import { AnalyticsView } from './components/AnalyticsView';
import { StatementsView } from './components/StatementsView';
import { PreferencesView } from './components/PreferencesView';
import { RefreshCcw, Bell, Construction, Plus, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
// Import jsPDF types if needed, but we are using from CDN/ImportMap so casting might be needed for TS
// @ts-ignore
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

const STORAGE_KEY = 'spendee_pc_data';
const VIEW_KEY = 'spendee_pc_view';

const App: React.FC = () => {
  // --- Global State ---
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  
  // Routing Persistence
  const [currentView, setCurrentView] = useState<AppView>(() => {
      const savedView = localStorage.getItem(VIEW_KEY);
      return (savedView as AppView) || AppView.DASHBOARD;
  });

  // Settings
  const [currency, setCurrency] = useState<Currency>('EUR');
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Month Selection State
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // Format: YYYY-MM

  // Filter & Sort State (Dashboard)
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [sortType, setSortType] = useState<SortType>('DATE');

  // --- Persistence ---
  useEffect(() => {
      localStorage.setItem(VIEW_KEY, currentView);
  }, [currentView]);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.transactions && Array.isArray(parsed.transactions)) {
            setTransactions(parsed.transactions);
            setTips(parsed.tips || []);
            setCurrency(parsed.currency || 'EUR');
            setAppState(AppState.SUCCESS);
        }
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    }
  }, []);

  useEffect(() => {
    if (appState === AppState.SUCCESS) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ transactions, tips, currency }));
    }
  }, [transactions, tips, appState, currency]);

  // --- Month Logic ---
  const availableMonths = useMemo(() => {
      const months = new Set(transactions.map(t => t.date.substring(0, 7))); // YYYY-MM
      return Array.from(months).sort().reverse(); // Newest first
  }, [transactions]);

  // Auto-select latest month on load or new data, ONLY if no selection or if selection is invalid
  useEffect(() => {
      if (availableMonths.length > 0) {
          if (!selectedMonth || !availableMonths.includes(selectedMonth)) {
              setSelectedMonth(availableMonths[0]);
          }
      }
  }, [availableMonths, selectedMonth]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
      const currentIndex = availableMonths.indexOf(selectedMonth);
      if (currentIndex === -1) return;

      if (direction === 'prev' && currentIndex < availableMonths.length - 1) {
          setSelectedMonth(availableMonths[currentIndex + 1]);
      } else if (direction === 'next' && currentIndex > 0) {
          setSelectedMonth(availableMonths[currentIndex - 1]);
      }
  };

  // --- Derived State (Filtering) ---
  const transactionsForSelectedMonth = useMemo(() => {
      if (!selectedMonth) return [];
      return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const dashboardFilteredTransactions = useMemo(() => {
      let result = [...transactionsForSelectedMonth];

      if (filterType === 'INCOME') {
          result = result.filter(t => t.amount > 0);
      } else if (filterType === 'EXPENSE') {
          result = result.filter(t => t.amount < 0);
      }

      result.sort((a, b) => {
          if (sortType === 'AMOUNT_ASC') return a.amount - b.amount;
          if (sortType === 'AMOUNT_DESC') return b.amount - a.amount;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      return result;
  }, [transactionsForSelectedMonth, filterType, sortType]);


  // --- Handlers ---
  const handleFileUpload = async (file: File) => {
    setAppState(AppState.ANALYZING);
    setError(null);
    try {
      const result = await analyzeBankStatement(file);
      
      setTransactions(prev => [...prev, ...result.transactions]);
      setTips(prev => Array.from(new Set([...prev, ...result.tips])));
      
      // Auto-switch to the latest month found in the NEW upload
      const newMonths = Array.from(new Set(result.transactions.map(t => t.date.substring(0, 7)))).sort().reverse();
      if(newMonths.length > 0) {
          setSelectedMonth(newMonths[0]);
      }

      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
      setAppState(AppState.ERROR);
    }
  };

  const handleExportYearlyPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(`Spendee Executive Summary (${new Date().getFullYear()})`, 14, 20);

    const rows = availableMonths.map(month => {
        const txs = transactions.filter(t => t.date.startsWith(month));
        const income = txs.filter(t => t.amount > 0).reduce((a, b) => a + b.amount, 0);
        const expense = txs.filter(t => t.amount < 0).reduce((a, b) => a + Math.abs(b.amount), 0);
        const net = income - expense;
        return [month, income.toFixed(2), expense.toFixed(2), net.toFixed(2)];
    });

    autoTable(doc, {
        startY: 30,
        head: [['Month', 'Total Income', 'Total Expenses', 'Net Flow']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [66, 133, 244] }, // Blue
    });

    doc.save("spendee_yearly_summary.pdf");
  };

  const handleReset = () => {
    if (window.confirm("Are you sure? This will clear all data permanently.")) {
        setAppState(AppState.IDLE);
        setTransactions([]);
        setTips([]);
        setError(null);
        setSelectedMonth('');
        localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleRemoveSubscription = (id: string) => {
      const updated = transactions.map(t => {
          if (t.id === id) {
              return { ...t, is_subscription: false };
          }
          return t;
      });
      setTransactions(updated);
  };

  const handlePromoteToSubscription = (id: string, newName?: string) => {
      const updated = transactions.map(t => {
          if (t.id === id) {
              return { 
                  ...t, 
                  is_subscription: true,
                  merchant: newName || t.merchant 
              };
          }
          return t;
      });
      setTransactions(updated);
  };

  const handleUpdateCategory = (categoryName: string, newName: string) => {
      const updated = transactions.map(t => 
          t.category === categoryName ? { ...t, category: newName } : t
      );
      setTransactions(updated);
  };

  const handleBulkUpdateCategory = (ids: string[], newCategory: string) => {
      const updated = transactions.map(t => 
          ids.includes(t.id) ? { ...t, category: newCategory } : t
      );
      setTransactions(updated);
  };

  // --- Render Helpers ---
  const renderContent = () => {
      if (appState === AppState.ANALYZING) {
           return (
            <div className="flex flex-col items-center justify-center h-[80%] max-w-2xl mx-auto">
                <div className="w-full">
                    <FileUpload onFileSelect={() => {}} isAnalyzing={true} />
                </div>
            </div>
          );
      }

      if (appState === AppState.ERROR) {
          return (
            <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-xl mb-6 text-center animate-in fade-in slide-in-from-top-4">
                <p className="font-bold">Analysis Failed</p>
                <p className="text-sm opacity-80">{error}</p>
                <button onClick={() => setAppState(AppState.IDLE)} className="mt-2 text-sm underline hover:text-white">Try Again</button>
            </div>
          );
      }

      if (appState === AppState.IDLE && currentView !== AppView.STATEMENTS) {
          return (
            <div className="flex flex-col items-center justify-center h-[80%] max-w-2xl mx-auto">
                <div className="w-full">
                    <FileUpload onFileSelect={handleFileUpload} isAnalyzing={false} />
                </div>
            </div>
          );
      }

      switch (currentView) {
          case AppView.DASHBOARD:
              return (
                  <DashboardView 
                    allTransactions={transactions} // Global context for analytics
                    filteredTransactions={dashboardFilteredTransactions} // Selected Month context for UI
                    selectedMonth={selectedMonth}
                    tips={tips}
                    filterType={filterType}
                    sortType={sortType}
                    onFilterChange={setFilterType}
                    onSortChange={setSortType}
                    onRemoveSubscription={handleRemoveSubscription}
                    onPromoteSubscription={handlePromoteToSubscription}
                  />
              );
          case AppView.TRANSACTIONS:
              return (
                  <div className="h-full pb-10">
                      <TransactionsView 
                        transactions={transactions} // Show ALL in manager, or filter? Usually full history is better here.
                        onPromoteSubscription={handlePromoteToSubscription}
                        onBulkUpdateCategory={handleBulkUpdateCategory}
                        currency={currency}
                      />
                  </div>
              );
          case AppView.ANALYTICS:
              return (
                  <AnalyticsView 
                    transactions={transactionsForSelectedMonth} // Scoped to month for forecasting
                    tips={tips} 
                    currency={currency}
                  />
              );
          case AppView.STATEMENTS:
              return (
                  <StatementsView 
                    transactions={transactions} 
                    onUpload={handleFileUpload} 
                    isAnalyzing={false}
                  />
              );
           case AppView.SETTINGS:
              return (
                  <PreferencesView 
                    transactions={transactions}
                    currency={currency}
                    onCurrencyChange={setCurrency}
                    onUpdateCategory={handleUpdateCategory}
                    onResetData={handleReset}
                  />
              );
          default:
              return null;
      }
  };

  return (
    <div className="flex h-screen bg-background text-text overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Desktop Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        onLogout={() => { if(confirm("Clear local session?")) handleReset() }}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-16 border-b border-gray-800 flex justify-between items-center px-6 bg-background/50 backdrop-blur-md sticky top-0 z-10">
           <div className="flex items-center gap-2 text-sm text-gray-500">
             <span className="hover:text-gray-300 cursor-pointer" onClick={() => setCurrentView(AppView.DASHBOARD)}>Home</span>
             <span>/</span>
             <span className="text-white font-medium capitalize">{currentView.toLowerCase()}</span>
           </div>

           {/* Central Month Selector (Only visible if we have months) */}
           {appState === AppState.SUCCESS && availableMonths.length > 0 && currentView === AppView.DASHBOARD && (
               <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#27272a] p-1 rounded-xl border border-gray-700 shadow-xl">
                    <button 
                        onClick={() => handleMonthChange('next')} 
                        disabled={availableMonths.indexOf(selectedMonth) === 0}
                        className="p-1.5 rounded-lg hover:bg-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-300" />
                    </button>
                    <span className="w-24 text-center font-mono font-bold text-white text-sm">
                        {selectedMonth}
                    </span>
                    <button 
                        onClick={() => handleMonthChange('prev')} 
                        disabled={availableMonths.indexOf(selectedMonth) === availableMonths.length - 1}
                        className="p-1.5 rounded-lg hover:bg-gray-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
               </div>
           )}
           
           <div className="flex items-center gap-4">
               {appState === AppState.SUCCESS && (
                 <>
                    <button 
                        onClick={handleExportYearlyPDF}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#27272a] border border-gray-700 hover:border-gray-500 rounded-lg text-xs font-medium transition-all text-white"
                        title="Download Yearly PDF Report"
                    >
                        <FileDown className="w-3 h-3" />
                        Summary
                    </button>
                    <button 
                        onClick={() => setCurrentView(AppView.STATEMENTS)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium transition-all text-white shadow-lg shadow-blue-900/20"
                    >
                        <Plus className="w-3 h-3" />
                        Upload
                    </button>
                 </>
               )}
               <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
               </button>
               <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border border-white/10"></div>
           </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar relative">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;