import React, { useState } from 'react';
import { Transaction, FilterType, SortType } from '../types';
import { SummaryCard } from './SummaryCard';
import { AnalyticsCard } from './AnalyticsCard';
import { TransactionsCard } from './TransactionsCard';
import { StandingOrdersCard } from './StandingOrdersCard';

interface DashboardViewProps {
  allTransactions: Transaction[];
  filteredTransactions: Transaction[]; // Transactions for the SELECTED month
  tips: string[];
  filterType: FilterType;
  sortType: SortType;
  selectedMonth: string;
  onFilterChange: (type: FilterType) => void;
  onSortChange: (type: SortType) => void;
  onRemoveSubscription: (id: string) => void;
  onPromoteSubscription: (id: string, newName?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  allTransactions,
  filteredTransactions,
  tips,
  filterType,
  sortType,
  selectedMonth,
  onFilterChange,
  onSortChange,
  onRemoveSubscription,
  onPromoteSubscription
}) => {
  // Shared state for category filtering to sync Analytics and Transaction List
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleClearCategories = () => setSelectedCategories([]);

  return (
    <div className="grid grid-cols-12 gap-6 pb-10 max-w-[1600px] mx-auto">
      {/* Top Row: Immediate Financial Overview */}
      <div className="col-span-12 lg:col-span-4 min-h-[380px]">
        {/* Summary shows data for the SELECTED MONTH */}
        <SummaryCard 
            transactions={filteredTransactions} 
            selectedMonth={selectedMonth}
        />
      </div>
      <div className="col-span-12 lg:col-span-8 min-h-[380px]">
        {/* Analytics needs GLOBAL data for the benchmark (Average of other months) */}
        {/* Now receives selectedCategories to sync visual focus */}
        <AnalyticsCard 
            transactions={allTransactions} 
            selectedMonth={selectedMonth}
            tips={tips} 
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
        />
      </div>

      {/* Main Row: Transactions & Recurring */}
      <div className="col-span-12 lg:col-span-8 h-[600px]">
        <TransactionsCard 
            transactions={filteredTransactions} 
            filterType={filterType}
            sortType={sortType}
            onFilterChange={onFilterChange}
            onSortChange={onSortChange}
            onPromoteSubscription={onPromoteSubscription}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            onClearCategories={handleClearCategories}
        />
      </div>
      <div className="col-span-12 lg:col-span-4 h-[600px]">
        <StandingOrdersCard 
            transactions={filteredTransactions} 
            onRemoveSubscription={onRemoveSubscription}
        />
      </div>
    </div>
  );
};